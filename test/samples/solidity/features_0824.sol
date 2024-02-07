pragma solidity 0.8.24;

contract Features_0824 {
    function some() public {
        uint a = block.blobbasefee;
        bytes32 w = blobhash(0);

        assembly {
            let bbf := blobbasefee()
            let bh := blobhash(0)

            mcopy(0x100, 0x200, 0x300)

            let zero := 0
            tstore(zero, 5)
            let x := tload(zero)
            tstore(zero, 8)
            let y := tload(zero)
            tstore(zero, y)
        }
    }
}