import { DependencyNotFoundError } from "./errors";

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
