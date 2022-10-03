pragma solidity >=0.8.16;

interface I {}
contract C {}

library L {
    function plus(uint a, uint b) external pure returns (uint) {
        return a + b;
    }
}

type ValueType is uint256;

/**
 * https://docs.soliditylang.org/en/v0.8.16/units-and-global-variables.html
 */
contract Test {
    using L for uint;

    uint[] i;
    bytes b;

    function testBuiltins() public payable {
        address payable addr = payable(0x0);

        blockhash;

        block.basefee;
        block.chainid;
        block.coinbase;
        block.difficulty;
        block.gaslimit;
        block.number;
        block.timestamp;

        gasleft;

        msg.data;
        msg.sender;
        msg.sig;
        msg.value;

        tx.gasprice;
        tx.origin;

        // abi.decode;
        // abi.encode;
        // abi.encodePacked;
        // abi.encodeWithSelector;
        // abi.encodeWithSignature;

        assert;

        addmod;
        mulmod;
        keccak256;
        sha256;
        ripemd160;
        ecrecover;

        addr.balance;
        addr.transfer;
        addr.send;
        addr.call;
        addr.delegatecall;
        addr.staticcall;

        selfdestruct;

        this.testBuiltins.selector;

        addr.code;
        addr.codehash;

        // bytes.concat;
        // string.concat;

        type(C).name;
        type(C).creationCode;
        type(C).runtimeCode;
        type(I).interfaceId;

        type(int8).min;
        type(int8).max;
        type(int256).min;
        type(int256).max;

        type(uint8).min;
        type(uint8).max;
        type(uint256).min;
        type(uint256).max;

        // i.push(1);
        // i.push() = 2;
        // i.pop();
        i.length;

        // b.push(bytes1(0x01));
        // b.push() = 0x02;
        // b.pop();
        b.length;

        bytes32(0x0).length;

        uint256(1).plus;

        ValueType.wrap;
        ValueType.unwrap;
    }
}
