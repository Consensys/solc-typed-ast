contract ConstExprs {
    function literals() public {
        42;
        -42;
        1.1;
        -1.23459278345682734561283746128974561987;
        12937846128975612904871239487120957130498612937823435623456453456756325623563;
        -9999999999999999999999999999999999999999999999999999999999999999999999999999;
        0x123456;
        0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa;
        -0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab;
        true;
        false;
        "normal string";
        hex"01020304";
    }

    function unaryOps() public {
        -42; /// int_const -42
        ~42; /// int_const -43
        -1.1; /// int_const -1.1
        //~1.1; bitwise negation not allowed on rationals
        !true; 
        !false;
        ~0x23; /// int_const -36 = 011100
    }

    function binaryOps() public {
        // Logical
        true || false;
        true && true;
        true && (false || true);

        // Equality
        23 == 0x23;
        42 != 0x42;
        2 == 1.1 + 0.9;
        //3.45423453 != 3.45423452;

        //Equality comparison not allowed for strings
        //"abc" == "abc";
        //"abc" != "abd";
        //"abc" == hex"616263";

        true == true;
        true != false;

        // Other comparisons
        
        // Comparisons with rationals not allowed
        /*
        1.1 < 1.2;
        1.1 <= 1.1;
        4.2 > 4.1;
        4.2 >= 4.2;
        */
        1.1 + 0.9 < 3;
        1 <= 1.1-0.1;
        5 > 4;
        5 >= 5;

        // Arithmetic
        
        1.1 + 0.9; // 2
        1.2 - 0.2; // 1
        1.5 * 2.0; // 3
        6 /  1.5; // 4
        6 / -1.5; // -4
        6 / 2; // 3
        -6 / 2; // -3
        6 % 1.5; // 0
        6 % -1.5; // 0
        7 % 1.5; // 1
        7.5 % -1.5; // 0
        7.5/ -1.5;
        9 ** 2;
        // Rational power not allowed even when resulting in an integer result
        // 9 ** 1.5;
        // I don't think its possible to have a non-integer base resulting in an integer exponentiation
        // 1.5 ** 2
    }
}
