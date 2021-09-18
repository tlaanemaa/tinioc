import * as tinioc from "./main";

describe("tinioc", () => {
  it("only exports what is expected", () => {
    expect(Object.keys(tinioc).sort()).toStrictEqual(
      ["Container", "BindingNotFoundError", "declareInjectable"].sort()
    );
  });
});
