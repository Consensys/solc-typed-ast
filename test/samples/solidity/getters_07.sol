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
        uint x;
        uint y;
        uint[] memory z;

        S2 memory w;

        (w, x) = this.s();

        z = w.y;
        y = w.x;
    }
}
