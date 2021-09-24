import { Container, Inject } from "./container";
import { BindingNotFoundError } from "./utils";

describe("Container instance", () => {
  describe("bind", () => {
    // Component declarations
    const ADDER = Symbol.for("adder");
    interface Adder {
      add(number1: number, number2: number): number;
    }

    // Component implementations
    const adder = (): Adder => ({
      add: (number1: number, number2: number) => number1 + number2,
    });

    const container = new Container();

    it("should bind a component into the container", () => {
      expect(container.isBound(ADDER)).toBe(false);
      container.bind<Adder>(ADDER, adder);
      expect(container.isBound(ADDER)).toBe(true);
    });
  });

  describe("isBound", () => {
    // Component declarations
    const ADDER = Symbol.for("adder");
    interface Adder {
      add(number1: number, number2: number): number;
    }

    // Component implementations
    const adder = (): Adder => ({
      add: (number1: number, number2: number) => number1 + number2,
    });

    const container = new Container();
    container.bind<Adder>(ADDER, adder);

    it("return true if component is bound in the container", () => {
      expect(container.isBound(ADDER)).toBe(true);
    });

    it("should return true if component is bound in the parent container", () => {
      const childContainer = container.createChild();
      expect(childContainer.isBound(ADDER)).toBe(true);
    });
  });

  describe("isCurrentBound", () => {
    // Component declarations
    const ADDER = Symbol.for("adder");
    interface Adder {
      add(number1: number, number2: number): number;
    }

    // Component implementations
    const adder = (): Adder => ({
      add: (number1: number, number2: number) => number1 + number2,
    });

    const container = new Container();
    container.bind<Adder>(ADDER, adder);

    it("return true if component is bound in the container", () => {
      expect(container.isCurrentBound(ADDER)).toBe(true);
    });

    it("should return false if component is bound in the parent container", () => {
      const childContainer = container.createChild();
      expect(childContainer.isCurrentBound(ADDER)).toBe(false);
    });
  });

  describe("unbind", () => {
    // Component declarations
    const ADDER = Symbol.for("adder");
    interface Adder {
      add(number1: number, number2: number): number;
    }

    // Component implementations
    const adder = (): Adder => ({
      add: (number1: number, number2: number) => number1 + number2,
    });

    it("should unbind the component from the container", () => {
      const container = new Container();
      container.bind<Adder>(ADDER, adder);

      expect(container.isBound(ADDER)).toBe(true);
      container.unbind(ADDER);
      expect(container.isBound(ADDER)).toBe(false);
    });

    it("should not unbind the component from a parent container", () => {
      const container = new Container();
      container.bind<Adder>(ADDER, adder);
      const childContainer = container.createChild();

      expect(childContainer.isBound(ADDER)).toBe(true);
      childContainer.unbind(ADDER);
      expect(childContainer.isBound(ADDER)).toBe(true);
      expect(childContainer.isCurrentBound(ADDER)).toBe(false);
    });

    it("should not unbind other components from the container", () => {
      const ADDER2 = Symbol.for("adder2");
      const container = new Container();
      container.bind<Adder>(ADDER, adder);
      container.bind<Adder>(ADDER2, adder);

      expect(container.isBound(ADDER)).toBe(true);
      expect(container.isBound(ADDER2)).toBe(true);
      container.unbind(ADDER);
      expect(container.isBound(ADDER)).toBe(false);
      expect(container.isBound(ADDER2)).toBe(true);
    });
  });

  describe("get", () => {
    describe("when used with simple component relationships", () => {
      // Component declarations
      const ADDER = Symbol.for("adder");
      interface Adder {
        add(number: number): number;
      }

      const NUMBER_CARRIER = "number_carrier";
      interface NumberCarrier {
        num2: number;
      }

      // Component implementations
      const adder = (inject: Inject): Adder => {
        const numberCarrier = inject<NumberCarrier>(NUMBER_CARRIER);
        const add = (number: number) => number + numberCarrier.num2;
        return { add };
      };

      const numberCarrier = (): NumberCarrier => {
        return { num2: 5 };
      };

      // Component bindings
      const container = new Container();
      container.bind<Adder>(ADDER, adder);
      container.bind<NumberCarrier>(NUMBER_CARRIER, numberCarrier);

      it("should find a known component", () => {
        const component = container.get<Adder>(ADDER);
        expect(component.add(7)).toBe(5 + 7);
      });

      it("should throw and error when asked for an unknown component", () => {
        expect(() => container.get<Adder>("banana")).toThrowError(
          BindingNotFoundError
        );
      });
    });

    describe("when used with circular component relationships", () => {
      // Component declarations
      const ADDER = Symbol.for("adder");
      interface Adder {
        baseValue: number;
        add(number: number): number;
      }

      const NUMBER_CARRIER = Symbol.for("number_carrier");
      interface NumberCarrier {
        getNum2(): number;
      }

      // Component implementations
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

      // Component bindings
      const container = new Container();
      container.bind<Adder>(ADDER, adder);
      container.bind<NumberCarrier>(NUMBER_CARRIER, numberCarrier);

      it("should find a known component", () => {
        const component = container.get<Adder>(ADDER);
        expect(component.add(7)).toBe(3 + 1 + 7);
      });

      it("should throw and error when asked for an unknown component", () => {
        expect(() => container.get<Adder>("banana")).toThrowError(
          BindingNotFoundError
        );
      });
    });
  });

  describe("extend", () => {
    // Component declarations
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

    // Component implementations
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

    describe("when extended with 2 containers, separately", () => {
      const container = new Container();
      container.extend(baseContainer1);
      container.extend(baseContainer2);
      container.extend(baseContainer1); // This is used to test the uniqueness
      container.bind<Breads>(BREADS, breads);

      it("should push provided unique containers to the parents array", () => {
        expect(container.parents).toStrictEqual([
          baseContainer1,
          baseContainer2,
        ]);
      });

      it("should find own components", () => {
        const component = container.get<Breads>(BREADS);
        expect(component.baguette).toBe(5);
      });

      it("should find the components from the first base container", () => {
        const component = container.get<Messages>(MESSAGES);
        expect(component.welcome).toBe("Hello");
      });

      it("should find the components from the second base container", () => {
        const component = container.get<Numbers>(NUMBERS);
        expect(component.PI).toBe(3.14);
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

    // Root container component bindings
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
        const component = grandChildContainer.get<Messages>(MESSAGES);
        expect(component.welcome).toBe("Hello");
      });

      it("should find components from the child container", () => {
        const component = grandChildContainer.get<Numbers>(NUMBERS);
        expect(component.PI).toBe(3.14);
      });

      it("should throw if the component is not found in any of the containers", () => {
        expect(() => grandChildContainer.get("potato")).toThrowError(
          BindingNotFoundError
        );
      });
    });
  });
});
