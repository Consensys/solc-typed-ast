pragma solidity 0.4.26;

interface I {}
contract C {
    function () payable {}
}

library L {
    function plus(uint a, uint b) external pure returns (uint) {
        return a + b;
    }
}

/**
 * https://docs.soliditylang.org/en/v0.4.26/units-and-global-variables.html
 */
contract Test {
    using L for uint;

    uint[] i;
    bytes b;

    function testBuiltins() public payable {
        address addr = address(0x0);
        C c = C(addr);

        blockhash;

        block.blockhash;
        block.coinbase;
        block.difficulty;
        block.gaslimit;
        block.number;
        block.timestamp;

        gasleft;

        msg.data;
        msg.gas;
        msg.sender;
        msg.sig;
        msg.value;

        now;

        tx.gasprice;
        tx.origin;

        abi.encode();
        abi.encodePacked();
        abi.encodeWithSelector(0x00000000);
        abi.encodeWithSignature("main()");

        assert;

        addmod;
        mulmod;
        keccak256;
        sha256;
        sha3;
        ripemd160;
        ecrecover;

        addr.balance;
        addr.transfer(0);
        addr.send(0);
        // addr.call();
        // addr.callcode();
        // addr.delegatecall();

        c.balance;
        c.transfer(0);
        c.send(0);
        // c.call();
        // c.callcode();
        // c.delegatecall();

        // c.call.gas(3000).value(1)();

        selfdestruct;
        suicide;

        // i.push(1);
        i.length;

        // b.push(bytes1(0x01));
        b.length;

        bytes32(0x0).length;

        uint256(1).plus;
    }
}
