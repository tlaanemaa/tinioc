import { Container, Inject } from "./container";
import { BindingNotFoundError } from "./utils";

describe("Container instance", () => {
  describe("get", () => {
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

      it("should find a known component", () => {
        const binding = container.get<Adder>(ADDER);
        expect(binding.add(7)).toBe(5 + 7);
      });

      it("should throw and error when asked for an unknown component", () => {
        expect(() => container.get<Adder>("banana")).toThrowError(
          BindingNotFoundError
        );
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

      it("should find a known component", () => {
        const binding = container.get<Adder>(ADDER);
        expect(binding.add(7)).toBe(3 + 1 + 7);
      });

      it("should throw and error when asked for an unknown component", () => {
        expect(() => container.get<Adder>("banana")).toThrowError(
          BindingNotFoundError
        );
      });
    });
  });

  describe("extend", () => {
    // Binding declarations
    const MESSAGES = Symbol.for("messages");
    interface Messages {
      welcome: string;
    }

    const NUMBERS = Symbol.for("numbers");
    interface Numbers {
      PI: number;
    }

    const BREADS = Symbol.for("breads");
    interface Breads {
      baguette: number;
    }

    // Binding implementations
    const messages = (): Messages => ({
      welcome: "Hello",
    });
    const numbers = (): Numbers => ({
      PI: 3.14,
    });
    const breads = (): Breads => ({
      baguette: 5,
    });

    // Container bindings
    const baseContainer1 = new Container();
    baseContainer1.bind<Messages>(MESSAGES, messages);
    const baseContainer2 = new Container();
    baseContainer2.bind<Numbers>(NUMBERS, numbers);

    describe("when extended with the first base container", () => {
      const container = new Container();
      container.extend(baseContainer1);
      container.bind<Breads>(BREADS, breads);

      it("should find own components", () => {
        const component = container.get<Breads>(BREADS);
        expect(component.baguette).toBe(5);
      });

      it("should find the components from the first base container", () => {
        const component = container.get<Messages>(MESSAGES);
        expect(component.welcome).toBe("Hello");
      });

      describe("when extended with the second base container", () => {
        container.extend(baseContainer2);

        it("should find the components from the second base container", () => {
          const component = container.get<Numbers>(NUMBERS);
          expect(component.PI).toBe(3.14);
        });

        it("should still find the components from the first base container", () => {
          const component = container.get<Messages>(MESSAGES);
          expect(component.welcome).toBe("Hello");
        });

        it("should still find own components", () => {
          const component = container.get<Breads>(BREADS);
          expect(component.baguette).toBe(5);
        });
      });
    });
  });

  describe("createChild", () => {
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

    describe("grandchild container", () => {
      childContainer.bind<Numbers>(NUMBERS, numbers);
      const grandChildContainer = childContainer.createChild();

      it("should find components from the original parent container", () => {
        const binding = grandChildContainer.get<Messages>(MESSAGES);
        expect(binding.welcome).toBe("Hello");
      });

      it("should find components from the child container", () => {
        const binding = grandChildContainer.get<Numbers>(NUMBERS);
        expect(binding.PI).toBe(3.14);
      });

      it("should throw if the component is not found in any of the containers", () => {
        expect(() => grandChildContainer.get("potato")).toThrowError(
          BindingNotFoundError
        );
      });
    });
  });

  describe("Container.merge", () => {
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

    it("should return a new container", () => {
      expect(mergedContainer).toBeInstanceOf(Container);
    });

    describe("merged container", () => {
      it("should find components from container 1", () => {
        const binding = mergedContainer.get<Messages>(MESSAGES);
        expect(binding.welcome).toBe("Hello");
      });

      it("should find components from container 2", () => {
        const binding = mergedContainer.get<Numbers>(NUMBERS);
        expect(binding.PI).toBe(3.14);
      });
    });
  });
});
