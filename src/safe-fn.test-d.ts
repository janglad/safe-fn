import { describe, expectTypeOf, test } from "vitest";
import { z } from "zod";
import { SafeFn } from "./safe-fn";

describe("input", () => {
  test("should properly type the input schema for primitives", () => {
    const inputSchema = z.string();
    const safeFn = SafeFn.new().input(inputSchema);
    expectTypeOf(safeFn._inputSchema).toEqualTypeOf<typeof inputSchema>();
  });

  test("should properly type the input schema for objects", () => {
    const inputSchema = z.object({
      test: z.string(),
      nested: z.object({
        value: z.number(),
      }),
    });
    const safeFn = SafeFn.new().input(inputSchema);
    expectTypeOf(safeFn._inputSchema).toEqualTypeOf<typeof inputSchema>();
  });

  test("should properly type the input for transformed schemas", () => {
    const inputSchema = z
      .object({
        test: z.string(),
        nested: z.object({
          value: z.number(),
        }),
      })
      .transform(({ test }) => ({ test, newProperty: "test" }));
    const safeFn = SafeFn.new().input(inputSchema);
    expectTypeOf(safeFn._inputSchema).toEqualTypeOf<typeof inputSchema>();
  });
});

describe("output", () => {
  test("should properly type the output schema for primitives", () => {
    const outputSchema = z.string();
    const safeFn = SafeFn.new().output(outputSchema);
    expectTypeOf(safeFn._outputSchema).toEqualTypeOf<typeof outputSchema>();
  });

  test("should properly type the output schema for objects", () => {
    const outputSchema = z.object({
      test: z.string(),
      nested: z.object({
        value: z.number(),
      }),
    });
    const safeFn = SafeFn.new().output(outputSchema);
    expectTypeOf(safeFn._outputSchema).toEqualTypeOf<typeof outputSchema>();
  });

  test("should properly type the output for transformed schemas", () => {
    const outputSchema = z
      .object({
        test: z.string(),
        nested: z.object({
          value: z.number(),
        }),
      })
      .transform(({ test }) => ({ test, newProperty: "test" }));
    const safeFn = SafeFn.new().output(outputSchema);
    expectTypeOf(safeFn._outputSchema).toEqualTypeOf<typeof outputSchema>();
  });
});

