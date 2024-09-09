import { z } from "zod";

import { err, Result } from "neverthrow";
import type { MergeResults } from "./result";
import { RunnableSafeFn } from "./runnable-safe-fn";
import type {
  AnyRunnableSafeFn,
  ErrorObj,
  InferInputSchema,
  InferSafeFnErrError,
  InferSafeFnOkData,
  InferUnparsedInput,
  MergeZodTypes,
  Prettify,
  SafeFnDefaultCatchHandler,
  SafeFnDefaultCatchHandlerErr,
  SafeFnDefaultHandlerFn,
  SafeFnHandlerArgs,
  SafeFnHandlerReturn,
  SafeFnInput,
  SafeFnInternals,
  SchemaInputOrFallback,
  TOrFallback,
  UnionIfNotT,
} from "./types";

export class SafeFnBuilder<
  TCtx,
  TInputSchema extends SafeFnInput,
  TMergedInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnInput,
  TUnparsedInput,
  TParentErr extends ErrorObj | undefined,
> {
  readonly _internals: SafeFnInternals<
    TCtx,
    TInputSchema,
    TMergedInputSchema,
    TOutputSchema,
    TUnparsedInput
  >;

  protected constructor(
    internals: SafeFnInternals<
      TCtx,
      TInputSchema,
      TMergedInputSchema,
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
    TNewParent extends AnyRunnableSafeFn
      ? InferSafeFnOkData<TNewParent>
      : undefined,
    undefined,
    TOrFallback<InferInputSchema<TNewParent>, undefined>,
    undefined,
    InferUnparsedInput<TNewParent>,
    TNewParent extends AnyRunnableSafeFn
      ? {
          action: InferSafeFnErrError<TNewParent, true>;
          regular: InferSafeFnErrError<TNewParent, false>;
        }
      : undefined
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
      TCtx,
      TNewInputSchema,
      MergeZodTypes<TMergedInputSchema, TNewInputSchema>,
      TOutputSchema,
      UnionIfNotT<z.input<TNewInputSchema>, TUnparsedInput, never>,
      TParentErr
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
      TCtx,
      TInputSchema,
      TMergedInputSchema,
      TOutputSchema,
      UnionIfNotT<TNewUnparsedInput, TUnparsedInput, never>,
      TParentErr
    >,
    "input" | "unparsedInput"
  > {
    return this as unknown as SafeFnBuilder<
      TCtx,
      TInputSchema,
      TMergedInputSchema,
      TOutputSchema,
      UnionIfNotT<TNewUnparsedInput, TUnparsedInput, never>,
      TParentErr
    >;
  }

  output<TNewOutputSchema extends z.ZodTypeAny>(
    schema: TNewOutputSchema,
  ): Omit<
    SafeFnBuilder<
      TCtx,
      TInputSchema,
      TMergedInputSchema,
      TNewOutputSchema,
      TUnparsedInput,
      TParentErr
    >,
    "output"
  > {
    return new SafeFnBuilder({
      ...this._internals,
      outputSchema: schema,
    } as any);
  }

  handler<TNewHandlerResult extends SafeFnHandlerReturn<TOutputSchema>>(
    handler: (
      args: Prettify<
        SafeFnHandlerArgs<TCtx, TMergedInputSchema, TUnparsedInput>
      >,
    ) => TNewHandlerResult,
  ): RunnableSafeFn<
    TCtx,
    TInputSchema,
    TMergedInputSchema,
    TOutputSchema,
    TUnparsedInput,
    TNewHandlerResult,
    TParentErr,
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
      args: Prettify<
        SafeFnHandlerArgs<TCtx, TMergedInputSchema, TUnparsedInput>
      >,
    ) => AsyncGenerator<YieldErr, GeneratorResult>,
  ): RunnableSafeFn<
    TCtx,
    TInputSchema,
    TMergedInputSchema,
    TOutputSchema,
    TUnparsedInput,
    // YieldErr can be never if the generator never yields an error, [] cause distribution
    [YieldErr] extends [never]
      ? GeneratorResult
      : MergeResults<GeneratorResult, YieldErr>,
    TParentErr,
    SafeFnDefaultCatchHandlerErr
  > {
    const handler = async (
      args: Prettify<
        SafeFnHandlerArgs<TCtx, TMergedInputSchema, TUnparsedInput>
      >,
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
