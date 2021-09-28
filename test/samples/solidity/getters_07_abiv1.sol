pragma solidity ^0.7.0;

interface Some {}

contract AccessorReturns {
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
    Some[] public f;

    function main() public {
        uint256[] memory arr = new uint[](3);
        arr[0] = 1;
        
        uint x = this.a(0);
        uint y = this.b(address(0x0));
        E z  = this.c();
        (E u, bytes1 v) = this.d();
        address w = this.e();

        Some t = this.f(0);
    }
}