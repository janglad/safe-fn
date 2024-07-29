import { describe, expect, test } from "vitest";
import { z } from "zod";
import { Ok } from "./result";
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

describe("action", () => {
  test("should set the action function", () => {
    const actionFn = () => Ok("data");
    const safeFn = SafeFn.new().action(actionFn);
    expect(safeFn._actionFn).toEqual(actionFn);
  });
});

describe("internals", () => {
  describe("_parseInput", () => {
    test("should throw when no input schema is defined", async () => {
      const safeFn = SafeFn.new();
      expect(() => safeFn._parseInput("data")).rejects.toThrow();
    });

    test("should return Ok when input is valid", async () => {
      const inputSchema = z.string();
      const safeFn = SafeFn.new().input(inputSchema);
      const res = await safeFn._parseInput("data");
      expect(res).toEqual(Ok("data"));
    });

    // TODO: mabe write this better
    test("should return Err when input is invalid", async () => {
      const inputSchema = z.string();
      const safeFn = SafeFn.new().input(inputSchema);
      const res = await safeFn._parseInput(123);
      expect(res.success).toBe(false);
      expect(res.data).toBeUndefined();
      expect(res.error).toBeDefined();
      expect(res.error).toBeInstanceOf(z.ZodError);
    });

    test("should transform input", async () => {
      const inputSchema = z.string().transform((data) => data + "!");
      const safeFn = SafeFn.new().input(inputSchema);
      const res = await safeFn._parseInput("data");
      expect(res).toEqual(Ok("data!"));
    });
  });

  describe("_parseOutput", () => {
    test("should throw when no output schema is defined", async () => {
      const safeFn = SafeFn.new();
      expect(() => safeFn._parseOutput("data")).rejects.toThrow();
    });

    test("should return Ok when output is valid", async () => {
      const outputSchema = z.string();
      const safeFn = SafeFn.new().output(outputSchema);
      const res = await safeFn._parseOutput("data");
      expect(res).toEqual(Ok("data"));
    });

    test("should return Err when output is invalid", async () => {
      const outputSchema = z.string();
      const safeFn = SafeFn.new().output(outputSchema);
      const res = await safeFn._parseOutput(123);
      expect(res.success).toBe(false);
      expect(res.data).toBeUndefined();
      expect(res.error).toBeDefined();
      expect(res.error).toBeInstanceOf(z.ZodError);
    });

    test("should transform output", async () => {
      const outputSchema = z.string().transform((data) => data + "!");
      const safeFn = SafeFn.new().output(outputSchema);
      const res = await safeFn._parseOutput("data");
      expect(res).toEqual(Ok("data!"));
    });
  });
});
