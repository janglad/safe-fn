import { err, ok, type Err, type Result } from "./result";
import type { TInternals } from "./safe-fn-builder";
import type {
  AnyRunnableSafeFn,
  AnySafeFnThrownHandler,
  SafeFnActionFn,
  SafeFnInput,
  SafeFnInputParseError,
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
  TActionFn extends SafeFnActionFn<
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    TParent
  >,
  TThrownHandler extends AnySafeFnThrownHandler,
> {
  readonly _internals: TInternals<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    TActionFn,
    TThrownHandler
  >;

  constructor(
    internals: TInternals<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      TActionFn,
      TThrownHandler
    >,
  ) {
    this._internals = internals;
  }

  createAction(): (
    args: SafeFnRunArgs<TInputSchema, TUnparsedInput, TParent>,
  ) => Promise<
    SafeFnReturn<TInputSchema, TOutputSchema, TActionFn, TThrownHandler>
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
    TActionFn,
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
    SafeFnReturn<TInputSchema, TOutputSchema, TActionFn, TThrownHandler>
  > {
    try {
      let ctx: any;

      if (this._internals.parent !== undefined) {
        const parentRes = await this._internals.parent.run(args);
        if (!parentRes.success) {
          return parentRes as any;
        }
        ctx = parentRes.data;
      }

      let parsedInput: typeof args.parsedInput = undefined;
      if (this._internals.inputSchema !== undefined) {
        const parseRes = await this._parseInput(args);
        if (!parseRes.success) {
          return parseRes;
        } else {
          parsedInput = parseRes.data;
        }
      }
      const actionRes = await this._internals.actionFn({
        parsedInput,
        unparsedInput: args,
        // TODO: pass context when functions are set up
        ctx,
      } as any);

      if (!actionRes.success) {
        return actionRes;
      }

      if (this._internals.outputSchema !== undefined) {
        return await this._parseOutput(actionRes.data);
      }

      return actionRes;
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
    }) as Err<SafeFnInputParseError<TInputSchema>>;
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
    }) as Err<SafeFnOutputParseError<TOutputSchema>>;
  }
}
