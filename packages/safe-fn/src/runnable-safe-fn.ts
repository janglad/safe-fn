import { ResultAsync, safeTry } from "neverthrow";
import { ok } from "./result";
import type {
  AnyRunnableSafeFn,
  AnySafeFnHandlerRes,
  AnySafeFnThrownHandler,
  AnySafeFnThrownHandlerRes,
  SafeFnInput,
  SafeFnInputParseError,
  SafeFnInternals,
  SafeFnOutputParseError,
  SafeFnReturn,
  SafeFnRunArgs,
  SchemaOutputOrFallback,
} from "./types";
import { isFrameworkError, safeZodAsyncParse } from "./util";

export class RunnableSafeFn<
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnInput,
  TUnparsedInput,
  THandlerRes extends AnySafeFnHandlerRes,
  TThrownHandlerRes extends AnySafeFnThrownHandlerRes,
> {
  readonly _internals: SafeFnInternals<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput
  >;

  constructor(
    internals: SafeFnInternals<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >,
  ) {
    this._internals = internals;
  }

  createAction(): (
    args: SafeFnRunArgs<TUnparsedInput, TParent>,
  ) => THandlerRes {
    // TODO: strip stack traces etc here
    return this.run.bind(this) as any;
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
    THandlerRes,
    ReturnType<TNewThrownHandler>
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
  run(
    args: SafeFnRunArgs<TUnparsedInput, TParent>,
  ): SafeFnReturn<TInputSchema, TOutputSchema, THandlerRes, TThrownHandlerRes> {
    const inputSchema = this._internals.inputSchema;
    const outputSchema = this._internals.outputSchema;
    const handler = this._internals.handler;
    const parent = this._internals.parent;
    const uncaughtErrorHandler = this._internals.uncaughtErrorHandler;
    const _parseOutput = this._parseOutput.bind(this);
    const _parseInput = this._parseInput.bind(this);

    const res = safeTry(async function* () {
      const ctx =
        parent === undefined ? undefined : yield* parent.run(args).safeUnwrap();

      const parsedInput =
        inputSchema === undefined
          ? undefined
          : yield* _parseInput(args).safeUnwrap();

      const handlerRes = yield* ResultAsync.fromSafePromise(
        (async () => {
          return await handler({
            parsedInput,
            unparsedInput: args,
            ctx,
          } as any);
        })(),
      ).safeUnwrap();

      const parsedOutput =
        outputSchema === undefined
          ? undefined
          : yield* _parseOutput(handlerRes).safeUnwrap();

      return parsedOutput === undefined ? handlerRes : ok(parsedOutput);
    });

    return ResultAsync.fromPromise(res, (error) => {
      if (isFrameworkError(error)) {
        throw error;
      }
      return ResultAsync.fromSafePromise(
        (async () => {
          const res = await uncaughtErrorHandler(error);
          return res;
        })(),
      ).andThen((res) => res);
    }).andThen((res) => res) as any;
  }

  /*
################################
||                            ||
||          Internal          ||
||                            ||
################################
*/

  _parseInput(
    input: unknown,
  ): ResultAsync<
    SchemaOutputOrFallback<TInputSchema, never>,
    SafeFnInputParseError<TInputSchema>
  > {
    if (this._internals.inputSchema === undefined) {
      throw new Error("No input schema defined");
    }

    return safeZodAsyncParse(this._internals.inputSchema, input).mapErr(
      (error) => {
        if (error.code === "PARSING_UNHANDLED") {
          throw error.cause;
        }
        return {
          code: "INPUT_PARSING",
          cause: error.cause,
        } as SafeFnInputParseError<TInputSchema>;
      },
    );
  }

  _parseOutput(
    output: unknown,
  ): ResultAsync<
    SchemaOutputOrFallback<TOutputSchema, never>,
    SafeFnOutputParseError<TOutputSchema>
  > {
    if (this._internals.outputSchema === undefined) {
      throw new Error("No output schema defined");
    }

    return safeZodAsyncParse(this._internals.outputSchema, output).mapErr(
      (error) => {
        if (error.code === "PARSING_UNHANDLED") {
          throw error.cause;
        }
        return {
          code: "OUTPUT_PARSING",
          cause: error.cause,
        } as SafeFnOutputParseError<TOutputSchema>;
      },
    );
  }
}
