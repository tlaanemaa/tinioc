import { Scope } from "./scope";

describe("Scope", () => {
  it("is a function", () => {
    expect(Scope).toBeInstanceOf(Function);
  });

  describe("set", () => {
    it("adds a value to the scope", () => {
      const scope = new Scope();
      scope.set("banana", 5);
      expect(scope.has("banana")).toBe(true);
    });

    it("returns this", () => {
      const scope = new Scope();
      expect(scope.set("mango", 7).has("mango")).toBe(true);
    });

    it("does not add the value to parent's scope", () => {
      const scope = new Scope();
      const childScope = scope.createChild();
      childScope.set("banana", 5);
      expect(scope.has("banana")).toBe(false);
    });
  });

  describe("has", () => {
    it("returns true if a value is in the scope", () => {
      const scope = new Scope();
      scope.set("banana", 5);
      expect(scope.has("banana")).toBe(true);
    });

    it("returns false if a value is not in the scope", () => {
      const scope = new Scope();
      expect(scope.has("mango")).toBe(false);
    });

    it("returns true if a value is in the parent's scope", () => {
      const scope = new Scope();
      scope.set("banana", 5);
      const childScope = scope.createChild();
      expect(childScope.has("banana")).toBe(true);
    });

    it("returns false if a value is not in the either scope", () => {
      const scope = new Scope();
      const childScope = scope.createChild();
      expect(childScope.has("banana")).toBe(false);
    });
  });

  describe("get", () => {
    it("returns the value if a value is in the scope", () => {
      const scope = new Scope();
      scope.set("banana", 5);
      expect(scope.get("banana")).toBe(5);
    });

    it("returns undefined if a value is not in the scope", () => {
      const scope = new Scope();
      expect(scope.get("mango")).toBe(undefined);
    });

    it("returns the value if a value is in the parent's scope", () => {
      const scope = new Scope();
      scope.set("banana", 5);
      const childScope = scope.createChild();
      expect(childScope.get("banana")).toBe(5);
    });

    it("returns undefined if a value is not in the either scope", () => {
      const scope = new Scope();
      const childScope = scope.createChild();
      expect(childScope.get("banana")).toBe(undefined);
    });
  });

  describe("delete", () => {
    it("deletes the value from the scope", () => {
      const scope = new Scope();
      scope.set("banana", 5);
      expect(scope.has("banana")).toBe(true);
      scope.delete("banana");
      expect(scope.has("banana")).toBe(false);
    });

    it("returns true if the deleted value existed", () => {
      const scope = new Scope();
      scope.set("banana", 5);
      expect(scope.delete("banana")).toBe(true);
      expect(scope.has("banana")).toBe(false);
    });

    it("returns false if the deleted value did not exist", () => {
      const scope = new Scope();
      expect(scope.delete("banana")).toBe(false);
    });

    it("does not add the value to parent's scope", () => {
      const scope = new Scope();
      scope.set("banana", 5);
      const childScope = scope.createChild();
      expect(childScope.has("banana")).toBe(true);
      childScope.delete("banana");
      expect(childScope.has("banana")).toBe(true);
      expect(scope.has("banana")).toBe(true);
    });
  });

  describe("createChild", () => {
    it("creates a new scope", () => {
      const scope = new Scope();
      const childScope = scope.createChild();
      expect(childScope).toBeInstanceOf(Scope);
    });

    it("creates a new scope that is a child of the original scope", () => {
      const scope = new Scope();
      scope.set("banana", 7);
      const childScope = scope.createChild();
      expect(childScope.get("banana")).toBe(7);
    });
  });
});
