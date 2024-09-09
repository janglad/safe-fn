import { ok } from "neverthrow";
import { SafeFn as SafeFnBuilder } from "safe-fn";
import { z } from "zod";

// Just random stuff

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

const superComplexSchema = z
  .object({
    id: z.string().uuid(),
    createdAt: z.date(),
    updatedAt: z.date().optional(),
    name: z.string().min(1).max(100),
    email: z.string().email(),
    age: z.number().int().positive().max(150),
    isActive: z.boolean(),
    tags: z.array(z.string()).min(1).max(10),
    preferences: z.object({
      theme: z.enum(["light", "dark", "system"]),
      notifications: z.boolean(),
      language: z.string().refine((val) => /^[a-z]{2}-[A-Z]{2}$/.test(val), {
        message: "Invalid language format. Should be like 'en-US'",
      }),
    }),
    address: z
      .object({
        street: z.string(),
        city: z.string(),
        country: z.string(),
        postalCode: z.string().regex(/^\d{5}(-\d{4})?$/),
      })
      .nullable(),
    phoneNumbers: z.array(z.string().regex(/^\+?[1-9]\d{1,14}$/)).min(1),
    education: z.array(
      z.object({
        degree: z.string(),
        institution: z.string(),
        graduationYear: z
          .number()
          .int()
          .min(1900)
          .max(new Date().getFullYear()),
      }),
    ),
    socialMedia: z.record(z.string().url()),
    customFields: z.record(z.union([z.string(), z.number(), z.boolean()])),
    secretKey: z
      .string()
      .transform((val) => Buffer.from(val).toString("base64")),
    complexCalculation: z
      .number()
      .transform((val) => Math.pow(val, 2) + Math.sqrt(val)),
    nestedArray: z
      .array(
        z.array(
          z.object({
            key: z.string(),
            value: z.number(),
          }),
        ),
      )
      .nonempty(),
    union: z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.null(),
      z.object({
        type: z.literal("custom"),
        data: z.any(),
      }),
    ]),
    intersection: z.intersection(
      z.object({ a: z.string() }),
      z.object({ b: z.number() }),
    ),
    conditionalField: z.discriminatedUnion("type", [
      z.object({ type: z.literal("a"), value: z.string() }),
      z.object({ type: z.literal("b"), value: z.number() }),
    ]),
  })
  .strict();

const complex = SafeFnBuilder.new()
  .input(superComplexSchema)
  .handler((args) => {
    return ok(args.input);
  });

const schemaTransformed = z
  .object({
    test1: z.string(),
    nested1: z.object({
      value1: z.number(),
    }),
  })
  .transform(({ test1 }) => ({ test1, newProperty: "test" }));
type SchemaTransformedInput = z.input<typeof schemaTransformed>;
type SchemaTransformedOutput = z.output<typeof schemaTransformed>;

const safeFn1 = SafeFnBuilder.new()
  .input(schemaObject)
  .handler((args) => {
    return ok("SafeFn1" as const);
  });

const safeFn2 = SafeFnBuilder.new(safeFn1)
  .input(z.object({ prop1: z.string() }))
  .handler(async (args) => {
    return ok(`${args.ctx} called by SafeFn2` as const);
  });

const safeFn3 = SafeFnBuilder.new(safeFn2)
  .input(
    z.object({
      nested2: z.object({
        withNested: z.string(),
      }),
    }),
  )
  .handler(async (args) => {
    return ok(`${args.ctx} called by SafeFn3`);
  });

const safeFn4 = SafeFnBuilder.new(safeFn3).handler(async (args) => {
  return ok(`${args.ctx} called by SafeFn4`);
});

const safeFn5 = SafeFnBuilder.new(safeFn4)
  .input(
    z.object({
      prop1: z.string(),
      prop2: z.string(),
      prop3: z.string(),
      prop4: z.string(),
      prop5: z.string(),
      prop6: z.string(),
      prop7: z.string(),
    }),
  )
  .handler(async (args) => {
    return ok(`${args.ctx} called by SafeFn5`);
  });
