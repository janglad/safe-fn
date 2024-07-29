import { describe, expectTypeOf, test } from "vitest";
import { z } from "zod";
import { Ok, type Result } from "./result";
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

  describe("unparsedInput", () => {
    test("Should allow manually setting unparsedInput type", () => {
      const safeFn = SafeFn.new().unparsedInput<{ test: string }>();

      type ActionFn = Parameters<typeof safeFn.action>[0];
      type ActionFnArgs = Parameters<ActionFn>[0];

      expectTypeOf<ActionFnArgs["unparsedInput"]>().toEqualTypeOf<{
        test: string;
      }>();
    });
  });

  describe("output", () => {
    test("should type output as any without output schema", () => {
      const safeFn = SafeFn.new();
      type ActionFn = Parameters<typeof safeFn.action>[0];
      type ActionFnReturn = Awaited<ReturnType<ActionFn>>;

      expectTypeOf<ActionFnReturn>().toEqualTypeOf<Result<any, any>>();
    });

    test("should type output as outputSchema for primitives", () => {
      const outputSchema = z.string();
      const safeFn = SafeFn.new().output(outputSchema);

      type ActionFn = Parameters<typeof safeFn.action>[0];
      type ActionFnReturn = Awaited<ReturnType<ActionFn>>;

      expectTypeOf<ActionFnReturn>().toEqualTypeOf<
        Result<z.input<typeof outputSchema>, any>
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
        Result<z.infer<typeof outputSchema>, any>
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
        Result<z.infer<typeof outputSchema>, any>
      >();
    });
  });
});

describe("run", () => {
  describe("input", () => {
    // TODO: Allow passing unparsedInput as generic
    test("should infer input from actionFn if no input schema is provided", () => {
      const safeFn = SafeFn.new()
        .unparsedInput<any>()
        .action((args: { unparsedInput: { test: string } }) =>
          Ok(args.unparsedInput),
        );

      type RunInput = Parameters<typeof safeFn.run>[0];
      expectTypeOf<RunInput>().toEqualTypeOf<{ test: string }>();
    });

    test("should type input as inputSchema input for primitives", () => {
      const inputSchema = z.string();
      const safeFn = SafeFn.new()
        .input(inputSchema)
        .action((args) => Ok(args.parsedInput));

      type RunInput = Parameters<typeof safeFn.run>[0];

      expectTypeOf<RunInput>().toEqualTypeOf<z.input<typeof inputSchema>>();
    });

    test("should type input as inputSchema input for objects", () => {
      const inputSchema = z.object({
        test: z.string(),
        nested: z.object({
          value: z.number(),
        }),
      });
      const safeFn = SafeFn.new()
        .input(inputSchema)
        .action((args) => Ok(args.parsedInput));

      type RunInput = Parameters<typeof safeFn.run>[0];

      expectTypeOf<RunInput>().toEqualTypeOf<z.input<typeof inputSchema>>();
    });

    test("should type input as inputSchema input for transformed schemas", () => {
      const inputSchema = z
        .object({
          test: z.string(),
          nested: z.object({
            value: z.number(),
          }),
        })
        .transform(({ test }) => ({ test, newProperty: "test" }));
      const safeFn = SafeFn.new()
        .input(inputSchema)
        .action((args) => Ok(args.parsedInput));

      type RunInput = Parameters<typeof safeFn.run>[0];

      expectTypeOf<RunInput>().toEqualTypeOf<z.input<typeof inputSchema>>();
    });
  });

  // TODO: add output testing after result type is defined
  describe.todo("output");
});