describe("action", () => {
  describe("input", () => {
    test("should type parsed input as never without input schema"),
      () => {
        const safeFn = SafeFn.new();
        type ActionFn = Parameters<typeof safeFn.action>[0];
        type ActionFnArgs = Parameters<ActionFn>[0];

        expectTypeOf<ActionFnArgs["parsedInput"]>().toEqualTypeOf<never>();
      };
    test("should type parsed input as inputSchema for primitives ", () => {
      const inputSchema = z.string();
      const safeFn = SafeFn.new().input(inputSchema);

      type ActionFn = Parameters<typeof safeFn.action>[0];
      type ActionFnArgs = Parameters<ActionFn>[0];

      expectTypeOf<ActionFnArgs["parsedInput"]>().toEqualTypeOf<
        z.output<typeof inputSchema>
      >();
    });

    test("should type parsed input as inputSchema for objects", () => {
      const inputSchema = z.object({
        test: z.string(),
        nested: z.object({
          value: z.number(),
        }),
      });
      const safeFn = SafeFn.new().input(inputSchema);

      type ActionFn = Parameters<typeof safeFn.action>[0];
      type ActionFnArgs = Parameters<ActionFn>[0];

      expectTypeOf<ActionFnArgs["parsedInput"]>().toEqualTypeOf<
        z.output<typeof inputSchema>
      >();
    });

    test("should type parsed input as inputSchema for transformed schemas", () => {
      const inputSchema = z
        .object({
          test: z.string(),
          nested: z.object({
            value: z.number(),
          }),
        })
        .transform(({ test }) => ({ test, newProperty: "test" }));
      const safeFn = SafeFn.new().input(inputSchema);

      type ActionFn = Parameters<typeof safeFn.action>[0];
      type ActionFnArgs = Parameters<ActionFn>[0];

      expectTypeOf<ActionFnArgs["parsedInput"]>().toEqualTypeOf<
        z.output<typeof inputSchema>
      >();
    });

    test("should type unparsed input as unknown without input schema", () => {
      const safeFn = SafeFn.new();
      type ActionFn = Parameters<typeof safeFn.action>[0];
      type ActionFnArgs = Parameters<ActionFn>[0];

      expectTypeOf<ActionFnArgs["unparsedInput"]>().toEqualTypeOf<unknown>();
    });

    test("should type unparsed input as inputSchema for primitives", () => {
      const inputSchema = z.string();
      const safeFn = SafeFn.new().input(inputSchema);

      type ActionFn = Parameters<typeof safeFn.action>[0];
      type ActionFnArgs = Parameters<ActionFn>[0];

      expectTypeOf<ActionFnArgs["unparsedInput"]>().toEqualTypeOf<
        z.input<typeof inputSchema>
      >();
    });

    test("should type unparsed input as inputSchema for objects", () => {
      const inputSchema = z.object({
        test: z.string(),
        nested: z.object({
          value: z.number(),
        }),
      });
      const safeFn = SafeFn.new().input(inputSchema);

      type ActionFn = Parameters<typeof safeFn.action>[0];
      type ActionFnArgs = Parameters<ActionFn>[0];

      expectTypeOf<ActionFnArgs["unparsedInput"]>().toEqualTypeOf<
        z.input<typeof inputSchema>
      >();
    });

    test("should type unparsed input as inputSchema for transformed schemas", () => {
      const inputSchema = z
        .object({
          test: z.string(),
          nested: z.object({
            value: z.number(),
          }),
        })
        .transform(({ test }) => ({ test, newProperty: "test" }));
      const safeFn = SafeFn.new().input(inputSchema);

      type ActionFn = Parameters<typeof safeFn.action>[0];
      type ActionFnArgs = Parameters<ActionFn>[0];

      expectTypeOf<ActionFnArgs["unparsedInput"]>().toEqualTypeOf<
        z.input<typeof inputSchema>
      >();
    });
  });

  describe("output", () => {
    test("should type output as any without output schema", () => {
      const safeFn = SafeFn.new();
      type ActionFn = Parameters<typeof safeFn.action>[0];
      type ActionFnReturn = Awaited<ReturnType<ActionFn>>;

      expectTypeOf<ActionFnReturn>().toEqualTypeOf<any>();
    });

    test("should type output as outputSchema for primitives", () => {
      const outputSchema = z.string();
      const safeFn = SafeFn.new().output(outputSchema);

      type ActionFn = Parameters<typeof safeFn.action>[0];
      type ActionFnReturn = Awaited<ReturnType<ActionFn>>;

      expectTypeOf<ActionFnReturn>().toEqualTypeOf<
        z.input<typeof outputSchema>
      >();
    });

    test("should type output as outputSchema for objects", () => {
      const outputSchema = z.object({
        test: z.string(),
        nested: z.object({
          value: z.number(),
        }),
      });
      const safeFn = SafeFn.new().output(outputSchema);

      type ActionFn = Parameters<typeof safeFn.action>[0];
      type ActionFnReturn = Awaited<ReturnType<ActionFn>>;

      expectTypeOf<ActionFnReturn>().toEqualTypeOf<
        z.infer<typeof outputSchema>
      >();
    });

    test("should type output as outputSchema for transformed schemas", () => {
      const outputSchema = z
        .object({
          test: z.string(),
          nested: z.object({
            value: z.number(),
          }),
        })
        .transform(({ test }) => ({ test, newProperty: "test" }));
      const safeFn = SafeFn.new().output(outputSchema);

      type ActionFn = Parameters<typeof safeFn.action>[0];
      type ActionFnReturn = Awaited<ReturnType<ActionFn>>;

      expectTypeOf<ActionFnReturn>().toEqualTypeOf<
        z.infer<typeof outputSchema>
      >();
    });
  });
});
