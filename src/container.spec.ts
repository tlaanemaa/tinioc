import { Container, Inject } from "./container";
import { BindingNotFoundError } from "./utils";

describe("Container instance", () => {
  describe("get", () => {
    describe("when used with simple component relationships", () => {
      // Component declarations
      const ADDER = Symbol.for("adder");
      interface Adder {
        add(number: number): number;
      }

      const NUMBER_CARRIER = Symbol.for("number_carrier");
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
