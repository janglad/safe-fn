import { assert, describe, expect, test } from "vitest";
import { z } from "zod";
import { Err, Ok } from "./result";
import { SafeFn } from "./safe-fn";

describe("SafeFn", () => {
  test("should create a new instance", () => {
    const safeFn = SafeFn.new();
    expect(safeFn).toBeInstanceOf(SafeFn);
  });
});

describe("input", () => {
  test("should set the input schema", () => {
    const inputSchema = z.string();
    const safeFn = SafeFn.new().input(inputSchema);
    expect(safeFn._inputSchema).toEqual(inputSchema);
  });
});

describe("output", () => {
  test("should set the output schema", () => {
    const outputSchema = z.string();
    const safeFn = SafeFn.new().output(outputSchema);
    expect(safeFn._outputSchema).toEqual(outputSchema);
  });
});

describe("action", () => {
  test("should set the action function", () => {
    const actionFn = () => Ok("data");
    const safeFn = SafeFn.new().action(actionFn);
    expect(safeFn._actionFn).toEqual(actionFn);
  });
});

describe("internals", () => {
  describe("_parseInput", () => {
    test("should throw when no input schema is defined", async () => {
      const safeFn = SafeFn.new();
      expect(() => safeFn._parseInput("data")).rejects.toThrow();
    });

    test("should return Ok when input is valid", async () => {
      const inputSchema = z.string();
      const safeFn = SafeFn.new().input(inputSchema);
      const res = await safeFn._parseInput("data");
      expect(res).toEqual(Ok("data"));
    });

    // TODO: mabe write this better
    test("should return Err when input is invalid", async () => {
      const inputSchema = z.string();
      const safeFn = SafeFn.new().input(inputSchema);
      const res = await safeFn._parseInput(123);
      expect(res.success).toBe(false);
      expect(res.data).toBeUndefined();
      expect(res.error).toBeDefined();
      expect(res.error.cause).toBeInstanceOf(z.ZodError);
    });

    test("should transform input", async () => {
      const inputSchema = z.string().transform((data) => data + "!");
      const safeFn = SafeFn.new().input(inputSchema);
      const res = await safeFn._parseInput("data");
      expect(res).toEqual(Ok("data!"));
    });
  });

  describe("_parseOutput", () => {
    test("should throw when no output schema is defined", async () => {
      const safeFn = SafeFn.new();
      expect(() => safeFn._parseOutput("data")).rejects.toThrow();
    });

    test("should return Ok when output is valid", async () => {
      const outputSchema = z.string();
      const safeFn = SafeFn.new().output(outputSchema);
      const res = await safeFn._parseOutput("data");
      expect(res).toEqual(Ok("data"));
    });

    test("should return Err when output is invalid", async () => {
      const outputSchema = z.string();
      const safeFn = SafeFn.new().output(outputSchema);
      const res = await safeFn._parseOutput(123);
      expect(res.success).toBe(false);
      expect(res.data).toBeUndefined();
      expect(res.error).toBeDefined();
      expect(res.error.cause).toBeInstanceOf(z.ZodError);
    });

    test("should transform output", async () => {
      const outputSchema = z.string().transform((data) => data + "!");
      const safeFn = SafeFn.new().output(outputSchema);
      const res = await safeFn._parseOutput("data");
      expect(res).toEqual(Ok("data!"));
    });
  });
});

