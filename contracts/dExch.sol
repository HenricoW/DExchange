// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// import IERC20 from OpenZeppelin
import './IERC20.sol';
import './Dai.sol';
import './Rep.sol';
import './Bat.sol';
import './Zrx.sol';

/// @title Contract for ERC-20 based decentralised exchange
contract dExch {

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
        address creator;                        // EXTRA: keep track of which order belongs to who
        Side side;
        bytes32 ticker;
        uint price;
        uint qty;
        uint date;
        uint remaining;                         // qty not filled yet
        bool completed;
    }
    mapping(address => Order[]) public userOrders;                                     // EXTRA: mapping of user open orders
    mapping(bytes32 => mapping(Side => Order[])) public orderBooks;                    // ticker => Side => OrderArray
    uint public nextOrderId;                                                           // for next unique order id

    // modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "You are not authorized to do this transaction.");
        _;
    }

    modifier tokenExists(bytes32 ticker) {
        require(tokenDetails[ticker].tokenAddr != address(0), "This token is not supported.");
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
        // require(_tkn.balanceOf(msg.sender) >= amount, 'Insufficient tokan balance');  =>  will be enforced by token itself
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
    function createLimitOrder(Side side, bytes32 ticker, uint price, uint amount) external tokenExists(ticker) {
        // check necessary balance: buy (DAI) or sell (ticker)
        if(side == Side.BUY) { 
            require(userBalances[msg.sender][bytes32('DAI')] >= amount * price, 'Insufficient DAI balance');
        } else {
            require(userBalances[msg.sender][ticker] >= amount, 'Insufficient token balance');
        }

        // create the order
        Order memory order = Order(
            nextOrderId,
            msg.sender,
            side,
            ticker,
            price,
            amount,
            block.timestamp,
            amount,
            false
        );

        // push the order to relevant order array
        Order[] storage oBook = orderBooks[ticker][side];
        oBook.push(order);

        // run algo to sort order array

        // done
    }
}