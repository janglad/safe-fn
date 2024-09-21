import { err, ok, type Result } from "neverthrow";
import { assert, describe, expectTypeOf, test } from "vitest";
import { z } from "zod";
import { type ActionResult } from "./result";
import { createSafeFn } from "./safe-fn-builder";
import type { TSafeFnDefaultCatchHandlerErrError } from "./types/catch-handler";
import type {
  TSafeFnInputParseError,
  TSafeFnOutputParseError,
} from "./types/schema";
import type { TPrettify } from "./types/util";

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
  describe("use", () => {
    test("should not allow chaining when parent can not return ok", () => {
      const parent = createSafeFn().handler(() => err("test"));
      // @ts-expect-error
      const child = createSafeFn().use(parent);
    });
  });
  describe("handler", () => {
    const safeFnPrimitiveInput = createSafeFn().input(schemaPrimitive);
    const safeFnObjectInput = createSafeFn().input(schemaObject);
    const safeFnTransformedInput = createSafeFn().input(schemaTransformed);
    const safeFnNoInput = createSafeFn();
    const safeFnUnparsedInput = createSafeFn().unparsedInput<{
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

      test("should type parsedInput as undefined and unparsedInput as undefined  when no input schema is provided", () => {
        safeFnNoInput.handler((input) => {
          expectTypeOf(input.unsafeRawInput).toEqualTypeOf<undefined>();
          expectTypeOf(input.input).toEqualTypeOf<undefined>();
          return ok(input);
        });

        safeFnNoInput.handler(async (input) => {
          expectTypeOf(input.unsafeRawInput).toEqualTypeOf<undefined>();
          expectTypeOf(input.input).toEqualTypeOf<undefined>();
          return ok(input);
        });

        safeFnNoInput.safeHandler(async function* (input) {
          expectTypeOf(input.unsafeRawInput).toEqualTypeOf<undefined>();
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

      test("should merge unparsed and type array of parsed input when parent and child have input schema with transforms", () => {
        const input2 = z.object({
          new: z.string(),
          properties: z.array(z.number()),
        });

        const input3 = z.object({
          new2: z.string(),
          properties2: z.array(z.number()),
        });

        const parent = safeFnTransformedInput.handler(() => ok(""));

        const child = createSafeFn()
          .use(parent)
          .handler(() => ok(""));
        const child2 = createSafeFn()
          .use(child)
          .input(input2)
          .handler(() => ok(""));
        const child3 = createSafeFn().use(child2).input(input3);

        type ExpectedUnparsedInput = TPrettify<
          SchemaTransformedInput &
            z.input<typeof input2> &
            z.input<typeof input3>
        >;
        type ExpectedParsedInput = z.input<typeof input3>;

        type ExpectedCtxInput = [
          SchemaTransformedOutput,
          undefined,
          z.input<typeof input2>,
        ];

        child3.handler((args) => {
          expectTypeOf(
            args.unsafeRawInput,
          ).toEqualTypeOf<ExpectedUnparsedInput>();
          expectTypeOf(args.input).toEqualTypeOf<ExpectedParsedInput>();
          expectTypeOf(args.ctxInput).toEqualTypeOf<ExpectedCtxInput>();
          return ok(args);
        });

        child3.handler(async (args) => {
          expectTypeOf(
            args.unsafeRawInput,
          ).toEqualTypeOf<ExpectedUnparsedInput>();
          expectTypeOf(args.input).toEqualTypeOf<ExpectedParsedInput>();
          expectTypeOf(args.ctxInput).toEqualTypeOf<ExpectedCtxInput>();
          return ok(args);
        });

        child3.safeHandler(async function* (args) {
          expectTypeOf(
            args.unsafeRawInput,
          ).toEqualTypeOf<ExpectedUnparsedInput>();
          expectTypeOf(args.input).toEqualTypeOf<ExpectedParsedInput>();
          expectTypeOf(args.ctxInput).toEqualTypeOf<ExpectedCtxInput>();
          return ok(args);
        });
      });

      test("should merge unparsedInput and type parsedInput from child when parent ha no input schema but defines unparsed", () => {
        const parent = createSafeFn()
          .unparsedInput<{
            new: string;
            properties: number[];
          }>()
          .handler(() => ok(""));

        const child = createSafeFn().use(parent).input(schemaTransformed);

        type ExpectedUnparsedInput = TPrettify<
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
        const parent = createSafeFn()
          .unparsedInput<{
            new: string;
            properties: number[];
          }>()
          .handler(() => ok(""));

        const child = createSafeFn().use(parent).unparsedInput<{
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

      test("should type unparsedInput as undefined and parsedInput as undefined when no input schema is provided", () => {
        const parent = createSafeFn().handler(() => ok(""));
        const child = createSafeFn().use(parent);

        type ExpectedUnparsedInput = undefined;
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
      test("should type value as undefined when no parent is provided", () => {
        const safeFn = createSafeFn();

        safeFn.handler((args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<undefined>();
          return ok(args);
        });

        safeFn.handler(async (args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<undefined>();
          return ok(args);
        });

        safeFn.safeHandler(async function* (args) {
          expectTypeOf(args.ctx).toEqualTypeOf<undefined>();
          return ok(args);
        });
      });

      describe("should type value when parent has primitive output schema", () => {
        const syncParent = createSafeFn()
          .output(schemaPrimitive)
          .handler(() => ok("hello"));
        const asyncParent = createSafeFn()
          .output(schemaPrimitive)
          .handler(async () => ok("hello"));
        const safeParent = createSafeFn()
          .output(schemaPrimitive)
          .safeHandler(async function* () {
            return ok("hello");
          });

        const safeFnSyncParent = createSafeFn().use(syncParent);
        safeFnSyncParent.handler((args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaPrimitiveOutput>();
          return ok(args);
        });

        safeFnSyncParent.handler(async (args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaPrimitiveOutput>();
          return ok(args);
        });

        safeFnSyncParent.safeHandler(async function* (args) {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaPrimitiveOutput>();
          return ok(args);
        });

        const safeFnAsyncParent = createSafeFn().use(asyncParent);
        safeFnAsyncParent.handler((args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaPrimitiveOutput>();
          return ok(args);
        });

        safeFnAsyncParent.handler(async (args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaPrimitiveOutput>();
          return ok(args);
        });

        const safeFnSafeParent = createSafeFn().use(safeParent);
        safeFnSafeParent.handler((args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaPrimitiveOutput>();
          return ok(args);
        });

        safeFnSafeParent.handler(async (args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaPrimitiveOutput>();
          return ok(args);
        });

        safeFnSafeParent.safeHandler(async function* (args) {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaPrimitiveOutput>();
          return ok(args);
        });
      });

      describe("should type value when parent has object output schema", () => {
        const syncParent = createSafeFn()
          .output(schemaObject)
          .handler(() => ok({ test: "hello", nested: { value: 1 } }));
        const asyncParent = createSafeFn()
          .output(schemaObject)
          .handler(async () => ok({ test: "hello", nested: { value: 1 } }));
        const safeParent = createSafeFn()
          .output(schemaObject)
          .safeHandler(async function* () {
            return ok({ test: "hello", nested: { value: 1 } });
          });

        const safeFnSyncParent = createSafeFn().use(syncParent);
        safeFnSyncParent.handler((args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaObjectOutput>();
          return ok(args);
        });

        safeFnSyncParent.handler(async (args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaObjectOutput>();
          return ok(args);
        });

        safeFnSyncParent.safeHandler(async function* (args) {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaObjectOutput>();
          return ok(args);
        });

        const safeFnAsyncParent = createSafeFn().use(asyncParent);
        safeFnAsyncParent.handler((args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaObjectOutput>();
          return ok(args);
        });

        safeFnAsyncParent.handler(async (args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaObjectOutput>();
          return ok(args);
        });
        safeFnAsyncParent.safeHandler(async function* (args) {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaObjectOutput>();
          return ok(args);
        });

        const safeFnSafeParent = createSafeFn().use(safeParent);
        safeFnSafeParent.handler((args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaObjectOutput>();
          return ok(args);
        });

        safeFnSafeParent.handler(async (args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaObjectOutput>();
          return ok(args);
        });

        safeFnSafeParent.safeHandler(async function* (args) {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaObjectOutput>();
          return ok(args);
        });
      });

      describe("should properly type value when parent has transformed output schema", () => {
        const syncParent = createSafeFn()
          .output(schemaTransformed)
          .handler(() => ok({ test: "hello", nested: { value: 1 } }));
        const asyncParent = createSafeFn()
          .output(schemaTransformed)
          .handler(async () => ok({ test: "hello", nested: { value: 1 } }));
        const safeParent = createSafeFn()
          .output(schemaTransformed)
          .safeHandler(async function* () {
            return ok({ test: "hello", nested: { value: 1 } });
          });

        const safeFnSyncParent = createSafeFn().use(syncParent);
        safeFnSyncParent.handler((args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaTransformedOutput>();
          return ok(args);
        });

        safeFnSyncParent.handler(async (args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaTransformedOutput>();
          return ok(args);
        });

        safeFnSyncParent.safeHandler(async function* (args) {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaTransformedOutput>();
          return ok(args);
        });

        const safeFnAsyncParent = createSafeFn().use(asyncParent);
        safeFnAsyncParent.handler((args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaTransformedOutput>();
          return ok(args);
        });

        safeFnAsyncParent.handler(async (args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaTransformedOutput>();
          return ok(args);
        });
        safeFnAsyncParent.safeHandler(async function* (args) {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaTransformedOutput>();
          return ok(args);
        });

        const safeFnSafeParent = createSafeFn().use(safeParent);
        safeFnSafeParent.handler((args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaTransformedOutput>();
          return ok(args);
        });

        safeFnSafeParent.handler(async (args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaTransformedOutput>();
          return ok(args);
        });

        safeFnSafeParent.safeHandler(async function* (args) {
          expectTypeOf(args.ctx).toEqualTypeOf<SchemaTransformedOutput>();
          return ok(args);
        });
      });

      describe("should properly type value when parent output is inferred", () => {
        const expectedOutput = ok("hello" as const);
        type ExpectedCtx = "hello";

        const syncParent = createSafeFn().handler(() => expectedOutput);
        const asyncParent = createSafeFn().handler(async () => expectedOutput);
        const safeParent = createSafeFn().safeHandler(async function* () {
          return expectedOutput;
        });

        const safeFnSyncParent = createSafeFn().use(syncParent);
        safeFnSyncParent.handler((args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<ExpectedCtx>();
          return ok(args);
        });
        safeFnSyncParent.handler(async (args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<ExpectedCtx>();
          return ok(args);
        });
        safeFnSyncParent.safeHandler(async function* (args) {
          expectTypeOf(args.ctx).toEqualTypeOf<ExpectedCtx>();
          return ok(args);
        });

        const safeFnAsyncParent = createSafeFn().use(asyncParent);
        safeFnAsyncParent.handler((args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<ExpectedCtx>();
          return ok(args);
        });
        safeFnAsyncParent.handler(async (args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<ExpectedCtx>();
          return ok(args);
        });
        safeFnAsyncParent.safeHandler(async function* (args) {
          expectTypeOf(args.ctx).toEqualTypeOf<ExpectedCtx>();
          return ok(args);
        });

        const safeFnSafeParent = createSafeFn().use(safeParent);
        safeFnSafeParent.handler((args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<ExpectedCtx>();
          return ok(args);
        });

        safeFnSafeParent.handler(async (args) => {
          expectTypeOf(args.ctx).toEqualTypeOf<ExpectedCtx>();
          return ok(args);
        });
        safeFnSafeParent.safeHandler(async function* (args) {
          expectTypeOf(args.ctx).toEqualTypeOf<ExpectedCtx>();
          return ok(args);
        });
      });
    });
  });
});

describe("runnableSafeFn", () => {
  describe("run", () => {
    describe("input", () => {
      test("should not require input when none is set", async () => {
        const safeFn = createSafeFn();
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
        const parent = createSafeFn()
          .input(schemaTransformed)
          .handler(() => ok("hello" as const));
        const child = createSafeFn()
          .use(parent)
          .handler(() => ok("hello" as const));

        expectTypeOf(child.run).parameters.toEqualTypeOf<
          [SchemaTransformedInput]
        >();
      });
    });

    describe("output", () => {
      test("should type OK as output schema when output schema is provided", async () => {
        const safeFn = createSafeFn().output(schemaTransformed);
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
        const safeFn = createSafeFn();
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
        const safeFn = createSafeFn();
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

        expectTypeOf(
          resultSync.error,
        ).toEqualTypeOf<TSafeFnDefaultCatchHandlerErrError>();
        expectTypeOf(
          resultAsync.error,
        ).toEqualTypeOf<TSafeFnDefaultCatchHandlerErrError>();
        expectTypeOf(
          resultSafe.error,
        ).toEqualTypeOf<TSafeFnDefaultCatchHandlerErrError>();
      });

      test("should type Err as custom when catch handler is provided", async () => {
        const safeFn = createSafeFn();
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
        const safeFn = createSafeFn();
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
          "hello" | TSafeFnDefaultCatchHandlerErrError
        >();
        expectTypeOf(resultAsync.error).toEqualTypeOf<
          "hello" | TSafeFnDefaultCatchHandlerErrError
        >();
        expectTypeOf(resultSafe.error).toEqualTypeOf<
          "hello" | TSafeFnDefaultCatchHandlerErrError
        >();
      });

      test("should merge errors when both returned and has custom handler", async () => {
        const safeFn = createSafeFn();
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

      test("should correctly type when handler can return either Err or Ok", async () => {
        const safeFn = createSafeFn();

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
          "world" | TSafeFnDefaultCatchHandlerErrError
        >;

        expectTypeOf(resultSync).toEqualTypeOf<ExpectedResult>();
        expectTypeOf(resultAsync).toEqualTypeOf<ExpectedResult>();
        expectTypeOf(resultSafe).toEqualTypeOf<ExpectedResult>();
        expectTypeOf(resultSafeYield).toEqualTypeOf<ExpectedResult>();
      });

      test("should merge Err types from parent handler and catch handler", async () => {
        const safeFn = createSafeFn();
        const parentSync = safeFn
          .handler(() => {
            let bool = true;
            if (bool) {
              return err("hello" as const);
            }
            return ok("world" as const);
          })
          .catch(() => err("world" as const));
        const parentAsync = safeFn
          .handler(async () => {
            let bool = true;
            if (bool) {
              return err("hello" as const);
            }
            return ok("world" as const);
          })
          .catch(() => err("world" as const));
        const parentSafe = safeFn
          .safeHandler(async function* () {
            let bool = true;
            if (bool) {
              return err("hello" as const);
            }
            return ok("world" as const);
          })
          .catch(() => err("world" as const));

        const safeFnSyncParentSync = createSafeFn()
          .use(parentSync)
          .handler(() => ok("ok" as const));
        const safeFnAsyncParentSync = createSafeFn()
          .use(parentAsync)
          .handler(async () => ok("ok" as const));
        const safeFnSafeParentSync = createSafeFn()
          .use(parentSafe)
          .safeHandler(async function* () {
            return ok("ok" as const);
          });

        const resSync = await safeFnSyncParentSync.run();
        const resAsync = await safeFnAsyncParentSync.run();
        const resSafe = await safeFnSafeParentSync.run();

        assert(resSync.isErr());
        assert(resAsync.isErr());
        assert(resSafe.isErr());

        expectTypeOf(resSync.error).toEqualTypeOf<
          "hello" | "world" | TSafeFnDefaultCatchHandlerErrError
        >();
        expectTypeOf(resAsync.error).toEqualTypeOf<
          "hello" | "world" | TSafeFnDefaultCatchHandlerErrError
        >();
        expectTypeOf(resSafe.error).toEqualTypeOf<
          "hello" | "world" | TSafeFnDefaultCatchHandlerErrError
        >();
      });

      test("should merge Err types from parent schemas", async () => {
        const safeFn = createSafeFn();
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

        const safeFnSyncParent = createSafeFn()
          .use(parentSync)
          .handler(() => ok("ok" as const));
        const safeFnAsyncParent = createSafeFn()
          .use(parentAsync)
          .handler(async () => ok("ok" as const));
        const safeFnSafeParent = createSafeFn()
          .use(parentSafe)
          .safeHandler(async function* () {
            return ok("ok" as const);
          });

        // @ts-expect-error - input is not compatible
        const resSync = await safeFnSyncParent.run();
        // @ts-expect-error - input is not compatible
        const resAsync = await safeFnAsyncParent.run();
        // @ts-expect-error - input is not compatible
        const resSafe = await safeFnSafeParent.run();

        assert(!resSync.isOk());
        assert(!resAsync.isOk());
        assert(!resSafe.isOk());

        resAsync.error.code;

        expectTypeOf(resSync.error).toEqualTypeOf<
          | TSafeFnDefaultCatchHandlerErrError
          | {
              code: "INPUT_PARSING";
              cause: z.ZodError<SchemaTransformedInput>;
            }
        >();
        expectTypeOf(resAsync.error).toEqualTypeOf<
          | TSafeFnDefaultCatchHandlerErrError
          | {
              code: "INPUT_PARSING";
              cause: z.ZodError<SchemaTransformedInput>;
            }
        >();
        expectTypeOf(resSafe.error).toEqualTypeOf<
          | TSafeFnDefaultCatchHandlerErrError
          | {
              code: "INPUT_PARSING";
              cause: z.ZodError<SchemaTransformedInput>;
            }
        >();

        const nestedChild = createSafeFn()
          .use(safeFnSafeParent)
          .handler(() => ok("ok" as const));
        // @ts-expect-error
        const resNestedChildSync = await nestedChild.run();

        assert(resNestedChildSync.isErr());

        expectTypeOf(resNestedChildSync.error).toEqualTypeOf<
          | TSafeFnDefaultCatchHandlerErrError
          | {
              code: "INPUT_PARSING";
              cause: z.ZodError<SchemaTransformedInput>;
            }
        >();
      });
    });

    describe("callbacks", () => {
      const safeFn = createSafeFn()
        .input(schemaTransformed)
        .handler(() => ok("hello" as const));
      const childSchema = z.object({ child: z.string() });
      type ChildSchemaInput = z.input<typeof childSchema>;
      const child = createSafeFn()
        .use(safeFn)
        .input(childSchema)
        .handler(() => ok("world" as const));

      test("onStart", () => {
        type OnStartArgs = Parameters<Parameters<typeof child.onStart>[0]>[0];

        type ExpectedUnsafeRawInput = TPrettify<
          SchemaTransformedInput & { child: string }
        >;

        type ExpectedArgs = TPrettify<{
          unsafeRawInput: ExpectedUnsafeRawInput;
        }>;

        expectTypeOf<OnStartArgs>().toEqualTypeOf<ExpectedArgs>();
      });

      test("onError", () => {
        type OnErrorArgs = Parameters<Parameters<typeof child.onError>[0]>[0];

        type UnsafeRawInput = TPrettify<
          SchemaTransformedInput & { child: string }
        >;

        type ExpectedInput = { child: string } | undefined;
        type ExpectedCtx = "hello" | undefined;
        type ExpectedCtxInput = [SchemaTransformedOutput] | undefined;
        type ExpectedRunErrError =
          | TSafeFnDefaultCatchHandlerErrError
          | {
              code: "INPUT_PARSING";
              cause: z.ZodError<
                TPrettify<SchemaTransformedInput & ChildSchemaInput>
              >;
            };

        type ExpectedActionErrError =
          | TSafeFnDefaultCatchHandlerErrError
          | {
              code: "INPUT_PARSING";
              cause: {
                formattedError: z.ZodFormattedError<
                  TPrettify<SchemaTransformedInput & ChildSchemaInput>
                >;
                flattenedError: z.typeToFlattenedError<
                  TPrettify<SchemaTransformedInput & ChildSchemaInput>,
                  string
                >;
              };
            };
        type ExpectedArgs = TPrettify<
          | {
              asAction: true;
              error: ExpectedActionErrError;
              input: ExpectedInput;
              ctx: ExpectedCtx;
              ctxInput: ExpectedCtxInput;
              unsafeRawInput: UnsafeRawInput;
            }
          | {
              asAction: false;
              error: ExpectedRunErrError;
              input: ExpectedInput;
              ctx: ExpectedCtx;
              ctxInput: ExpectedCtxInput;
              unsafeRawInput: UnsafeRawInput;
            }
        >;

        expectTypeOf<OnErrorArgs>().toEqualTypeOf<ExpectedArgs>();
      });

      test("onSuccess", () => {
        type OnSuccessArgs = Parameters<
          Parameters<typeof child.onSuccess>[0]
        >[0];

        type ExpectedUnsafeRawInput = TPrettify<
          SchemaTransformedInput & { child: string }
        >;
        type ExpectedInput = { child: string };
        type ExpectedCtx = "hello" | undefined;
        type ExpectedCtxInput = [SchemaTransformedOutput] | undefined;
        type ExpectedOkData = "world";

        type ExpectedArgs = TPrettify<{
          unsafeRawInput: ExpectedUnsafeRawInput;
          input: ExpectedInput;
          ctx: ExpectedCtx;
          ctxInput: ExpectedCtxInput;
          value: ExpectedOkData;
        }>;

        expectTypeOf<OnSuccessArgs>().toMatchTypeOf<ExpectedArgs>();
      });

      test("onComplete", () => {
        type OnCompleteArgs = Parameters<
          Parameters<typeof child.onComplete>[0]
        >[0];

        type ExpectedUnsafeRawInput = TPrettify<
          SchemaTransformedInput & { child: string }
        >;
        type ExpectedInput = { child: string };
        type ExpectedCtx = "hello";
        type ExpectedCtxInput = [SchemaTransformedOutput];
        type ExpectedOkData = "world";
        type ExpectedRunErrError =
          | TSafeFnDefaultCatchHandlerErrError
          | {
              code: "INPUT_PARSING";
              cause: z.ZodError<
                TPrettify<SchemaTransformedInput & ChildSchemaInput>
              >;
            };

        type ExpectedActionErrError =
          | TSafeFnDefaultCatchHandlerErrError
          | {
              code: "INPUT_PARSING";
              cause: {
                formattedError: z.ZodFormattedError<
                  TPrettify<SchemaTransformedInput & ChildSchemaInput>
                >;
                flattenedError: z.typeToFlattenedError<
                  TPrettify<SchemaTransformedInput & ChildSchemaInput>,
                  string
                >;
              };
            };

        type ExpectedArgs = TPrettify<
          | {
              asAction: boolean;
              unsafeRawInput: ExpectedUnsafeRawInput;
              input: ExpectedInput;
              ctx: ExpectedCtx;
              ctxInput: ExpectedCtxInput;
              result: Result<ExpectedOkData, never>;
            }
          | {
              asAction: true;
              unsafeRawInput: ExpectedUnsafeRawInput;
              input: ExpectedInput | undefined;
              ctx: ExpectedCtx | undefined;
              ctxInput: ExpectedCtxInput | undefined;
              result: Result<never, ExpectedActionErrError>;
            }
          | {
              asAction: false;
              unsafeRawInput: ExpectedUnsafeRawInput;
              input: ExpectedInput | undefined;
              ctx: ExpectedCtx | undefined;
              ctxInput: ExpectedCtxInput | undefined;
              result: Result<never, ExpectedRunErrError>;
            }
        >;
        expectTypeOf<ExpectedArgs>().toEqualTypeOf<OnCompleteArgs>();
      });
    });
  });

  describe("createAction", () => {
    describe("input", () => {
      test("should not require input when none is set", async () => {
        const safeFn = createSafeFn();
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
        const safeFn = createSafeFn();
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
        const safeFn = createSafeFn();
        const safeFnSync = safeFn
          .unparsedInput<{ test: string }>()
          .handler((input) => ok(input))
          .createAction();
      });

      test("should type unparsed input as inputSchema for transformed schemas", async () => {
        const safeFn = createSafeFn();
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
        const safeFn = createSafeFn()
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

        type ExpectedInputParseError = TSafeFnInputParseError<
          typeof schemaTransformed,
          true
        >;
        type ExpectedOutputParseError = TSafeFnOutputParseError<
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
        const safeFn = createSafeFn();
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

        const safeFnSyncParent = createSafeFn()
          .use(parentSync)
          .handler(() => ok("ok" as const));
        const safeFnAsyncParent = createSafeFn()
          .use(parentAsync)
          .handler(async () => ok("ok" as const));
        const safeFnSafeParent = createSafeFn()
          .use(parentSafe)
          .safeHandler(async function* () {
            return ok("ok" as const);
          });

        // @ts-expect-error - input is not compatible
        const resSync = await safeFnSyncParent.createAction()();
        // @ts-expect-error - input is not compatible
        const resAsync = await safeFnAsyncParent.createAction()();
        // @ts-expect-error - input is not compatible
        const resSafe = await safeFnSafeParent.createAction()();

        const testAction = safeFnSyncParent.createAction();

        assert(!resSync.ok);
        assert(!resAsync.ok);
        assert(!resSafe.ok);

        expectTypeOf(resSync.error).toEqualTypeOf<
          | TSafeFnDefaultCatchHandlerErrError
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
          | TSafeFnDefaultCatchHandlerErrError
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
          | TSafeFnDefaultCatchHandlerErrError
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

        const nestedChild = createSafeFn()
          .use(safeFnSafeParent)
          .handler(() => ok("ok" as const));
        // @ts-expect-error
        const resNestedChildSync = await nestedChild.run();

        assert(resNestedChildSync.isErr());

        expectTypeOf(resNestedChildSync.error).toEqualTypeOf<
          | TSafeFnDefaultCatchHandlerErrError
          | {
              code: "INPUT_PARSING";
              cause: z.ZodError<SchemaTransformedInput>;
            }
        >();
      });
    });
  });
});

const test1 = createSafeFn()
  .input(
    z.object({
      one: z.string(),
    }),
  )
  .output(
    z.object({
      one: z.string(),
    }),
  )
  .handler(() =>
    ok({
      one: "1",
    }),
  );

const schema = z.object({
  test: z.string(),
});

const test2 = createSafeFn()
  .use(test1)
  .input(
    z.object({
      two: z.string(),
    }),
  )
  .output(
    z.object({
      two: z.string(),
    }),
  )
  .handler(() =>
    ok({
      two: "2",
    }),
  );

const test3 = createSafeFn()
  .use(test2)
  .input(
    z.object({
      three: z.string(),
    }),
  )
  .output(
    z.object({
      three: z.string(),
    }),
  )
  .handler(() =>
    ok({
      three: "3",
    }),
  );

const test4 = createSafeFn()
  .use(test3)
  .input(
    z.object({
      four: z.string(),
    }),
  )
  .output(
    z.object({
      four: z.string(),
    }),
  )
  .handler(() =>
    ok({
      four: "4",
    }),
  );
