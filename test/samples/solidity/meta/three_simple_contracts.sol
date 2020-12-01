contract D {
  uint public u;
  function f() public {
    u = 4;
  }
}

contract C {
  uint public u;
  function f() public {
    u = 1;
  }
}

contract B is C {
  function f() public {
    u = 2;
  }
}

contract A is B,D {
  function f() public {  // will set u to 3
    u = 3;
  }
  function f1() public { // will set u to 2
    super.f();
  }
  function f2() public { // will set u to 2
    B.f();
  }
  function f3() public { // will set u to 1
    C.f();
  }
}
