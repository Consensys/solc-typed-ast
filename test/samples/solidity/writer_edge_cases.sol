pragma solidity ^0.4.13;

contract SourceWriterEdgeCases {
    event Foo() anonymous;
    struct EmptyStruct {}

    bytes3 a = hex"00ffcc";
    string b = "\x27\x28\x29";
    string c = "abc \"def\" ghi";
    string d = 'abc \'def\' ghi';
    bytes e = hex"010203";

    uint[] x = new uint[](5);

    function emptyReturn() public returns (uint a, uint b) {
        return;
    }

    function inlineAssembly() public {
        address addr = address(this);

        assembly {
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
        }
    }
}
