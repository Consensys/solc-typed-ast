pragma abicoder v2;

import "./v1.sol";

contract A is B {
	struct Sa {
		uint t;
	}

	Sa public x;
}
