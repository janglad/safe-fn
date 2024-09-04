import { assert, describe, expectTypeOf, test } from "vitest";
import { z } from "zod";
import { err, ok } from "./result";
import { SafeFnBuilder } from "./safe-fn-builder";
import type { SafeFnDefaultThrownHandlerErr, TODO } from "./types";

const schemaPrimitive = z.string();
type SchemaPrimitiveInput = z.input<typeof schemaPrimitive>;
type SchemaPrimitiveOutput = z.output<typeof schemaPrimitive>;

const schemaObject = z.object({
  test: z.string(),
  nested: z.object({
    value: z.number(),
  }),
});
type SchemaObjectInput = z.input<typeof schemaObject>;
type SchemaObjectOutput = z.output<typeof schemaObject>;

const schemaTransformed = z
  .object({
    test: z.string(),
    nested: z.object({
      value: z.number(),
    }),
  })
  .transform(({ test }) => ({ test, newProperty: "test" }));
type SchemaTransformedInput = z.input<typeof schemaTransformed>;
type SchemaTransformedOutput = z.output<typeof schemaTransformed>;

describe("SafeFnBuilder", () => {
  describe("action", () => {
    describe("parsedInput", () => {
      test("should properly type for primitives", () => {
        const safeFn = SafeFnBuilder.new().input(schemaPrimitive);
        safeFn.handler((input) => {
          expectTypeOf(
            input.parsedInput,
          ).toEqualTypeOf<SchemaPrimitiveOutput>();
          return ok(input);
        });

        safeFn.handler(async (input) => {
          expectTypeOf(
            input.parsedInput,
          ).toEqualTypeOf<SchemaPrimitiveOutput>();
          return ok(input);
        });

        safeFn.safeHandler(async function* (input) {
          expectTypeOf(
            input.parsedInput,
          ).toEqualTypeOf<SchemaPrimitiveOutput>();
          return ok(input);
        });
      });

      test("should properly type for objects", () => {
        const safeFn = SafeFnBuilder.new().input(schemaObject);
        safeFn.handler((input) => {
          expectTypeOf(input.parsedInput).toEqualTypeOf<SchemaObjectOutput>();
          return ok(input);
        });

        safeFn.handler(async (input) => {
          expectTypeOf(input.parsedInput).toEqualTypeOf<SchemaObjectOutput>();
          return ok(input);
        });

        safeFn.safeHandler(async function* (input) {
          expectTypeOf(input.parsedInput).toEqualTypeOf<SchemaObjectOutput>();
          return ok(input);
        });
      });

      test("should properly type for transformed schemas", () => {
        const safeFn = SafeFnBuilder.new().input(schemaTransformed);
        safeFn.handler((input) => {
          expectTypeOf(
            input.parsedInput,
          ).toEqualTypeOf<SchemaTransformedOutput>();
          return ok(input);
        });

        safeFn.handler(async (input) => {
          expectTypeOf(
            input.parsedInput,
          ).toEqualTypeOf<SchemaTransformedOutput>();
          return ok(input);
        });

        safeFn.safeHandler(async function* (input) {
          expectTypeOf(
            input.parsedInput,
          ).toEqualTypeOf<SchemaTransformedOutput>();
          return ok(input);
        });
      });

      test("should type as undefined when no input schema is provided", () => {
        const safeFn = SafeFnBuilder.new();
        safeFn.handler((input) => {
          expectTypeOf(input.parsedInput).toEqualTypeOf<undefined>();
          return ok(input);
        });

        safeFn.handler(async (input) => {
          expectTypeOf(input.parsedInput).toEqualTypeOf<undefined>();
          return ok(input);
        });

        safeFn.safeHandler(async function* (input) {
          expectTypeOf(input.parsedInput).toEqualTypeOf<undefined>();
          return ok(input);
        });
      });
      test.todo("with parent");
    });

    describe("unparsedInput", () => {
      test("should properly type for primitives", () => {
        const safeFn = SafeFnBuilder.new().input(schemaPrimitive);
        safeFn.handler((input) => {
          expectTypeOf(
            input.unparsedInput,
          ).toEqualTypeOf<SchemaPrimitiveInput>();
          return ok(input);
        });

        safeFn.handler(async (input) => {
          expectTypeOf(
            input.unparsedInput,
          ).toEqualTypeOf<SchemaPrimitiveInput>();
          return ok(input);
        });

        safeFn.safeHandler(async function* (input) {
          expectTypeOf(
            input.unparsedInput,
          ).toEqualTypeOf<SchemaPrimitiveInput>();
          return ok(input);
        });
      });

      test("should properly type for objects", () => {
        const safeFn = SafeFnBuilder.new().input(schemaObject);
        safeFn.handler((input) => {
          expectTypeOf(input.unparsedInput).toEqualTypeOf<SchemaObjectInput>();
          return ok(input);
        });

        safeFn.handler(async (input) => {
          expectTypeOf(input.unparsedInput).toEqualTypeOf<SchemaObjectInput>();
          return ok(input);
        });

        safeFn.safeHandler(async function* (input) {
          expectTypeOf(input.unparsedInput).toEqualTypeOf<SchemaObjectInput>();
          return ok(input);
        });
      });

      test("should properly type for transformed schemas", () => {
        const safeFn = SafeFnBuilder.new().input(schemaTransformed);
        safeFn.handler((input) => {
          expectTypeOf(
            input.unparsedInput,
          ).toEqualTypeOf<SchemaTransformedInput>();
          return ok(input);
        });

        safeFn.handler(async (input) => {
          expectTypeOf(
            input.unparsedInput,
          ).toEqualTypeOf<SchemaTransformedInput>();
          return ok(input);
        });

        safeFn.safeHandler(async function* (input) {
          expectTypeOf(
            input.unparsedInput,
          ).toEqualTypeOf<SchemaTransformedInput>();
          return ok(input);
        });
      });

      test("should type as unknown when no input schema is provided and not manually set", () => {
        const safeFn = SafeFnBuilder.new();

        safeFn.handler((input) => {
          expectTypeOf(input.unparsedInput).toEqualTypeOf<unknown>();
          return ok(input);
        });

        safeFn.handler(async (input) => {
          expectTypeOf(input.unparsedInput).toEqualTypeOf<unknown>();
          return ok(input);
        });

        safeFn.safeHandler(async function* (input) {
          expectTypeOf(input.unparsedInput).toEqualTypeOf<unknown>();
          return ok(input);
        });
      });

      test("should properly type when manually set", () => {
        const safeFn = SafeFnBuilder.new().unparsedInput<{ name: string }>();

        safeFn.handler((input) => {
          expectTypeOf(input.unparsedInput).toEqualTypeOf<{ name: string }>();
          return ok(input);
        });

        safeFn.handler(async (input) => {
          expectTypeOf(input.unparsedInput).toEqualTypeOf<{ name: string }>();
          return ok(input);
        });

        safeFn.safeHandler(async function* (input) {
          expectTypeOf(input.unparsedInput).toEqualTypeOf<{ name: string }>();
          return ok(input);
        });
      });

      test.todo("with parent");
    });

    describe("ctx", () => {
      test("should type as undefined when no parent is provided", () => {
        const safeFn = SafeFnBuilder.new();

        safeFn.handler((input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<undefined>();
          return ok(input);
        });

        safeFn.handler(async (input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<undefined>();
          return ok(input);
        });

        safeFn.safeHandler(async function* (input) {
          expectTypeOf(input.ctx).toEqualTypeOf<undefined>();
          return ok(input);
        });
      });

      describe("should type when parent has primitive output schema", () => {
        const syncParent = SafeFnBuilder.new()
          .output(schemaPrimitive)
          .handler(() => ok("hello"));
        const asyncParent = SafeFnBuilder.new()
          .output(schemaPrimitive)
          .handler(async () => ok("hello"));
        const safeParent = SafeFnBuilder.new()
          .output(schemaPrimitive)
          .safeHandler(async function* () {
            return ok("hello");
          });

        const safeFnSyncParent = SafeFnBuilder.new(syncParent);
        safeFnSyncParent.handler((input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaPrimitiveOutput>();
          return ok(input);
        });

        safeFnSyncParent.handler(async (input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaPrimitiveOutput>();
          return ok(input);
        });

        safeFnSyncParent.safeHandler(async function* (input) {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaPrimitiveOutput>();
          return ok(input);
        });

        const safeFnAsyncParent = SafeFnBuilder.new(asyncParent);
        safeFnAsyncParent.handler((input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaPrimitiveOutput>();
          return ok(input);
        });

        safeFnAsyncParent.handler(async (input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaPrimitiveOutput>();
          return ok(input);
        });

        const safeFnSafeParent = SafeFnBuilder.new(safeParent);
        safeFnSafeParent.handler((input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaPrimitiveOutput>();
          return ok(input);
        });

        safeFnSafeParent.handler(async (input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaPrimitiveOutput>();
          return ok(input);
        });

        safeFnSafeParent.safeHandler(async function* (input) {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaPrimitiveOutput>();
          return ok(input);
        });
      });

      describe("should type when parent has object output schema", () => {
        const syncParent = SafeFnBuilder.new()
          .output(schemaObject)
          .handler(() => ok({ test: "hello", nested: { value: 1 } }));
        const asyncParent = SafeFnBuilder.new()
          .output(schemaObject)
          .handler(async () => ok({ test: "hello", nested: { value: 1 } }));
        const safeParent = SafeFnBuilder.new()
          .output(schemaObject)
          .safeHandler(async function* () {
            return ok({ test: "hello", nested: { value: 1 } });
          });

        const safeFnSyncParent = SafeFnBuilder.new(syncParent);
        safeFnSyncParent.handler((input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaObjectOutput>();
          return ok(input);
        });

        safeFnSyncParent.handler(async (input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaObjectOutput>();
          return ok(input);
        });

        safeFnSyncParent.safeHandler(async function* (input) {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaObjectOutput>();
          return ok(input);
        });

        const safeFnAsyncParent = SafeFnBuilder.new(asyncParent);
        safeFnAsyncParent.handler((input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaObjectOutput>();
          return ok(input);
        });

        safeFnAsyncParent.handler(async (input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaObjectOutput>();
          return ok(input);
        });
        safeFnAsyncParent.safeHandler(async function* (input) {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaObjectOutput>();
          return ok(input);
        });

        const safeFnSafeParent = SafeFnBuilder.new(safeParent);
        safeFnSafeParent.handler((input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaObjectOutput>();
          return ok(input);
        });

        safeFnSafeParent.handler(async (input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaObjectOutput>();
          return ok(input);
        });

        safeFnSafeParent.safeHandler(async function* (input) {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaObjectOutput>();
          return ok(input);
        });
      });

      describe("should properly type when parent has transformed output schema", () => {
        const syncParent = SafeFnBuilder.new()
          .output(schemaTransformed)
          .handler(() => ok({ test: "hello", nested: { value: 1 } }));
        const asyncParent = SafeFnBuilder.new()
          .output(schemaTransformed)
          .handler(async () => ok({ test: "hello", nested: { value: 1 } }));
        const safeParent = SafeFnBuilder.new()
          .output(schemaTransformed)
          .safeHandler(async function* () {
            return ok({ test: "hello", nested: { value: 1 } });
          });

        const safeFnSyncParent = SafeFnBuilder.new(syncParent);
        safeFnSyncParent.handler((input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaTransformedOutput>();
          return ok(input);
        });

        safeFnSyncParent.handler(async (input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaTransformedOutput>();
          return ok(input);
        });

        safeFnSyncParent.safeHandler(async function* (input) {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaTransformedOutput>();
          return ok(input);
        });

        const safeFnAsyncParent = SafeFnBuilder.new(asyncParent);
        safeFnAsyncParent.handler((input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaTransformedOutput>();
          return ok(input);
        });

        safeFnAsyncParent.handler(async (input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaTransformedOutput>();
          return ok(input);
        });
        safeFnAsyncParent.safeHandler(async function* (input) {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaTransformedOutput>();
          return ok(input);
        });

        const safeFnSafeParent = SafeFnBuilder.new(safeParent);
        safeFnSafeParent.handler((input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaTransformedOutput>();
          return ok(input);
        });

        safeFnSafeParent.handler(async (input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaTransformedOutput>();
          return ok(input);
        });

        safeFnSafeParent.safeHandler(async function* (input) {
          expectTypeOf(input.ctx).toEqualTypeOf<SchemaTransformedOutput>();
          return ok(input);
        });
      });

      describe("should properly type when parent output is inferred", () => {
        const expectedOutput = ok("hello" as const);
        type ExpectedCtx = "hello";

        const syncParent = SafeFnBuilder.new().handler(() => expectedOutput);
        const asyncParent = SafeFnBuilder.new().handler(
          async () => expectedOutput,
        );
        const safeParent = SafeFnBuilder.new().safeHandler(async function* () {
          return expectedOutput;
        });

        const safeFnSyncParent = SafeFnBuilder.new(syncParent);
        safeFnSyncParent.handler((input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<ExpectedCtx>();
          return ok(input);
        });
        safeFnSyncParent.handler(async (input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<ExpectedCtx>();
          return ok(input);
        });
        safeFnSyncParent.safeHandler(async function* (input) {
          expectTypeOf(input.ctx).toEqualTypeOf<ExpectedCtx>();
          return ok(input);
        });

        const safeFnAsyncParent = SafeFnBuilder.new(asyncParent);
        safeFnAsyncParent.handler((input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<ExpectedCtx>();
          return ok(input);
        });
        safeFnAsyncParent.handler(async (input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<ExpectedCtx>();
          return ok(input);
        });
        safeFnAsyncParent.safeHandler(async function* (input) {
          expectTypeOf(input.ctx).toEqualTypeOf<ExpectedCtx>();
          return ok(input);
        });

        const safeFnSafeParent = SafeFnBuilder.new(safeParent);
        safeFnSafeParent.handler((input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<ExpectedCtx>();
          return ok(input);
        });

        safeFnSafeParent.handler(async (input) => {
          expectTypeOf(input.ctx).toEqualTypeOf<ExpectedCtx>();
          return ok(input);
        });
        safeFnSafeParent.safeHandler(async function* (input) {
          expectTypeOf(input.ctx).toEqualTypeOf<ExpectedCtx>();
          return ok(input);
        });
      });
    });
  });
});

