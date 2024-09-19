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

```ts
"use server";

const withAuth = createSafeFn().handler(async () => {
  const user = await auth.getUser();
  if (!user) {
    return err({
      code: "UNAUTHORIZED",
    });
  }
  return ok(user);
});

const createTodo = createSafeFn()
  .use(withAuth)
  .input(
    z.object({
      title: z.string(),
      description: z.string().min(10),
    }),
  )
  .output(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      description: z.string(),
    }),
  )
  .safeHandler(async function* (args) {
    const user = args.ctx;

    // Assuming createTodo returns a ResultAsync. yield* means that in the case of an Ok result todo gets assigned the value, otherwise the entire function short circuits and returns the error.
    const todo = yield* createTodo({
      title: args.input.title,
      description: args.input.description,
      userId: user.id,
    }).safeUnwrap();

    return ok(todo);
  })
  .onError(async (e) => {
    await logError(e);
  })
  .onSuccess(async (res) => {
    revalidatePath(`/todos/${res.value.id}`);
  });

export const createTodoAction = createTodo.createAction();
```

```tsx
"use client";

const { execute, isPending, error, data } = useServerAction(createTodoAction, {
  onSuccess: (args) => {
    toast.success("Todo created successfully");
  },
});
```
