pragma solidity >=0.6.0;

import './ERC20.sol';

contract Rep is ERC20 {
    // new ERC20 uses 18 decimals by default (and includes ERC20Detailed??)
    constructor () ERC20("Augur token", "REP") public {}
}