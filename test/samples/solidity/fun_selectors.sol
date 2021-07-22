contract D {
    uint public a;
}

struct T {
    address y;
}

enum X {
    A
}

function handleD(D d) {}
function handleX(X x) {}
function handleT(T memory t) {}

library Foo {
    enum Y {
        A
    }

    struct S {
        uint x;
    }

    function funD(D d) public {}
    function funS(S memory s) public {}
    function funT(T memory t) public {}
    function funX(X x) public {}
    function funY(Y y) public {}
}

interface Bar {
    function funD(D d) external;
    function funS(Foo.S calldata s) external;
    function funT(T calldata s) external;
    function funX(X x) external;
    function funY(Foo.Y y) external;
}

contract Baz {
    function funD(D d) external {}
    function funS(Foo.S calldata s) external {}
    function funT(T calldata s) external {}
    function funX(X x) external {}
    function funY(Foo.Y y) external {}

    function main() public {
        assert(Foo.funD.selector == bytes4(keccak256("funD(D)")));
        assert(Foo.funD.selector == 0x46467911);

        assert(Foo.funS.selector == bytes4(keccak256("funS(Foo.S)")));
        assert(Foo.funS.selector == 0x2d9de9c3);

        assert(Foo.funT.selector == bytes4(keccak256("funT(T)")));
        assert(Foo.funT.selector == 0x8c551140);

        assert(Foo.funX.selector == bytes4(keccak256("funX(X)")));
        assert(Foo.funX.selector == 0x20c5a75c);

        assert(Foo.funY.selector == bytes4(keccak256("funY(Foo.Y)")));
        assert(Foo.funY.selector == 0xc79a4d37);

        assert(Bar.funD.selector == bytes4(keccak256("funD(address)")));
        assert(Bar.funD.selector == 0x4e209091);

        assert(Bar.funS.selector == bytes4(keccak256("funS((uint256))")));
        assert(Bar.funS.selector == 0xe373f962);

        assert(Bar.funT.selector == bytes4(keccak256("funT((address))")));
        assert(Bar.funT.selector == 0x3793b6f0);

        assert(Bar.funX.selector == bytes4(keccak256("funX(uint8)")));
        assert(Bar.funX.selector == 0x0a42a215);

        assert(Bar.funY.selector == bytes4(keccak256("funY(uint8)")));
        assert(Bar.funY.selector == 0x0a035664);
        
        assert(type(Bar).interfaceId == 0x9a812b72);

        assert(Baz.funD.selector == bytes4(keccak256("funD(address)")));
        assert(Baz.funD.selector == 0x4e209091);

        assert(Baz.funS.selector == bytes4(keccak256("funS((uint256))")));
        assert(Baz.funS.selector == 0xe373f962);

        assert(Baz.funT.selector == bytes4(keccak256("funT((address))")));
        assert(Baz.funT.selector == 0x3793b6f0);

        assert(Baz.funX.selector == bytes4(keccak256("funX(uint8)")));
        assert(Baz.funX.selector == 0x0a42a215);

        assert(Baz.funY.selector == bytes4(keccak256("funY(uint8)")));
        assert(Baz.funY.selector == 0x0a035664);
    }
}
