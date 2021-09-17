import { Container } from "./container";
import { declareDependency } from "./utils";

describe("Container", () => {
  const ADDER = Symbol.for("adder");
  interface Adder {
    add(num1: number): number;
  }

  const NUMBER_CARRIER = Symbol.for("number_carrier");
  interface NumberCarrier {
    num2: number;
  }

  const adder = declareDependency(({ get }): Adder => {
    const numberCarrier = get<NumberCarrier>(NUMBER_CARRIER);
    const add = (number: number) => number + numberCarrier.num2;
    return { add };
  });

  const numberCarrier = declareDependency(({ get }): NumberCarrier => {
    return { num2: 5 };
  });

  const container = new Container();
  container.bind<Adder>(ADDER, adder);
  container.bind<NumberCarrier>(NUMBER_CARRIER, numberCarrier);

  describe("when asked for a dependency", () => {
    const dependency = container.get<Adder>(ADDER);

    it("should return that dependency and resolve it's dependencies", () => {
      expect(dependency.add(7)).toBe(12);
    });
  });
});
