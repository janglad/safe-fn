import { err, ok, type Result } from "neverthrow";
import { assert, describe, expect, test, vi, type Mock } from "vitest";
import { z } from "zod";
import type { TAnyRunnableSafeFn } from "./runnable-safe-fn";
import { createSafeFn, SafeFnBuilder } from "./safe-fn-builder";
import type { TInferSafeFnCallbacks } from "./types/callbacks";
import type { TODO } from "./types/util";

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
      const builder = createSafeFn();
      expect(builder).toBeInstanceOf(SafeFnBuilder);
    });

    test("should set the input schema as undefined", () => {
      const builder = createSafeFn() as any;
      expect(builder._internals.inputSchema).toBeUndefined();
    });

    test("should set the output schema as undefined", () => {
      const builder = createSafeFn() as any;
      expect(builder._internals.outputSchema).toBeUndefined();
    });

    test("should set the correct default action", () => {
      const builder = createSafeFn() as any;
      const res = builder._internals.handler(undefined as TODO);
      expect(res).toBeErr();

      expect(res.error).toMatchObject({
        code: "NO_HANDLER",
      });
    });

    test("should set the correct default catch handler", () => {
      const builder = createSafeFn() as any;
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
      const parent = createSafeFn().handler(() => ok(""));
      const child = createSafeFn().use(parent) as any;
      expect(child._internals.parent).toBe(parent);
    });
  });

  describe("input", () => {
    test("should set the input schema", () => {
      const builder = createSafeFn() as any;
      const inputSchema = z.string();
      const safeFn = builder.input(inputSchema);
      expect(safeFn._internals.inputSchema).toEqual(inputSchema);
    });

    test("should be new instance", () => {
      const builder = createSafeFn();
      const safeFn = builder.input(z.string());
      const safeFn2 = builder.input(z.string());
      expect(safeFn2).not.toBe(safeFn);
    });
  });

  describe("unsafeRawInput", () => {
    test("should return the same instance", () => {
      const builder = createSafeFn();
      const builder2 = builder.unparsedInput<string>();
      expect(builder2).toBe(builder);
    });
  });

  describe("output", () => {
    test("should set the output schema", () => {
      const builder = createSafeFn() as any;
      const outputSchema = z.string();
      const safeFn = builder.output(outputSchema);
      expect(safeFn._internals.outputSchema).toEqual(outputSchema);
    });

    test("should be new instance", () => {
      const builder = createSafeFn();
      const safeFn = builder.output(z.string());
      const safeFn2 = builder.output(z.string());
      expect(safeFn2).not.toBe(safeFn);
    });
  });

  describe("handler", () => {
    test("should set the handler function", () => {
      const builder = createSafeFn();
      const handlerFn = () => ok("data");
      const safeFn = builder.handler(handlerFn) as any;
      expect(safeFn._internals.handler).toBe(handlerFn);
    });

    test("should be new instance", () => {
      const builder = createSafeFn();
      const safeFn = builder.handler(() => ok("data"));
      const safeFn2 = builder.handler(() => ok("data"));
      expect(safeFn2).not.toBe(safeFn);
    });
  });

  describe("safeHandler", () => {
    test("should set the safe handler function", async () => {
      const builder = createSafeFn();
      const safeHandlerFn = async function* () {
        return ok("data");
      };
      // Note: generator functions are wrapped, so we're comparing the result instead of the function here
      const safeFn = builder.safeHandler(safeHandlerFn) as any;
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
      const safeFn = createSafeFn()
        .handler(() => ok(""))
        .catch(errorHandler) as any;
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
          createMockFn: (mockAction: Mock) =>
            createSafeFn().input(inputSchema).handler(mockAction),
        },
        {
          name: "async",
          createMockFn: (mockAction: Mock) =>
            createSafeFn()
              .input(inputSchema)
              .handler(async (args) => mockAction(args)),
        },
        {
          name: "generator",
          createMockFn: (mockAction: Mock) =>
            createSafeFn()
              .input(inputSchema)
              .safeHandler(async function* (args) {
                return mockAction(args);
              }),
        },
      ];

      const testCasesWithoutInputSchema = [
        {
          name: "regular",
          createMockFn: (mockAction: Mock) =>
            createSafeFn().unparsedInput<unknown>().handler(mockAction),
        },
        {
          name: "async",
          createMockFn: (mockAction: Mock) =>
            createSafeFn().unparsedInput<unknown>().handler(mockAction),
        },
        {
          name: "generator",
          createMockFn: (mockAction: Mock) =>
            createSafeFn()
              .unparsedInput<unknown>()
              .safeHandler(async function* (args) {
                return mockAction(args);
              }),
        },
      ];

      testCasesWithInputSchema.forEach(({ name, createMockFn }) => {
        test(`should parse input and pass it to ${name} handler when input schema is defined`, async () => {
          const mock = vi.fn().mockResolvedValue(ok(""));
          const safeFn = createMockFn(mock);
          const res = await safeFn.run({ name: "John", lastName: "Doe" });
          expect(res).toBeOk();
          const args = mock.mock.calls[0]![0];
          expect(args.input).toEqual({
            fullName: "John Doe",
          });
          expect(args.unsafeRawInput).toEqual({
            name: "John",
            lastName: "Doe",
          });
        });
        test("should pass unparsed input to handler when input schema is defined", async () => {
          const mock = vi.fn().mockResolvedValue(ok(""));
          const safeFn = createMockFn(mock);
          const res = await safeFn.run({ name: "John", lastName: "Doe" });
          expect(res).toBeOk();
          const args = mock.mock.calls[0]![0];
          expect(args.input).toEqual({
            fullName: "John Doe",
          });
          expect(args.unsafeRawInput).toEqual({
            name: "John",
            lastName: "Doe",
          });
        });

        test(`should return Err if input is not valid for ${name} handler`, async () => {
          const mock = vi.fn().mockResolvedValue(ok(""));
          const safeFn = createMockFn(mock);

          // @ts-expect-error - Wrong input type
          const res = (await safeFn.run({})) as any;
          expect(res).toBeErr();
          assert(res.isErr());
          expect(res.error.code).toBe("INPUT_PARSING");
          assert(res.error.code === "INPUT_PARSING");
          expect(res.error.cause.formattedError.lastName).toBeDefined();
          expect(res.error.cause.formattedError.name).toBeDefined();
        });

        test("should pass parent input in array", async () => {
          const mock = vi.fn().mockResolvedValue(ok(""));
          const parent = createMockFn(mock);
          const handlerMock = vi.fn().mockResolvedValue(ok(""));
          const child = createSafeFn().use(parent).handler(handlerMock);

          await child.run({ name: "John", lastName: "Doe" });

          const args = handlerMock.mock.calls[0]![0];

          expect(args.ctxInput).toEqual([
            {
              fullName: "John Doe",
            },
          ]);
        });
      });

      testCasesWithoutInputSchema.forEach(({ name, createMockFn }) => {
        test(`should pass unparsed input to handler when input schema is not defined for ${name} handler`, async () => {
          const mock = vi.fn().mockResolvedValue(ok(""));
          const safeFn = createMockFn(mock);
          const res = await safeFn.run({ name: "John", lastName: "Doe" });
          expect(res).toBeOk();
          const args = mock.mock.calls[0]![0];
          expect(args.unsafeRawInput).toEqual({
            name: "John",
            lastName: "Doe",
          });
        });

        test("should pass undefined as parsed input if input is undefined", async () => {
          const mock = vi.fn().mockResolvedValue(ok(""));
          const safeFn = createMockFn(mock);
          // @ts-expect-error - Wrong input type
          const res = await safeFn.run();
          expect(res).toBeOk();
          const args = mock.mock.calls[0]![0];
          expect(args.input).toEqual(undefined);
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
          createSafeFn()
            .unparsedInput<{ name: string; lastName: string }>()
            .output(outputSchema)
            .handler((args) => ok(args.unsafeRawInput)),
      },
      {
        name: "async",
        createSafeFn: () =>
          createSafeFn()
            .unparsedInput<{ name: string; lastName: string }>()
            .output(outputSchema)
            .handler(async (args) => ok(args.unsafeRawInput)),
      },
      {
        name: "generator",
        createSafeFn: () =>
          createSafeFn()
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
          createSafeFn()
            .unparsedInput<{ name: string; lastName: string }>()
            .handler((args) => ok(args.unsafeRawInput)),
      },
      {
        name: "async",
        createSafeFn: () =>
          createSafeFn()
            .unparsedInput<{ name: string; lastName: string }>()
            .handler(async (args) => ok(args.unsafeRawInput)),
      },
      {
        name: "generator",
        createSafeFn: () =>
          createSafeFn()
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
        expect(res.error.cause.formattedError.lastName).toBeDefined();
        expect(res.error.cause.formattedError.name).toBeDefined();
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
          createSafeFn()
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
          createSafeFn()
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
          createSafeFn()
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

    test("should use default catch handler", async () => {
      const safeFn = createSafeFn().handler(() => {
        throw new Error("error");
      });
      const res = await safeFn.run();
      expect(res).toBeErr();
      assert(res.isErr());
      expect(res.error.code).toBe("UNCAUGHT_ERROR");
      assert(res.error.code === "UNCAUGHT_ERROR");
    });

    test("should use child catch handler on parent if parent uses default", async () => {
      const parent = createSafeFn().handler(() => {
        let bool = true;
        if (bool) {
          throw new Error("error");
        }
        return ok("");
      });

      const child = createSafeFn()
        .use(parent)
        .handler(() => {
          return ok("");
        })
        .catch((e) =>
          err({
            code: "TEST_ERROR",
            cause: e,
          } as const),
        );

      const res = await child.run();
      assert(res.isErr());
      expect(res.error.code).toBe("TEST_ERROR");
      assert(res.error.code === "TEST_ERROR");
      expect(res.error.cause).toBeInstanceOf(Error);
      assert(res.error.cause instanceof Error);
      expect(res.error.cause.message).toBe("error");
    });
    test("should use parent catch handler on parent if parent defines one", async () => {
      const parent = createSafeFn()
        .handler(() => {
          let bool = true;
          if (bool) {
            throw new Error("error");
          }
          return ok("");
        })
        .catch((e) =>
          err({
            code: "PARENT_ERROR",
            cause: e,
          } as const),
        );

      const child = createSafeFn()
        .use(parent)
        .handler(() => {
          return ok("");
        })
        .catch((e) =>
          err({
            code: "TEST_ERROR",
            cause: e,
          } as const),
        );

      const res = await child.run();
      assert(res.isErr());
      expect(res.error.code).toBe("PARENT_ERROR");
      expect(res.error.cause).toBeInstanceOf(Error);
      assert(res.error.cause instanceof Error);
      expect(res.error.cause.message).toBe("error");
    });
  });

  describe("return error", async () => {
    const outputParseMock = vi.fn().mockResolvedValue(ok(""));
    const postYieldMock = vi.fn().mockResolvedValue(ok(""));

    const testCases = [
      {
        name: "regular",
        createSafeFn: () => {
          const builder = createSafeFn().handler(() => err("Ooh no!")) as any;
          builder._parseOutput = outputParseMock;
          return builder;
        },
      },
      {
        name: "async",
        createSafeFn: () => {
          const builder = createSafeFn().handler(async () =>
            err("Ooh no!"),
          ) as any;
          builder._parseOutput = outputParseMock;
          return builder;
        },
      },
      {
        name: "generator - return error",
        createSafeFn: () => {
          const builder = createSafeFn().safeHandler(async function* () {
            return err("Ooh no!");
          }) as any;
          builder._parseOutput = outputParseMock;
          return builder;
        },
      },
      {
        name: "generator - yield error",
        createSafeFn: () => {
          const builder = createSafeFn().safeHandler(async function* () {
            yield* err("Ooh no!").safeUnwrap();
            postYieldMock();
            return ok("Ooh yes!");
          }) as any;
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

  describe("callbacks", () => {
    describe("should run callbacks with right args in success case", async () => {
      const callbackMocks = {
        onStart: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn(),
        onComplete: vi.fn(),
      };

      const parentInputSchema = z.object({ age: z.number() });
      const parent = createSafeFn()
        .input(parentInputSchema)
        .handler(() => ok("Parent!" as const));

      const childInputSchema = z.object({ name: z.string() });
      const safeFn = createSafeFn()
        .use(parent)
        .input(childInputSchema)
        .handler(() => ok("Ok!" as const))
        .onStart(callbackMocks.onStart)
        .onSuccess(callbackMocks.onSuccess)
        .onError(callbackMocks.onError)
        .onComplete(callbackMocks.onComplete);

      await safeFn.run({ name: "John", age: 100 });

      type Callbacks = TInferSafeFnCallbacks<typeof safeFn>;
      type CallbackArgs = {
        [K in keyof Callbacks]: Exclude<Callbacks[K], undefined> extends (
          args: infer Args,
        ) => void
          ? Args
          : never;
      };

      test("onError", () => {
        expect(callbackMocks.onError).not.toHaveBeenCalled();
      });

      test("onStart", () => {
        expect(callbackMocks.onStart).toHaveBeenCalledWith({
          unsafeRawInput: { name: "John", age: 100 },
        } satisfies CallbackArgs["onStart"]);
      });

      test("onSuccess", () => {
        expect(callbackMocks.onSuccess).toHaveBeenCalledWith({
          input: { name: "John" },
          unsafeRawInput: { name: "John", age: 100 },
          ctx: "Parent!",
          ctxInput: [{ age: 100 }],
          value: "Ok!",
        } satisfies CallbackArgs["onSuccess"]);
      });

      test("onComplete", () => {
        expect(callbackMocks.onComplete).toHaveBeenCalledWith({
          input: { name: "John" },
          unsafeRawInput: { name: "John", age: 100 },
          ctx: "Parent!",
          ctxInput: [{ age: 100 }],
          result: ok("Ok!") as TODO,
        } satisfies CallbackArgs["onComplete"]);
      });
    });

    describe("should run callbacks with right args when child returns Err", async () => {
      const callbackMocks = {
        onStart: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn(),
        onComplete: vi.fn(),
      };

      const parentInputSchema = z.object({ age: z.number() });
      const childInputSchema = z.object({ name: z.string() });

      const parent = createSafeFn()
        .input(parentInputSchema)
        .handler(() => ok("Parent!" as const));

      const safeFn = createSafeFn()
        .use(parent)
        .input(childInputSchema)
        .handler((args) => {
          return err("Woops!");
        })
        .onStart(callbackMocks.onStart)
        .onSuccess(callbackMocks.onSuccess)
        .onError(callbackMocks.onError)
        .onComplete(callbackMocks.onComplete);

      type Callbacks = TInferSafeFnCallbacks<typeof safeFn>;
      type CallbackArgs = {
        [K in keyof Callbacks]: Exclude<Callbacks[K], undefined> extends (
          args: infer Args,
        ) => void
          ? Args
          : never;
      };

      await safeFn.run({ name: "John", age: 100 });

      test("onStart", () => {
        expect(callbackMocks.onStart).toHaveBeenCalledWith({
          unsafeRawInput: { name: "John", age: 100 },
        } satisfies CallbackArgs["onStart"]);
      });

      test("onSuccess", () => {
        expect(callbackMocks.onSuccess).not.toHaveBeenCalled();
      });

      test("onError", () => {
        expect(callbackMocks.onError).toHaveBeenCalledWith({
          error: "Woops!",
          ctx: "Parent!",
          ctxInput: [{ age: 100 }],
          input: { name: "John" },
          unsafeRawInput: { name: "John", age: 100 },
        } satisfies CallbackArgs["onError"]);
      });

      test("onComplete", () => {
        expect(callbackMocks.onComplete).toHaveBeenCalledWith({
          input: { name: "John" },
          unsafeRawInput: { name: "John", age: 100 },
          ctx: "Parent!",
          ctxInput: [{ age: 100 }],
          result: err("Woops!"),
        } satisfies CallbackArgs["onComplete"]);
      });
    });

    describe("should run callbacks with right args when parent returns Err", async () => {
      const callbackMocks = {
        onStart: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn(),
        onComplete: vi.fn(),
      };

      const parentInputSchema = z.object({ age: z.number() });
      const childInputSchema = z.object({ name: z.string() });

      const parent = createSafeFn()
        .input(parentInputSchema)
        .handler(() => {
          let bool = true;
          if (bool) {
            return err("Parent!" as const);
          }
          return ok("");
        });

      const safeFn = createSafeFn()
        .use(parent)
        .input(childInputSchema)
        .handler((args) => {
          return ok("Child");
        })
        .onStart(callbackMocks.onStart)
        .onSuccess(callbackMocks.onSuccess)
        .onError(callbackMocks.onError)
        .onComplete(callbackMocks.onComplete);

      type Callbacks = TInferSafeFnCallbacks<typeof safeFn>;
      type CallbackArgs = {
        [K in keyof Callbacks]: Exclude<Callbacks[K], undefined> extends (
          args: infer Args,
        ) => void
          ? Args
          : never;
      };

      await safeFn.run({ name: "John", age: 100 });

      test("onStart", () => {
        expect(callbackMocks.onStart).toHaveBeenCalledWith({
          unsafeRawInput: { name: "John", age: 100 },
        } satisfies CallbackArgs["onStart"]);
      });

      test("onSuccess", () => {
        expect(callbackMocks.onSuccess).not.toHaveBeenCalled();
      });

      test("onError", () => {
        expect(callbackMocks.onError).toHaveBeenCalledWith({
          error: "Parent!",
          ctx: undefined,
          ctxInput: [{ age: 100 }],
          input: undefined,
          unsafeRawInput: { name: "John", age: 100 },
        } satisfies CallbackArgs["onError"]);
      });

      test("onComplete", () => {
        expect(callbackMocks.onComplete).toHaveBeenCalledWith({
          input: undefined,
          unsafeRawInput: { name: "John", age: 100 },
          ctx: undefined,
          ctxInput: [{ age: 100 }],
          result: err("Parent!") as TODO,
        } satisfies CallbackArgs["onComplete"]);
      });
    });

    describe("should run callbacks with right args when parent fails parsing", async () => {
      const callbackMocks = {
        onStart: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn(),
        onComplete: vi.fn(),
      };

      const parentInputSchema = z.object({ age: z.number() });
      const childInputSchema = z.object({ name: z.string() });

      const parent = createSafeFn()
        .input(parentInputSchema)
        .handler(() => ok("Parent!" as const));

      const safeFn = createSafeFn()
        .use(parent)
        .input(childInputSchema)
        .handler((args) => {
          return ok("Child");
        })
        .onStart(callbackMocks.onStart)
        .onSuccess(callbackMocks.onSuccess)
        .onError(callbackMocks.onError)
        .onComplete(callbackMocks.onComplete);

      type Callbacks = TInferSafeFnCallbacks<typeof safeFn>;
      type CallbackArgs = {
        [K in keyof Callbacks]: Exclude<Callbacks[K], undefined> extends (
          args: infer Args,
        ) => void
          ? Args
          : never;
      };

      // @ts-expect-error - passing wrong inputs on purpose
      await safeFn.run({ fake: "fake", data: "data" });

      test("onStart", () => {
        expect(callbackMocks.onStart).toHaveBeenCalledWith({
          unsafeRawInput: { fake: "fake", data: "data" },
        });
      });

      test("onSuccess", () => {
        expect(callbackMocks.onSuccess).not.toHaveBeenCalled();
      });

      test("onError", () => {
        expect(callbackMocks.onError).toHaveBeenCalled();

        const args = callbackMocks.onError.mock
          .calls[0]![0] as CallbackArgs["onError"];

        assert(args.ctx === undefined);
        assert(args.input === undefined);
        assert(args.error.code === "INPUT_PARSING");
        expect(args.error.cause.formattedError.age).toBeDefined();
        // Doesn't reach child parsing
        expect(args.error.cause.formattedError.name).not.toBeDefined();
      });

      test("onComplete", () => {
        expect(callbackMocks.onComplete).toHaveBeenCalled();
        const args = callbackMocks.onComplete.mock
          .calls[0]![0] as CallbackArgs["onComplete"];

        assert(args.ctx === undefined);
        assert(args.input === undefined);
        assert(args.result.isErr());
        assert(args.result.error.code === "INPUT_PARSING");
        expect(args.result.error.cause.formattedError.age).toBeDefined();
        // Doesn't reach child parsing
        expect(args.result.error.cause.formattedError.name).not.toBeDefined();
      });
    });
  });

  describe("mapErr", () => {
    test("should map the error when input parsing fails", async () => {
      const fn = createSafeFn()
        .input(z.object({ test: z.string() }))
        .handler(() => ok({ test: "hello" }))
        .mapErr((e) => {
          return {
            code: "NEW_CODE",
            cause: e.cause,
          } as const;
        });

      // @ts-expect-error - passing wrong input on purpose
      const res = await fn.run({});
      expect(res.isErr()).toBe(true);
      assert(res.isErr());
      expect(res.error.code).toBe("NEW_CODE");
    });
  });
});

describe("parent", () => {
  const parents = [
    {
      name: "regular",
      createSafeFn: () => createSafeFn().handler((args) => ok("Parent!")),
    },
    {
      name: "async",
      createSafeFn: () => createSafeFn().handler(async (args) => ok("Parent!")),
    },
    {
      name: "generator",
      createSafeFn: () =>
        createSafeFn().safeHandler(async function* (args) {
          return ok("Parent!");
        }),
    },
  ];

  const children = [
    {
      name: "regular",
      createSafeFn: (parent: TAnyRunnableSafeFn, handlerMock: Mock) =>
        createSafeFn().use(parent).handler(handlerMock),
    },
    {
      name: "async",
      createSafeFn: (parent: TAnyRunnableSafeFn, handlerMock: Mock) =>
        createSafeFn().use(parent).handler(handlerMock),
    },
    {
      name: "generator",
      createSafeFn: (parent: TAnyRunnableSafeFn, handlerMock: Mock) =>
        createSafeFn()
          .use(parent)
          .safeHandler(async function* (args) {
            return handlerMock(args);
          }),
    },
  ];

  parents.forEach(({ name: parentName, createSafeFn: createParentSafeFn }) => {
    children.forEach(({ name: childName, createSafeFn: createChildSafeFn }) => {
      test(`should pass parent ctx from ${parentName} to ${childName}`, async () => {
        const parent = createParentSafeFn();
        const handlerMock = vi.fn().mockResolvedValue(ok(""));
        const child = createChildSafeFn(
          parent as TAnyRunnableSafeFn,
          handlerMock,
        );

        const res = await child.run();

        const args = handlerMock.mock.calls[0]![0];
        expect(args.ctx).toEqual("Parent!");
        expect(args.ctxInput).toEqual([undefined]);
      });
    });
  });

  const parentsWithError = [
    {
      name: "regular",
      createSafeFn: () => createSafeFn().handler((args) => err("Not ok!")),
    },
    {
      name: "async",
      createSafeFn: () =>
        createSafeFn().handler(async (args) => err("Not ok!")),
    },
    {
      name: "generator - return error",
      createSafeFn: () =>
        createSafeFn().safeHandler(async function* (args) {
          return err("Not ok!");
        }),
    },
    {
      name: "generator - yield error",
      createSafeFn: () =>
        createSafeFn().safeHandler(async function* (args) {
          yield* err("Not ok!").safeUnwrap();
          return ok("Ok!");
        }),
    },
  ];

  const childrenWithMocks = [
    {
      name: "regular",
      createSafeFn: (parent: TAnyRunnableSafeFn, mockHandler: Mock) =>
        createSafeFn().use(parent).handler(mockHandler),
    },
    {
      name: "async",
      createSafeFn: (parent: TAnyRunnableSafeFn, mockHandler: Mock) =>
        createSafeFn()
          .use(parent)
          .handler(async () => mockHandler()),
    },
    {
      name: "generator",
      createSafeFn: (parent: TAnyRunnableSafeFn, mockHandler: Mock) =>
        createSafeFn()
          .use(parent)
          .safeHandler(async function* () {
            return mockHandler();
          }),
    },
  ];
  parentsWithError.forEach(
    ({ name: parentName, createSafeFn: createParentSafeFn }) => {
      childrenWithMocks.forEach(
        async ({ name: childName, createSafeFn: createChildSafeFn }) => {
          const mockHandler = vi.fn().mockResolvedValue(ok(""));
          const parent = createParentSafeFn();
          const child = createChildSafeFn(
            parent as TAnyRunnableSafeFn,
            mockHandler,
          );
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
    const fn1 = createSafeFn()
      .input(
        z.object({
          parsed1: z.string(),
        }),
      )
      .handler(() => ok(""));

    const fn2 = createSafeFn()
      .use(fn1)
      .unparsedInput<{ unparsed2: string }>()
      .handler(() => ok("ctx"));
    const mockHandler = vi.fn().mockResolvedValue(ok(""));

    const fn3 = createSafeFn()
      .use(fn2)
      .input(
        z.object({
          parsed3: z.string(),
        }),
      )
      .handler(mockHandler);

    const res = await fn3.run({
      parsed1: "parsed1",
      unparsed2: "unparsed2",
      parsed3: "parsed3",
    });

    const args = mockHandler.mock.calls[0]![0];

    expect(res).toBeOk();

    expect(args.ctx).toEqual("ctx");
    expect(args.ctxInput).toEqual([{ parsed1: "parsed1" }, undefined]);
    expect(args.input).toEqual({ parsed3: "parsed3" });
    expect(args.unsafeRawInput).toEqual({
      parsed1: "parsed1",
      unparsed2: "unparsed2",
      parsed3: "parsed3",
    });
  });
});

describe("createAction", () => {
  describe("input", async () => {
    test("should transform input error", async () => {
      const action = createSafeFn()
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
      const parent = createSafeFn()
        .input(z.object({ name: z.string() }))
        .handler((args) => ok(args));
      const child = createSafeFn()
        .use(parent)
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
      const action = createSafeFn()
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
      const parent = createSafeFn()
        .output(z.object({ name: z.string() }))
        //@ts-expect-error - passing wrong input on purpose
        .handler((args) => {
          return ok({});
        });
      const child = createSafeFn()
        .use(parent)
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

      const child2 = createSafeFn()
        .use(parent)
        .output(z.object({ age: z.number() }))
        .handler(() => {
          return ok({ age: 100 });
        });

      const child3 = createSafeFn()
        .use(child2)
        .handler(() => ok({}))
        .createAction();

      const res2 = await child3();
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
