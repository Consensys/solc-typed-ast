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
