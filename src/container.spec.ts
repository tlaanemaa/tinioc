import { Container } from "./container";
import { declareDependency, DependencyNotFoundError } from "./utils";

describe("Container", () => {
  describe("when used with simple dependency relationships", () => {
    // Dependency declarations
    const ADDER = Symbol.for("adder");
    interface Adder {
      add(number: number): number;
    }

    const NUMBER_CARRIER = Symbol.for("number_carrier");
    interface NumberCarrier {
      num2: number;
    }

    // Dependency implementations
    const adder = declareDependency(({ get }): Adder => {
      const numberCarrier = get<NumberCarrier>(NUMBER_CARRIER);
      const add = (number: number) => number + numberCarrier.num2;
      return { add };
    });

    const numberCarrier = declareDependency((): NumberCarrier => {
      return { num2: 5 };
    });

    // Dependency bindings
    const container = new Container();
    container.bind<Adder>(ADDER, adder);
    container.bind<NumberCarrier>(NUMBER_CARRIER, numberCarrier);

    describe("when asked for a known dependency", () => {
      const dependency = container.get<Adder>(ADDER);

      it("should return that dependency and resolve it's dependencies", () => {
        expect(dependency.add(7)).toBe(5 + 7);
      });
    });

    describe("when asked for an unknown dependency", () => {
      it("should throw an error", () => {
        expect(() => container.get<Adder>("banana")).toThrow(
          DependencyNotFoundError
        );
      });
    });
  });

  describe("when used with circular dependency relationships", () => {
    // Dependency declarations
    const ADDER = Symbol.for("adder");
    interface Adder {
      baseValue: number;
      add(number: number): number;
    }

    const NUMBER_CARRIER = Symbol.for("number_carrier");
    interface NumberCarrier {
      getNum2(): number;
    }

    // Dependency implementations
    const adder = declareDependency(({ get }): Adder => {
      const numberCarrier = get<NumberCarrier>(NUMBER_CARRIER);
      const add = (number: number) => number + numberCarrier.getNum2();
      return { add, baseValue: 3 };
    });

    const numberCarrier = declareDependency(({ get }): NumberCarrier => {
      const getNum2 = () => {
        const adder = get<Adder>(ADDER);
        return adder.baseValue + 1;
      };
      return { getNum2 };
    });

    // Dependency bindings
    const container = new Container();
    container.bind<Adder>(ADDER, adder);
    container.bind<NumberCarrier>(NUMBER_CARRIER, numberCarrier);

    describe("when asked for a known dependency", () => {
      const dependency = container.get<Adder>(ADDER);

      it("should return that dependency and resolve it's dependencies", () => {
        expect(dependency.add(7)).toBe(3 + 1 + 7);
      });
    });

    describe("when asked for an unknown dependency", () => {
      it("should throw an error", () => {
        expect(() => container.get<Adder>(Symbol.for("potatis"))).toThrow(
          DependencyNotFoundError
        );
      });
    });
  });
});
