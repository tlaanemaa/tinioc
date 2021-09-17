import { declareDependency, DependencyNotFoundError } from "./utils";

describe("declareDependency", () => {
  const arg = () => ({ a: 1 });

  it("should pass it's argument through", () => {
    expect(declareDependency(arg)).toBe(arg);
  });
});

describe("DependencyNotFoundError", () => {
  describe("when called with a string", () => {
    const error = new DependencyNotFoundError("banana");

    it("should return an error", () => {
      expect(error).toBeInstanceOf(Error);
    });

    it("should contain that string in it's message", () => {
      expect(error.message).toBe('Dependency "banana" not found!');
    });
  });
});
