contract Test {
    function some() public {
        int a = 0;
        bool b = false;

        a = -a;
        a = ~a;

        delete a;

        b = !b;
    }
}
