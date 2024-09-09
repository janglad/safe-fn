import { Err, err, Ok, ok, type Result } from "neverthrow";
import { assert, describe, expectTypeOf, test } from "vitest";
import { z } from "zod";
import { type ActionResult } from "./result";
import { SafeFnBuilder } from "./safe-fn-builder";
import type {
  Prettify,
  SafeFnDefaultCatchHandlerErr,
  SafeFnInputParseError,
  SafeFnOutputParseError,
} from "./types";

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
    const safeFnPrimitiveInput = SafeFnBuilder.new().input(schemaPrimitive);
    const safeFnObjectInput = SafeFnBuilder.new().input(schemaObject);
    const safeFnTransformedInput = SafeFnBuilder.new().input(schemaTransformed);
    const safeFnNoInput = SafeFnBuilder.new();
    const safeFnUnparsedInput = SafeFnBuilder.new().unparsedInput<{
      name: string;
    }>();

    describe("(un)parsedInput", () => {
      test("should properly type parsed and unparsed input for primitives", () => {
        safeFnPrimitiveInput.handler((input) => {
          expectTypeOf(
            input.unsafeRawInput,
          ).toEqualTypeOf<SchemaPrimitiveInput>();
          expectTypeOf(input.input).toEqualTypeOf<SchemaPrimitiveOutput>();
          return ok(input);
        });

        safeFnPrimitiveInput.handler(async (input) => {
          expectTypeOf(
            input.unsafeRawInput,
          ).toEqualTypeOf<SchemaPrimitiveInput>();
          expectTypeOf(input.input).toEqualTypeOf<SchemaPrimitiveOutput>();
          return ok(input);
        });

        safeFnPrimitiveInput.safeHandler(async function* (input) {
          expectTypeOf(
            input.unsafeRawInput,
          ).toEqualTypeOf<SchemaPrimitiveInput>();
          expectTypeOf(input.input).toEqualTypeOf<SchemaPrimitiveOutput>();
          return ok(input);
        });
      });

      test("should properly type parsed and unparsed input for objects", () => {
        safeFnObjectInput.handler((input) => {
          expectTypeOf(input.unsafeRawInput).toEqualTypeOf<SchemaObjectInput>();
          expectTypeOf(input.input).toEqualTypeOf<SchemaObjectOutput>();
          return ok(input);
        });

        safeFnObjectInput.handler(async (input) => {
          expectTypeOf(input.unsafeRawInput).toEqualTypeOf<SchemaObjectInput>();
          expectTypeOf(input.input).toEqualTypeOf<SchemaObjectOutput>();
          return ok(input);
        });

        safeFnObjectInput.safeHandler(async function* (input) {
          expectTypeOf(input.unsafeRawInput).toEqualTypeOf<SchemaObjectInput>();
          expectTypeOf(input.input).toEqualTypeOf<SchemaObjectOutput>();
          return ok(input);
        });
      });

      test("should properly type parsed and unparsed input for transformed schemas", () => {
        safeFnTransformedInput.handler((input) => {
          expectTypeOf(
            input.unsafeRawInput,
          ).toEqualTypeOf<SchemaTransformedInput>();
          expectTypeOf(input.input).toEqualTypeOf<SchemaTransformedOutput>();
          return ok(input);
        });

        safeFnTransformedInput.handler(async (input) => {
          expectTypeOf(
            input.unsafeRawInput,
          ).toEqualTypeOf<SchemaTransformedInput>();
          expectTypeOf(input.input).toEqualTypeOf<SchemaTransformedOutput>();
          return ok(input);
        });

        safeFnTransformedInput.safeHandler(async function* (input) {
          expectTypeOf(
            input.unsafeRawInput,
          ).toEqualTypeOf<SchemaTransformedInput>();
          expectTypeOf(input.input).toEqualTypeOf<SchemaTransformedOutput>();
          return ok(input);
        });
      });

      test("should type parsedInput as undefined, unparsed input as never when no input schema is provided", () => {
        safeFnNoInput.handler((input) => {
          expectTypeOf(input.unsafeRawInput).toEqualTypeOf<never>();
          expectTypeOf(input.input).toEqualTypeOf<undefined>();
          return ok(input);
        });

        safeFnNoInput.handler(async (input) => {
          expectTypeOf(input.unsafeRawInput).toEqualTypeOf<never>();
          expectTypeOf(input.input).toEqualTypeOf<undefined>();
          return ok(input);
        });

        safeFnNoInput.safeHandler(async function* (input) {
          expectTypeOf(input.unsafeRawInput).toEqualTypeOf<never>();
          expectTypeOf(input.input).toEqualTypeOf<undefined>();
          return ok(input);
        });
      });

      test("should properly type unparsed input when manually set", () => {
        safeFnUnparsedInput.handler((input) => {
          expectTypeOf(input.unsafeRawInput).toEqualTypeOf<{ name: string }>();
          return ok(input);
        });

        safeFnUnparsedInput.handler(async (input) => {
          expectTypeOf(input.unsafeRawInput).toEqualTypeOf<{ name: string }>();
          return ok(input);
        });

        safeFnUnparsedInput.safeHandler(async function* (input) {
          expectTypeOf(input.unsafeRawInput).toEqualTypeOf<{ name: string }>();
          return ok(input);
        });
      });

      test("should merge parsed and unparsed input when parent and child have input schema with transforms", () => {
        const input2 = z.object({
          new: z.string(),
          properties: z.array(z.number()),
        });
        const parent = safeFnTransformedInput.handler(() => ok(""));
        const child = SafeFnBuilder.new(parent).input(input2);

        type ExpectedUnparsedInput = Prettify<
          SchemaTransformedInput & z.input<typeof input2>
        >;
        type ExpectedParsedInput = Prettify<
          SchemaTransformedOutput & z.output<typeof input2>
        >;

        child.handler((input) => {
          expectTypeOf(
            input.unsafeRawInput,
          ).toEqualTypeOf<ExpectedUnparsedInput>();
          expectTypeOf(input.input).toEqualTypeOf<ExpectedParsedInput>();
          return ok(input);
        });

        child.handler(async (input) => {
          expectTypeOf(
            input.unsafeRawInput,
          ).toEqualTypeOf<ExpectedUnparsedInput>();
          expectTypeOf(input.input).toEqualTypeOf<ExpectedParsedInput>();
          return ok(input);
        });

        child.safeHandler(async function* (input) {
          expectTypeOf(
            input.unsafeRawInput,
          ).toEqualTypeOf<ExpectedUnparsedInput>();
          expectTypeOf(input.input).toEqualTypeOf<ExpectedParsedInput>();
          return ok(input);
        });
      });

      test("should merge unparsedInput and type parsedInput from child when parent ha no input schema but defines unparsed", () => {
        const parent = SafeFnBuilder.new()
          .unparsedInput<{
            new: string;
            properties: number[];
          }>()
          .handler(() => ok(""));

        const child = SafeFnBuilder.new(parent).input(schemaTransformed);

        type ExpectedUnparsedInput = Prettify<
          SchemaTransformedInput & {
            new: string;
            properties: number[];
          }
        >;
        type ExpectedParsedInput = SchemaTransformedOutput;

        child.handler((input) => {
          expectTypeOf(
            input.unsafeRawInput,
          ).toEqualTypeOf<ExpectedUnparsedInput>();
          expectTypeOf(input.input).toEqualTypeOf<ExpectedParsedInput>();
          return ok(input);
        });

        child.handler(async (input) => {
          expectTypeOf(
            input.unsafeRawInput,
          ).toEqualTypeOf<ExpectedUnparsedInput>();
          expectTypeOf(input.input).toEqualTypeOf<ExpectedParsedInput>();
          return ok(input);
        });

        child.safeHandler(async function* (input) {
          expectTypeOf(
            input.unsafeRawInput,
          ).toEqualTypeOf<ExpectedUnparsedInput>();
          expectTypeOf(input.input).toEqualTypeOf<ExpectedParsedInput>();
          return ok(input);
        });
      });

      test("should merge unparsedInput and type parsedInput as undefined when both manually define unparsedInput", () => {
        const parent = SafeFnBuilder.new()
          .unparsedInput<{
            new: string;
            properties: number[];
          }>()
          .handler(() => ok(""));

        const child = SafeFnBuilder.new(parent).unparsedInput<{
          superNew: string;
          supertest: number[];
        }>();

        type ExpectedUnparsedInput = {
          new: string;
          properties: number[];
          superNew: string;
          supertest: number[];
        };
        type ExpectedParsedInput = undefined;

        child.handler((input) => {
          expectTypeOf(
            input.unsafeRawInput,
          ).toEqualTypeOf<ExpectedUnparsedInput>();
          expectTypeOf(input.input).toEqualTypeOf<ExpectedParsedInput>();
          return ok(input);
        });

        child.handler(async (input) => {
          expectTypeOf(
            input.unsafeRawInput,
          ).toEqualTypeOf<ExpectedUnparsedInput>();
          expectTypeOf(input.input).toEqualTypeOf<ExpectedParsedInput>();
          return ok(input);
        });

        child.safeHandler(async function* (input) {
          expectTypeOf(
            input.unsafeRawInput,
          ).toEqualTypeOf<ExpectedUnparsedInput>();
          expectTypeOf(input.input).toEqualTypeOf<ExpectedParsedInput>();
          return ok(input);
        });
      });

      test("should type unparsedInput as never and parsedInput as undefined when no input schema is provided", () => {
        const parent = SafeFnBuilder.new().handler(() => ok(""));
        const child = SafeFnBuilder.new(parent);

        type ExpectedUnparsedInput = never;
        type ExpectedParsedInput = undefined;

        child.handler((input) => {
          expectTypeOf(
            input.unsafeRawInput,
          ).toEqualTypeOf<ExpectedUnparsedInput>();
          expectTypeOf(input.input).toEqualTypeOf<ExpectedParsedInput>();
          return ok(input);
        });

        child.handler(async (input) => {
          expectTypeOf(
            input.unsafeRawInput,
          ).toEqualTypeOf<ExpectedUnparsedInput>();
          expectTypeOf(input.input).toEqualTypeOf<ExpectedParsedInput>();
          return ok(input);
        });

        child.safeHandler(async function* (input) {
          expectTypeOf(
            input.unsafeRawInput,
          ).toEqualTypeOf<ExpectedUnparsedInput>();
          expectTypeOf(input.input).toEqualTypeOf<ExpectedParsedInput>();
          return ok(input);
        });
      });
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
    describe("input", () => {
      test("should not require input when none is set", async () => {
        const safeFn = SafeFnBuilder.new();
        const safeFnSync = safeFn.handler(() => ok("hello" as const));
        const safeFnAsync = safeFn.handler(async () => ok("hello" as const));
        const safeFnSafe = safeFn.safeHandler(async function* () {
          return ok("hello" as const);
        });

        expectTypeOf(safeFnSync.run).parameters.toEqualTypeOf<[]>();
        expectTypeOf(safeFnAsync.run).parameters.toEqualTypeOf<[]>();
        expectTypeOf(safeFnSafe.run).parameters.toEqualTypeOf<[]>();
      });

      test("should merge input type from parent", () => {
        const parent = SafeFnBuilder.new()
          .input(schemaTransformed)
          .handler(() => ok("hello" as const));
        const child = SafeFnBuilder.new(parent).handler(() =>
          ok("hello" as const),
        );

        expectTypeOf(child.run).parameters.toEqualTypeOf<
          [SchemaTransformedInput]
        >();
      });
    });

    describe("output", () => {
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

        const resultSync = await safeFnSync.run();
        const resultAsync = await safeFnAsync.run();
        const resultSafe = await safeFnSafe.run();

        assert(resultSync.isOk());
        assert(resultAsync.isOk());
        assert(resultSafe.isOk());

        expectTypeOf(resultSync.value).toEqualTypeOf<SchemaTransformedOutput>();
        expectTypeOf(
          resultAsync.value,
        ).toEqualTypeOf<SchemaTransformedOutput>();
        expectTypeOf(resultSafe.value).toEqualTypeOf<SchemaTransformedOutput>();
      });

      test("should type Ok as inferred when no output schema is provided", async () => {
        const safeFn = SafeFnBuilder.new();
        const safeFnSync = safeFn.handler(() => ok("hello" as const));
        const safeFnAsync = safeFn.handler(async () => ok("hello" as const));
        const safeFnSafe = safeFn.safeHandler(async function* () {
          return ok("hello" as const);
        });

        const resultSync = await safeFnSync.run();
        const resultAsync = await safeFnAsync.run();
        const resultSafe = await safeFnSafe.run();

        assert(resultSync.isOk());
        assert(resultAsync.isOk());
        assert(resultSafe.isOk());

        expectTypeOf(resultSync.value).toEqualTypeOf<"hello">();
        expectTypeOf(resultAsync.value).toEqualTypeOf<"hello">();
        expectTypeOf(resultSafe.value).toEqualTypeOf<"hello">();
      });

      test("should type Err as default when no catch handler is provided", async () => {
        const safeFn = SafeFnBuilder.new();
        const safeFnSync = safeFn.handler(() => ok("hello" as const));
        const safeFnAsync = safeFn.handler(async () => ok("hello" as const));
        const safeFnSafe = safeFn.safeHandler(async function* () {
          return ok("hello" as const);
        });

        const resultSync = await safeFnSync.run();
        const resultAsync = await safeFnAsync.run();
        const resultSafe = await safeFnSafe.run();

        assert(resultSync.isErr());
        assert(resultAsync.isErr());
        assert(resultSafe.isErr());

        expectTypeOf(resultSync.error).toEqualTypeOf<
          SafeFnDefaultCatchHandlerErr["error"]
        >();
        expectTypeOf(resultAsync.error).toEqualTypeOf<
          SafeFnDefaultCatchHandlerErr["error"]
        >();
        expectTypeOf(resultSafe.error).toEqualTypeOf<
          SafeFnDefaultCatchHandlerErr["error"]
        >();
      });

      test("should type Err as custom when catch handler is provided", async () => {
        const safeFn = SafeFnBuilder.new();
        const safeFnSync = safeFn
          .handler(() => ok("hello" as const))
          .catch(() => err("world" as const));
        const safeFnAsync = safeFn
          .handler(async () => ok("hello" as const))
          .catch(() => err("world" as const));
        const safeFnSafe = safeFn
          .safeHandler(async function* () {
            return ok("hello" as const);
          })
          .catch(() => err("world" as const));

        const resultSync = await safeFnSync.run();
        const resultAsync = await safeFnAsync.run();
        const resultSafe = await safeFnSafe.run();

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

        const resultSync = await safeFnSync.run();
        const resultAsync = await safeFnAsync.run();
        const resultSafe = await safeFnSafe.run();

        assert(resultSync.isErr());
        assert(resultAsync.isErr());
        assert(resultSafe.isErr());

        expectTypeOf(resultSync.error).toEqualTypeOf<
          "hello" | SafeFnDefaultCatchHandlerErr["error"]
        >();
        expectTypeOf(resultAsync.error).toEqualTypeOf<
          "hello" | SafeFnDefaultCatchHandlerErr["error"]
        >();
        expectTypeOf(resultSafe.error).toEqualTypeOf<
          "hello" | SafeFnDefaultCatchHandlerErr["error"]
        >();
      });

      test("should merge errors when both returned and has custom handler", async () => {
        const safeFn = SafeFnBuilder.new();
        const safeFnSync = safeFn
          .handler(() => err("hello" as const))
          .catch(() => err("world" as const));
        const safeFnAsync = safeFn
          .handler(async () => err("hello" as const))
          .catch(() => err("world" as const));
        const safeFnSafe = safeFn
          .safeHandler(async function* () {
            return err("hello" as const);
          })
          .catch(() => err("world" as const));

        const resultSync = await safeFnSync.run();
        const resultAsync = await safeFnAsync.run();
        const resultSafe = await safeFnSafe.run();

        assert(resultSync.isErr());
        assert(resultAsync.isErr());
        assert(resultSafe.isErr());

        expectTypeOf(resultSync.error).toEqualTypeOf<"hello" | "world">();
        expectTypeOf(resultAsync.error).toEqualTypeOf<"hello" | "world">();
        expectTypeOf(resultSafe.error).toEqualTypeOf<"hello" | "world">();
      });

      test("should correctly type full result when output schema is provided and handler can return only error", async () => {
        const safeFn = SafeFnBuilder.new().output(schemaTransformed);
        const safeFnSync = safeFn.handler(() => err("hello" as const));
        const safeFnAsync = safeFn.handler(async () => err("hello" as const));
        const safeFnSafe = safeFn.safeHandler(async function* () {
          return err("hello" as const);
        });

        const resultSync = await safeFnSync.run();
        const resultAsync = await safeFnAsync.run();
        const resultSafe = await safeFnSafe.run();

        expectTypeOf(resultSync).toEqualTypeOf<
          Result<never, "hello" | SafeFnDefaultCatchHandlerErr["error"]>
        >();
        expectTypeOf(resultAsync).toEqualTypeOf<
          Result<never, "hello" | SafeFnDefaultCatchHandlerErr["error"]>
        >();
        expectTypeOf(resultSafe).toEqualTypeOf<
          Result<never, "hello" | SafeFnDefaultCatchHandlerErr["error"]>
        >();
      });

      test("should correctly type when handler can return either Err or Ok", async () => {
        const safeFn = SafeFnBuilder.new();

        const safeFnSync = safeFn.handler(() => {
          let bool = true;
          if (bool) {
            return ok("hello" as const);
          }
          return err("world" as const);
        });
        const safeFnAsync = safeFn.handler(async () => {
          let bool = true;
          if (bool) {
            return ok("hello" as const);
          }
          return err("world" as const);
        });
        const safeFnSafe = safeFn.safeHandler(async function* () {
          let bool = true;
          if (bool) {
            return ok("hello" as const);
          }
          return err("world" as const);
        });

        const safeFnSafeYield = safeFn.safeHandler(async function* () {
          let bool = true;
          if (!bool) {
            yield* err("world" as const).safeUnwrap();
          }
          return ok("hello" as const);
        });

        const resultSync = await safeFnSync.run();
        const resultAsync = await safeFnAsync.run();
        const resultSafe = await safeFnSafe.run();
        const resultSafeYield = await safeFnSafeYield.run();

        type ExpectedResult = Result<
          "hello",
          "world" | SafeFnDefaultCatchHandlerErr["error"]
        >;

        expectTypeOf(resultSync).toEqualTypeOf<ExpectedResult>();
        expectTypeOf(resultAsync).toEqualTypeOf<ExpectedResult>();
        expectTypeOf(resultSafe).toEqualTypeOf<ExpectedResult>();
        expectTypeOf(resultSafeYield).toEqualTypeOf<ExpectedResult>();
      });

      test("should merge Err types from parent handler and catch handler", async () => {
        const safeFn = SafeFnBuilder.new();
        const parentSync = safeFn
          .handler(() => err("hello" as const))
          .catch(() => err("world" as const));
        const parentAsync = safeFn
          .handler(async () => err("hello" as const))
          .catch(() => err("world" as const));
        const parentSafe = safeFn
          .safeHandler(async function* () {
            return err("hello" as const);
          })
          .catch(() => err("world" as const));

        const safeFnSyncParentSync = SafeFnBuilder.new(parentSync).handler(() =>
          ok("ok" as const),
        );
        const safeFnAsyncParentSync = SafeFnBuilder.new(parentAsync).handler(
          async () => ok("ok" as const),
        );
        const safeFnSafeParentSync = SafeFnBuilder.new(parentSafe).safeHandler(
          async function* () {
            return ok("ok" as const);
          },
        );

        const resSync = await safeFnSyncParentSync.run();
        const resAsync = await safeFnAsyncParentSync.run();
        const resSafe = await safeFnSafeParentSync.run();

        assert(resSync.isErr());
        assert(resAsync.isErr());
        assert(resSafe.isErr());

        expectTypeOf(resSync.error).toEqualTypeOf<
          "hello" | "world" | SafeFnDefaultCatchHandlerErr["error"]
        >();
        expectTypeOf(resAsync.error).toEqualTypeOf<
          "hello" | "world" | SafeFnDefaultCatchHandlerErr["error"]
        >();
        expectTypeOf(resSafe.error).toEqualTypeOf<
          "hello" | "world" | SafeFnDefaultCatchHandlerErr["error"]
        >();
      });

      test("should merge Err types from parent schemas", async () => {
        const safeFn = SafeFnBuilder.new();
        const parentSync = safeFn
          .input(schemaTransformed)
          .handler(() => ok("hi" as const));
        const parentAsync = safeFn
          .input(schemaTransformed)
          .handler(async () => ok("hi" as const));
        const parentSafe = safeFn
          .input(schemaTransformed)
          .safeHandler(async function* () {
            return ok("hi" as const);
          });

        const safeFnSyncParent = SafeFnBuilder.new(parentSync).handler(() =>
          ok("ok" as const),
        );
        const safeFnAsyncParent = SafeFnBuilder.new(parentAsync).handler(
          async () => ok("ok" as const),
        );
        const safeFnSafeParent = SafeFnBuilder.new(parentSafe).safeHandler(
          async function* () {
            return ok("ok" as const);
          },
        );

        // @ts-expect-error - input is not compatible
        const resSync = await safeFnSyncParent.run();
        // @ts-expect-error - input is not compatible
        const resAsync = await safeFnAsyncParent.run();
        // @ts-expect-error - input is not compatible
        const resSafe = await safeFnSafeParent.run();

        assert(!resSync.isOk());
        assert(!resAsync.isOk());
        assert(!resSafe.isOk());

        expectTypeOf(resSync.error).toEqualTypeOf<
          | SafeFnDefaultCatchHandlerErr["error"]
          | {
              code: "INPUT_PARSING";
              cause: z.ZodError<SchemaTransformedInput>;
            }
        >();
        expectTypeOf(resAsync.error).toEqualTypeOf<
          | SafeFnDefaultCatchHandlerErr["error"]
          | {
              code: "INPUT_PARSING";
              cause: z.ZodError<SchemaTransformedInput>;
            }
        >();
        expectTypeOf(resSafe.error).toEqualTypeOf<
          | SafeFnDefaultCatchHandlerErr["error"]
          | {
              code: "INPUT_PARSING";
              cause: z.ZodError<SchemaTransformedInput>;
            }
        >();

        const nestedChild = SafeFnBuilder.new(safeFnSafeParent).handler(() =>
          ok("ok" as const),
        );
        // @ts-expect-error
        const resNestedChildSync = await nestedChild.run();

        assert(resNestedChildSync.isErr());

        expectTypeOf(resNestedChildSync.error).toEqualTypeOf<
          | SafeFnDefaultCatchHandlerErr["error"]
          | {
              code: "INPUT_PARSING";
              cause: z.ZodError<SchemaTransformedInput>;
            }
        >();
      });
    });

    describe("callbacks", () => {
      const safeFn = SafeFnBuilder.new()
        .input(schemaTransformed)
        .handler(() => ok("hello" as const));
      const childSchema = z.object({ child: z.string() });
      type ChildSchemaInput = z.input<typeof childSchema>;
      const child = SafeFnBuilder.new(safeFn)
        .input(childSchema)
        .handler(() => ok("world" as const));

      test("onStart", () => {
        type OnStartArgs = Parameters<Parameters<typeof child.onStart>[0]>[0];

        type ExpectedUnsafeRawInput = Prettify<
          SchemaTransformedInput & { child: string }
        >;

        type ExpectedArgs = Prettify<{
          unsafeRawInput: ExpectedUnsafeRawInput;
        }>;

        expectTypeOf<OnStartArgs>().toEqualTypeOf<ExpectedArgs>();
      });

      test("onError", () => {
        type OnErrorArgs = Parameters<Parameters<typeof child.onError>[0]>[0];

        type UnsafeRawInput = Prettify<
          SchemaTransformedInput & { child: string }
        >;

        type ExpectedInput =
          | Prettify<SchemaTransformedOutput & { child: string }>
          | undefined;
        type ExpectedCtx = "hello" | undefined;
        type ExpectedRunErrError =
          | SafeFnDefaultCatchHandlerErr["error"]
          | {
              code: "INPUT_PARSING";
              cause: z.ZodError<SchemaTransformedInput>;
            }
          | {
              code: "INPUT_PARSING";
              cause: z.ZodError<ChildSchemaInput>;
            };

        type ExpectedActionErrError =
          | SafeFnDefaultCatchHandlerErr["error"]
          | {
              code: "INPUT_PARSING";
              cause: {
                formattedError: z.ZodFormattedError<SchemaTransformedInput>;
                flattenedError: z.typeToFlattenedError<
                  SchemaTransformedInput,
                  string
                >;
              };
            }
          | {
              code: "INPUT_PARSING";
              cause: {
                formattedError: z.ZodFormattedError<ChildSchemaInput>;
                flattenedError: z.typeToFlattenedError<
                  ChildSchemaInput,
                  string
                >;
              };
            };
        type ExpectedArgs =
          | {
              asAction: true;
              error: ExpectedActionErrError;
              input: ExpectedInput;
              ctx: ExpectedCtx;
              unsafeRawInput: UnsafeRawInput;
            }
          | {
              asAction: false;
              error: ExpectedRunErrError;
              input: ExpectedInput;
              ctx: ExpectedCtx;
              unsafeRawInput: UnsafeRawInput;
            };

        expectTypeOf<OnErrorArgs>().toMatchTypeOf<ExpectedArgs>();
      });

      test("onSuccess", () => {
        type OnSuccessArgs = Parameters<
          Parameters<typeof child.onSuccess>[0]
        >[0];

        type ExpectedUnsafeRawInput = Prettify<
          SchemaTransformedInput & { child: string }
        >;
        type ExpectedInput = Prettify<
          SchemaTransformedOutput & { child: string }
        >;
        type ExpectedCtx = "hello";
        type ExpectedOkData = "world";

        type ExpectedArgs = Prettify<{
          unsafeRawInput: ExpectedUnsafeRawInput;
          input: ExpectedInput;
          ctx: ExpectedCtx;
          value: ExpectedOkData;
        }>;

        expectTypeOf<OnSuccessArgs>().toMatchTypeOf<ExpectedArgs>();
      });

      test("onComplete", () => {
        type OnCompleteArgs = Parameters<
          Parameters<typeof child.onComplete>[0]
        >[0];

        type ExpectedUnsafeRawInput = Prettify<
          SchemaTransformedInput & { child: string }
        >;
        type ExpectedInput = Prettify<
          SchemaTransformedOutput & { child: string }
        >;
        type ExpectedCtx = "hello";
        type ExpectedOkData = "world";
        type ExpectedRunErrError =
          | SafeFnDefaultCatchHandlerErr["error"]
          | {
              code: "INPUT_PARSING";
              cause: z.ZodError<SchemaTransformedInput>;
            }
          | {
              code: "INPUT_PARSING";
              cause: z.ZodError<ChildSchemaInput>;
            };

        type ExpectedActionErrError =
          | SafeFnDefaultCatchHandlerErr["error"]
          | {
              code: "INPUT_PARSING";
              cause: {
                formattedError: z.ZodFormattedError<SchemaTransformedInput>;
                flattenedError: z.typeToFlattenedError<
                  SchemaTransformedInput,
                  string
                >;
              };
            }
          | {
              code: "INPUT_PARSING";
              cause: {
                formattedError: z.ZodFormattedError<ChildSchemaInput>;
                flattenedError: z.typeToFlattenedError<
                  ChildSchemaInput,
                  string
                >;
              };
            };

        type ExpectedArgs =
          | {
              asAction: boolean;
              unsafeRawInput: ExpectedUnsafeRawInput;
              input: ExpectedInput;
              ctx: ExpectedCtx;
              result: Ok<ExpectedOkData, never>;
            }
          | {
              asAction: true;
              unsafeRawInput: ExpectedUnsafeRawInput;
              input: ExpectedInput | undefined;
              ctx: ExpectedCtx | undefined;
              result: Err<never, ExpectedActionErrError>;
            }
          | {
              asAction: false;
              unsafeRawInput: ExpectedUnsafeRawInput;
              input: ExpectedInput | undefined;
              ctx: ExpectedCtx | undefined;
              result: Err<never, ExpectedRunErrError>;
            };
        expectTypeOf<ExpectedArgs>().toMatchTypeOf<OnCompleteArgs>();
      });
    });
  });

  describe("createAction", () => {
    describe("input", () => {
      test("should not require input when none is set", async () => {
        const safeFn = SafeFnBuilder.new();
        const safeFnSync = safeFn
          .handler(() => ok("hello" as const))
          .createAction();
        const safeFnAsync = safeFn
          .handler(async () => ok("hello" as const))
          .createAction();
        const safeFnSafe = safeFn
          .safeHandler(async function* () {
            return ok("hello" as const);
          })
          .createAction();

        expectTypeOf(safeFnSync).parameters.toEqualTypeOf<[]>();
        expectTypeOf(safeFnAsync).parameters.toEqualTypeOf<[]>();
        expectTypeOf(safeFnSafe).parameters.toEqualTypeOf<[]>();
      });

      test("should type input when manually set", async () => {
        const safeFn = SafeFnBuilder.new();
        const safeFnSync = safeFn
          .unparsedInput<{ test: string }>()
          .handler((input) => ok(input))
          .createAction();
        const safeFnAsync = safeFn
          .unparsedInput<{ test: string }>()
          .handler(async (input) => ok(input))
          .createAction();
        const safeFnSafe = safeFn
          .unparsedInput<{ test: string }>()
          .safeHandler(async function* (input) {
            return ok(input);
          })
          .createAction();

        expectTypeOf(safeFnSync).parameters.toEqualTypeOf<[{ test: string }]>();
        expectTypeOf(safeFnAsync).parameters.toEqualTypeOf<
          [{ test: string }]
        >();
        expectTypeOf(safeFnSafe).parameters.toEqualTypeOf<[{ test: string }]>();
      });

      test("should type unparsed input as inputSchema for transformed schemas", async () => {
        const safeFn = SafeFnBuilder.new();
        const safeFnSync = safeFn
          .unparsedInput<{ test: string }>()
          .handler((input) => ok(input))
          .createAction();
      });

      test("should type unparsed input as inputSchema for transformed schemas", async () => {
        const safeFn = SafeFnBuilder.new();
        const safeFnSync = safeFn
          .unparsedInput<{ test: string }>()
          .handler((input) => ok(input))
          .createAction();
        const safeFnAsync = safeFn
          .unparsedInput<{ test: string }>()
          .handler(async (input) => ok(input))
          .createAction();
        const safeFnSafe = safeFn
          .unparsedInput<{ test: string }>()
          .safeHandler(async function* (input) {
            return ok(input);
          })
          .createAction();

        expectTypeOf(safeFnSync).parameters.toEqualTypeOf<[{ test: string }]>();
        expectTypeOf(safeFnAsync).parameters.toEqualTypeOf<
          [{ test: string }]
        >();
        expectTypeOf(safeFnSafe).parameters.toEqualTypeOf<[{ test: string }]>();
      });
    });

    describe("output", () => {
      // Just throwing the kitchen sink here to not make this file any longer
      test("should type proper result", async () => {
        const safeFn = SafeFnBuilder.new()
          .input(schemaTransformed)
          .output(schemaPrimitive);

        const safeActionSync = safeFn
          .handler(() => ok("hello"))
          .catch(() => err("world" as const))
          .createAction();
        const safeActionAsync = safeFn
          .handler(async () => ok("hello"))
          .catch(() => err("world" as const))
          .createAction();
        const safeActionSafe = safeFn
          .safeHandler(async function* () {
            return ok("hello" as const);
          })
          .catch(() => err("world" as const))
          .createAction();
        const safeActionSafeYield = safeFn
          .safeHandler(async function* () {
            yield* err("world2" as const).safeUnwrap();
            return ok("hello");
          })
          .catch(() => err("world" as const))
          .createAction();

        type ExpectedInputParseError = SafeFnInputParseError<
          typeof schemaTransformed,
          true
        >;
        type ExpectedOutputParseError = SafeFnOutputParseError<
          typeof schemaPrimitive,
          true
        >;
        // Type comes from Zod, so const is lost
        type ExpectedOk = string;
        type ExpectedErr = "world";
        type ExpectedErr2 = "world2";

        expectTypeOf(safeActionSync).returns.resolves.toEqualTypeOf<
          ActionResult<
            ExpectedOk,
            ExpectedErr | ExpectedInputParseError | ExpectedOutputParseError
          >
        >();
        expectTypeOf(safeActionAsync).returns.resolves.toEqualTypeOf<
          ActionResult<
            ExpectedOk,
            ExpectedErr | ExpectedInputParseError | ExpectedOutputParseError
          >
        >();
        expectTypeOf(safeActionSafe).returns.resolves.toEqualTypeOf<
          ActionResult<
            ExpectedOk,
            ExpectedErr | ExpectedInputParseError | ExpectedOutputParseError
          >
        >();
        expectTypeOf(safeActionSafeYield).returns.resolves.toEqualTypeOf<
          ActionResult<
            ExpectedOk,
            | ExpectedErr
            | ExpectedErr2
            | ExpectedInputParseError
            | ExpectedOutputParseError
          >
        >();
      });

      test("should merge Err types from parent schemas", async () => {
        const safeFn = SafeFnBuilder.new();
        const parentSync = safeFn
          .input(schemaTransformed)
          .handler(() => ok("hi" as const));
        const parentAsync = safeFn
          .input(schemaTransformed)
          .handler(async () => ok("hi" as const));
        const parentSafe = safeFn
          .input(schemaTransformed)
          .safeHandler(async function* () {
            return ok("hi" as const);
          });

        const safeFnSyncParent = SafeFnBuilder.new(parentSync).handler(() =>
          ok("ok" as const),
        );
        const safeFnAsyncParent = SafeFnBuilder.new(parentAsync).handler(
          async () => ok("ok" as const),
        );
        const safeFnSafeParent = SafeFnBuilder.new(parentSafe).safeHandler(
          async function* () {
            return ok("ok" as const);
          },
        );

        // @ts-expect-error - input is not compatible
        const resSync = await safeFnSyncParent.createAction()();
        // @ts-expect-error - input is not compatible
        const resAsync = await safeFnAsyncParent.createAction()();
        // @ts-expect-error - input is not compatible
        const resSafe = await safeFnSafeParent.createAction()();

        assert(!resSync.ok);
        assert(!resAsync.ok);
        assert(!resSafe.ok);

        expectTypeOf(resSync.error).toEqualTypeOf<
          | SafeFnDefaultCatchHandlerErr["error"]
          | {
              code: "INPUT_PARSING";
              cause: {
                formattedError: z.ZodFormattedError<SchemaTransformedInput>;
                flattenedError: z.typeToFlattenedError<
                  SchemaObjectInput,
                  string
                >;
              };
            }
        >();
        expectTypeOf(resAsync.error).toEqualTypeOf<
          | SafeFnDefaultCatchHandlerErr["error"]
          | {
              code: "INPUT_PARSING";
              cause: {
                formattedError: z.ZodFormattedError<SchemaTransformedInput>;
                flattenedError: z.typeToFlattenedError<
                  SchemaObjectInput,
                  string
                >;
              };
            }
        >();
        expectTypeOf(resSafe.error).toEqualTypeOf<
          | SafeFnDefaultCatchHandlerErr["error"]
          | {
              code: "INPUT_PARSING";
              cause: {
                formattedError: z.ZodFormattedError<SchemaTransformedInput>;
                flattenedError: z.typeToFlattenedError<
                  SchemaObjectInput,
                  string
                >;
              };
            }
        >();

        const nestedChild = SafeFnBuilder.new(safeFnSafeParent).handler(() =>
          ok("ok" as const),
        );
        // @ts-expect-error
        const resNestedChildSync = await nestedChild.run();

        assert(resNestedChildSync.isErr());

        expectTypeOf(resNestedChildSync.error).toEqualTypeOf<
          | SafeFnDefaultCatchHandlerErr["error"]
          | {
              code: "INPUT_PARSING";
              cause: z.ZodError<SchemaTransformedInput>;
            }
        >();
      });
    });
  });
});
