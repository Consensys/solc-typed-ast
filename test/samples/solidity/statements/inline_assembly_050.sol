pragma solidity ^0.5.0;

contract TestAssembly {
    function singleOneLineAssembly(int x) public returns (int y) {
        assembly { y := add(x, 1) }
    }

    function singleMultilineAssembly(int x) public {
        assembly {
            let y := 100

            x := sub(y, x)
        }
    }

    function multipleAssemblies(int x) public returns (int a, int b) {
        if (x > 0) {
            assembly {
                x := sub(x, 1)
                x := add(1, x)
            }
        }

        assembly {
            let y := 200

            a := add(x, y)
            b := sub(x, y)
        }
    }
}
