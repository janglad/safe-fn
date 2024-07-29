import { describe, expectTypeOf, test } from "vitest";
import { z } from "zod";
import { SafeFn } from "./safe-fn";

describe("input", () => {
  test("should properly type the input schema for primitives", () => {
    const inputSchema = z.string();
    const safeFn = SafeFn.new().input(inputSchema);
    expectTypeOf(safeFn._inputSchema).toMatchTypeOf<typeof inputSchema>();
  });

  test("should properly type the input schema for objects", () => {
    const inputSchema = z.object({
      test: z.string(),
      nested: z.object({
        value: z.number(),
      }),
    });
    const safeFn = SafeFn.new().input(inputSchema);
    expectTypeOf(safeFn._inputSchema).toMatchTypeOf<typeof inputSchema>();
  });

  test("should properly type the input for transformed schemas", () => {
    const inputSchema = z
      .object({
        test: z.string(),
        nested: z.object({
          value: z.number(),
        }),
      })
      .transform(({ test }) => ({ test }));
    const safeFn = SafeFn.new().input(inputSchema);
    expectTypeOf(safeFn._inputSchema).toMatchTypeOf<typeof inputSchema>();
  });
});

describe("output", () => {
  test("should properly type the output schema for primitives", () => {
    const outputSchema = z.string();
    const safeFn = SafeFn.new().output(outputSchema);
    expectTypeOf(safeFn._outputSchema).toMatchTypeOf<typeof outputSchema>();
  });

  test("should properly type the output schema for objects", () => {
    const outputSchema = z.object({
      test: z.string(),
      nested: z.object({
        value: z.number(),
      }),
    });
    const safeFn = SafeFn.new().output(outputSchema);
    expectTypeOf(safeFn._outputSchema).toMatchTypeOf<typeof outputSchema>();
  });

  test("should properly type the output for transformed schemas", () => {
    const outputSchema = z
      .object({
        test: z.string(),
        nested: z.object({
          value: z.number(),
        }),
      })
      .transform(({ test }) => ({ test }));
    const safeFn = SafeFn.new().output(outputSchema);
    expectTypeOf(safeFn._outputSchema).toMatchTypeOf<typeof outputSchema>();
  });
});
