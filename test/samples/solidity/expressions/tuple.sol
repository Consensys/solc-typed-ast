contract SomeContract {
    function tupleSimple() public {
        (uint x, uint y) = (1, 2);
        (uint z) = (1);
    }

    function tupleNested() public {
        uint8 r;
        uint16 t;
        string memory x;
        address f;

        (r, t, ,f) = (7, 8, ("xyz", 0x42), address(0x0));
    }

    function tupleArray() public {
        uint8[3] memory a = [1, 2, 3];
    }
}
