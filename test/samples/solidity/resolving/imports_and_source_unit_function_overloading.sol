import "./foo.sol";
import "./foo.sol" as boo;
import {moo as goo} from "./foo.sol";

function moo(address a) {
    uint t = moo(1);
}

function goo() {
    
}

function main() {
    moo(1);
    moo(address(0x0));
    goo();
    goo(1);

    roo memory t;
    foo memory t1;
}

