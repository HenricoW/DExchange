// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import './IERC20.sol';
// import './SafeMath.sol'                              
import './Dai.sol';
import './Rep.sol';
import './Bat.sol';
import './Zrx.sol';

/// @title Contract for ERC-20 based decentralised exchange
contract dExch {
    
    // exchange properties
    bytes32 constant DAI = bytes32('DAI');              // Quote currency of the exchange

    // token properties
    struct Token { bytes32 ticker; address tokenAddr; }
    address public admin;
    bytes32[] public tokenList;
    mapping (bytes32 => Token) public tokenDetails;                             // ticker => Token

    // user properties
    mapping(address => mapping(bytes32 => uint)) public userBalances;           // usrAddr => ticker => balance

    // order properties
    enum Side { BUY, SELL }
    struct Order {
        uint id;
        address creator;
        Side side;
        bytes32 ticker;
        uint price;
        uint qty;
        uint date;
        uint remaining;
        bool isFilled;
    }
    mapping(address => Order[]) public userOrders;                                     // EXTRA: mapping of user open orders
    mapping(bytes32 => mapping(Side => Order[])) public orderBooks;                    // ticker => Side => OrderArray
    uint public nextOrderId;                                                           // for next unique order id
    uint public nextTradeId;                                                           // for next unique trade id

    // events
    event tradeExecuted(
        uint tradeId,
        uint orderId,
        bytes32 ticker,
        Side side,
        uint price,
        uint amount,
        uint timestamp
    );

    // modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "You are not authorized to do this transaction.");
        _;
    }

    modifier tokenExists(bytes32 ticker) {
        require(tokenDetails[ticker].tokenAddr != address(0), "This token is not supported.");
        _;
    }

    modifier notQuoteTkn(bytes32 ticker) {
        require(ticker != DAI, "Cannot trade DAI");
        _;
    }

    /*
    *   Main contract body
    */
    constructor() {
        admin = msg.sender;
    }

    // add token - only admin
    function addToken(bytes32 _ticker, address _tokenAddr) external onlyAdmin() {
        tokenDetails[_ticker] = Token(_ticker, _tokenAddr);
        tokenList.push(_ticker);
    }

    // user: deposit (ticker, amount) - use transferFrom(user, self, amount) -> usr will have to apporve contract, IERC20.sol on ticker addr
    function deposit(bytes32 ticker, uint amount) external tokenExists(ticker) {
        IERC20 _tkn = IERC20(tokenDetails[ticker].tokenAddr);
        userBalances[msg.sender][ticker] += amount;

        _tkn.transferFrom(msg.sender, address(this), amount);
    }

    // user: withdraw (ticker, amount) - only if suffic balance - use transfer fn, IERC20.sol on ticker addr
    function withdraw(bytes32 ticker, uint amount) external tokenExists(ticker) {
        require(userBalances[msg.sender][ticker] >= amount, 'Insufficient token balance');
        IERC20 _tkn = IERC20(tokenDetails[ticker].tokenAddr);
        userBalances[msg.sender][ticker] -= amount;

        _tkn.transfer(msg.sender, amount);
    }

    // user: createLimitOrder
    function createLimitOrder(Side side, bytes32 ticker, uint price, uint amount) external tokenExists(ticker) notQuoteTkn(ticker) {
        
        // check necessary balance: buy (DAI) or sell (ticker)
        if(side == Side.BUY) { 
            require(userBalances[msg.sender][DAI] >= amount * price, 'Insufficient DAI balance');
        } else {
            require(userBalances[msg.sender][ticker] >= amount, 'Insufficient token balance');
        }

        // create the order
        Order memory order = Order( nextOrderId, msg.sender, side, ticker, price, amount, block.timestamp, amount, false );

        // push the order to relevant order array
        Order[] storage oBook = orderBooks[ticker][side];
        oBook.push(order);

        // EXTRA - separate sort as fn so it can be updated:
        orderBooks[ticker][side] = sort(oBook, side);

        nextOrderId++;
    }

    // create market order (ticker, side, amount, price)
    function createMarketOrder(bytes32 ticker, Side side, uint amount) external tokenExists(ticker) notQuoteTkn(ticker) {

        // check necessary balance: sell (ticker)
        if(side == Side.SELL) { 
            require(userBalances[msg.sender][ticker] >= amount, 'Insufficient token balance');
        }

        // get order book for opposite side (storage to use pop() later)
        Order[] storage oBook = orderBooks[ticker][(side == Side.SELL) ? Side.BUY : Side.SELL];

        // loop through order book to match orders
        uint i = 0;
        while(i < oBook.length && amount > 0){
            // set order qty
            uint fillAmount = (amount > oBook[i].remaining) ? oBook[i].remaining : amount;

            // if BUY: check DAI balance => will work even if amount > balance[msg.sender] > oBook[0].remaining
            uint DAIamount = fillAmount * oBook[i].price;

            // update order book
            oBook[i].remaining -= fillAmount;
            amount -= fillAmount;

            // update user balances
            if(side == Side.BUY) {
                require(userBalances[msg.sender][DAI] >= DAIamount, 'Insufficient DAI balance');
                // ticker records
                userBalances[oBook[i].creator][ticker] -= fillAmount;
                userBalances[msg.sender][ticker] += fillAmount;
                // DAI records
                userBalances[oBook[i].creator][DAI] += DAIamount;
                userBalances[msg.sender][DAI] -= DAIamount;
            } else {
                // ticker records
                userBalances[oBook[i].creator][ticker] += fillAmount;
                userBalances[msg.sender][ticker] -= fillAmount;
                // DAI records
                userBalances[oBook[i].creator][DAI] -= DAIamount;
                userBalances[msg.sender][DAI] += DAIamount;
            }

            if(oBook[i].remaining == 0) oBook[i].isFilled = true;

            emit tradeExecuted(
                nextTradeId,
                nextOrderId,
                ticker,
                side,
                oBook[i].price,
                fillAmount,
                block.timestamp
            );
            nextTradeId++;

            i++;
        }

        // Loop through order book => remove filled orders & commit order book back to main storage
        uint j = 0;
        while(j < oBook.length && oBook[j].isFilled){
            for(uint k = j; k < oBook.length - 1; k++){
                oBook[k] = oBook[k + 1];
            }
            oBook.pop();
            j++;
        }

        // push oBook back to storage

    }

    // EXTRA: separate sort fn
    function sort(Order[] storage orders, Side side) internal returns (Order[] storage){
        uint i = orders.length;
        while(i > 0){
            if( (side == Side.BUY) && (orders[i - 1].price > orders[i].price) ) { break; }
            else if( orders[i - 1].price < orders[i].price ) { break; }

            orders = swap(orders, i-1, i);
            i--;
        }

        return orders;
    }

    // EXTRA: create swap as separate fn
    function swap(Order[] storage orders, uint index1, uint index2) internal returns (Order[] storage){
        require(index1 > 0 && index2 > 0 && index1 < orders.length && index2 < orders.length, "One or more indices out of bounds.");
        Order memory temp = orders[index1];
        orders[index1] = orders[index2];
        orders[index2] = temp;

        return orders;
    }
}