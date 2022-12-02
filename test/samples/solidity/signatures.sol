pragma solidity 0.8.7;

library Lib {
        struct S {
                uint[] nums;
                address a;
        }

        struct S1 {
                S s;
                mapping(uint=>uint) m;
                function () external f;
        }

        function f1(uint[] storage x) public {}
        function f2(mapping(uint => uint) storage x) public {}
        function f3(S memory s) public {}
        function f4(S1 storage s) public {}
        // why is this allowed?
        function f5(S storage s) external {}
        function f6(S calldata s) external {}
        function f7(address payable a) public {}
        function f8(function (address) external returns (bool) fn) external returns (bool) {}
}

library L {
    function f(address caller, function (address) external returns (bool) funcName) internal returns (bool) {
        return funcName(caller);
    }
}

contract C {
    function (address) external returns (bool) public v;
    
    function cf(address caller, function (address) external returns (bool) funcName) external returns (bool) {
        return funcName(caller);
    }

    function lf(address caller) external {
        L.f(caller, v);
    }
}

/**
 * Note that structs can not participate as mapping keys,
 * therefore can not be subject of public variable getters arguments.
 * They can only appear as return types.
 */
contract D {
    struct S0 {
        address s;
    }

    struct S1 {
        uint x;
        uint y;
        S0 p;
    }

    struct S2 {
        bool b;
        S1 s;
        address a;
    }

    S2 public s2;
    S1 public s1;
    S0 public s0;

    function fnA(S2 memory _s2, S1 memory _s1, S0 memory _s0) public returns (S2 memory, S1 memory, S0 memory) {}
    function fnB(S2[] memory _s2, S1[] memory _s1, S0[] memory _s0) public returns (S2[] memory, S1[] memory, S0[] memory) {}
}
