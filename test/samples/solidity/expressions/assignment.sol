contract Test {
    int a = 1;

    function some() public {
        int b = 0;

        b += 1;
        b -= 2;
        b *= 20;
        b /= 2;
        b %= 5;
        b = 7;
        b &= 1;
        b |= 1;
        b ^= 1;
    }
}
