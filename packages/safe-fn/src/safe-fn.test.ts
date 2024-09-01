import { assert, describe, expect, test } from "vitest";
import { z } from "zod";
import { err, ok } from "./result";
import { SafeFnBuilder } from "./safe-fn-builder";

describe("SafeFn", () => {
  test("should create a new instance", () => {
    const safeFn = SafeFnBuilder.new();
    expect(safeFn).toBeInstanceOf(SafeFnBuilder);
  });
});

describe("input", () => {
  test("should set the input schema", () => {
    const inputSchema = z.string();
    const safeFn = SafeFnBuilder.new().input(inputSchema);
    expect(safeFn._internals.inputSchema).toEqual(inputSchema);
  });
});

describe("output", () => {
  test("should set the output schema", () => {
    const outputSchema = z.string();
    const safeFn = SafeFnBuilder.new().output(outputSchema);
    expect(safeFn._internals.outputSchema).toEqual(outputSchema);
  });
});

describe("handler", () => {
  test("should set the handler function", () => {
    const handlerFn = () => ok("data");
    const safeFn = SafeFnBuilder.new().handler(handlerFn);
    expect(safeFn._internals.handler).toEqual(handlerFn);
  });
});

describe("internals", () => {
  describe("_parseInput", () => {
    test("should throw when no input schema is defined", async () => {
      const safeFn = SafeFnBuilder.new().handler(() => ok("data" as any));
      expect(() => safeFn._parseInput("data")).toThrow();
    });

    test("should return Ok when input is valid", async () => {
      const inputSchema = z.string();
      const safeFn = SafeFnBuilder.new()
        .input(inputSchema)
        .handler(() => ok(""));
      const res = await safeFn._parseInput("data");
      expect(res).toEqual(ok("data"));
    });

    // TODO: mabe write this better
    test("should return Err when input is invalid", async () => {
      const inputSchema = z.string();
      const safeFn = SafeFnBuilder.new()
        .input(inputSchema)
        .handler(() => ok(""));
      const res = await safeFn._parseInput(123);
      expect(res.isOk()).toBe(false);
      assert(res.isErr());
      expect(res.error).toBeDefined();
      assert(res.error !== undefined);
      expect(res.error.cause).toBeInstanceOf(z.ZodError);
    });

    test("should transform input", async () => {
      const inputSchema = z.string().transform((data) => data + "!");
      const safeFn = SafeFnBuilder.new()
        .input(inputSchema)
        .handler(() => ok(""));
      const res = await safeFn._parseInput("data");
      expect(res).toEqual(ok("data!"));
    });
  });

  describe("_parseOutput", () => {
    test("should throw when no output schema is defined", async () => {
      const safeFn = SafeFnBuilder.new().handler(() => ok("data" as any));
      expect(() => safeFn._parseOutput("data")).toThrow();
    });

    test("should return Ok when output is valid", async () => {
      const outputSchema = z.string();
      const safeFn = SafeFnBuilder.new()
        .output(outputSchema)
        .handler(() => ok(""));
      const res = await safeFn._parseOutput("data");
      expect(res).toEqual(ok("data"));
    });

    test("should return Err when output is invalid", async () => {
      const outputSchema = z.string();
      const safeFn = SafeFnBuilder.new()
        .output(outputSchema)
        .handler(() => ok(""));
      const res = await safeFn._parseOutput(123);
      expect(res.isOk()).toBe(false);
      assert(res.isErr());
      expect(res.error).toBeDefined();
      assert(res.error !== undefined);
      expect(res.error.cause).toBeInstanceOf(z.ZodError);
    });

    test("should transform output", async () => {
      const outputSchema = z.string().transform((data) => data + "!");
      const safeFn = SafeFnBuilder.new()
        .output(outputSchema)
        .handler(() => ok(""));
      const res = await safeFn._parseOutput("data");
      expect(res).toEqual(ok("data!"));
    });
  });
});

