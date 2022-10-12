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
    function ret1(uint256[] calldata a) external returns (uint[] calldata) {
        return a;
    }

    function ret2(uint256[] calldata b) external returns (uint[] calldata) {
        return b;
    }

    function ret3(uint256[] calldata c) public returns (uint[] calldata) {
        return c;
    }

    function ret4(uint256[] calldata e) internal returns (uint[] calldata) {
        return e;
    }

    function main(uint[] calldata p) public {
        uint[] memory arr = new uint[](4);

        this.ret1(arr)[1] = 1;

        ret3(p);
        this.ret3;
        this.ret3(p);
        ret4(p);

        (uint8 x, uint16 y) = true ? (0xff, 0xffff) : (0, 0);

        function (uint256[] memory) external returns (uint[] memory) fn = false ? this.ret1 : this.ret2;
    }
}