describe("run", () => {
  describe("input", () => {
    test("should set parsedInput to undefined when no input schema is defined", async () => {
      const res = await SafeFn.new()
        .action((args) => Ok(args.parsedInput))
        .run({});
      expect(res).toEqual(Ok(undefined));
    });

    test("should pass unparsedInput when no input schema is defined", async () => {
      const res = await SafeFn.new()
        .action((args) => Ok(args.unparsedInput))
        .run("data");
      expect(res).toEqual(Ok("data"));
    });

    test("should pass unparsedInput when input schema is defined", async () => {
      const inputSchema = z.any().transform((_) => undefined);
      const res = await SafeFn.new()
        .input(inputSchema)
        .action((args) => Ok(args.unparsedInput))
        .run("data");
      expect(res).toEqual(Ok("data"));
    });

    test("should pass parsedInput when input schema is defined", async () => {
      const inputSchema = z.any().transform((_) => "parsed");
      const res = await SafeFn.new()
        .input(inputSchema)
        .action((args) => Ok(args.parsedInput))
        .run("data");
      expect(res).toEqual(Ok("parsed"));
    });

    test("should return Err when input is invalid", async () => {
      const inputSchema = z.string();
      const res = await SafeFn.new()
        .input(inputSchema)
        .action((args) => Ok(args.parsedInput))
        // @ts-expect-error
        .run(123);

      if (!res.success) {
        type test = typeof res.error;
      }

      expect(res.success).toBe(false);
      expect(res.data).toBeUndefined();
      expect(res.error).toBeDefined();
      assert(res.error !== undefined);
      expect(res.error.code).toBe("INPUT_PARSING");
      assert(res.error.code === "INPUT_PARSING");
      expect(res.error.cause).toBeInstanceOf(z.ZodError);
    });
  });

  describe("output", () => {
    test("should return action result when no output schema is defined", async () => {
      const res = await SafeFn.new()
        .action((args) => Ok("data"))
        .run({});
      expect(res).toEqual(Ok("data"));
    });

    test("should return parsed output when output schema is defined", async () => {
      const outputSchema = z.any().transform((_) => "parsed");
      const res = await SafeFn.new()
        .output(outputSchema)
        .action((args) => Ok("Any string"))
        .run({});
      expect(res).toEqual(Ok("parsed"));
    });

    test("should return Err when output is invalid", async () => {
      const outputSchema = z.string();
      const res = await SafeFn.new()
        .output(outputSchema)
        // @ts-expect-error
        .action((args) => Ok(123))
        .run({});
      expect(res.success).toBe(false);
      expect(res.data).toBeUndefined();
      expect(res.error).toBeDefined();
      expect(res.error.cause).toBeInstanceOf(z.ZodError);
    });
  });

  describe("error", () => {
    test("should not throw uncaught error without function provided", async () => {
      const safeFn = SafeFn.new().action(() => {
        throw new Error("error");
      });

      expect(() => safeFn.run({})).not.toThrow();
    });

    test("should not throw uncaught error with function provided", async () => {
      const safeFn = SafeFn.new()
        .action(() => {
          throw new Error("error");
        })
        .error(() => Err("error"));

      expect(() => safeFn.run({})).not.toThrow();
    });

    test("should pass uncaught error on to error handler", async () => {
      const safeFn = SafeFn.new()
        .action(() => {
          throw new Error("a new error");
        })
        .error((error) => {
          return Err(error);
        });

      const res = await safeFn.run({});

      expect(res.success).toBe(false);
      expect(res.error).toBeInstanceOf(Error);
      // Double assert for type checking
      assert(res.error instanceof Error);
      expect(res.error.message).toBe("a new error");
    });
  });
});

describe("error", () => {
  test("should set the error handler", () => {
    const errorHandler = () => Err("error");
    const safeFn = SafeFn.new().error(errorHandler);
    expect(safeFn._uncaughtErrorHandler).toEqual(errorHandler);
  });
});

describe("procedure", () => {
  test("should set parent procedure", () => {
    const safeFn1 = SafeFn.new();
    const safeFn2 = SafeFn.new(safeFn1);
    expect(safeFn2._parent).toEqual(safeFn1);
  });

  test("should return parent return value as ctx", () => {
    const safeFn1 = SafeFn.new().action(() => Ok("hello"));
    const safeFn2 = SafeFn.new(safeFn1).action((args) => {
      return Ok(args.ctx);
    });

    expect(safeFn2.run({})).resolves.toEqual(Ok("hello"));
  });
});
