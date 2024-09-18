import { z } from "zod";

import { err, Result } from "neverthrow";
import type { MergeResults } from "./result";
import { RunnableSafeFn, type AnyRunnableSafeFn } from "./runnable-safe-fn";

import type {
  TSafeFnDefaultCatchHandler,
  TSafeFnDefaultCatchHandlerErr,
} from "./types/catch-handler";
import type {
  TSafeFnDefaultHandlerFn,
  TSafeFnHandlerArgs,
  TSafeFnHandlerReturn,
} from "./types/handler";
import type { TSafeFnInternals } from "./types/internals";
import type {
  InferMergedInputSchemaInput,
  InferMergedParentOutputSchemaInput,
  InferUnparsedInputTuple,
  TSafeFnInput,
  TSafeFnUnparsedInput,
  TSchemaInputOrFallback,
} from "./types/schema";

import type { BuildMergedHandlersErrs } from "./types/run";
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
  TParentMergedHandlerErrs extends Result<never, unknown>,
  TInputSchema extends TSafeFnInput,
  TMergedInputSchemaInput extends AnyObject | undefined,
  TOutputSchema extends TSafeFnInput,
  TMergedParentOutputSchemaInput extends AnyObject | undefined,
  TUnparsedInput extends TSafeFnUnparsedInput,
> {
  readonly _internals: TSafeFnInternals<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    any,
    TSafeFnDefaultCatchHandlerErr
  >;

  protected constructor(
    internals: TSafeFnInternals<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      any,
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
    Result<never, never>,
    undefined,
    undefined,
    undefined,
    undefined,
    []
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
    BuildMergedHandlersErrs<TNewParent>,
    TInputSchema,
    InferMergedInputSchemaInput<TNewParent>,
    TOutputSchema,
    InferMergedParentOutputSchemaInput<TNewParent>,
    InferUnparsedInputTuple<TNewParent>
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
      TParentMergedHandlerErrs,
      TNewInputSchema,
      TUnionIfNotT<
        TMergedInputSchemaInput,
        z.input<TNewInputSchema>,
        undefined
      >,
      TOutputSchema,
      TMergedParentOutputSchemaInput,
      [
        TUnparsedInput extends []
          ? z.input<TNewInputSchema>
          : TUnparsedInput[0] & z.input<TNewInputSchema>,
      ]
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
      TParentMergedHandlerErrs,
      TInputSchema,
      TMergedInputSchemaInput,
      TOutputSchema,
      TMergedParentOutputSchemaInput,
      [
        TUnparsedInput extends []
          ? TNewUnparsedInput
          : TUnparsedInput[0] & TNewUnparsedInput,
      ]
    >,
    "input" | "unparsedInput"
  > {
    return this as unknown as SafeFnBuilder<
      TParent,
      TParentMergedHandlerErrs,
      TInputSchema,
      TMergedInputSchemaInput,
      TOutputSchema,
      TMergedParentOutputSchemaInput,
      [
        TUnparsedInput extends []
          ? TNewUnparsedInput
          : TUnparsedInput[0] & TNewUnparsedInput,
      ]
    >;
  }

  output<TNewOutputSchema extends z.ZodTypeAny>(
    schema: TNewOutputSchema,
  ): Omit<
    SafeFnBuilder<
      TParent,
      TParentMergedHandlerErrs,
      TInputSchema,
      TMergedInputSchemaInput,
      TNewOutputSchema,
      TMergedParentOutputSchemaInput,
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
    TParentMergedHandlerErrs,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
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
    TParentMergedHandlerErrs,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
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