describe("runnableSafeFn", () => {
  describe("run", () => {
    test("should type OK as output schema when output schema is provided", async () => {
      const safeFn = SafeFnBuilder.new().output(schemaTransformed);
      const safeFnSync = safeFn.handler(() =>
        ok({ test: "hello", nested: { value: 1 } }),
      );
      const safeFnAsync = safeFn.handler(async () =>
        ok({ test: "hello", nested: { value: 1 } }),
      );
      const safeFnSafe = safeFn.safeHandler(async function* () {
        return ok({ test: "hello", nested: { value: 1 } });
      });

      const resultSync = await safeFnSync.run(undefined as TODO);
      const resultAsync = await safeFnAsync.run(undefined as TODO);
      const resultSafe = await safeFnSafe.run(undefined as TODO);

      assert(resultSync.isOk());
      assert(resultAsync.isOk());
      assert(resultSafe.isOk());

      expectTypeOf(resultSync.value).toEqualTypeOf<SchemaTransformedOutput>();
      expectTypeOf(resultAsync.value).toEqualTypeOf<SchemaTransformedOutput>();
      expectTypeOf(resultSafe.value).toEqualTypeOf<SchemaTransformedOutput>();
    });

    test("should type Ok as inferred when no output schema is provided", async () => {
      const safeFn = SafeFnBuilder.new();
      const safeFnSync = safeFn.handler(() => ok("hello" as const));
      const safeFnAsync = safeFn.handler(async () => ok("hello" as const));
      const safeFnSafe = safeFn.safeHandler(async function* () {
        return ok("hello" as const);
      });

      const resultSync = await safeFnSync.run(undefined as TODO);
      const resultAsync = await safeFnAsync.run(undefined as TODO);
      const resultSafe = await safeFnSafe.run(undefined as TODO);

      assert(resultSync.isOk());
      assert(resultAsync.isOk());
      assert(resultSafe.isOk());

      expectTypeOf(resultSync.value).toEqualTypeOf<"hello">();
      expectTypeOf(resultAsync.value).toEqualTypeOf<"hello">();
      expectTypeOf(resultSafe.value).toEqualTypeOf<"hello">();
    });

    test("should type Err as default when no error handler is provided", async () => {
      const safeFn = SafeFnBuilder.new();
      const safeFnSync = safeFn.handler(() => ok("hello" as const));
      const safeFnAsync = safeFn.handler(async () => ok("hello" as const));
      const safeFnSafe = safeFn.safeHandler(async function* () {
        return ok("hello" as const);
      });

      const resultSync = await safeFnSync.run(undefined as TODO);
      const resultAsync = await safeFnAsync.run(undefined as TODO);
      const resultSafe = await safeFnSafe.run(undefined as TODO);

      assert(resultSync.isErr());
      assert(resultAsync.isErr());
      assert(resultSafe.isErr());

      expectTypeOf(resultSync.error).toEqualTypeOf<
        SafeFnDefaultThrownHandlerErr["error"]
      >();
      expectTypeOf(resultAsync.error).toEqualTypeOf<
        SafeFnDefaultThrownHandlerErr["error"]
      >();
      expectTypeOf(resultSafe.error).toEqualTypeOf<
        SafeFnDefaultThrownHandlerErr["error"]
      >();
    });

    test("should type Err as custom when error handler is provided", async () => {
      const safeFn = SafeFnBuilder.new();
      const safeFnSync = safeFn
        .handler(() => ok("hello" as const))
        .error(() => err("world" as const));
      const safeFnAsync = safeFn
        .handler(async () => ok("hello" as const))
        .error(() => err("world" as const));
      const safeFnSafe = safeFn
        .safeHandler(async function* () {
          return ok("hello" as const);
        })
        .error(() => err("world" as const));

      const resultSync = await safeFnSync.run(undefined as TODO);
      const resultAsync = await safeFnAsync.run(undefined as TODO);
      const resultSafe = await safeFnSafe.run(undefined as TODO);

      assert(resultSync.isErr());
      assert(resultAsync.isErr());
      assert(resultSafe.isErr());

      expectTypeOf(resultSync.error).toEqualTypeOf<"world">();
      expectTypeOf(resultAsync.error).toEqualTypeOf<"world">();
      expectTypeOf(resultSafe.error).toEqualTypeOf<"world">();
    });

    test("should type Err as inferred when returned from handler", async () => {
      const safeFn = SafeFnBuilder.new();
      const safeFnSync = safeFn.handler(() => err("hello" as const));
      const safeFnAsync = safeFn.handler(async () => err("hello" as const));
      const safeFnSafe = safeFn.safeHandler(async function* () {
        return err("hello" as const);
      });

      const resultSync = await safeFnSync.run(undefined as TODO);
      const resultAsync = await safeFnAsync.run(undefined as TODO);
      const resultSafe = await safeFnSafe.run(undefined as TODO);

      assert(resultSync.isErr());
      assert(resultAsync.isErr());
      assert(resultSafe.isErr());

      expectTypeOf(resultSync.error).toEqualTypeOf<
        "hello" | SafeFnDefaultThrownHandlerErr["error"]
      >();
      expectTypeOf(resultAsync.error).toEqualTypeOf<
        "hello" | SafeFnDefaultThrownHandlerErr["error"]
      >();
      expectTypeOf(resultSafe.error).toEqualTypeOf<
        "hello" | SafeFnDefaultThrownHandlerErr["error"]
      >();
    });

    test("should merge errors when both returned and has custom handler", async () => {
      const safeFn = SafeFnBuilder.new();
      const safeFnSync = safeFn
        .handler(() => err("hello" as const))
        .error(() => err("world" as const));
      const safeFnAsync = safeFn
        .handler(async () => err("hello" as const))
        .error(() => err("world" as const));
      const safeFnSafe = safeFn
        .safeHandler(async function* () {
          return err("hello" as const);
        })
        .error(() => err("world" as const));

      const resultSync = await safeFnSync.run(undefined as TODO);
      const resultAsync = await safeFnAsync.run(undefined as TODO);
      const resultSafe = await safeFnSafe.run(undefined as TODO);

      assert(resultSync.isErr());
      assert(resultAsync.isErr());
      assert(resultSafe.isErr());

      expectTypeOf(resultSync.error).toEqualTypeOf<"hello" | "world">();
      expectTypeOf(resultAsync.error).toEqualTypeOf<"hello" | "world">();
      expectTypeOf(resultSafe.error).toEqualTypeOf<"hello" | "world">();
    });
  });
});
