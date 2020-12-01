pragma solidity ^0.4.13;

contract TestFor {
    function forWithExpression() public {
        int a = 0;

        for (int b = 1; b < 10; b++)a += b;
    }

    function forWithBlock() public {
        int a = 0;
        int b = 1;

        for (int c = 0; c < 10; c++) {
            a += c;
            b -= c;
        }
    }

    function forWithInitializationWithoutDeclaration() public {
        int a = 0;
        int b = 1;
        int c;

        for (c = 0; c < 10; c++) {
            a += c;
            b -= c;
        }
    }

    function forWithoutInitialization() public {
        int a = 0;
        int b = 1;

        for (; b < 10; b += 2)a += b;
    }

    function forWithoutLoopExpression() public {
        int a = 0;

        for (int b = 0; b < 10;)a += ++b;
    }

    function forWithoutLoopCondition() public {
        int a = 0;

        for (int b = 0; ; b++) {
            if (b > 10) {
                break;
            }

            a += b;
        }
    }

    function forWithExpressionOnly() public {
        int a = 0;
        int b = 1;
        
        for (;; a++) {
            if (a > 10) {
                break;
            }

            b += a;
        }
    }

    function forWithLoopConditionOnly() public {
        int a = 0;
        int b = 1;

        for (;a > 10;) b += a++;
    }

    function forWithInitializationOnly() public {
        int a = 0;

        for (int b = 0;;) {
            if (b > 10) {
                break;
            }

            a += b++;
        }
    }

    function forWithNothing() public {
        int a = 0;
        int b = 1;

        for (;;) {
            if (a > 10) {
                break;
            }

            b += a++;
        }
    }
}
