pragma solidity 0.8.7;

library Lib {
        struct S {
                uint[] nums;
                address a;
        }

        struct S1 {
                S s;
                mapping(uint=>uint) m;
        }

        function f1(uint[] storage x) public {}
        function f2(mapping(uint => uint) storage x) public {}
        function f3(S memory s) public {}
        function f4(S1 storage s) public {}
        // why is this allowed?
        function f5(S storage s) external {}
        function f6(S calldata s) external {}
        function f7(address payable a) public {}
}
