pragma solidity ^0.6.3;

// import IERC20 from OpenZeppelin
import './IERC20.sol';
import './Dai.sol';

/// @title Contract for ERC-20 based decentralised exchange
contract dExch {

    // token properties
    struct Token { bytes32 ticker; address tokenAddr; }
    address public admin;
    bytes32[] public tokenList
    mapping (bytes32 => Token) public tokenDetails;

    // user properties
    mapping(address => mapping(bytes32 => uint)) public userBalances;

    // order properties
    // order struct {id, creator, token, quoteToken, amount, price, date, remaining, filled}
    // array of orders

    // modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, 'You are not the admin');
        _;
    }

    modifier tokenExists(bytes32 ticker) {
        require(tokenDetails[ticker].address != address(0), "Token not listed");
        _;
    }

    constructor() public {
        admin = msg.sender;
    }

    // add token - only admin
    function addToken(bytes32 _ticker, address _tokenAddr) external onlyAdmin() {
        tokenDetails[_ticker] = Token(_ticker, _tokenAddr);
        tokenList.push(_ticker);
    }

    // user: deposit (ticker, amount) - use transferFrom(user, self, amount) -> usr will have to apporve contract, IERC20.sol on ticker addr
    function deposit(bytes32 ticker, uint amount) external tokenExists(ticker) {
        IERC20 _tkn = IERC20(tokenDetails[ticker].tokenAddr)
        // require(_tkn.balanceOf(msg.sender) >= amount, 'Insufficient tokan balance');
        userBalances[msg.sender][ticker] += amount;

        _tkn.transferFrom(msg.sender, address(this), amount);
    }

    // user: withdraw (ticker, amount) - only if suffic balance - use transfer fn, IERC20.sol on ticker addr
    function withdraw(bytes32 ticker, uint amount) external tokenExists(ticker) {
        require(userBalances[msg.sender][ticker] >= amount, 'Insufficient token balance')
        IERC20 _tkn = IERC20(tokenDetails[ticker].tokenAddr)
        userBalances[msg.sender][ticker] -= amount;

        _tkn.transfer(msg.sender, amount);
    }

    // user: createLimitOrder(token, amount, price)
}