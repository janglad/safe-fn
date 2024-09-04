import { assert, describe, expect, test } from "vitest";
import { z } from "zod";
import { err, ok, type Result } from "./result";
import { SafeFnBuilder } from "./safe-fn-builder";
import type { TODO } from "./types";

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

      const testCases = [
        {
          name: "regular",
          createSafeFn: () =>
            SafeFnBuilder.new()
              .input(inputSchema)
              .handler((args) => ok(args.parsedInput.fullName)),
        },
        {
          name: "async",
          createSafeFn: () =>
            SafeFnBuilder.new()
              .input(inputSchema)
              .handler(async (args) => ok(args.parsedInput.fullName)),
        },
        {
          name: "generator",
          createSafeFn: () =>
            SafeFnBuilder.new()
              .input(inputSchema)
              .safeHandler(async function* (args) {
                return ok(args.parsedInput.fullName);
              }),
        },
      ];

      testCases.forEach(({ name, createSafeFn }) => {
        test(`should parse input and pass it to ${name} handler`, async () => {
          const safeFn = createSafeFn();
          const res = await safeFn.run({ name: "John", lastName: "Doe" });
          expect(res).toBeOk();
          assert(res.isOk());
          expect(res.value).toBe("John Doe");
        });
      });

      testCases.forEach(({ name, createSafeFn }) => {
        test(`should return Err if input is not valid for ${name} handler`, async () => {
          const safeFn = createSafeFn();
          // @ts-expect-error
          const res = await safeFn.run({});
          expect(res).toBeErr();
          assert(res.isErr());
          expect(res.error).toMatchObject({
            code: "INPUT_PARSING",
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

      const testCases = [
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

      testCases.forEach(({ name, createSafeFn }) => {
        test(`should return Ok with parsed output for ${name} handler`, async () => {
          const safeFn = createSafeFn();
          const res = await safeFn.run({ name: "John", lastName: "Doe" });
          expect(res).toBeOk();
          assert(res.isOk());
          expect(res.value).toEqual({
            fullName: "John Doe",
          });
        });
      });

      testCases.forEach(({ name, createSafeFn }) => {
        test(`should return Err if output is not valid for ${name} handler`, async () => {
          const safeFn = createSafeFn();
          // @ts-expect-error
          const res = await safeFn.run({});
          expect(res).toBeErr();
          assert(res.isErr());
          expect(res.error).toMatchObject({
            code: "OUTPUT_PARSING",
          });
        });
      });
    });
  });
});
