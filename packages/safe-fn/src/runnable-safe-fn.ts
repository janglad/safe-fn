import { ResultAsync, safeTry } from "neverthrow";

import type { SafeFnRunArgs } from "../dist";
import { actionErr, actionOk, ok } from "./result";
import type {
  AnyRunnableSafeFn,
  AnySafeFnCatchHandlerRes,
  AnySafeFnHandlerRes,
  SafeFnAction,
  SafeFnActionArgs,
  SafeFnActionReturn,
  SafeFnInput,
  SafeFnInputParseError,
  SafeFnInternals,
  SafeFnOutputParseError,
  SafeFnReturn,
  SchemaOutputOrFallback,
} from "./types";
import { isFrameworkError, mapZodError, safeZodAsyncParse } from "./util";

export class RunnableSafeFn<
  TParent extends AnyRunnableSafeFn | undefined,
  TInputSchema extends SafeFnInput,
  TOutputSchema extends SafeFnInput,
  TUnparsedInput,
  THandlerRes extends AnySafeFnHandlerRes,
  TThrownHandlerRes extends AnySafeFnCatchHandlerRes,
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

  createAction(): SafeFnAction<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes,
    TThrownHandlerRes
  > {
    // TODO: strip stack traces etc here
    return this.runAsAction.bind(this);
  }

  /*
################################
||                            ||
||          Builder           ||
||                            ||
################################
*/

  catch<TNewThrownHandlerRes extends AnySafeFnCatchHandlerRes>(
    handler: (error: unknown) => TNewThrownHandlerRes,
  ): RunnableSafeFn<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes,
    TNewThrownHandlerRes
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
    ...args: SafeFnRunArgs<TUnparsedInput>
  ): SafeFnReturn<
    TParent,
    TInputSchema,
    TOutputSchema,
    THandlerRes,
    TThrownHandlerRes,
    false
  > {
    return this._run(args[0], false);
  }
  _run<TAsAction extends boolean>(
    args: SafeFnRunArgs<TUnparsedInput>[0],
    tAsAction: TAsAction,
  ): SafeFnReturn<
    TParent,
    TInputSchema,
    TOutputSchema,
    THandlerRes,
    TThrownHandlerRes,
    TAsAction
  > {
    const inputSchema = this._internals.inputSchema;
    const outputSchema = this._internals.outputSchema;
    const handler = this._internals.handler;
    const parent = this._internals.parent;
    const uncaughtErrorHandler = this._internals.uncaughtErrorHandler;
    const _parseOutput = this._parseOutput.bind(this);
    const _parseInput = this._parseInput.bind(this);

    const res = safeTry(async function* () {
      const ctx =
        parent === undefined
          ? undefined
          : yield* parent._run(args, tAsAction).safeUnwrap();

      const parsedInput =
        inputSchema === undefined
          ? undefined
          : yield* _parseInput(args, tAsAction).safeUnwrap();

      const handlerRes = yield* (
        await handler({
          parsedInput,
          unparsedInput: args,
          ctx,
        } as any)
      ).safeUnwrap();

      const parsedOutput =
        outputSchema === undefined
          ? undefined
          : yield* _parseOutput(handlerRes, tAsAction).safeUnwrap();

      return parsedOutput === undefined ? ok(handlerRes) : ok(parsedOutput);
    });

    return ResultAsync.fromPromise(res, (error) => {
      if (isFrameworkError(error)) {
        throw error;
      }
      const handledErr = uncaughtErrorHandler(error);
      if (handledErr.isOk())
        throw new Error("uncaught error handler returned ok");
      return handledErr.error;
    }).andThen((res) => res) as any;
  }

  async runAsAction(
    ...args: SafeFnActionArgs<TUnparsedInput>
  ): SafeFnActionReturn<
    TParent,
    TInputSchema,
    TOutputSchema,
    THandlerRes,
    TThrownHandlerRes
  > {
    const res = await this._run(args[0], true);
    if (res.isOk()) {
      return actionOk(res.value) as Awaited<
        SafeFnActionReturn<
          TParent,
          TInputSchema,
          TOutputSchema,
          THandlerRes,
          TThrownHandlerRes
        >
      >;
    }
    return actionErr(res.error) as Awaited<
      SafeFnActionReturn<
        TParent,
        TInputSchema,
        TOutputSchema,
        THandlerRes,
        TThrownHandlerRes
      >
    >;
  }

  /*
################################
||                            ||
||          Internal          ||
||                            ||
################################
*/

  _parseInput<TAsAction extends boolean = false>(
    input: unknown,
    asAction: TAsAction,
  ): ResultAsync<
    SchemaOutputOrFallback<TInputSchema, never>,
    SafeFnInputParseError<TInputSchema, TAsAction>
  > {
    if (this._internals.inputSchema === undefined) {
      throw new Error("No input schema defined");
    }

    return safeZodAsyncParse(this._internals.inputSchema, input).mapErr(
      (error) => {
        if (error.code === "PARSING_UNHANDLED") {
          throw error.cause;
        }

        if (asAction) {
          const cause = mapZodError(error.cause as any);
          return {
            code: "INPUT_PARSING",
            cause,
          } as SafeFnInputParseError<TInputSchema, TAsAction>;
        }

        return {
          code: "INPUT_PARSING",
          cause: error.cause,
        } as SafeFnInputParseError<TInputSchema, TAsAction>;
      },
    );
  }

  _parseOutput<TAsAction extends boolean = false>(
    output: unknown,
    asAction: TAsAction,
  ): ResultAsync<
    SchemaOutputOrFallback<TOutputSchema, never>,
    SafeFnOutputParseError<TOutputSchema, TAsAction>
  > {
    if (this._internals.outputSchema === undefined) {
      throw new Error("No output schema defined");
    }

    return safeZodAsyncParse(this._internals.outputSchema, output).mapErr(
      (error) => {
        if (error.code === "PARSING_UNHANDLED") {
          throw error.cause;
        }

        if (asAction) {
          const cause = mapZodError(error.cause as any);
          return {
            code: "OUTPUT_PARSING",
            cause,
          } as SafeFnOutputParseError<TOutputSchema, TAsAction>;
        }

        return {
          code: "OUTPUT_PARSING",
          cause: error.cause,
        } as SafeFnOutputParseError<TOutputSchema, TAsAction>;
      },
    );
  }
}
