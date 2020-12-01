// ------------------------------------------------------------
// /test/samples/solidity/statements/inline_assembly_060.sol
// ------------------------------------------------------------
pragma solidity ^0.6.0;

contract Test {
    function assemblyReadsState() public view {
        address addr = address(this);
        assembly {
            let str := "abc"
            let a := balance(addr)
            let b := sload(0x20)
            let c := staticcall(2100, addr, 0, 0, 0, 0)
            let d := origin()
            let e := gasprice()
            let f := coinbase()
            let g := timestamp()
            let h := number()
            let i := difficulty()
            let j := gaslimit()
            let k := blockhash(1)
            let l := extcodesize(addr)
            let m := caller()
            let n := callvalue()
            extcodecopy(0, 0, 0, 0)
            if 1 {
                let v, t
                function fn1 () {
                    leave
                }
                function fn2 (arg1, arg2) -> ret1, ret2 {}
                v, t := fn2(1, 2)
            }
            let bV := true
            let gV
            switch bV
            case false {
                gV := 10
            }
            default {
                gV := 20
            }
            switch bV
            case true {
                gV := 30
            }
            switch bV
            default {
                gV := 40
            }
            let xV := 0
            for {
                let iV := 0
            } lt(iV, 0x100) {
                i := add(iV, 0x20)
            } {
                xV := add(xV, mload(i))
                continue
                break
            }
            let iV := 0
            for {} lt(iV, 0x100) {} {
                xV := add(xV, mload(i))
                iV := add(iV, 0x20)
            }
        }
    }

    function assemblyWritesState() public {
        address addr = address(this);
        assembly {
            sstore(sload(0x20), 1)
            let a := gas()
            let b := call(2100, addr, 0, 0, 0, 0, 0)
            let c := callcode(2100, addr, 0, 0, 0, 0, 0)
            let d := delegatecall(2100, addr, 0, 0, 0, 0)
            log0(0, 0)
            log1(0, 0, 0)
            log2(0, 0, 0, 0)
            log3(0, 0, 0, 0, 0)
            log4(0, 0, 0, 0, 0, 0)
            selfdestruct(addr)
        }
    }
}
