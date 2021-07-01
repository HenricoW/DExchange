// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import './Utils.sol';

/// @title Contract for ERC-20 based decentralised exchange
contract dExch is ReentrancyGuard {

    using SafeMath for uint256;
    
    // exchange properties
    bytes32 constant DAI = bytes32('DAI');              // Quote currency of the exchange
    address public admin;
    // NOTE: ALL PRICES ARE THIS MANY ORDERS OF MAGNITUDE LARGER AND STORED AS SUCH, CONVERTED BACK FOR ALL CALCULATIONS
    uint256 constant public priceDecimals = 6;                      // # of decimals for price values

    // order properties

    // token properties
    struct Token { bytes32 ticker; address tokenAddr; }
    bytes32[] public tokenList;
    mapping (bytes32 => Token) public tokenDetails;                             // ticker => Token

    // user properties
    mapping(address => mapping(bytes32 => uint256)) public userBalances;           // usrAddr => ticker => balance
    // mapping(address => Order[]) public userOrders;                              // EXTRA: mapping of user open orders
    mapping(bytes32 => mapping(uint256 => Order[])) public orderBooks;             // ticker => Side => OrderArray
    uint256 public nextOrderId;                                                    // for next unique order id
    uint256 public nextTradeId;                                                    // for next unique trade id

    // events
    event tradeExecuted(
        uint256 tradeId,
        uint256 orderId,
        bytes32 indexed ticker,
        Side side,
        uint256 price,
        uint256 amount,
        uint256 timestamp
    );

    // modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "dExch: You are not authorized to do this transaction.");
        _;
    }

    modifier tokenExists(bytes32 ticker) {
        require(tokenDetails[ticker].tokenAddr != address(0), "dExch: This token is not supported");
        _;
    }

    modifier notQuoteTkn(bytes32 ticker) {
        require(ticker != DAI, "dExch: Cannot trade DAI");
        _;
    }

    /*
    *   Main contract body
    */
    constructor() public {
        admin = msg.sender;
    }

    // add token - only admin
    function addToken(bytes32 _ticker, address _tokenAddr) external onlyAdmin() {
        tokenDetails[_ticker] = Token(_ticker, _tokenAddr);
        tokenList.push(_ticker);
    }

    // view supported token tickers
    function viewTokenList() external view returns(string[] memory){
        string[] memory tokens = new string[](tokenList.length);
        for(uint256 i = 0; i < tokenList.length; i.add(1)){
            tokens[i] = string(abi.encodePacked(tokenList[i]));
        }
        return tokens;
    }

    // get token list
    function getTokens() external view returns (Token[] memory) {
        Token[] memory tokenArray = new Token[](tokenList.length);
        for(uint256 i; i < tokenList.length; i.add(1)){
            tokenArray[i] = tokenDetails[tokenList[i]];
        }
        return tokenArray;
    }

    // user: deposit (ticker, amount) - use transferFrom(user, self, amount) -> usr will have to apporve contract, IERC20.sol on ticker addr
    function deposit(bytes32 ticker, uint256 amount) external tokenExists(ticker) {
        IERC20 _tkn = IERC20(tokenDetails[ticker].tokenAddr);
        userBalances[msg.sender][ticker] = userBalances[msg.sender][ticker].add(amount);

        _tkn.transferFrom(msg.sender, address(this), amount);
    }

    // user: withdraw (ticker, amount) - only if suffic balance - use transfer fn, IERC20.sol on ticker addr
    function withdraw(bytes32 ticker, uint256 amount) external tokenExists(ticker) nonReentrant() {
        require(userBalances[msg.sender][ticker] >= amount, 'dExch (withdraw): Insufficient token balance');
        IERC20 _tkn = IERC20(tokenDetails[ticker].tokenAddr);
        userBalances[msg.sender][ticker] = userBalances[msg.sender][ticker].sub(amount);

        _tkn.transfer(msg.sender, amount);
    }

    // user: createLimitOrder
    function createLimitOrder(Side side, bytes32 ticker, uint256 price, uint256 _amount) external tokenExists(ticker) notQuoteTkn(ticker) {
        uint256 usdxFactor = 1;
        if(ticker == bytes32('USDC') || ticker == bytes32('USDT')) usdxFactor = 10**(18 - 6);
        // check necessary balance: buy (DAI) or sell (ticker)
        if(side == Side.BUY) { 
            require(userBalances[msg.sender][DAI] >= ( _amount.mul(usdxFactor).mul(price).div(10**priceDecimals) ), 'dExch (createLimitOrder): Insufficient DAI balance');
        } else {
            // comparing like with like every time
            require(userBalances[msg.sender][ticker] >= _amount, 'dExch (createLimitOrder): Insufficient token balance');
        }

        // push the order to relevant order array
        Order[] storage oBook = orderBooks[ticker][uint256(side)];
        oBook.push(Order( nextOrderId, msg.sender, side, ticker, price, _amount, block.timestamp, _amount, false ));

        // EXTRA - separate sort as fn so it can be updated:
        Utils.sort(oBook, side);
        orderBooks[ticker][uint256(side)] = oBook;

        nextOrderId++;
    }

    // view the order book
    function viewOrderBook(bytes32 _ticker, Side _side) external view returns(Order[] memory){
        return orderBooks[_ticker][uint256(_side)];
    }

    // create market order (ticker, side, amount)
    function createMarketOrder(bytes32 ticker, Side side, uint256 amount) external tokenExists(ticker) notQuoteTkn(ticker) {

        // check necessary balance: sell (ticker) >> can't compare buy side, price varies accross orderbook
        if(side == Side.SELL) { 
            require(userBalances[msg.sender][ticker] >= amount, 'dExch (createMarketOrder): Insufficient token balance');
        }

        // get order book for opposite side (storage to use pop() later)
        Order[] storage oBook = orderBooks[ticker][uint256((side == Side.SELL) ? Side.BUY : Side.SELL)];

        // loop through order book to match orders
        matchOrders(oBook, amount, side, ticker);

        // Loop through order book => remove filled orders & commit order book back to main storage
        Utils.removeFilledOrders(oBook);

    }

    function matchOrders(Order[] storage _oBook, uint256 _amount, Side _side, bytes32 _ticker) internal {
        uint256 i = 0;
        while(i < _oBook.length && _amount > 0){
            // set order qty
            uint256 fillAmount = (_amount > _oBook[i].remaining) ? _oBook[i].remaining : _amount;

            // if BUY: check DAI balance => will work even if amount > balance[msg.sender] > oBook[0].remaining
            uint256 usdxFactor = 1;
            if(_ticker == bytes32('USDC') || _ticker == bytes32('USDT')) usdxFactor = 10**(18 - 6);
            uint256 DAIamount = fillAmount.mul(usdxFactor).mul(_oBook[i].price).div(10**priceDecimals);

            // update order book
            _oBook[i].remaining = _oBook[i].remaining.sub(fillAmount);
            _amount = _amount.sub(fillAmount);

            // update user balances
            Utils.updateUserBals(userBalances, _oBook, i, _ticker, DAIamount, fillAmount, _side);

            if(_oBook[i].remaining == 0) _oBook[i].isFilled = true;

            emit tradeExecuted(
                nextTradeId,
                nextOrderId,
                _ticker,
                _side,
                _oBook[i].price,
                fillAmount,
                block.timestamp
            );
            nextTradeId.add(1);

            i.add(1);
        }
    }
    
}