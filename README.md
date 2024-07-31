# Safe Fn

Personal project and highly WIP.

A way to write typesafe, error as value functions. Aimed to be used at the boundary of your application (like in a server action).

## TODO

- Chaining safe functions
- Callbacks
- Hooks to use on front end
- Look into type performance
- Actually publish this lol

## Why

This started as me abusing zod's `z.function()` to discovering existing solutions like `next-safe-action` and `zsa` and not being fully satisfied.

### Errors as values

This library enforces the classic `Result<TData, TError>` like type. This makes it possible to have errors completely type safe and handle them as you desire later on in your application. This is opposed to throwing them, where you can not tell what errors (or values really as you can throw anything) will be thrown by a function without looking at the implementation.

### Extendable

Functions can be extended after they're written, making it possible to add platform specific features to a function later on. For example

```ts
//some-shared-module/user.ts
export const createUser = SafeFn.new()
  .input(
    z.object({
      name: z.string(),
      email: z.string(),
    }),
  )
  .output(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string(),
    }),
  )
  .action(async (input) => {
    try {
      const user = await db.user.insert(input.parsedInput);
      return Ok(user);
    } catch (error) {
      if (error instanceof DbError) {
        if (error.code === "UNIQUE_CONSTRAINT") {
          return Err({
            code: "DUPLICATE_USER",
            message: "User already exists",
          });
        }
      }

      return Err({
        code: "INTERNAL_ERROR",
        message: "Something went wrong",
      });
    }
  });

//In Next  app/.../some-route/user.ts
("use server");
const createUserAction = createUser.onSuccess((data) => {
  revalidatePath(`/user/${data.id}`);
}).run;
```

## Usage

```ts
const safeFn = SafeFn.new()
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
  .error((error) => {
    return Err({
      code: "CAUGHT_ERROR",
      cause,
    });
  })
  .action(async ({ parsedInput }) => {
    const isProfane = await isProfaneName(parsedInput.firstName);
    if (isProfane) {
      return Err({
        code: "PROFANE_NAME",
        message: "Name is profane",
      });
    }

    const fullName = `${parsedInput.firstName} ${parsedInput.lastName}`;
    return Ok({ fullName });
  });
```

can either return

```ts
{
  success: true,
  data: {
    fullName: "John Doe"
  }
}
```

or return an error (with success: false). This error is typed as a union of `SafeFnInputParseError`, `SafeFnOutputParseError`, and the error types returned by the action function and the thrown handler.
In this case this results in `error.code` being one of `"CAUGHT_ERROR"`, `"PROFANE_NAME"`, `"INPUT_PARSING"`, `"OUTPUT_PARSING"`.
