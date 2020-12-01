pragma solidity ^0.4.13;

contract TestThrow {
    function singleThrow() public returns (int a) {
        throw;
    }

    function nestedThrow(int x) public returns (int) {
        if (x > 100) throw;

        return x;
    }
}
