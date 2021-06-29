// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './IERC20.sol';
import './SafeMath.sol';
import './Dai.sol';
import './Rep.sol';
import './Bat.sol';
import './Zrx.sol';
import './Utils.sol';

/// @title Contract for ERC-20 based decentralised exchange
contract dExch {
    
    // exchange properties
    bytes32 constant DAI = bytes32('DAI');              // Quote currency of the exchange
    address public admin;

    // order properties

    // token properties
    struct Token { bytes32 ticker; address tokenAddr; }
    bytes32[] public tokenList;
    mapping (bytes32 => Token) public tokenDetails;                             // ticker => Token

    // user properties
    mapping(address => mapping(bytes32 => uint)) public userBalances;           // usrAddr => ticker => balance
    // mapping(address => Order[]) public userOrders;                              // EXTRA: mapping of user open orders
    mapping(bytes32 => mapping(uint => Order[])) public orderBooks;             // ticker => Side => OrderArray
    uint public nextOrderId;                                                    // for next unique order id
    uint public nextTradeId;                                                    // for next unique trade id

    // events
    event tradeExecuted(
        uint tradeId,
        uint orderId,
        bytes32 indexed ticker,
        Side side,
        uint price,
        uint amount,
        uint timestamp
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

    // view supported tokens
    function viewTokenList() external view returns(string[] memory){
        string[] memory tokens = new string[](tokenList.length);
        for(uint i = 0; i < tokenList.length; i++){
            tokens[i] = string(abi.encodePacked(tokenList[i]));
        }
        return tokens;
    }

    // get token list
    function getTokens() external view returns (Token[] memory) {
        Token[] memory tokenArray = new Token[](tokenList.length);
        for(uint8 i; i < tokenList.length; i++){
            tokenArray[i] = tokenDetails[tokenList[i]];
        }
        return tokenArray;
    }

    // user: deposit (ticker, amount) - use transferFrom(user, self, amount) -> usr will have to apporve contract, IERC20.sol on ticker addr
    function deposit(bytes32 ticker, uint amount) external tokenExists(ticker) {
        IERC20 _tkn = IERC20(tokenDetails[ticker].tokenAddr);
        userBalances[msg.sender][ticker] += amount;

        _tkn.transferFrom(msg.sender, address(this), amount);
    }

    // user: withdraw (ticker, amount) - only if suffic balance - use transfer fn, IERC20.sol on ticker addr
    function withdraw(bytes32 ticker, uint amount) external tokenExists(ticker) {
        require(userBalances[msg.sender][ticker] >= amount, 'dExch (withdraw): Insufficient token balance');
        IERC20 _tkn = IERC20(tokenDetails[ticker].tokenAddr);
        userBalances[msg.sender][ticker] -= amount;

        _tkn.transfer(msg.sender, amount);
    }

    // user: createLimitOrder
    function createLimitOrder(Side side, bytes32 ticker, uint price, uint _amount) external tokenExists(ticker) notQuoteTkn(ticker) {
        
        // check necessary balance: buy (DAI) or sell (ticker)
        if(side == Side.BUY) { 
            require(userBalances[msg.sender][DAI] >= _amount * price, 'dExch (createLimitOrder): Insufficient DAI balance');
        } else {
            require(userBalances[msg.sender][ticker] >= _amount, 'dExch (createLimitOrder): Insufficient token balance');
        }

        // push the order to relevant order array
        Order[] storage oBook = orderBooks[ticker][uint(side)];
        oBook.push(Order( nextOrderId, msg.sender, side, ticker, price, _amount, block.timestamp, _amount, false ));

        // EXTRA - separate sort as fn so it can be updated:
        Utils.sort(oBook, side);
        orderBooks[ticker][uint(side)] = oBook;

        nextOrderId++;
    }

    // view the order book
    function viewOrderBook(bytes32 _ticker, Side _side) external view returns(Order[] memory){
        return orderBooks[_ticker][uint(_side)];
    }

    // create market order (ticker, side, amount, price)
    function createMarketOrder(bytes32 ticker, Side side, uint amount) external tokenExists(ticker) notQuoteTkn(ticker) {

        // check necessary balance: sell (ticker)
        if(side == Side.SELL) { 
            require(userBalances[msg.sender][ticker] >= amount, 'dExch (createMarketOrder): Insufficient token balance');
        }

        // get order book for opposite side (storage to use pop() later)
        Order[] storage oBook = orderBooks[ticker][uint((side == Side.SELL) ? Side.BUY : Side.SELL)];

        // loop through order book to match orders
        matchOrders(oBook, amount, side, ticker);

        // Loop through order book => remove filled orders & commit order book back to main storage
        Utils.removeFilledOrders(oBook);

    }

    function matchOrders(Order[] storage _oBook, uint _amount, Side _side, bytes32 _ticker) internal {
        uint i = 0;
        while(i < _oBook.length && _amount > 0){
            // set order qty
            uint fillAmount = (_amount > _oBook[i].remaining) ? _oBook[i].remaining : _amount;

            // if BUY: check DAI balance => will work even if amount > balance[msg.sender] > oBook[0].remaining
            uint DAIamount = fillAmount * _oBook[i].price;

            // update order book
            _oBook[i].remaining -= fillAmount;
            _amount -= fillAmount;

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
            nextTradeId++;

            i++;
        }
    }
    
}