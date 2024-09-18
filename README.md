# Safe Fn

Personal project and still WIP.

## Why

Existing solutions like ZSA and Next-Safe-Action are great, but often fall short when it comes to handling errors. SafeFn integrated Neverthrow to create **fully** typed functions, ideal to be put at the edge of your application like in a server action. While it's possible to almost completely ignore Neverthrow to incrementally adopt it (the only requirement is that your handler functions return a `Result`), this library really shines when used in conjunction with it. `safeHandler()` builds on Neverthrow's `safeTry()` and allows for ergonomic "return early f error" handling.

It also provides a React library to easily call these server actions while taking care of transitions, pending states etc.

## Quick example

```ts
const authedAction = createSafeFn().handler(async () => {
  const user = await auth.getUser();
  if (!user) {
    return err({
      code: "UNAUTHORIZED",
    });
  }
  return ok(user);
});

const createTodoAction = createSafeFn()
  .use(authedAction)
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
```
