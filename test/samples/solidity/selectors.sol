pragma solidity >=0.8.15;

contract Selectors {
    address public x;

    event SomeEvent(address indexed addr, uint indexed v);
    error SomeError(address addr, uint v);

    function checkSelectors() pure public returns (bytes4 v, bytes4 fn, bytes32 ev, bytes4 er) {
        v = this.x.selector;
        fn = this.checkSelectors.selector;
        ev = SomeEvent.selector;
        er = SomeError.selector;

        assert(v == 0x0c55699c);
        assert(fn == 0x19e6976e);
        assert(ev == 0xdde371250dcd21c331edbb965b9163f4898566e8c60e28868533281edf66ab03);
        assert(er == 0x399802c9);
    }
}
