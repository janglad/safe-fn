# SafeFn

SafeFn is a library to easily build **fully** typed functions with validated input and output, procedure chaining, callbacks and more. This is ideal for functions that are at the edge of your applications, like Server Actions!

## Why

Existing solutions like [ZSA](https://github.com/IdoPesok/zsa) and [Next-Safe-Action](https://github.com/TheEdoRan/next-safe-action) are great, but often fall short when it comes to handling errors. SafeFn integrated [NeverThrow](https://github.com/supermacro/neverthrow) to enable typed errors (check out Matt Pocock's [Twitter thread](https://x.com/mattpocockuk/status/1825552684994457946) for a quick intro if you're not familiar).

While it's possible to almost completely ignore Neverthrow to incrementally adopt it as the only requirement is that your handler functions return a `Result`, this library really shines when used in conjunction with it. `safeHandler()` builds on Neverthrow's `safeTry()` and allows for ergonomic "return early if error" handling, similar to how throwing would work but with full type safety!.

It also provides a React library to easily call these server actions while taking care of transitions, pending states etc.

**Personal project and still WIP.**

## Documentation

The docs [can be found here](https://safe-fn.dev).

## Quick example

Take the simple case of a function that creates a todo for a user (very original I know).
We first need to make sure the user is signed in, then validate the input of the todo, store it in the database if it's valid and then return it.

All of this needs to be done while taking care of errors that might occur in any of these steps.

```ts
const withAuth = createSafeFn().handler(async () => {
  const user = await auth.getSignedInUser();
  if (!user) {
    return err({
      code: "NOT_AUTHORIZED",
    });
  }
  return ok(user);
});
const createTodo = createSafeFn()
  .use(withAuth)
  .input(
    z.object({
      title: z.string().min(2),
      description: z.string().min(2),
    }),
  )
  .handler(async (args) => {
    const user = args.ctx;
    const todo = await db.todo.create({
      title: args.input.title,
      description: args.input.description,
      userId: user.id,
    });
    return ok(todo);
  });
```

Considering both of these functions can throw we should probably add some error handling as such:

```ts
const withAuth = SafeFn.new()
  ...
  .catch((e) => {
    return err({
      code: "AUTH_ERROR",
    });
  });

const createTodo = SafeFn.new(withAuth)
  ...
  .catch((e) => {
    return err({
      code: "DB_ERROR",
    });
  });
```

This results in a fully typed function with the following return type:

```ts
type res = ResultAsync<
  {
    id: string;
    title: string;
    description: string;
  },
  | {
      code: "DB_ERROR";
    }
  | { code: "AUTH_ERROR" }
  | { code: "NOT_AUTHORIZED" }
  | {
      code: "INPUT_PARSING";
      cause: {
        formattedError: z.ZodFormattedError<{
          title: string;
          description: string;
        }>;
        flattenedError: z.ZodFlattenedError<{
          title: string;
          description: string;
        }>;
      };
    }
>;
```

we can easily call this function using the `run()` method:

```ts
const res = await createTodo({...})

if (res.isOk()){
  ...
} else if (res.isErr()){
  if (res.error.code === "AUTH_ERROR"){
    ...
  }
}
```

or on the client by creating an action and calling it with `useServerAction()`, in this example we're adding a platform specific callback to handle revalidation:

```ts title="server/... .ts"
"use server";

const createTodoAction = createTodo()
  .onSuccess(async (args) => {
    revalidatePath(`/todos/${args.value.id}`);
  })
  .createAction();
```

```tsx title="client/... .tsx"
const { execute, result, isPending } = useServerAction(createTodoAction);
```

However, the magic of the integration of NeverThrow really comes out if your other functions are also returning a `Result` or `ResultAsync`. Instead of passing a regular function via `handler()` you can also use `safeHandler()`.
This builds on Neverthrow's `safeTry()` and takes in a generator function. This generator function receives the same args as `handler()`, but it allows you to `yield *` other results (note that in `Neverthrow` versions before 8.1.0 you need to use `.safeUnwrap()`).
This is meant to emulate Rust's `?` operator and allows a very ergonomic way to write "return early if this fails, otherwise continue" logic.

This function has the same return type as the `handler()` example above.

```ts
const withAuth = createSafeFn().safeHandler(async function* () {
  const user = yield* auth.getSignedInUser();
  return ok(user);
});

const createTodoAction = createSafeFn()
  .use(withAuth)
  .input(
    z.object({
      title: z.string().min(2),
      description: z.string().min(2),
    }),
  )
  .safeHandler(async function* (args) {
    const user = args.ctx;
    const todo = yield* db.todo.create({
      title: args.input.title,
      description: args.input.description,
      userId: user.id,
    });
    return ok(todo);
  });
```
