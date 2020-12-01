contract Test {
    function some() public {
        uint b = 0;

        b = b + 1;
        b = b - 2;
        b = b * 20;
        b = b / 2;
        b = b % 5;
        b = b & 1;
        b = b | 1;
        b = b ^ 1;
        b = b ** 2;
    }
}
