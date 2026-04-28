import { describe, it, expect } from "vitest";
import { capitalize, isEven } from "./utils";

describe("utils", () => {
  it("capitalize", () => {
    expect(capitalize("a")).toBe("A");
  });
  it("isEven", () => {
    expect(isEven(2)).toBe(true);
  });
});
