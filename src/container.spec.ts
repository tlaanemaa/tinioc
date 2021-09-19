import { Container, Inject } from "./container";
import { BindingNotFoundError } from "./utils";

describe("Container", () => {
  describe("when used with simple binding relationships", () => {
    // Binding declarations
    const ADDER = Symbol.for("adder");
    interface Adder {
      add(number: number): number;
    }

    const NUMBER_CARRIER = Symbol.for("number_carrier");
    interface NumberCarrier {
      num2: number;
    }

    // Binding implementations
    const adder = (inject: Inject): Adder => {
      const numberCarrier = inject<NumberCarrier>(NUMBER_CARRIER);
      const add = (number: number) => number + numberCarrier.num2;
      return { add };
    };

    const numberCarrier = (): NumberCarrier => {
      return { num2: 5 };
    };

    // Binding bindings
    const container = new Container();
    container.bind<Adder>(ADDER, adder);
    container.bind<NumberCarrier>(NUMBER_CARRIER, numberCarrier);

    describe("when asked for a known binding", () => {
      const binding = container.get<Adder>(ADDER);

      it("should return that binding and resolve it's bindings", () => {
        expect(binding.add(7)).toBe(5 + 7);
      });
    });

    describe("when asked for an unknown binding", () => {
      it("should throw an error", () => {
        expect(() => container.get<Adder>("banana")).toThrowError(
          BindingNotFoundError
        );
      });
    });
  });

  describe("when used with circular binding relationships", () => {
    // Binding declarations
    const ADDER = Symbol.for("adder");
    interface Adder {
      baseValue: number;
      add(number: number): number;
    }

    const NUMBER_CARRIER = Symbol.for("number_carrier");
    interface NumberCarrier {
      getNum2(): number;
    }

    // Binding implementations
    const adder = (inject: Inject): Adder => {
      const numberCarrier = inject<NumberCarrier>(NUMBER_CARRIER);
      const add = (number: number) => number + numberCarrier.getNum2();
      return { add, baseValue: 3 };
    };

    const numberCarrier = (inject: Inject): NumberCarrier => {
      const getNum2 = () => {
        const adder = inject<Adder>(ADDER);
        return adder.baseValue + 1;
      };
      return { getNum2 };
    };

    // Binding bindings
    const container = new Container();
    container.bind<Adder>(ADDER, adder);
    container.bind<NumberCarrier>(NUMBER_CARRIER, numberCarrier);

    describe("when asked for a known binding", () => {
      const binding = container.get<Adder>(ADDER);

      it("should return that binding and resolve it's bindings", () => {
        expect(binding.add(7)).toBe(3 + 1 + 7);
      });
    });

    describe("when asked for an unknown binding", () => {
      it("should throw an error", () => {
        expect(() => container.get(Symbol.for("potato"))).toThrowError(
          BindingNotFoundError
        );
      });
    });
  });

  describe("when a child container is created", () => {
    // Binding declarations
    const MESSAGES = Symbol.for("messages");
    interface Messages {
      welcome: string;
    }

    const NUMBERS = Symbol.for("numbers");
    interface Numbers {
      PI: number;
    }

    // Binding implementations
    const messages = (): Messages => ({
      welcome: "Hello",
    });
    const numbers = (): Numbers => ({
      PI: 3.14,
    });

    // Root container binding bindings
    const container = new Container();
    container.bind<Messages>(MESSAGES, messages);
    const childContainer = container.createChild();

    it("should return a new container", () => {
      expect(childContainer).toBeInstanceOf(Container);
    });

    describe("when a new binding is bound in the child container", () => {
      childContainer.bind<Numbers>(NUMBERS, numbers);

      describe("when a grandchild container is created", () => {
        const grandChildContainer = childContainer.createChild();

        describe("when asked for a binding in the child container, from the grandchild container", () => {
          const binding = grandChildContainer.get<Numbers>(NUMBERS);

          it("should return it", () => {
            expect(binding.PI).toBe(3.14);
          });
        });

        describe("when asked for a binding in the root container, from the grandchild container", () => {
          const binding = grandChildContainer.get<Messages>(MESSAGES);

          it("should return it", () => {
            expect(binding.welcome).toBe("Hello");
          });
        });

        describe("when asked for an unknown binding, from the grandchild container", () => {
          it("should throw an error", () => {
            expect(() => grandChildContainer.get("potato")).toThrowError(
              BindingNotFoundError
            );
          });
        });
      });
    });
  });

  describe("when containers are merged", () => {
    // Binding declarations
    const MESSAGES = Symbol.for("messages");
    interface Messages {
      welcome: string;
    }

    const NUMBERS = "numbers";
    interface Numbers {
      PI: number;
    }

    // Binding implementations
    const messages = (): Messages => ({
      welcome: "Hello",
    });
    const numbers = (): Numbers => ({
      PI: 3.14,
    });

    // Container binding bindings
    const container1 = new Container();
    container1.bind<Messages>(MESSAGES, messages);

    const container2 = new Container();
    container2.bind<Numbers>(NUMBERS, numbers);

    const mergedContainer = Container.merge(container1, container2);

    describe("when asked for binding from container 1", () => {
      const binding = mergedContainer.get<Messages>(MESSAGES);

      it("should return it", () => {
        expect(binding.welcome).toBe("Hello");
      });
    });

    describe("when asked for binding from container 2", () => {
      const binding = mergedContainer.get<Numbers>(NUMBERS);

      it("should return it", () => {
        expect(binding.PI).toBe(3.14);
      });
    });
  });
});
