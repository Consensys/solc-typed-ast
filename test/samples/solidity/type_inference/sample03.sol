contract Base {
    function foo(uint x, uint y) external {}
}
contract T is Base {

}

library L {
    function foo(T t, uint x) external {

    }
}

contract Main {
    using L for T;

    function main(T t) public {
        t.foo(1);
        
        t.foo(1,2);
    }
}

contract Foo {
    function ret1(uint256[] calldata x) external returns (uint[] calldata) {
        return x;
    }

    function ret2(uint256[] calldata y) external returns (uint[] calldata) {
        return y;
    }

    function ret3(uint256[] calldata y) public returns (uint[] calldata) {
        return y;
    }

    function ret4(uint256[] calldata y) internal returns (uint[] calldata) {
        return y;
    }

    function main(uint[] calldata p) public {
        uint[] memory arr = new uint[](4);

        this.ret1(arr)[1] = 1;

        ret3(p);
        this.ret3(p);
        ret4(p);

        (uint8 x, uint16 y) = true ? (0xff, 0xffff) : (0, 0);

        function (uint256[] memory) external returns (uint[] memory) fn = false ? this.ret1 : this.ret2;
    }
}
