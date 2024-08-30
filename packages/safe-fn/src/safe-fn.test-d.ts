import { describe, expectTypeOf, test } from "vitest";
import { z } from "zod";
import type { InferInputSchema } from "../dist";
import { err, ok, type Err, type InferErrError, type Result } from "./result";
import { SafeFnBuilder } from "./safe-fn-builder";
import type {
  SafeFnDefaultThrowHandler,
  SafeFnInputParseError,
  SafeFnOutputParseError,
} from "./types";

describe("input", () => {
  test("should properly type the input schema for primitives", () => {
    const inputSchema = z.string();
    const safeFn = SafeFnBuilder.new().input(inputSchema);
    expectTypeOf(safeFn._internals._inputSchema).toEqualTypeOf<
      typeof inputSchema
    >();
  });

  test("should properly type the input schema for objects", () => {
    const inputSchema = z.object({
      test: z.string(),
      nested: z.object({
        value: z.number(),
      }),
    });
    const safeFn = SafeFnBuilder.new().input(inputSchema);
    expectTypeOf(safeFn._internals._inputSchema).toEqualTypeOf<
      typeof inputSchema
    >();
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
    const safeFn = SafeFnBuilder.new().input(inputSchema);
    expectTypeOf(safeFn._internals._inputSchema).toEqualTypeOf<
      typeof inputSchema
    >();
  });
});

describe("output", () => {
  test("should properly type the output schema for primitives", () => {
    const outputSchema = z.string();
    const safeFn = SafeFnBuilder.new().output(outputSchema);
    expectTypeOf(safeFn._internals._outputSchema).toEqualTypeOf<
      typeof outputSchema
    >();
  });

  test("should properly type the output schema for objects", () => {
    const outputSchema = z.object({
      test: z.string(),
      nested: z.object({
        value: z.number(),
      }),
    });
    const safeFn = SafeFnBuilder.new().output(outputSchema);
    expectTypeOf(safeFn._internals._outputSchema).toEqualTypeOf<
      typeof outputSchema
    >();
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
    const safeFn = SafeFnBuilder.new().output(outputSchema);
    expectTypeOf(safeFn._internals._outputSchema).toEqualTypeOf<
      typeof outputSchema
    >();
  });
});

