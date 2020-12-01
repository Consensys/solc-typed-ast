pragma solidity ^0.4.13;

contract TestBlock {
    function nestedBlocks() public {
        {
            int a = 0;

            {
                int b = 0;

                {
                    int c = 0;
                }
            }
        }
    }

    function statementBlocks() public {
        if (true) {
            log0(bytes32("yes"));
        } else {
            log0(bytes32("nope"));
        }

        for (int x = 0; x < 10; x++) {
            log0(bytes32(x));
        }

        int y = 0;

        while (y < 10) {
            log0(bytes32(y));

            y++;
        }

        int z = 0;

        do {
            z++;

            log0(bytes32(z));
        } while (z < 10);
    }

    function testNoBlocks() public {
        if (true) log0(bytes32("yes"));
        else log0(bytes32("nope"));

        for (int x = 0; x < 10; x++) log0(bytes32(x));

        int y = 0;

        while (y < 10) log0(bytes32(y++));

        int z = 0;

        do log0(bytes32(++z));
        while (z < 10);
    }
}
