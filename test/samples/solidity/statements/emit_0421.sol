pragma solidity ^0.4.21;

contract TestEmit {
    event A (
        int a,
        string b,
        address c
    );

    event B (
        int x,
        string y
    );

    function singleEmit() public {
        emit A(1, "single", address(this));
    }

    function multipleEmits(int z) public {
        if (z > 15) {
            emit B (z - 10, "sometimes");
        }

        emit A(z, "anyway", address(this));
    }
}
