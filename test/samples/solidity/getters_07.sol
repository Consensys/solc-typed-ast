pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

contract AccessorReturns {
    struct S1{
        S2 s;
        uint x;
    }

    struct S2 {
        uint x;
        uint[] y;
    }

    S1 public s;

    function main() public {
        function () external view returns (S2 memory, uint) s1 = this.s;
    }
}
