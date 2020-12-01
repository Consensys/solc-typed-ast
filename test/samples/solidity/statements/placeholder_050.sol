pragma solidity ^0.5.0;

contract TestPlaceholder {
    modifier anyway() {
        _;
    }

    modifier onlyTested(int x) {
        require(x > 10, "test");

        if (x < 15) _;
        else revert("failure");
    }
}
