library Set {
  struct Data {
    mapping(uint => bool) flags;
  }

  function insert(Data storage self, uint value) public returns (bool) {
      if (self.flags[value])
        return false;

      self.flags[value] = true;

      return true;
  }

  function remove(Data storage self, uint value) public returns (bool) {
    if (!self.flags[value])
      return false;

    self.flags[value] = false;

    return true;
  }

  function contains(Data storage self, uint value) public returns (bool) {
    return self.flags[value];
  }
}

library SomeLibraryForAny  {
  function test (uint self, uint b) public returns (bool) {
    return self > b;
  }
}

library SomeLibraryForUint {
  function add (uint self, uint b) public returns (uint) {
    return self + b;
  }
}

contract SomeContract {
  using SomeLibraryForAny for *;
  using SomeLibraryForUint for uint;
  using Set for Set.Data;

  Set.Data knownValues;

  function add3(uint number) public returns (uint) {
    number.test(5);

    return number.add(3);
  }

  function register(uint value) public {
    require(knownValues.insert(value));
  }
}

