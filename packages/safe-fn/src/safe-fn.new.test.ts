import { assert, describe, expect, test, vi } from "vitest";
import { z, ZodError } from "zod";
import { err, ok, type Result } from "./result";
import { SafeFnBuilder } from "./safe-fn-builder";
import type { TODO } from "./types";

// TODO: this does not belong here
expect.extend({
  toBeErr(received: Result<any, any>, expected?: any) {
    const isErr = received.isErr();
    return {
      message: () =>
        `expected ${JSON.stringify(received)} to ${isErr ? "not " : ""}be an Err \n`,
      pass: isErr,
    };
  },
  toBeOk(received: Result<any, any>, expected?: any) {
    const isOk = received.isOk();
    return {
      message: () =>
        `expected ${JSON.stringify(received)} to ${isOk ? "not " : ""}be an Ok \n`,
      pass: isOk,
    };
  },
});

interface CustomMatchers<R = unknown> {
  toBeErr(): R;
  toBeOk(): R;
}

declare module "vitest" {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

describe("safe-fn-builder", () => {
  describe("new", () => {
    test("should return a builder", () => {
      const builder = SafeFnBuilder.new();
      expect(builder).toBeInstanceOf(SafeFnBuilder);
    });

    test("should set the input schema as undefined", () => {
      const builder = SafeFnBuilder.new();
      expect(builder._internals.inputSchema).toBeUndefined();
    });

    test("should set the output schema as undefined", () => {
      const builder = SafeFnBuilder.new();
      expect(builder._internals.outputSchema).toBeUndefined();
    });

    test("should set the correct default action", () => {
      const builder = SafeFnBuilder.new();
      const res = builder._internals.handler(undefined as TODO);
      expect(res).toBeErr();
      // @ts-expect-error - Return not defined in builder type as .run can not be called anyway
      expect(res.error).toMatchObject({
        code: "NO_HANDLER",
      });
    });

    test("should set the correct default error handler", () => {
      const builder = SafeFnBuilder.new();
      const returnedError = builder._internals.uncaughtErrorHandler(
        undefined as TODO,
      );
      expect(returnedError).toBeErr();
      assert(returnedError.isErr());
      expect(returnedError.error).toMatchObject({
        code: "UNCAUGHT_ERROR",
      });
    });

    test("should set the parent safe-fn", () => {
      const parent = SafeFnBuilder.new().handler(() => ok(""));
      const child = SafeFnBuilder.new(parent);
      expect(child._internals.parent).toBe(parent);
    });
  });

  describe("input", () => {
    test("should set the input schema", () => {
      const builder = SafeFnBuilder.new();
      const inputSchema = z.string();
      const safeFn = builder.input(inputSchema);
      expect(safeFn._internals.inputSchema).toEqual(inputSchema);
    });

    test("should be new instance", () => {
      const builder = SafeFnBuilder.new();
      const safeFn = builder.input(z.string());
      const safeFn2 = builder.input(z.string());
      expect(safeFn2).not.toBe(safeFn);
    });
  });

  describe("unparsedInput", () => {
    test("should return the same instance", () => {
      const builder = SafeFnBuilder.new();
      const builder2 = builder.unparsedInput<string>();
      expect(builder2).toBe(builder);
    });
  });

  describe("output", () => {
    test("should set the output schema", () => {
      const builder = SafeFnBuilder.new();
      const outputSchema = z.string();
      const safeFn = builder.output(outputSchema);
      expect(safeFn._internals.outputSchema).toEqual(outputSchema);
    });

    test("should be new instance", () => {
      const builder = SafeFnBuilder.new();
      const safeFn = builder.output(z.string());
      const safeFn2 = builder.output(z.string());
      expect(safeFn2).not.toBe(safeFn);
    });
  });

  describe("handler", () => {
    test("should set the handler function", () => {
      const builder = SafeFnBuilder.new();
      const handlerFn = () => ok("data");
      const safeFn = builder.handler(handlerFn);
      expect(safeFn._internals.handler).toBe(handlerFn);
    });

    test("should be new instance", () => {
      const builder = SafeFnBuilder.new();
      const safeFn = builder.handler(() => ok("data"));
      const safeFn2 = builder.handler(() => ok("data"));
      expect(safeFn2).not.toBe(safeFn);
    });
  });

  describe("safeHandler", () => {
    test("should set the safe handler function", async () => {
      const builder = SafeFnBuilder.new();
      const safeHandlerFn = async function* () {
        return ok("data");
      };
      // Note: generator functions are wrapped, so we're comparing the result instead of the function here
      const safeFn = builder.safeHandler(safeHandlerFn);
      const handlerRes = await safeFn._internals.handler(undefined as TODO);
      const expectedRes = (await safeHandlerFn().next()).value;
      expect(handlerRes).toEqual(expectedRes);
    });
  });
});

describe("runnable-safe-fn", () => {
  describe("error", () => {
    test("should set the error handler", () => {
      const errorHandler = () => err("error");
      const safeFn = SafeFnBuilder.new()
        .handler(() => ok(""))
        .error(errorHandler);
      expect(safeFn._internals.uncaughtErrorHandler).toEqual(errorHandler);
    });
  });

  describe("run", () => {
    describe("input", () => {
      const inputSchema = z
        .object({ name: z.string(), lastName: z.string() })
        .transform((input) => ({
          fullName: `${input.name} ${input.lastName}`,
        }));

      const testCasesWithInputSchema = [
        {
          name: "regular",
          createSafeFn: () =>
            SafeFnBuilder.new()
              .input(inputSchema)
              .handler((args) => ok(args)),
        },
        {
          name: "async",
          createSafeFn: () =>
            SafeFnBuilder.new()
              .input(inputSchema)
              .handler(async (args) => ok(args)),
        },
        {
          name: "generator",
          createSafeFn: () =>
            SafeFnBuilder.new()
              .input(inputSchema)
              .safeHandler(async function* (args) {
                return ok(args);
              }),
        },
      ];

      const testCasesWithoutInputSchema = [
        {
          name: "regular",
          createSafeFn: () => SafeFnBuilder.new().handler((args) => ok(args)),
        },
        {
          name: "async",
          createSafeFn: () =>
            SafeFnBuilder.new().handler(async (args) => ok(args)),
        },
        {
          name: "generator",
          createSafeFn: () =>
            SafeFnBuilder.new().safeHandler(async function* (args) {
              return ok(args);
            }),
        },
      ];

      testCasesWithInputSchema.forEach(({ name, createSafeFn }) => {
        test(`should parse input and pass it to ${name} handler when input schema is defined`, async () => {
          const safeFn = createSafeFn();
          const res = await safeFn.run({ name: "John", lastName: "Doe" });
          expect(res).toBeOk();
          assert(res.isOk());
          expect(res.value).toMatchObject({
            parsedInput: {
              fullName: "John Doe",
            },
          });
        });
        test("should pass unparsed input to handler when input schema is defined", async () => {
          const safeFn = createSafeFn();
          const res = await safeFn.run({ name: "John", lastName: "Doe" });
          expect(res).toBeOk();
          assert(res.isOk());
          console.log(res.value);
          expect(res.value).toMatchObject({
            unparsedInput: {
              name: "John",
              lastName: "Doe",
            },
          });
        });

        test(`should return Err if input is not valid for ${name} handler`, async () => {
          const safeFn = createSafeFn();
          // @ts-expect-error
          const res = await safeFn.run({});
          expect(res).toBeErr();
          assert(res.isErr());
          expect(res.error.code).toBe("INPUT_PARSING");
          assert(res.error.code === "INPUT_PARSING");
          expect(res.error.cause).toBeInstanceOf(ZodError);
          expect(res.error.cause.format().lastName).toBeDefined();
          expect(res.error.cause.format().name).toBeDefined();
        });
      });

      testCasesWithoutInputSchema.forEach(({ name, createSafeFn }) => {
        test(`should pass unparsed input to handler when input schema is not defined for ${name} handler`, async () => {
          const safeFn = createSafeFn();
          const res = await safeFn.run({ name: "John", lastName: "Doe" });
          expect(res).toBeOk();
          assert(res.isOk());
          expect(res.value).toEqual({
            unparsedInput: { name: "John", lastName: "Doe" },
          });
        });

        test("should pass undefined as parsed input if input is undefined", async () => {
          const safeFn = createSafeFn();
          const res = await safeFn.run(undefined as TODO);
          expect(res).toBeOk();
          assert(res.isOk());
          expect(res.value).toEqual({
            parsedInput: undefined,
          });
        });
      });
    });

    describe("output", () => {
      const outputSchema = z
        .object({ name: z.string(), lastName: z.string() })
        .transform((input) => ({
          fullName: `${input.name} ${input.lastName}`,
        }));

      const testCasesWithOutputSchema = [
        {
          name: "regular",
          createSafeFn: () =>
            SafeFnBuilder.new()
              .unparsedInput<{ name: string; lastName: string }>()
              .output(outputSchema)
              .handler((args) => ok(args.unparsedInput)),
        },
        {
          name: "async",
          createSafeFn: () =>
            SafeFnBuilder.new()
              .unparsedInput<{ name: string; lastName: string }>()
              .output(outputSchema)
              .handler(async (args) => ok(args.unparsedInput)),
        },
        {
          name: "generator",
          createSafeFn: () =>
            SafeFnBuilder.new()
              .unparsedInput<{ name: string; lastName: string }>()
              .output(outputSchema)
              .safeHandler(async function* (args) {
                return ok(args.unparsedInput);
              }),
        },
      ];

      const testCasesWithoutOutputSchema = [
        {
          name: "regular",
          createSafeFn: () =>
            SafeFnBuilder.new()
              .unparsedInput<{ name: string; lastName: string }>()
              .handler((args) => ok(args.unparsedInput)),
        },
        {
          name: "async",
          createSafeFn: () =>
            SafeFnBuilder.new()
              .unparsedInput<{ name: string; lastName: string }>()
              .handler(async (args) => ok(args.unparsedInput)),
        },
        {
          name: "generator",
          createSafeFn: () =>
            SafeFnBuilder.new()
              .unparsedInput<{ name: string; lastName: string }>()
              .safeHandler(async function* (args) {
                return ok(args.unparsedInput);
              }),
        },
      ];

      testCasesWithOutputSchema.forEach(({ name, createSafeFn }) => {
        test(`should return Ok with parsed output for ${name} handler`, async () => {
          const safeFn = createSafeFn();
          const res = await safeFn.run({ name: "John", lastName: "Doe" });
          expect(res).toBeOk();
          assert(res.isOk());
          expect(res.value).toEqual({
            fullName: "John Doe",
          });
        });
        test(`should return Err if output is not valid for ${name} handler`, async () => {
          const safeFn = createSafeFn();
          // @ts-expect-error
          const res = await safeFn.run({});
          expect(res).toBeErr();
          assert(res.isErr());
          expect(res.error.code).toBe("OUTPUT_PARSING");
          assert(res.error.code === "OUTPUT_PARSING");
          expect(res.error.cause).toBeInstanceOf(ZodError);
          expect(res.error.cause.format().lastName).toBeDefined();
          expect(res.error.cause.format().name).toBeDefined();
        });
      });

      testCasesWithoutOutputSchema.forEach(({ name, createSafeFn }) => {
        test(`should pass through output from handler if output schema is not defined for ${name} handler`, async () => {
          const safeFn = createSafeFn();
          const res = await safeFn.run({ name: "John", lastName: "Doe" });
          expect(res).toBeOk();
          assert(res.isOk());
          expect(res.value).toEqual({
            name: "John",
            lastName: "Doe",
          });
        });
      });
    });

    describe("uncaught error", () => {
      const testCases = [
        {
          name: "regular",
          createSafeFn: () =>
            SafeFnBuilder.new()
              .handler(() => {
                throw new Error("error");
              })
              .error((e) =>
                err({
                  code: "TEST_ERROR",
                  cause: e,
                }),
              ),
        },
        {
          name: "async",
          createSafeFn: () =>
            SafeFnBuilder.new()
              .handler(async () => {
                throw new Error("error");
              })
              .error((e) =>
                err({
                  code: "TEST_ERROR",
                  cause: e,
                }),
              ),
        },
        {
          name: "generator",
          createSafeFn: () =>
            SafeFnBuilder.new()
              .safeHandler(async function* () {
                throw new Error("error");
              })
              .error((e) =>
                err({
                  code: "TEST_ERROR",
                  cause: e,
                }),
              ),
        },
      ];

      testCases.forEach(({ name, createSafeFn }) => {
        test(`should run error handler for ${name} handler`, async () => {
          const safeFn = createSafeFn();
          const res = await safeFn.run(undefined as TODO);
          expect(res).toBeErr();
          assert(res.isErr());
          expect(res.error.code).toBe("TEST_ERROR");
          assert(res.error.code === "TEST_ERROR");
          expect(res.error.cause).toBeInstanceOf(Error);
          assert(res.error.cause instanceof Error);
          expect(res.error.cause.message).toBe("error");
        });
      });
    });

    describe("return error", async () => {
      const outputParseMock = vi.fn();
      const postYieldMock = vi.fn();

      const testCases = [
        {
          name: "regular",
          createSafeFn: () => {
            const builder = SafeFnBuilder.new().handler(() => err("Ooh no!"));
            builder._parseOutput = outputParseMock;
            return builder;
          },
        },
        {
          name: "async",
          createSafeFn: () => {
            const builder = SafeFnBuilder.new().handler(async () =>
              err("Ooh no!"),
            );
            builder._parseOutput = outputParseMock;
            return builder;
          },
        },
        {
          name: "generator - return error",
          createSafeFn: () => {
            const builder = SafeFnBuilder.new().safeHandler(async function* () {
              return err("Ooh no!");
            });
            builder._parseOutput = outputParseMock;
            return builder;
          },
        },
        {
          name: "generator - yield error",
          createSafeFn: () => {
            const builder = SafeFnBuilder.new().safeHandler(async function* () {
              yield* err("Ooh no!").safeUnwrap();
              postYieldMock();
              return ok("Ooh yes!");
            });
            builder._parseOutput = outputParseMock;
            return builder;
          },
        },
      ] as const;

      testCases.forEach(({ name, createSafeFn }) => {
        test(`should return error from ${name} handler`, async () => {
          const safeFn = createSafeFn();
          const res = await safeFn.run(undefined as TODO);
          expect(res).toBeErr();
          assert(res.isErr());
          expect(res.error).toBe("Ooh no!");
        });
        test("should not run output parse if handler returned error", async () => {
          const safeFn = createSafeFn();
          const res = await safeFn.run(undefined as TODO);
          expect(res).toBeErr();
          assert(res.isErr());
          expect(outputParseMock).not.toHaveBeenCalled();
        });
      });

      test("should escape early out of generator if it yields an error", async () => {
        const safeFn = testCases[3].createSafeFn();
        const res = await safeFn.run(undefined as TODO);
        expect(res).toBeErr();
        assert(res.isErr());
        expect(postYieldMock).not.toHaveBeenCalled();
      });
    });
  });
  describe("createAction", () => {
    describe("input", async () => {
      test("should transform input error", async () => {
        const action = SafeFnBuilder.new()
          .input(z.object({ name: z.string() }))
          .handler((args) => ok(args))
          .createAction();

        // @ts-expect-error
        const res = await action({});
        expect(res.ok).toBe(false);
        assert(!res.ok);
        expect(res.error.code).toBe("INPUT_PARSING");
        assert(res.error.code === "INPUT_PARSING");
        expect(res.error.cause).toHaveProperty(["formattedError"]);
        expect(res.error.cause.formattedError).toHaveProperty(["name"]);
        expect(res.error.cause).toHaveProperty(["flattenedError"]);
      });
    });

    describe("output", () => {
      test("should transform output error", async () => {
        const action = SafeFnBuilder.new()
          .output(z.object({ name: z.string() }))
          // @ts-expect-error
          .handler((args) => {
            return ok({});
          })
          .createAction();

        const res = await action(undefined as TODO);
        expect(res.ok).toBe(false);
        assert(!res.ok);
        expect(res.error.code).toBe("OUTPUT_PARSING");
        assert(res.error.code === "OUTPUT_PARSING");
        expect(res.error.cause).toHaveProperty(["formattedError"]);
        expect(res.error.cause.formattedError).toHaveProperty(["name"]);
        expect(res.error.cause).toHaveProperty(["flattenedError"]);
      });
    });
  });
});