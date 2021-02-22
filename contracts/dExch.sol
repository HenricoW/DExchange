pragma solidity ^0.6.3;

/// @title Contract for ERC-20 based decentralised exchange
contract dExch {

    // token properties
    struct Token {
        bytes32 ticker;
        address tokenAddr;
    }
    address public admin;
    Token[] public tokenList
    mapping (bytes32 => Token) public tokenDetails;

    // user properties
    mapping(bytes32 => mapping(address => uint)) public userBalances;

    // modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, 'You are not the admin');
        _;
    }

    constructor () public {
        admin = msg.sender;
    }

    function addToken(bytes32 _ticker, address _tokenAddr) public onlyAdmin() {
        Token memory tkn = Token(_ticker, _tokenAddr);
        tokenList.push(tkn);
        tokenDetails[_ticker] = tkn;
    }
}