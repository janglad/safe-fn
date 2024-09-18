import { z } from "zod";

import { err, Result } from "neverthrow";
import type { MergeResults } from "./result";
import { RunnableSafeFn, type AnyRunnableSafeFn } from "./runnable-safe-fn";

import type {
  TSafeFnDefaultCatchHandler,
  TSafeFnDefaultCatchHandlerErr,
} from "./types/error";
import type {
  TSafeFnDefaultHandlerFn,
  TSafeFnHandlerArgs,
  TSafeFnHandlerReturn,
} from "./types/handler";
import type { TSafeFnInternals } from "./types/internals";
import type {
  InferMergedInputSchemaInput,
  InferMergedOutputSchemaInput,
  InferUnparsedInput,
  TSafeFnInput,
  TSchemaInputOrFallback,
} from "./types/schema";

import type {
  AnyObject,
  TMaybePromise,
  TODO,
  TPrettify,
  TUnionIfNotT,
} from "./types/util";

export const createSafeFn = () => {
  return SafeFnBuilder.new();
};
export class SafeFnBuilder<
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends TSafeFnInput,
  TMergedInputSchemaInput extends AnyObject | undefined,
  TOutputSchema extends TSafeFnInput,
  TMergedOutputSchemaInput extends AnyObject | undefined,
  TUnparsedInput,
> {
  readonly _internals: TSafeFnInternals<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    TSafeFnDefaultCatchHandlerErr
  >;

  protected constructor(
    internals: TSafeFnInternals<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      TSafeFnDefaultCatchHandlerErr
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
  static new(): SafeFnBuilder<
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    never
  > {
    return new SafeFnBuilder({
      parent: undefined,
      inputSchema: undefined,
      outputSchema: undefined,
      handler: (() =>
        err({
          code: "NO_HANDLER",
        } as const)) satisfies TSafeFnDefaultHandlerFn,
      uncaughtErrorHandler: ((error: unknown) => {
        // TODO: Keep track of asAction both at compile and run time, switch error input based on that.
        console.error(error);
        return err({
          code: "UNCAUGHT_ERROR",
          cause:
            "An uncaught error occurred. You can implement a custom error handler by using `catch()`",
        } as const);
      }) satisfies TSafeFnDefaultCatchHandler,
    }) as any;
  }

  use<TNewParent extends AnyRunnableSafeFn>(
    parent: TNewParent,
  ): SafeFnBuilder<
    TNewParent,
    TInputSchema,
    InferMergedInputSchemaInput<TNewParent>,
    TOutputSchema,
    InferMergedOutputSchemaInput<TNewParent>,
    InferUnparsedInput<TNewParent>
  > {
    return new SafeFnBuilder({
      ...(this._internals as TODO),
      parent: parent as any,
    }) as any;
  }

  input<TNewInputSchema extends z.ZodTypeAny>(
    schema: TNewInputSchema,
  ): Omit<
    SafeFnBuilder<
      TParent,
      TNewInputSchema,
      TUnionIfNotT<
        TMergedInputSchemaInput,
        z.input<TNewInputSchema>,
        undefined
      >,
      TOutputSchema,
      TMergedOutputSchemaInput,
      TUnionIfNotT<z.input<TNewInputSchema>, TUnparsedInput, never>
    >,
    "input" | "unparsedInput"
  > {
    return new SafeFnBuilder({
      ...(this._internals as TODO),
      inputSchema: schema as TODO,
    } as any) as TODO;
  }

  // Utility method to set unparsedInput type. Other option is currying with action, this seems more elegant.
  unparsedInput<TNewUnparsedInput>(): Omit<
    SafeFnBuilder<
      TParent,
      TInputSchema,
      TMergedInputSchemaInput,
      TOutputSchema,
      TMergedOutputSchemaInput,
      TUnionIfNotT<TNewUnparsedInput, TUnparsedInput, never>
    >,
    "input" | "unparsedInput"
  > {
    return this as unknown as SafeFnBuilder<
      TParent,
      TInputSchema,
      TMergedInputSchemaInput,
      TOutputSchema,
      TMergedOutputSchemaInput,
      TUnionIfNotT<TNewUnparsedInput, TUnparsedInput, never>
    >;
  }

  output<TNewOutputSchema extends z.ZodTypeAny>(
    schema: TNewOutputSchema,
  ): Omit<
    SafeFnBuilder<
      TParent,
      TInputSchema,
      TMergedInputSchemaInput,
      TNewOutputSchema,
      TUnionIfNotT<
        TMergedOutputSchemaInput,
        z.input<TNewOutputSchema>,
        undefined
      >,
      TUnparsedInput
    >,
    "output"
  > {
    return new SafeFnBuilder({
      ...this._internals,
      outputSchema: schema as TODO,
    } as any) as TODO;
  }

  handler<TNewHandlerResult extends TSafeFnHandlerReturn<TOutputSchema>>(
    handler: (
      args: TPrettify<
        TSafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>
      >,
    ) => TMaybePromise<TNewHandlerResult>,
  ): RunnableSafeFn<
    TParent,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedOutputSchemaInput,
    TUnparsedInput,
    Awaited<TNewHandlerResult>,
    TSafeFnDefaultCatchHandlerErr
  > {
    return new RunnableSafeFn(
      {
        ...this._internals,
        handler,
      } as TODO,
      {
        onStart: undefined,
        onSuccess: undefined,
        onError: undefined,
        onComplete: undefined,
      } as TODO,
    ) as TODO;
  }

  safeHandler<
    YieldErr extends Result<never, unknown>,
    GeneratorResult extends Result<
      TSchemaInputOrFallback<TOutputSchema, any>,
      unknown
    >,
  >(
    fn: (
      args: TPrettify<
        TSafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>
      >,
    ) => AsyncGenerator<YieldErr, GeneratorResult>,
  ): RunnableSafeFn<
    TParent,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedOutputSchemaInput,
    TUnparsedInput,
    // YieldErr can be never if the generator never yields an error, [] cause distribution
    [YieldErr] extends [never]
      ? GeneratorResult
      : MergeResults<GeneratorResult, YieldErr>,
    TSafeFnDefaultCatchHandlerErr
  > {
    const handler = async (
      args: TPrettify<
        TSafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>
      >,
    ) => {
      return (await fn(args).next()).value;
    };

    return new RunnableSafeFn(
      {
        ...this._internals,
        handler,
      } as TODO,
      {
        onStart: undefined,
        onSuccess: undefined,
        onError: undefined,
        onComplete: undefined,
      },
    );
  }
}
