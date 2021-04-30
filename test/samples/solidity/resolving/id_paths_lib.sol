import "./id_paths_lib2.sol";

function foo(uint x) returns (uint) {
    return x+1;
}

struct SG {
    int8 a;
}

enum EG {
    B
}

uint constant const = 1;

library Lib {
    function foo(uint t) internal returns (uint) {
        return t + 2;
    }
}
