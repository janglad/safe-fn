import { err, ok, type Result } from "neverthrow";
import { assert, describe, expect, test, vi, type Mock } from "vitest";
import { z, ZodError } from "zod";
import { SafeFnBuilder } from "./safe-fn-builder";
import type { AnyRunnableSafeFn, TODO } from "./types";

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

    test("should set the correct default catch handler", () => {
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

  describe("unsafeRawInput", () => {
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
  describe("catch", () => {
    test("should set the catch handler", () => {
      const errorHandler = () => err("error");
      const safeFn = SafeFnBuilder.new()
        .handler(() => ok(""))
        .catch(errorHandler);
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
          createSafeFn: () =>
            SafeFnBuilder.new()
              .unparsedInput<unknown>()
              .handler((args) => ok(args)),
        },
        {
          name: "async",
          createSafeFn: () =>
            SafeFnBuilder.new()
              .unparsedInput<unknown>()
              .handler(async (args) => ok(args)),
        },
        {
          name: "generator",
          createSafeFn: () =>
            SafeFnBuilder.new()
              .unparsedInput<unknown>()
              .safeHandler(async function* (args) {
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
            input: {
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
            unsafeRawInput: {
              name: "John",
              lastName: "Doe",
            },
          });
        });

        test(`should return Err if input is not valid for ${name} handler`, async () => {
          const safeFn = createSafeFn();

          // @ts-expect-error - Wrong input type
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
            unsafeRawInput: { name: "John", lastName: "Doe" },
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
              .handler((args) => ok(args.unsafeRawInput)),
        },
        {
          name: "async",
          createSafeFn: () =>
            SafeFnBuilder.new()
              .unparsedInput<{ name: string; lastName: string }>()
              .output(outputSchema)
              .handler(async (args) => ok(args.unsafeRawInput)),
        },
        {
          name: "generator",
          createSafeFn: () =>
            SafeFnBuilder.new()
              .unparsedInput<{ name: string; lastName: string }>()
              .output(outputSchema)
              .safeHandler(async function* (args) {
                return ok(args.unsafeRawInput);
              }),
        },
      ];

      const testCasesWithoutOutputSchema = [
        {
          name: "regular",
          createSafeFn: () =>
            SafeFnBuilder.new()
              .unparsedInput<{ name: string; lastName: string }>()
              .handler((args) => ok(args.unsafeRawInput)),
        },
        {
          name: "async",
          createSafeFn: () =>
            SafeFnBuilder.new()
              .unparsedInput<{ name: string; lastName: string }>()
              .handler(async (args) => ok(args.unsafeRawInput)),
        },
        {
          name: "generator",
          createSafeFn: () =>
            SafeFnBuilder.new()
              .unparsedInput<{ name: string; lastName: string }>()
              .safeHandler(async function* (args) {
                return ok(args.unsafeRawInput);
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
              .catch((e) =>
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
              .catch((e) =>
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
              .catch((e) =>
                err({
                  code: "TEST_ERROR",
                  cause: e,
                }),
              ),
        },
      ];

      testCases.forEach(({ name, createSafeFn }) => {
        test(`should run catch handler for ${name} handler`, async () => {
          const safeFn = createSafeFn();
          const res = await safeFn.run();
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
          const res = await safeFn.run();
          expect(res).toBeErr();
          assert(res.isErr());
          expect(res.error).toBe("Ooh no!");
        });
        test("should not run output parse if handler returned error", async () => {
          const safeFn = createSafeFn();
          const res = await safeFn.run();
          expect(res).toBeErr();
          assert(res.isErr());
          expect(outputParseMock).not.toHaveBeenCalled();
        });
      });

      test("should escape early out of generator if it yields an error", async () => {
        const safeFn = testCases[3].createSafeFn();
        const res = await safeFn.run();
        expect(res).toBeErr();
        assert(res.isErr());
        expect(postYieldMock).not.toHaveBeenCalled();
      });
    });
  });

  describe("parent", () => {
    const parents = [
      {
        name: "regular",
        createSafeFn: () => SafeFnBuilder.new().handler((args) => ok("Ok!")),
      },
      {
        name: "async",
        createSafeFn: () =>
          SafeFnBuilder.new().handler(async (args) => ok("Ok!")),
      },
      {
        name: "generator",
        createSafeFn: () =>
          SafeFnBuilder.new().safeHandler(async function* (args) {
            return ok("Ok!");
          }),
      },
    ];

    const children = [
      {
        name: "regular",
        createSafeFn: (parent: AnyRunnableSafeFn) =>
          SafeFnBuilder.new(parent).handler((args) => ok(args.ctx)),
      },
      {
        name: "async",
        createSafeFn: (parent: AnyRunnableSafeFn) =>
          SafeFnBuilder.new(parent).handler(async (args) => ok(args.ctx)),
      },
      {
        name: "generator",
        createSafeFn: (parent: AnyRunnableSafeFn) =>
          SafeFnBuilder.new(parent).safeHandler(async function* (args) {
            return ok(args.ctx);
          }),
      },
    ];

    parents.forEach(
      ({ name: parentName, createSafeFn: createParentSafeFn }) => {
        children.forEach(
          ({ name: childName, createSafeFn: createChildSafeFn }) => {
            test(`should pass parent result from ${parentName} to ${childName}`, async () => {
              const parent = createParentSafeFn();
              const child = createChildSafeFn(parent as AnyRunnableSafeFn);
              // @ts-expect-error - cast to any so input is not compatible
              const res = await child.run();
              expect(res).toBeOk();
              assert(res.isOk());
              expect(res.value).toBe("Ok!");
            });
          },
        );
      },
    );

    const parentsWithError = [
      {
        name: "regular",
        createSafeFn: () =>
          SafeFnBuilder.new().handler((args) => err("Not ok!")),
      },
      {
        name: "async",
        createSafeFn: () =>
          SafeFnBuilder.new().handler(async (args) => err("Not ok!")),
      },
      {
        name: "generator - return error",
        createSafeFn: () =>
          SafeFnBuilder.new().safeHandler(async function* (args) {
            return err("Not ok!");
          }),
      },
      {
        name: "generator - yield error",
        createSafeFn: () =>
          SafeFnBuilder.new().safeHandler(async function* (args) {
            yield* err("Not ok!").safeUnwrap();
            return ok("Ok!");
          }),
      },
    ];

    const childrenWithMocks = [
      {
        name: "regular",
        createSafeFn: (parent: AnyRunnableSafeFn, mockHandler: Mock) =>
          SafeFnBuilder.new(parent).handler(mockHandler),
      },
      {
        name: "async",
        createSafeFn: (parent: AnyRunnableSafeFn, mockHandler: Mock) =>
          SafeFnBuilder.new(parent).handler(async () => mockHandler()),
      },
      {
        name: "generator",
        createSafeFn: (parent: AnyRunnableSafeFn, mockHandler: Mock) =>
          SafeFnBuilder.new(parent).safeHandler(async function* () {
            return mockHandler();
          }),
      },
    ];
    parentsWithError.forEach(
      ({ name: parentName, createSafeFn: createParentSafeFn }) => {
        childrenWithMocks.forEach(
          async ({ name: childName, createSafeFn: createChildSafeFn }) => {
            const mockHandler = vi.fn();
            const parent = createParentSafeFn();
            const child = createChildSafeFn(
              parent as AnyRunnableSafeFn,
              mockHandler,
            );

            // @ts-expect-error - cast to any so input is not compatible
            const res = await child.run();
            test(`should pass error from ${parentName} to ${childName}`, () => {
              expect(res).toBeErr();
              assert(res.isErr());
              expect(res.error).toBe("Not ok!");
            });
            test(`should not call ${childName} handler for error in ${parentName}`, () => {
              expect(mockHandler).not.toHaveBeenCalled();
            });
          },
        );
      },
    );

    test("should pass parsed and unparsed input from parent to child", async () => {
      // TODO: also do for other types of handlers
      const fn1 = SafeFnBuilder.new()
        .input(
          z.object({
            parsed1: z.string(),
          }),
        )
        .handler(() => ok(""));

      const fn2 = SafeFnBuilder.new(fn1)
        .unparsedInput<{ unparsed2: string }>()
        .handler(() => ok("ctx"));
      const fn3 = SafeFnBuilder.new(fn2)
        .input(
          z.object({
            parsed3: z.string(),
          }),
        )
        .handler((args) => ok(args));

      const res = await fn3.run({
        parsed1: "parsed1",
        unparsed2: "unparsed2",
        parsed3: "parsed3",
      });

      expect(res).toBeOk();
      assert(res.isOk());
      expect(res.value).toEqual({
        ctx: "ctx",
        input: {
          parsed1: "parsed1",
          parsed3: "parsed3",
        },
        unsafeRawInput: {
          parsed1: "parsed1",
          unparsed2: "unparsed2",
          parsed3: "parsed3",
        },
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

      test("should transform input error from parent", async () => {
        const parent = SafeFnBuilder.new()
          .input(z.object({ name: z.string() }))
          .handler((args) => ok(args));
        const child = SafeFnBuilder.new(parent)
          .input(z.object({ age: z.number() }))
          .handler((args) => ok(args))
          .createAction();

        // @ts-expect-error
        const res = await child({});
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
          // @ts-expect-error - passing wrong input on purpose
          .handler((args) => {
            return ok({});
          })
          .createAction();

        const res = await action();
        expect(res.ok).toBe(false);
        assert(!res.ok);
        expect(res.error.code).toBe("OUTPUT_PARSING");
        assert(res.error.code === "OUTPUT_PARSING");
        expect(res.error.cause).toHaveProperty(["formattedError"]);
        expect(res.error.cause.formattedError).toHaveProperty(["name"]);
        expect(res.error.cause).toHaveProperty(["flattenedError"]);
      });

      test("should transform output error from parent", async () => {
        const parent = SafeFnBuilder.new()
          .output(z.object({ name: z.string() }))
          //@ts-expect-error - passing wrong input on purpose
          .handler((args) => {
            return ok({});
          });
        const child = SafeFnBuilder.new(parent)
          .handler((args) => ok(args))
          .createAction();

        const res = await child();

        expect(res.ok).toBe(false);
        assert(!res.ok);

        expect(res.error.code).toBe("OUTPUT_PARSING");
        assert(res.error.code === "OUTPUT_PARSING");
        expect(res.error.cause).toHaveProperty(["formattedError"]);
        expect(res.error.cause.formattedError).toHaveProperty(["name"]);
        expect(res.error.cause).toHaveProperty(["flattenedError"]);

        const child2 = SafeFnBuilder.new(parent)
          .output(z.object({ age: z.number() }))
          .handler(() => {
            return ok({ age: 100 });
          });

        const child3 = SafeFnBuilder.new(child2)
          .handler(() => ok({}))
          .createAction();

        const res2 = await child3();
        console.log(res2);
        expect(res2.ok).toBe(false);
        assert(!res2.ok);
        expect(res2.error.code).toBe("OUTPUT_PARSING");
        assert(res2.error.code === "OUTPUT_PARSING");
        expect(res2.error.cause).toHaveProperty(["formattedError"]);
        expect(res2.error.cause.formattedError).toHaveProperty(["name"]);
        expect(res2.error.cause).toHaveProperty(["flattenedError"]);
      });
    });
  });
});
