import { err, ok, type Err, type Result } from "./result";
import type {
  AnyRunnableSafeFn,
  AnySafeFnThrownHandler,
  SafeFnHandlerFn,
  SafeFnInput,
  SafeFnInputParseError,
  SafeFnInternals,
  SafeFnOutputParseError,
  SafeFnReturn,
  SafeFnRunArgs,
  SchemaOutputOrFallback,
} from "./types";
import { isFrameworkError } from "./util";

export class RunnableSafeFn<
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnInput,
  TUnparsedInput,
  THandlerFn extends SafeFnHandlerFn<
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    TParent
  >,
  TThrownHandler extends AnySafeFnThrownHandler,
> {
  readonly _internals: SafeFnInternals<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerFn,
    TThrownHandler
  >;

  constructor(
    internals: SafeFnInternals<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerFn,
      TThrownHandler
    >,
  ) {
    this._internals = internals;
  }

  createAction(): (
    args: SafeFnRunArgs<TInputSchema, TUnparsedInput, TParent>,
  ) => Promise<
    SafeFnReturn<TInputSchema, TOutputSchema, THandlerFn, TThrownHandler>
  > {
    // TODO: strip stack traces etc here
    return this.run.bind(this);
  }

  /*
################################
||                            ||
||          Builder           ||
||                            ||
################################
*/

  error<TNewThrownHandler extends AnySafeFnThrownHandler>(
    handler: TNewThrownHandler,
  ): RunnableSafeFn<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerFn,
    TNewThrownHandler
  > {
    return new RunnableSafeFn({
      ...this._internals,
      uncaughtErrorHandler: handler,
    });
  }

  /*
################################
||                            ||
||            Run             ||
||                            ||
################################
  */
  async run(
    args: SafeFnRunArgs<TInputSchema, TUnparsedInput, TParent>,
  ): Promise<
    SafeFnReturn<TInputSchema, TOutputSchema, THandlerFn, TThrownHandler>
  > {
    try {
      let ctx: any;

      if (this._internals.parent !== undefined) {
        const parentRes = await this._internals.parent.run(args);
        if (!parentRes.isOk()) {
          return parentRes as any;
        }
        ctx = parentRes.value;
      }

      let parsedInput: typeof args.parsedInput = undefined;
      if (this._internals.inputSchema !== undefined) {
        const parseRes = await this._parseInput(args);
        if (!parseRes.isOk()) {
          return parseRes as any;
        } else {
          parsedInput = parseRes.value;
        }
      }
      const handlerRes = await this._internals.handler({
        parsedInput,
        unparsedInput: args,
        // TODO: pass context when functions are set up
        ctx,
      } as any);

      if (!handlerRes.isOk()) {
        return handlerRes;
      }

      if (this._internals.outputSchema !== undefined) {
        return await this._parseOutput(handlerRes.value);
      }

      return handlerRes;
    } catch (error) {
      if (isFrameworkError(error)) {
        throw error;
      }
      return await this._internals.uncaughtErrorHandler(error);
    }
  }

  /*
################################
||                            ||
||          Internal          ||
||                            ||
################################
*/

  async _parseInput(
    input: unknown,
  ): Promise<
    Result<
      SchemaOutputOrFallback<TInputSchema, never>,
      SafeFnInputParseError<TInputSchema>
    >
  > {
    if (this._internals.inputSchema === undefined) {
      throw new Error("No input schema defined");
    }

    const res = await this._internals.inputSchema.safeParseAsync(input);

    if (res.success) {
      return ok(res.data);
    }

    return err({
      code: "INPUT_PARSING",
      cause: res.error,
    }) as Err<never, SafeFnInputParseError<TInputSchema>>;
  }

  async _parseOutput(
    output: unknown,
  ): Promise<
    Result<
      SchemaOutputOrFallback<TOutputSchema, never>,
      SafeFnOutputParseError<TOutputSchema>
    >
  > {
    if (this._internals.outputSchema === undefined) {
      throw new Error("No output schema defined");
    }

    const res = await this._internals.outputSchema.safeParseAsync(output);

    if (res.success) {
      return ok(res.data);
    }

    return err({
      code: "OUTPUT_PARSING",
      cause: res.error,
    }) as Err<never, SafeFnOutputParseError<TOutputSchema>>;
  }
}
