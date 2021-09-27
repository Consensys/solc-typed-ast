pragma solidity ^0.8.0;

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
    S[] public f;
    Some[] public g;

    function main() public {
        uint256[] memory arr = new uint[](3);
        arr[0] = 1;

        f.push(S(arr, 1, "abc", S1(E.B, arr, bytes1(0x13))));
        (int8 x, string memory y, S1 memory z) = this.f(0);

        assert(z.t.length == 3 && z.t[0] == 1);
    }
}
