import { z } from "zod";

import { err, type MergeResults, type Result } from "./result";
import { RunnableSafeFn } from "./runnable-safe-fn";
import type {
  AnyRunnableSafeFn,
  Prettify,
  SafeFnDefaultThrowHandler,
  SafeFnHandlerArgs,
  SafeFnHandlerFn,
  SafeFnInput,
  SafeFnInternals,
  SchemaInputOrFallback,
} from "./types";

export class SafeFnBuilder<
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnInput,
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
  ): SafeFnBuilder<TNewParent, undefined, undefined, unknown> {
    return new SafeFnBuilder({
      parent,
      inputSchema: undefined,
      outputSchema: undefined,
      handler: () =>
        err({
          code: "NO_HANDLER",
        } as const),
      uncaughtErrorHandler: (error: unknown) =>
        err({
          code: "UNCAUGHT_ERROR",
          cause: error,
        } as const),
    }) as any;
  }

  input<TNewInputSchema extends z.ZodTypeAny>(
    schema: TNewInputSchema,
  ): Omit<
    SafeFnBuilder<
      TParent,
      TNewInputSchema,
      TOutputSchema,
      z.input<TNewInputSchema>
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
    SafeFnBuilder<TParent, TInputSchema, TOutputSchema, TNewUnparsedInput>,
    "input" | "unparsedInput"
  > {
    return this as unknown as SafeFnBuilder<
      TParent,
      TInputSchema,
      TOutputSchema,
      TNewUnparsedInput
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

  handler<
    TNewHandlerFn extends SafeFnHandlerFn<
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      TParent
    >,
  >(
    handler: TNewHandlerFn,
  ): RunnableSafeFn<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    ReturnType<TNewHandlerFn>,
    ReturnType<SafeFnDefaultThrowHandler>
  > {
    return new RunnableSafeFn({
      ...this._internals,
      handler,
    });
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
    MergeResults<GeneratorResult, YieldErr>,
    ReturnType<SafeFnDefaultThrowHandler>
  > {
    const handler = async (
      args: SafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>,
    ) => {
      return (await fn(args).next()).value;
    };

    return new RunnableSafeFn({
      ...this._internals,
      handler,
    });
  }
}
