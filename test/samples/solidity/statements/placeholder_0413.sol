pragma solidity ^0.4.13;

contract TestPlaceholder {
    modifier anyway() {
        _;
    }

    modifier onlyTested(int x) {
        require(x > 10);

        if (x < 15) _;
        else revert();
    }
}
