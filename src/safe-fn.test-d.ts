import { describe, expectTypeOf, test } from "vitest";
import { z } from "zod";
import { Err, Ok, type InferErrError, type Result } from "./result";
import { SafeFn } from "./safe-fn";
import type {
  SafeFnDefaultActionFn,
  SafeFnDefaultThrowHandler,
  SafeFnInputParseError,
  SafeFnOutputParseError,
} from "./types";

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

  describe("output", () => {
    test("should infer return type as Res<never,default error> when no action is set", async () => {
      const safeFn = SafeFn.new().error(() => {
        throw new Error();
      });
      type Res = Awaited<ReturnType<typeof safeFn.run>>;
      type inferred = InferErrError<Res>;

      expectTypeOf<Res>().toEqualTypeOf<
        Result<never, ReturnType<SafeFnDefaultActionFn>["error"]>
      >();
    });
    test("should infer success return type from action when no output schema is provided", async () => {
      const safeFn = SafeFn.new().action(() => Ok("data" as const));

      expectTypeOf(safeFn.run({})).resolves.toMatchTypeOf<
        Result<"data", any>
      >();
    });

    test("should type output as Ok<outputSchema> for transformed values", async () => {
      const outputSchema = z.string().transform((data) => data + "!");
      const safeFn = SafeFn.new().output(outputSchema);

      const res = await safeFn.run({});
      expectTypeOf(res).toMatchTypeOf<
        Result<z.output<typeof outputSchema>, any>
      >();
    });
  });

  describe("error", () => {
    test("should infer Err return as default when no error function is set", async () => {
      const safeFn = SafeFn.new().action(() => Ok("data" as const));

      type Res = Awaited<ReturnType<typeof safeFn.run>>;
      type InferredErrError = InferErrError<Res>;
      expectTypeOf<InferredErrError>().toEqualTypeOf<
        ReturnType<SafeFnDefaultThrowHandler>["error"]
      >();
    });

    test("should infer Err return type from action when no error function is set", async () => {
      const safeFn = SafeFn.new().action(() => Err("my error" as const));
      type Res = Awaited<ReturnType<typeof safeFn.run>>;
      type InferredErrError = InferErrError<Res>;
      expectTypeOf<InferredErrError>().toEqualTypeOf<
        "my error" | ReturnType<SafeFnDefaultThrowHandler>["error"]
      >();
    });

    test("should infer Err return type from action when error function is set", async () => {
      const safeFn = SafeFn.new()
        .action(() => {
          return Err("error" as const);
        })
        .error(() => Err("thrown" as const));

      type Res = Awaited<ReturnType<typeof safeFn.run>>;
      type InferredErrError = InferErrError<Res>;

      expectTypeOf<InferredErrError>().toEqualTypeOf<"error" | "thrown">();
    });
  });
});

describe("internals", () => {
  describe("_parseInput", () => {
    test("should return Result Ok as never when no input schema is defined", async () => {
      const safeFn = SafeFn.new();
      const res = await safeFn._parseInput("data");
      expectTypeOf(res).toMatchTypeOf<Result<never, any>>();
    });

    test("should type Result Ok as inputSchema for transformed schemas", async () => {
      const inputSchema = z
        .object({
          test: z.string(),
          nested: z.object({
            value: z.number(),
          }),
        })
        .transform(({ test }) => ({ test, newProperty: "test" }));
      const safeFn = SafeFn.new().input(inputSchema);
      const res = await safeFn._parseInput("data");
      expectTypeOf(res).toMatchTypeOf<
        Result<z.output<typeof inputSchema>, any>
      >();
    });

    test("should type Result Err as never without input schema", async () => {
      const safeFn = SafeFn.new();
      const res = await safeFn._parseInput(123);
      expectTypeOf(res).toEqualTypeOf<Result<never, never>>();
    });

    test("should type Result Err as typed ZodError for transformed schemas", async () => {
      const inputSchema = z
        .object({
          test: z.string(),
          nested: z.object({
            value: z.number(),
          }),
        })
        .transform(({ test }) => ({ test, newProperty: "test" }));
      const safeFn = SafeFn.new().input(inputSchema);
      const res = await safeFn._parseInput(123);
      expectTypeOf(res).toMatchTypeOf<
        Result<any, SafeFnInputParseError<typeof inputSchema>>
      >();
    });
  });

  describe("_parseOutput", () => {
    test("should return Result Ok as never when no output schema is defined", async () => {
      const safeFn = SafeFn.new();
      const res = await safeFn._parseOutput("data");
      expectTypeOf(res).toMatchTypeOf<Result<never, any>>();
    });

    test("should type Result Ok as outputSchema for transformed schemas", async () => {
      const outputSchema = z
        .object({
          test: z.string(),
          nested: z.object({
            value: z.number(),
          }),
        })
        .transform(({ test }) => ({ test, newProperty: "test" }));
      const safeFn = SafeFn.new().output(outputSchema);
      const res = await safeFn._parseOutput("data");
      expectTypeOf(res).toMatchTypeOf<
        Result<z.output<typeof outputSchema>, any>
      >();
    });

    test("should type Result Err as never without output schema", async () => {
      const safeFn = SafeFn.new();
      const res = await safeFn._parseOutput(123);
      expectTypeOf(res).toEqualTypeOf<Result<never, never>>();
    });

    test("should type Result Err as typed ZodError for transformed schemas", async () => {
      const outputSchema = z
        .object({
          test: z.string(),
          nested: z.object({
            value: z.number(),
          }),
        })
        .transform(({ test }) => ({ test, newProperty: "test" }));
      const safeFn = SafeFn.new().output(outputSchema);
      const res = await safeFn._parseOutput(123);
      expectTypeOf(res).toMatchTypeOf<
        Result<any, SafeFnOutputParseError<typeof outputSchema>>
      >();
    });
  });
});

describe("error", () => {
  test("should properly type the _uncaughtErrorHandler function", () => {
    const safeFn = SafeFn.new().error((error) => Err("hello" as const));

    type res = ReturnType<typeof safeFn._uncaughtErrorHandler>;
    expectTypeOf(safeFn._uncaughtErrorHandler).toEqualTypeOf<
      (error: unknown) => Err<"hello">
    >();
  });
});
