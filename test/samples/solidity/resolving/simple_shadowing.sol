pragma solidity ^0.8.0;
uint constant foo = 1;

struct gfoo {
    uint x;
}

enum gbar {
    A
}

function gf1() { }

contract Foo {
    struct foo {
        uint x;
    }
    
    enum bar {
        A
    }
    
    event boo();
    
    function f1(uint x) internal {}
    
    uint gfoo;
    uint gbar;
    uint gf1;
    function main(uint foo, uint bar, uint boo, uint f1) public {
        
        // Arguments shadowing defintions from the contract level
        
        //foo memory m; - can't access struct of same name
        
        //bar b; - can't access enum of same name
        
        //emit boo(); - can't access event of same name
        
        //f1(); - can't access function of same name
        
        // State vars shadowing definitions from the unit level
        
        //gfoo memory m; - can't access struct from global context shadowed by state var
        
        // gbar e; can't access enum from global context shadowed by state var
        
        // gf1(); - can't access free function from global context shadowed by state var
    }
}