describe("run", () => {
  describe("input", () => {
    test("should set parsedInput to undefined when no input schema is defined", async () => {
      const res = await SafeFnBuilder.new()
        .handler((args) => ok(args.parsedInput))
        .run({});
      expect(res).toEqual(ok(undefined));
    });

    test("should pass unparsedInput when no input schema is defined", async () => {
      const res = await SafeFnBuilder.new()
        .handler((args) => ok(args.unparsedInput))
        .run("data");
      expect(res).toEqual(ok("data"));
    });

    test("should pass unparsedInput when input schema is defined", async () => {
      const inputSchema = z.any().transform((_) => undefined);
      const res = await SafeFnBuilder.new()
        .input(inputSchema)
        .handler((args) => ok(args.unparsedInput))
        .run("data");
      expect(res).toEqual(ok("data"));
    });

    test("should pass parsedInput when input schema is defined", async () => {
      const inputSchema = z.any().transform((_) => "parsed");
      const res = await SafeFnBuilder.new()
        .input(inputSchema)
        .handler((args) => ok(args.parsedInput))
        .run("data");
      expect(res).toEqual(ok("parsed"));
    });

    test("should return Err when input is invalid", async () => {
      const inputSchema = z.string();
      const res = await SafeFnBuilder.new()
        .input(inputSchema)
        .handler((args) => ok(args.parsedInput))
        // @ts-expect-error
        .run(123);

      expect(res.isOk()).toBe(false);
      assert(res.isErr());
      expect(res.error).toBeDefined();
      assert(res.error !== undefined);
      expect(res.error.code).toBe("INPUT_PARSING");
      assert(res.error.code === "INPUT_PARSING");
      expect(res.error.cause).toBeInstanceOf(z.ZodError);
    });
  });

  describe("output", () => {
    test("should return handler result when no output schema is defined", async () => {
      const res = await SafeFnBuilder.new()
        .handler((args) => ok("data"))
        .run({});
      expect(res).toEqual(ok("data"));
    });

    test("should return parsed output when output schema is defined", async () => {
      const outputSchema = z.any().transform((_) => "parsed");
      const res = await SafeFnBuilder.new()
        .output(outputSchema)
        .handler((args) => ok("Any string"))
        .run({});
      expect(res).toEqual(ok("parsed"));
    });

    test("should return Err when output is invalid", async () => {
      const outputSchema = z.string();
      const res = await SafeFnBuilder.new()
        .output(outputSchema)
        // @ts-expect-error
        .handler((args) => ok(123))
        .run({});
      expect(res.isOk()).toBe(false);
      assert(res.isErr());
      expect(res.error).toBeDefined();
      expect(res.error.cause).toBeInstanceOf(z.ZodError);
    });
  });

  describe("error", () => {
    test("should not throw uncaught error without function provided", async () => {
      const safeFn = SafeFnBuilder.new().handler(() => {
        throw new Error("error");
      });

      expect(() => safeFn.run({})).not.toThrow();
    });

    test("should not throw uncaught error with function provided", async () => {
      const safeFn = SafeFnBuilder.new()
        .handler(() => {
          throw new Error("error");
        })
        .error(() => err("error"));

      expect(() => safeFn.run({})).not.toThrow();
    });
    // TODO: fix this
    test.todo("should pass uncaught error on to error handler", async () => {
      const safeFn = SafeFnBuilder.new()
        .handler(() => {
          throw new Error("a new error");
        })
        .error((error) => {
          return err(error);
        });

      const res = await safeFn.run({});

      expect(res.isOk()).toBe(false);
      assert(res.isErr());
      const e = await res.error;
      console.log(e);
      expect(e).toBeInstanceOf(Error);
      // Double assert for type checking
      // assert(res.error instanceof Error);
      // expect(res.error.message).toBe("a new error");
    });
  });
});

describe("error", () => {
  test("should set the error handler", () => {
    const errorHandler = () => err("error");
    const safeFn = SafeFnBuilder.new()
      .handler(() => ok(""))
      .error(errorHandler);
    expect(safeFn._internals.uncaughtErrorHandler).toEqual(errorHandler);
  });
});

describe("procedure", () => {
  test("should set parent procedure", () => {
    const safeFn1 = SafeFnBuilder.new().handler(() => ok(""));
    const safeFn2 = SafeFnBuilder.new(safeFn1);
    expect(safeFn2._internals.parent).toEqual(safeFn1);
  });

  test("should return parent return value as ctx", () => {
    const safeFn1 = SafeFnBuilder.new().handler(() => ok("hello"));
    const safeFn2 = SafeFnBuilder.new(safeFn1).handler((args) => {
      return ok(args.ctx);
    });

    expect(safeFn2.run({})).resolves.toEqual(ok("hello"));
  });
});
