import { ok } from "neverthrow";
import { createSafeFn } from "safe-fn";
import { z } from "zod";

const safeFn1 = createSafeFn()
  .input(
    z.object({
      firstName: z.string(),
      lastName: z.string(),
    }),
  )
  .output(
    z.object({
      fullName: z.string(),
    }),
  )
  .handler(async (args) => {
    return ok({ fullName: `${args.input.firstName} ${args.input.lastName}` });
  })
  .onStart(async (args) => {
    args.unsafeRawInput.firstName;
  })
  .onComplete(async (args) => {
    args.unsafeRawInput.firstName;
  })
  .onError(async (args) => {
    args.unsafeRawInput.firstName;
  });

const res = safeFn1.run({ firstName: "John", lastName: "Doe" });

const safeFn2 = createSafeFn()
  .use(safeFn1)
  .input(
    z
      .object({
        birthday: z.string(),
      })
      .transform((val) => ({
        birthday: new Date(val.birthday),
      })),
  )
  .output(
    z.object({
      fullName: z.string(),
      age: z.number(),
    }),
  )
  .safeHandler(async function* (args) {
    const age = new Date().getFullYear() - args.input.birthday.getFullYear();
    return ok({ fullName: args.ctxInput[0].firstName, age });
  })
  .onError(async (args) => {});

const res2 = safeFn2.run({
  firstName: "John",
  lastName: "Doe",
  birthday: "1990-01-01",
});
