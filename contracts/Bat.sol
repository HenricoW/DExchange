pragma solidity >=0.6.0;

import './ERC20.sol';

contract Bat is ERC20 {
    // new ERC20 uses 18 decimals by default (and includes ERC20Detailed??)
    constructor () ERC20("Basic attention token", "BAT") public {}
}