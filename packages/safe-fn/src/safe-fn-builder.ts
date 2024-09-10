import { z } from "zod";

import { err, Result } from "neverthrow";
import type { MergeResults } from "./result";
import { RunnableSafeFn } from "./runnable-safe-fn";
import type {
  AnyRunnableSafeFn,
  InferUnparsedInput,
  Prettify,
  SafeFnDefaultCatchHandler,
  SafeFnDefaultCatchHandlerErr,
  SafeFnDefaultHandlerFn,
  SafeFnHandlerArgs,
  SafeFnHandlerReturn,
  SafeFnInput,
  SafeFnInternals,
  SafeFnOutput,
  SchemaInputOrFallback,
  UnionIfNotT,
} from "./types";

export class SafeFnBuilder<
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnOutput,
  TUnparsedInput,
> {
  readonly _internals: SafeFnInternals<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput
  >;

  protected constructor(
    internals: SafeFnInternals<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >,
  ) {
    this._internals = internals;
  }

  /*
################################
||                            ||
||          Builder           ||
||                            ||
################################
*/
  static new<TNewParent extends AnyRunnableSafeFn | undefined = undefined>(
    parent?: TNewParent,
  ): SafeFnBuilder<
    TNewParent,
    undefined,
    undefined,
    InferUnparsedInput<TNewParent>
  > {
    return new SafeFnBuilder({
      parent,
      inputSchema: undefined,
      outputSchema: undefined,
      handler: (() =>
        err({
          code: "NO_HANDLER",
        } as const)) satisfies SafeFnDefaultHandlerFn,
      uncaughtErrorHandler: ((error: unknown) => {
        // TODO: Keep track of asAction both at compile and run time, switch error input based on that.
        console.error(error);
        return err({
          code: "UNCAUGHT_ERROR",
          cause:
            "An uncaught error occurred. You can implement a custom error handler by using `catch()`",
        } as const);
      }) satisfies SafeFnDefaultCatchHandler,
    }) as any;
  }

  input<TNewInputSchema extends z.ZodTypeAny>(
    schema: TNewInputSchema,
  ): Omit<
    SafeFnBuilder<
      TParent,
      TNewInputSchema,
      TOutputSchema,
      UnionIfNotT<z.input<TNewInputSchema>, TUnparsedInput, never>
    >,
    "input" | "unparsedInput"
  > {
    return new SafeFnBuilder({
      ...this._internals,
      inputSchema: schema,
    } as any);
  }

  // Utility method to set unparsedInput type. Other option is currying with action, this seems more elegant.
  unparsedInput<TNewUnparsedInput>(): Omit<
    SafeFnBuilder<
      TParent,
      TInputSchema,
      TOutputSchema,
      UnionIfNotT<TNewUnparsedInput, TUnparsedInput, never>
    >,
    "input" | "unparsedInput"
  > {
    return this as unknown as SafeFnBuilder<
      TParent,
      TInputSchema,
      TOutputSchema,
      UnionIfNotT<TNewUnparsedInput, TUnparsedInput, never>
    >;
  }

  output<TNewOutputSchema extends z.ZodTypeAny>(
    schema: TNewOutputSchema,
  ): Omit<
    SafeFnBuilder<TParent, TInputSchema, TNewOutputSchema, TUnparsedInput>,
    "output"
  > {
    return new SafeFnBuilder({
      ...this._internals,
      outputSchema: schema,
    } as any);
  }

  handler<TNewHandlerResult extends SafeFnHandlerReturn<TOutputSchema>>(
    handler: (
      args: Prettify<SafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>>,
    ) => TNewHandlerResult,
  ): RunnableSafeFn<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    TNewHandlerResult,
    SafeFnDefaultCatchHandlerErr
  > {
    return new RunnableSafeFn(
      {
        ...this._internals,
        handler,
      },
      {
        onStart: undefined,
        onSuccess: undefined,
        onError: undefined,
        onComplete: undefined,
      },
    );
  }

  safeHandler<
    YieldErr extends Result<never, unknown>,
    GeneratorResult extends Result<
      SchemaInputOrFallback<TOutputSchema, any>,
      unknown
    >,
  >(
    fn: (
      args: Prettify<SafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>>,
    ) => AsyncGenerator<YieldErr, GeneratorResult>,
  ): RunnableSafeFn<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    // YieldErr can be never if the generator never yields an error, [] cause distribution
    [YieldErr] extends [never]
      ? GeneratorResult
      : MergeResults<GeneratorResult, YieldErr>,
    SafeFnDefaultCatchHandlerErr
  > {
    const handler = async (
      args: Prettify<SafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>>,
    ) => {
      return (await fn(args).next()).value;
    };

    return new RunnableSafeFn(
      {
        ...this._internals,
        handler,
      },
      {
        onStart: undefined,
        onSuccess: undefined,
        onError: undefined,
        onComplete: undefined,
      },
    );
  }
}
