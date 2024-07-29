import { describe, expect, test } from "vitest";
import { z } from "zod";
import { SafeFn } from "./safe-fn";

describe("SafeFn", () => {
  test("should create a new instance", () => {
    const safeFn = SafeFn.new();
    expect(safeFn).toBeInstanceOf(SafeFn);
  });
});

describe("input", () => {
  test("should set the input schema", () => {
    const inputSchema = z.string();
    const safeFn = SafeFn.new().input(inputSchema);
    expect(safeFn._inputSchema).toEqual(inputSchema);
  });
});

describe("output", () => {
  test("should set the output schema", () => {
    const outputSchema = z.string();
    const safeFn = SafeFn.new().output(outputSchema);
    expect(safeFn._outputSchema).toEqual(outputSchema);
  });
});
