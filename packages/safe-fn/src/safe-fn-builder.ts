import { z } from "zod";

import { err, type Result } from "neverthrow";
import type { MergeResults } from "./result";
import {
  RunnableSafeFn,
  type TAnyRunnableSafeFn,
  type TRunnableSafeFn,
  type TRunnableSafeFnPickArgs,
} from "./runnable-safe-fn";

import type {
  TSafeFnDefaultCatchHandler,
  TSafeFnDefaultCatchHandlerErr,
  TSafeFnDefaultCatchHandlerErrError,
} from "./types/catch-handler";
import type {
  AnyCtxInput,
  TSafeFnDefaultHandlerFn,
  TSafeFnHandlerArgs,
  TSafeFnHandlerReturn,
} from "./types/handler";
import type { TSafeFnInternals } from "./types/internals";
import type {
  InferInputSchema,
  InferUnparsedInputTuple,
  TInferCtxInput,
  TInferMergedInputSchemaInput,
  TInferMergedParentOutputSchemaInput,
  TSafeFnInput,
  TSafeFnUnparsedInput,
  TSchemaInputOrFallback,
  TSchemaOutputOrFallback,
} from "./types/schema";

import type { InferSafeFnOkData, TBuildMergedHandlersErrs } from "./types/run";
import type {
  AnyObject,
  TIntersectIfNotT,
  TMaybePromise,
  TODO,
  TPrettify,
} from "./types/util";

export const createSafeFn = () => {
  return SafeFnBuilder.new();
};

type TSafeFnBuilder<
  TData,
  TRunErr,
  TActionErr,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TParentMergedHandlerErrs extends Result<never, unknown>,
  in out TInputSchema extends TSafeFnInput,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnInput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out TOmitArgs extends string | number | symbol,
> = Omit<
  SafeFnBuilder<
    TData,
    TRunErr,
    TActionErr,
    TCtx,
    TCtxInput,
    TParentMergedHandlerErrs,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    TOmitArgs
  >,
  TOmitArgs
>;

export class SafeFnBuilder<
  TData,
  TRunErr,
  TActionErr,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TParentMergedHandlerErrs extends Result<never, unknown>,
  in out TInputSchema extends TSafeFnInput,
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnInput,
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out TOmitArgs extends string | number | symbol,
> {
  readonly _internals: TSafeFnInternals<
    TCtx,
    TCtxInput,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    any,
    TSafeFnDefaultCatchHandlerErr
  >;

  protected constructor(
    internals: TSafeFnInternals<
      TCtx,
      TCtxInput,
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
  static new(): TSafeFnBuilder<
    never,
    TSafeFnDefaultCatchHandlerErrError,
    TSafeFnDefaultCatchHandlerErrError,
    undefined,
    [],
    Result<never, never>,
    undefined,
    undefined,
    undefined,
    undefined,
    [],
    `_${string}` | "new"
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

  use<TNewParent extends TAnyRunnableSafeFn>(
    parent: TNewParent,
  ): TSafeFnBuilder<
    TData,
    TRunErr,
    TActionErr,
    InferSafeFnOkData<TNewParent>,
    [
      ...TInferCtxInput<TNewParent>,
      TSchemaOutputOrFallback<InferInputSchema<TNewParent>, undefined>,
    ],
    TBuildMergedHandlersErrs<TNewParent>,
    TInputSchema,
    TInferMergedInputSchemaInput<TNewParent>,
    TOutputSchema,
    TInferMergedParentOutputSchemaInput<TNewParent>,
    InferUnparsedInputTuple<TNewParent>,
    TOmitArgs | "use"
  > {
    return new SafeFnBuilder({
      ...(this._internals as TODO),
      parent: parent as any,
    }) as any;
  }

  input<TNewInputSchema extends z.ZodTypeAny>(
    schema: TNewInputSchema,
  ): TSafeFnBuilder<
    TData,
    TRunErr,
    TActionErr,
    TCtx,
    TCtxInput,
    TParentMergedHandlerErrs,
    TNewInputSchema,
    TIntersectIfNotT<
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
    ],
    TOmitArgs | "input"
  > {
    return new SafeFnBuilder({
      ...(this._internals as TODO),
      inputSchema: schema as TODO,
    } as any) as TODO;
  }

  // Utility method to set unparsedInput type. Other option is currying with action, this seems more elegant.
  unparsedInput<TNewUnparsedInput>(): TSafeFnBuilder<
    TData,
    TRunErr,
    TActionErr,
    TCtx,
    TCtxInput,
    TParentMergedHandlerErrs,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    [
      TUnparsedInput extends []
        ? TNewUnparsedInput
        : TUnparsedInput[0] & TNewUnparsedInput,
    ],
    TOmitArgs | "unparsedInput"
  > {
    return this as unknown as SafeFnBuilder<
      TData,
      TRunErr,
      TActionErr,
      TCtx,
      TCtxInput,
      TParentMergedHandlerErrs,
      TInputSchema,
      TMergedInputSchemaInput,
      TOutputSchema,
      TMergedParentOutputSchemaInput,
      [
        TUnparsedInput extends []
          ? TNewUnparsedInput
          : TUnparsedInput[0] & TNewUnparsedInput,
      ],
      TOmitArgs | "unparsedInput"
    >;
  }

  output<TNewOutputSchema extends z.ZodTypeAny>(
    schema: TNewOutputSchema,
  ): TSafeFnBuilder<
    TData,
    TRunErr,
    TActionErr,
    TCtx,
    TCtxInput,
    TParentMergedHandlerErrs,
    TInputSchema,
    TMergedInputSchemaInput,
    TNewOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    TOmitArgs | "output"
  > {
    return new SafeFnBuilder({
      ...this._internals,
      outputSchema: schema as TODO,
    } as any) as TODO;
  }

  handler<TNewHandlerResult extends TSafeFnHandlerReturn<TOutputSchema>>(
    handler: (
      args: TPrettify<
        TSafeFnHandlerArgs<TCtx, TCtxInput, TInputSchema, TUnparsedInput>
      >,
    ) => TMaybePromise<TNewHandlerResult>,
  ): TRunnableSafeFn<
    TData,
    TRunErr,
    TActionErr,
    TCtx,
    TCtxInput,
    TParentMergedHandlerErrs,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    Awaited<TNewHandlerResult>,
    TSafeFnDefaultCatchHandlerErr,
    TRunnableSafeFnPickArgs
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
        TSafeFnHandlerArgs<TCtx, TCtxInput, TInputSchema, TUnparsedInput>
      >,
    ) => AsyncGenerator<YieldErr, GeneratorResult>,
  ): TRunnableSafeFn<
    TData,
    TRunErr,
    TActionErr,
    TCtx,
    TCtxInput,
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
    TSafeFnDefaultCatchHandlerErr,
    TRunnableSafeFnPickArgs
  > {
    const handler = async (
      args: TPrettify<
        TSafeFnHandlerArgs<TCtx, TCtxInput, TInputSchema, TUnparsedInput>
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
    ) as any;
  }
}
