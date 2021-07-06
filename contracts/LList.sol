// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";

contract LList {
    using SafeMath for uint256;

    // Node public head;
    struct Node {
        uint256 price; // needed for referencing from prev, next nodes
        // LList orders; // LATER: list for cumulated orders of the same price, ordered as queue
        uint256 prev;
        uint256 next;
    }
    Node public _HEAD; // used as entry point for LList
    Node public _TAIL;
    uint256 public length = 0;
    mapping(uint256 => Node) public list;  // consuming app: DO NOT ALLOW ZERO PRICE
    uint256[] public priceArray;

    // New orders will mostly be created from the side closest to the bid/ask price
    // This enum will help optimise placing new entries, maintaining a sorted state
    // This is due to keeping the internal price array always as ASCENDING
    // Main contract instantiates, buySide & sellSide LLists, front-end reverses the
    // relevant array as needed (offloading non-critical computation)
    enum Bias {
        lowValues,
        highValues
    }
    Bias entryBias;

    constructor (uint256 newEntriesBias) public {
        entryBias = Bias(newEntriesBias);
    }

    // Fn's to add:
    // insertAtHead     : 
    // removeFromHead   : 
    // insertAfterPrice    : if price already in list, add node after (for now, don't merge). If price not in list, insert after next sorted price

    function addElement(uint256 price) external {
        if(price < _HEAD.price) { _insertAtHead(price); }
        else if(price > _TAIL.price) { _insertAtTail(price); }
        else {
            uint256 mid = length / 2;
            (uint256 entry, uint256 idx) = (price < priceArray[mid]) ? _findPlace(0, mid, price) : _findPlace(mid, (length - 1), price);
            _insertAfter(entry, price, idx);
        }
        _buildPriceArray(); // TRADEOFF - <Outside>: ensures priceArray is always up to date for wherever it's needed. <Inside last else block>: less gas for entries outside of current range
    }

    function _insertAtHead(uint256 price) internal {
        // if(length == 0) head = new Node(price, Node(0));
        // head = new Node(price, head);
        if(length == 0) {
            list[price] = Node(price, 0, 0);
            _TAIL = list[price];
        } else {
            list[price] = Node(price, 0, _HEAD.price);
            if(length == 1) _TAIL.prev = price;
            list[_HEAD.price].prev = price;
        }
        _HEAD = list[price];

        length = length.add(1);
    }

    function _insertAtTail(uint256 price) internal {
        if(length == 0) {
            list[price] = Node(price, 0, 0);
            _HEAD = list[price];
        } else {
            list[price] = Node(price, _TAIL.price, 0);
            if(length == 1) _HEAD.next = price;
            list[_TAIL.price].next = price;
        }
        _TAIL = list[price];

        length = length.add(1);
    }

    // NOTE: HAVE TO CALL _buildPriceArray() BEFORE CALLING THIS FUNCTION
    function _findPlace(uint256 start, uint256 end, uint256 price) public returns(uint256, uint256) {
        if(end <= start.add(1)) {
            uint256 value = priceArray[start];
            return (value, start);
        }

        // already know that: priceArr[start] < price < priceArr[end], when this fn is called
        uint256 mid = ((start + end) / 2); // v = (1/3 + b*(1/3)); m = s + ( (e - s)*v ) <== to implement bias
        return (price < priceArray[mid]) ? _findPlace(start, mid, price) : _findPlace(mid, end, price);
    }

    function _insertAfter(uint256 entry, uint256 newPrice, uint256 index) public {
        // operation involves 3 elements: 1st (old), 2nd (new), 3rd (old)
        // set 2nd element
        list[newPrice] = Node(newPrice, list[entry].price, list[entry].next);
        // update 3rd element
        list[list[entry].next].prev = newPrice;
        if(index == (length - 2)) _TAIL = list[list[entry].next];
        // update 1st element
        list[entry].next = newPrice;
        if(index == 0) _HEAD = list[entry];

        length = length.add(1);
    }

    function _buildPriceArray() public { // create an external version that outputs prices and volumes, use front-end to reverse array as needed
        require(length > 0, "List length is zero");
        Node memory current = _HEAD;
        priceArray = new uint256[](length);
        priceArray[0] = current.price;

        uint256 counter = 1;
        while(current.next != 0){
            priceArray[counter] = current.next;
            current = list[current.next];
            counter = counter.add(1);
        }
    }

    function removeFromHead() public {
        require(length > 0, "No entries in list");
        Node memory next = list[_HEAD.next]; // grab ref to second item in list
        // list[_HEAD.price] = Node(0,0,0); // reset old head data
        delete list[_HEAD.price]; // reset old head data
        next.prev = 0; // set pointer to 'null' (to be current head)
        _HEAD = next;
    }
}