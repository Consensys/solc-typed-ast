pragma solidity ^0.8.0;

import "./id_paths_lib.sol" as L;
import {Lib as Lib1} from "./id_paths_lib.sol";

contract Base {
    uint y = 2;
    function foo(uint x) internal virtual returns (uint) {
        return x + 1;
    }
    
    struct S {
        uint t;
    }
    
    enum E {
        A
    }
    
    event E1();
}

contract Child is Base {
    uint z = 1;
    function foo(uint x) internal virtual override returns (uint) {
        return Base.foo(x) + 1;
    }
    
    
    function main() public {
        assert(foo(Child.z + Child.z) == 5);
        emit Base.E1();
    }
}

contract Unrelated {
    function main() public {
        Base.S memory s;
        Base.E e;
        
        uint t = L.const;
        
        L.foo(t);
        
        L.SG memory s1;
        L.EG e1;
        
        t = L.Lib.foo(t);

        t = Lib1.foo(t);

        L.Boo t1;
    }
}
