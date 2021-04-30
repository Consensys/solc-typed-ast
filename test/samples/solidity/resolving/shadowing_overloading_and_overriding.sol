pragma solidity ^0.8.0;
function foo(uint x, uint y, uint z) {
}


function bar(uint x, uint y, uint z) {
}

function boo(uint x) {
    
}

struct v {
    uint x;
    uint y;
}

abstract contract Base {
    function foo() public virtual {}
    function foo(uint x) public virtual {}
    function v() external virtual  returns (uint) ;
    function v(uint x) external virtual  returns (uint) {
        return x;
    }
    modifier M() { _; }
    
    event E();
    event E(uint x);
}

contract Child is Base {
    uint public override v;
    //event E(); can't override events
    function foo() public override {}
    function boo(uint t) public {}
    
    function main() M public {
        foo();
        foo(1);
        //foo(1,2,3); // - higher-scope foo is not resolved
        bar(1,2,3);
        
        emit E();
        emit E(1);
        
        // boo() is not visible
        boo(1);
    }
}

