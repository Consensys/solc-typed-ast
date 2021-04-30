pragma solidity ^0.4.0;
contract Foo {
    struct foo {
        uint x;
    }
    
    function main() internal {
        foo memory m = foo(bar);
        
        uint bar = m.x;
    }
}
