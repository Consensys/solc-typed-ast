library Some {
    struct Item {
        uint id;
    }

    struct Abc {
        Item item;
    }

    struct Def {
        Item item;
    }

    function id(Abc memory data) pure public returns(uint) {
        return data.item.id;
    }

    function id(Def memory data) pure public returns(uint) {
        return data.item.id;
    }
}

contract Test {
    using Some for Some.Abc;
    using Some for Some.Def;

    function verify() pure public {
        Some.Abc memory a = Some.Abc({ item: Some.Item(1) });
        Some.Def memory b = Some.Def({ item: Some.Item(2) });

        assert(a.id() == 1);
        assert(b.id() == 2);
    }
}
