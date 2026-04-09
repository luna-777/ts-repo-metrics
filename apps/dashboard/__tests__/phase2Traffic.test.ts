import { describe, expect, it } from "vitest";
import {
  phase2TrafficCellClass,
  trafficForCognitive,
  trafficForCyclomatic,
  trafficForMiNorm,
} from "../lib/phase2Traffic";

describe("trafficForMiNorm", () => {
  it("bands match GRAD-AI dashboard legend", () => {
    expect(trafficForMiNorm(90)).toBe("green");
    expect(trafficForMiNorm(85)).toBe("green");
    expect(trafficForMiNorm(84)).toBe("yellow");
    expect(trafficForMiNorm(65)).toBe("yellow");
    expect(trafficForMiNorm(64.9)).toBe("red");
    expect(trafficForMiNorm(0)).toBe("red");
  });
});

describe("trafficForCyclomatic", () => {
  it("green ≤10, yellow 11–20, red ≥21", () => {
    expect(trafficForCyclomatic(1)).toBe("green");
    expect(trafficForCyclomatic(10)).toBe("green");
    expect(trafficForCyclomatic(11)).toBe("yellow");
    expect(trafficForCyclomatic(20)).toBe("yellow");
    expect(trafficForCyclomatic(21)).toBe("red");
  });
});

describe("trafficForCognitive", () => {
  it("green ≤8, yellow 9–15, red ≥16", () => {
    expect(trafficForCognitive(0)).toBe("green");
    expect(trafficForCognitive(8)).toBe("green");
    expect(trafficForCognitive(9)).toBe("yellow");
    expect(trafficForCognitive(15)).toBe("yellow");
    expect(trafficForCognitive(16)).toBe("red");
  });
});

describe("phase2TrafficCellClass", () => {
  it("returns untinted base class when value is missing", () => {
    expect(phase2TrafficCellClass(undefined, "mi")).toBe("text-right tabular-nums");
  });

  it("includes tint classes for numeric values", () => {
    const cls = phase2TrafficCellClass(50, "mi");
    expect(cls).toContain("text-right");
    expect(cls).toContain("tabular-nums");
    expect(cls).toContain("red-500");
  });
});