describe("action", () => {
  describe("input", () => {
    test("should type parsed input as empty object without input schema"),
      () => {
        const safeFn = SafeFnBuilder.new();
        type ActionFn = Parameters<typeof safeFn.action>[0];
        type ActionFnArgs = Parameters<ActionFn>[0];

        expectTypeOf<ActionFnArgs["parsedInput"]>().toEqualTypeOf<{}>();
      };
    test("should type parsed input as inputSchema for primitives ", () => {
      const inputSchema = z.string();
      const safeFn = SafeFnBuilder.new().input(inputSchema);

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
      const safeFn = SafeFnBuilder.new().input(inputSchema);

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
      const safeFn = SafeFnBuilder.new().input(inputSchema);

      type ActionFn = Parameters<typeof safeFn.action>[0];
      type ActionFnArgs = Parameters<ActionFn>[0];

      expectTypeOf<ActionFnArgs["parsedInput"]>().toEqualTypeOf<
        z.output<typeof inputSchema>
      >();
    });

    test("should type unparsed input as unknown without input schema", () => {
      const safeFn = SafeFnBuilder.new();
      type ActionFn = Parameters<typeof safeFn.action>[0];
      type ActionFnArgs = Parameters<ActionFn>[0];

      expectTypeOf<ActionFnArgs["unparsedInput"]>().toEqualTypeOf<unknown>();
    });

    test("should type unparsed input as inputSchema for primitives", () => {
      const inputSchema = z.string();
      const safeFn = SafeFnBuilder.new().input(inputSchema);

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
      const safeFn = SafeFnBuilder.new().input(inputSchema);

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
      const safeFn = SafeFnBuilder.new().input(inputSchema);

      type ActionFn = Parameters<typeof safeFn.action>[0];
      type ActionFnArgs = Parameters<ActionFn>[0];

      expectTypeOf<ActionFnArgs["unparsedInput"]>().toEqualTypeOf<
        z.input<typeof inputSchema>
      >();
    });
  });

  describe("unparsedInput", () => {
    test("Should allow manually setting unparsedInput type", () => {
      const safeFn = SafeFnBuilder.new().unparsedInput<{ test: string }>();

      type ActionFn = Parameters<typeof safeFn.action>[0];
      type ActionFnArgs = Parameters<ActionFn>[0];

      expectTypeOf<ActionFnArgs["unparsedInput"]>().toEqualTypeOf<{
        test: string;
      }>();
    });
  });

  describe("output", () => {
    test("should type output as any without output schema", () => {
      const safeFn = SafeFnBuilder.new();
      type ActionFn = Parameters<typeof safeFn.action>[0];
      type ActionFnReturn = Awaited<ReturnType<ActionFn>>;

      expectTypeOf<ActionFnReturn>().toEqualTypeOf<Result<any, any>>();
    });

    test("should type output as outputSchema for primitives", () => {
      const outputSchema = z.string();
      const safeFn = SafeFnBuilder.new().output(outputSchema);

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
      const safeFn = SafeFnBuilder.new().output(outputSchema);

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
      const safeFn = SafeFnBuilder.new().output(outputSchema);

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
    test("should type input as inputSchema input for primitives", () => {
      const inputSchema = z.string();
      const safeFn = SafeFnBuilder.new()
        .input(inputSchema)
        .action((args) => ok(args.parsedInput));

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
      const safeFn = SafeFnBuilder.new()
        .input(inputSchema)
        .action((args) => ok(args.parsedInput));

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
      const safeFn = SafeFnBuilder.new()
        .input(inputSchema)
        .action((args) => ok(args.parsedInput));

      type RunInput = Parameters<typeof safeFn.run>[0];

      expectTypeOf<RunInput>().toEqualTypeOf<z.input<typeof inputSchema>>();
    });
  });

  describe("output", () => {
    // test("should infer return type as Res<never,default error> when no action is set", async () => {
    //   const safeFn = SafeFn.new().error(() => {
    //     throw new Error();
    //   });
    //   type Res = Awaited<ReturnType<typeof safeFn.run>>;
    //   type inferred = InferErrError<Res>;

    //   expectTypeOf<Res>().toEqualTypeOf<
    //     Result<never, ReturnType<SafeFnDefaultActionFn>["error"]>
    //   >();
    // });
    test("should infer success return type from action when no output schema is provided", async () => {
      const safeFn = SafeFnBuilder.new().action(() => ok("data" as const));

      expectTypeOf(safeFn.run({})).resolves.toMatchTypeOf<
        Result<"data", any>
      >();
    });

    test("should type output as Ok<outputSchema> for transformed values", async () => {
      const outputSchema = z.string().transform((data) => data + "!");
      const safeFn = SafeFnBuilder.new()
        .output(outputSchema)
        .action(() => ok(""));

      const res = await safeFn.run({});
      expectTypeOf(res).toMatchTypeOf<
        Result<z.output<typeof outputSchema>, any>
      >();
    });
  });

  describe("error", () => {
    test("should infer Err return as default when no error function is set", async () => {
      const safeFn = SafeFnBuilder.new().action(() => ok("data" as const));

      type Res = Awaited<ReturnType<typeof safeFn.run>>;
      type InferredErrError = InferErrError<Res>;
      expectTypeOf<InferredErrError>().toEqualTypeOf<
        ReturnType<SafeFnDefaultThrowHandler>["error"]
      >();
    });

    test("should infer Err return type from action when no error function is set", async () => {
      const safeFn = SafeFnBuilder.new().action(() => err("my error" as const));
      type Res = Awaited<ReturnType<typeof safeFn.run>>;
      type InferredErrError = InferErrError<Res>;
      expectTypeOf<InferredErrError>().toEqualTypeOf<
        "my error" | ReturnType<SafeFnDefaultThrowHandler>["error"]
      >();
    });

    test("should infer Err return type from action when error function is set", async () => {
      const safeFn = SafeFnBuilder.new()
        .action(() => {
          return err("error" as const);
        })
        .error(() => err("thrown" as const));

      type Res = Awaited<ReturnType<typeof safeFn.run>>;
      type InferredErrError = InferErrError<Res>;

      expectTypeOf<InferredErrError>().toEqualTypeOf<"error" | "thrown">();
    });
  });
});

describe("internals", () => {
  describe("_parseInput", () => {
    test("should return Result Ok as never when no input schema is defined", async () => {
      const safeFn = SafeFnBuilder.new().action(() => ok("data" as const));
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
      const safeFn = SafeFnBuilder.new()
        .input(inputSchema)
        .action(() => ok(""));
      const res = await safeFn._parseInput("data");
      expectTypeOf(res).toMatchTypeOf<
        Result<z.output<typeof inputSchema>, any>
      >();
    });

    test("should type Result Err as never without input schema", async () => {
      const safeFn = SafeFnBuilder.new().action(() => ok(""));
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
      const safeFn = SafeFnBuilder.new()
        .input(inputSchema)
        .action(() => ok(""));
      const res = await safeFn._parseInput(123);
      expectTypeOf(res).toMatchTypeOf<
        Result<any, SafeFnInputParseError<typeof inputSchema>>
      >();
    });
  });

  describe("_parseOutput", () => {
    test("should return Result Ok as never when no output schema is defined", async () => {
      const safeFn = SafeFnBuilder.new().action(() => ok("data" as const));
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
      const safeFn = SafeFnBuilder.new()
        .output(outputSchema)
        .action(() => ok("" as any));
      const res = await safeFn._parseOutput("data");
      expectTypeOf(res).toMatchTypeOf<
        Result<z.output<typeof outputSchema>, any>
      >();
    });

    test("should type Result Err as never without output schema", async () => {
      const safeFn = SafeFnBuilder.new().action(() => ok("" as any));
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
      const safeFn = SafeFnBuilder.new()
        .output(outputSchema)
        .action(() => ok("" as any));
      const res = await safeFn._parseOutput(123);
      expectTypeOf(res).toMatchTypeOf<
        Result<any, SafeFnOutputParseError<typeof outputSchema>>
      >();
    });
  });
});

describe("error", () => {
  test("should properly type the _uncaughtErrorHandler function", () => {
    const safeFn = SafeFnBuilder.new().error((error) => err("hello" as const));

    type res = ReturnType<typeof safeFn._internals._uncaughtErrorHandler>;
    expectTypeOf(safeFn._internals._uncaughtErrorHandler).toEqualTypeOf<
      (error: unknown) => Err<"hello">
    >();
  });
});

describe("parent", () => {
  test("should properly type the _parent function", () => {
    const safeFn1 = SafeFnBuilder.new()
      .input(z.object({ name: z.string() }))
      .action(() => ok(""));
    const safeFn2 = SafeFnBuilder.new(safeFn1).input(
      z.object({ age: z.number() }),
    );
    expectTypeOf(safeFn2._internals._parent).toEqualTypeOf(safeFn1);
  });

  describe("action", () => {
    describe("args", () => {
      // TODO: test unparsed input
      test.todo("should merge unparsedInput");
      describe("parsedInput", () => {
        test("should merge parsedInput when parent and child have input schema", () => {
          const input1 = z.object({ name: z.string() });
          const input2 = z.object({ age: z.number() });
          const safeFn1 = SafeFnBuilder.new()
            .input(input1)
            .action(() => ok(""));
          const safeFn2 = SafeFnBuilder.new(safeFn1).input(input2);

          type S2ParsedInput = Parameters<
            Parameters<typeof safeFn2.action>[0]
          >[0]["parsedInput"];

          type test = InferInputSchema<typeof safeFn1>;

          expectTypeOf<S2ParsedInput>().toMatchTypeOf<
            z.output<typeof input1> & z.output<typeof input2>
          >();
        });

        test("should merge parsedInput when parent and child have input schema with transforms", () => {
          const input1 = z
            .object({ name: z.string() })
            .transform(({ name }) => ({
              name,
              newProperty: "test",
            }));
          const input2 = z.object({ age: z.number() }).transform(({ age }) => ({
            age,
            newProperty2: "test",
          }));

          const safeFn1 = SafeFnBuilder.new()
            .input(input1)
            .action(() => ok(""));
          const safeFn2 = SafeFnBuilder.new(safeFn1).input(input2);

          type S2ParsedInput = Parameters<
            Parameters<typeof safeFn2.action>[0]
          >[0]["parsedInput"];

          expectTypeOf<S2ParsedInput>().toMatchTypeOf<
            z.output<typeof input1> & z.output<typeof input2>
          >();
        });

        test("should take parsedInput from child when parent has no input schema", () => {
          const input = z.object({ name: z.string() });
          const safeFn1 = SafeFnBuilder.new().action((args) =>
            ok(args.parsedInput),
          );
          const safeFn2 = SafeFnBuilder.new(safeFn1).input(input);

          type S2ParsedInput = Parameters<
            Parameters<typeof safeFn2.action>[0]
          >[0]["parsedInput"];

          expectTypeOf<S2ParsedInput>().toMatchTypeOf<z.output<typeof input>>();
        });

        test("should take parsedInput from parent when child has no input schema", () => {
          const input = z.object({ name: z.string() });
          const safeFn1 = SafeFnBuilder.new()
            .input(input)
            .action(() => ok(""));
          const safeFn2 = SafeFnBuilder.new(safeFn1);

          type S2ParsedInput = Parameters<
            Parameters<typeof safeFn2.action>[0]
          >[0]["parsedInput"];

          expectTypeOf<S2ParsedInput>().toMatchTypeOf<z.output<typeof input>>();
        });
      });

      describe("ctx", () => {
        test("should type ctx as unwrapped OK value from parent", () => {
          const safeFn1 = SafeFnBuilder.new().action(() =>
            ok("ctx return" as const),
          );
          const safeFn2 = SafeFnBuilder.new(safeFn1);

          type S2Ctx = Parameters<
            Parameters<typeof safeFn2.action>[0]
          >[0]["ctx"];
          expectTypeOf<S2Ctx>().toEqualTypeOf<"ctx return">();
        });

        test("should type ctx as empty object if parent never returns", () => {
          const safeFn1 = SafeFnBuilder.new().action(() =>
            err("ctx return" as const),
          );
          const safeFn2 = SafeFnBuilder.new(safeFn1);

          type S2Ctx = Parameters<
            Parameters<typeof safeFn2.action>[0]
          >[0]["ctx"];
          expectTypeOf<S2Ctx>().toEqualTypeOf<{}>();
        });
      });
    });
  });
});
