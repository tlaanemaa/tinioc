import { BindingNotFoundError } from "./utils";

describe("BindingNotFoundError", () => {
  describe("when called with a string", () => {
    const error = new BindingNotFoundError("banana");

    it("should return an error", () => {
      expect(error).toBeInstanceOf(Error);
    });

    it("should contain that string in it's message", () => {
      expect(error.message).toBe('Binding "banana" not found!');
    });
  });

  describe("when called with a symbol", () => {
    const error = new BindingNotFoundError(Symbol.for("aliens"));

    it("should return an error", () => {
      expect(error).toBeInstanceOf(Error);
    });

    it("should contain that string in it's message", () => {
      expect(error.message).toBe('Binding "Symbol(aliens)" not found!');
    });
  });
});
