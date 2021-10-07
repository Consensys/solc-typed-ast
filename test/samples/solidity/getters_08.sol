pragma solidity ^0.8.0;

interface Some {}

contract AccessorReturns {
    type U is uint;
    type I is int;
    type A is address;
    type AP is address payable;
    type B1 is bytes1;
    type B32 is bytes32;

    enum E {
        A, B, C
    }

    struct S1 {
        E e;
        uint[] t;
        bytes1 f;
    }

    struct S2 {
        uint[] a;
        address b;
        mapping(address => uint) map;
    }

    struct S {
        uint[] a;
        int8 b;
        string x;
        S1 s1;
    }

    uint[] public a;
    mapping(address => uint) public b;
    E public c;
    S1 public d;
    S2 public e;
    S[] public f;
    Some[] public g;
    Some public h;

    U public u;
    I public i;
    A public addr;
    AP public ap;
    B1 public b1;
    B32 public b32;

    mapping(A => U[4]) public udtvMapping;

    function main() public {
        function (uint256) external view returns (uint) a1 = this.a;
        function (address) external view returns (uint) b1 = this.b;
        function () external view returns (E) c1 = this.c;
        function () external view returns (E, bytes1) d1 = this.d;
        function () external view returns (address) e1 = this.e;
        function (uint256) external view returns (int8, string memory, S1 memory) f1 = this.f;
        function (uint256) external view returns (Some) g1 = this.g;
        function () external view returns (Some) h1 = this.h;

        function () external view returns (U) u1 = this.u;
        function () external view returns (I) i1 = this.i;
        function () external view returns (A) addr1 = this.addr;
        function () external view returns (AP) ap1 = this.ap;
        function () external view returns (B1) b11 = this.b1;
        function () external view returns (B32) b321 = this.b32;

        function (A, uint256) external view returns (U) udtvMapping1 = this.udtvMapping;
    }
}
