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
        function (uint256) external view returns (uint) a1 = this.a;
        function (address) external view returns (uint) b1 = this.b;
        function () external view returns (E) c1 = this.c;
        function () external view returns (E, bytes1) d1 = this.d;
        function () external view returns (address) e1 = this.e;
        function (uint256) external view returns (Some) f1 = this.f;
    }
}
