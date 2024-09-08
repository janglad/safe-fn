import { ok, ResultAsync, safeTry } from "neverthrow";

import {
  actionErr,
  actionOk,
  type InferAsyncErrError,
  type InferAsyncOkData,
} from "./result";
import type {
  AnyRunnableSafeFn,
  AnySafeFnCatchHandlerRes,
  AnySafeFnHandlerRes,
  SafeFnAction,
  SafeFnActionArgs,
  SafeFnActionReturn,
  SafeFnCallBacks,
  SafeFnHandlerArgs,
  SafeFnInput,
  SafeFnInputParseError,
  SafeFnInternals,
  SafeFnOnComplete,
  SafeFnOnError,
  SafeFnOnStart,
  SafeFnOnSuccess,
  SafeFnOutputParseError,
  SafeFnReturn,
  SafeFnRunArgs,
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

  readonly _callBacks: SafeFnCallBacks<
    TParent,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput,
    THandlerRes,
    TThrownHandlerRes
  >;

  constructor(
    internals: SafeFnInternals<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >,
    callBacks: SafeFnCallBacks<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes,
      TThrownHandlerRes
    >,
  ) {
    this._internals = internals;
    this._callBacks = callBacks;
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
    return this._runAsAction.bind(this);
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
    return new RunnableSafeFn(
      {
        ...this._internals,
        uncaughtErrorHandler: handler,
      },
      this._callBacks as SafeFnCallBacks<
        TParent,
        TInputSchema,
        TOutputSchema,
        TUnparsedInput,
        THandlerRes,
        TNewThrownHandlerRes
      >,
    );
  }

  onStart(onStartFn: SafeFnOnStart<TParent, TUnparsedInput>) {
    return new RunnableSafeFn(this._internals, {
      ...this._callBacks,
      onStart: onStartFn,
    });
  }
  onSuccess(
    onSuccessFn: SafeFnOnSuccess<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes
    >,
  ) {
    return new RunnableSafeFn(this._internals, {
      ...this._callBacks,
      onSuccess: onSuccessFn,
    });
  }
  onError(
    onErrorFn: SafeFnOnError<
      TParent,
      TInputSchema,
      TUnparsedInput,
      THandlerRes,
      TThrownHandlerRes
    >,
  ) {
    return new RunnableSafeFn(this._internals, {
      ...this._callBacks,
      onError: onErrorFn,
    });
  }
  onComplete(
    onCompleteFn: SafeFnOnComplete<
      TParent,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput,
      THandlerRes,
      TThrownHandlerRes
    >,
  ) {
    return new RunnableSafeFn(this._internals, {
      ...this._callBacks,
      onComplete: onCompleteFn,
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
    return this._run(args[0], false, false) as SafeFnReturn<
      TParent,
      TInputSchema,
      TOutputSchema,
      THandlerRes,
      TThrownHandlerRes,
      false
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

  _run<TAsAction extends boolean, TAsProcedure extends boolean>(
    args: SafeFnRunArgs<TUnparsedInput>[0],
    tAsAction: TAsAction,
    tAsProcedure: TAsProcedure,
  ): SafeFnReturn<
    TParent,
    TInputSchema,
    TOutputSchema,
    THandlerRes,
    TThrownHandlerRes,
    TAsAction
  > extends infer HandlerRes
    ? TAsProcedure extends true
      ? ResultAsync<
          {
            handlerRes: InferAsyncOkData<HandlerRes>;
            parsedInput: SchemaOutputOrFallback<TInputSchema, undefined>;
          },
          InferAsyncErrError<HandlerRes>
        >
      : HandlerRes
    : never {
    const inputSchema = this._internals.inputSchema;
    const outputSchema = this._internals.outputSchema;
    const handler = this._internals.handler;
    const parent = this._internals.parent;
    const uncaughtErrorHandler = this._internals.uncaughtErrorHandler;
    const _parseOutput = this._parseOutput.bind(this);
    const _parseInput = this._parseInput.bind(this);

    const res = safeTry(async function* () {
      const { handlerRes: parentHandlerRes, parsedInput: parentParsedInput } =
        parent === undefined
          ? { handlerRes: undefined, parsedInput: undefined }
          : yield* parent._run(args, tAsAction, true).safeUnwrap();

      const parsedInput =
        inputSchema === undefined
          ? parentParsedInput
          : yield* _parseInput(args, tAsAction)
              .map((res) => ({
                ...parentParsedInput,
                ...res,
              }))
              .safeUnwrap();

      const handlerRes = yield* (
        await handler({
          input: parsedInput,
          unsafeRawInput: args,
          ctx: parentHandlerRes,
        } as SafeFnHandlerArgs<TInputSchema, TUnparsedInput, TParent>)
      ).safeUnwrap();

      const parsedOutput =
        outputSchema === undefined
          ? undefined
          : yield* _parseOutput(handlerRes, tAsAction).safeUnwrap();

      const res = parsedOutput === undefined ? handlerRes : parsedOutput;
      return tAsProcedure
        ? ok({
            handlerRes: res,
            parsedInput,
          })
        : ok(res);
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

  async _runAsAction(
    ...args: SafeFnActionArgs<TUnparsedInput>
  ): SafeFnActionReturn<
    TParent,
    TInputSchema,
    TOutputSchema,
    THandlerRes,
    TThrownHandlerRes
  > {
    const res = await (this._run(args[0], true, false) as SafeFnReturn<
      TParent,
      TInputSchema,
      TOutputSchema,
      THandlerRes,
      TThrownHandlerRes,
      true
    >);

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
}
