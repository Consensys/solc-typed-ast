// ------------------------------------------------------------
// /test/samples/solidity/writer_edge_cases.sol
// ------------------------------------------------------------
pragma solidity ^0.4.13;

contract SourceWriterEdgeCases {
    struct EmptyStruct {}

    bytes3 internal a = hex"00ffcc";
    string internal b = "'()";
    string internal c = "abc \"def\" ghi";
    string internal d = "abc 'def' ghi";
    bytes internal e = "\u0001\u0002\u0003";
    uint[] internal x = new uint[](5);

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
