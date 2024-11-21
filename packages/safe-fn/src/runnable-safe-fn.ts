import { err, ok, ResultAsync } from "neverthrow";

import {
  actionErr,
  actionOk,
  type ActionErr,
  type InferErrError,
} from "./result";

import type {
  TAnySafeFnCatchHandlerRes,
  TSafeFnDefaultCatchHandlerErrError,
} from "./types/catch-handler";
import type { TSafeFnInternals } from "./types/internals";
import type {
  AnyTSafeFnInternalRunReturn2,
  TSafeFnInternalRunReturn2,
  TSafeFnInternalRunReturnError,
  TSafeFnReturnData,
  TSafeFnRunArgs,
  TSafeFnRunReturn,
} from "./types/run";
import type {
  TSafeFnInput,
  TSafeFnInputParseErrorNoZod,
  TSafeFnOutputParseErrorNoZod,
  TSafeFnUnparsedInput,
  TSchemaInputOrFallback,
  TSchemaOutputOrFallback,
} from "./types/schema";

import type { ZodTypeAny } from "zod";
import type { ActionResult } from "../dist";
import { SafeFnBuilder } from "./safe-fn-builder";
import type {
  TSafeFnAction,
  TSafeFnActionArgs,
  TSafeFnActionReturn,
} from "./types/action";
import type {
  TSafeFnCallBacks,
  TSafeFnOnComplete,
  TSafeFnOnError,
  TSafeFnOnStart,
  TSafeFnOnSuccess,
} from "./types/callbacks";
import type { AnyCtxInput } from "./types/handler";
import type { AnyObject, TODO } from "./types/util";
import { isFrameworkError, mapZodError } from "./util";

export interface TAnyRunnableSafeFn
  extends TRunnableSafeFn<any, any, any, any, any, any, any, any, any, any> {}

type AnyRunnableSafeFn = RunnableSafeFn<
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>;

export type TRunnableSafeFnPickArgs =
  | "catch"
  | "onStart"
  | "onSuccess"
  | "onError"
  | "onComplete"
  | "run"
  | "createAction"
  | "mapErr";

export type TRunnableSafeFn<
  in out TData,
  in out TRunErr,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  /* Includes input schema of `this` */
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnInput,
  /* Does not include output schema of `this` to be able to differentiate when handler only returns an error */
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out TPickArgs extends TRunnableSafeFnPickArgs,
> = Pick<
  RunnableSafeFn<
    TData,
    TRunErr,
    TCtx,
    TCtxInput,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    TPickArgs
  >,
  TPickArgs
>;

export class RunnableSafeFn<
  in out TData,
  in out TRunErr,
  in out TCtx,
  in out TCtxInput extends AnyCtxInput,
  in out TInputSchema extends TSafeFnInput,
  /* Includes input schema of `this` */
  in out TMergedInputSchemaInput extends AnyObject | undefined,
  in out TOutputSchema extends TSafeFnInput,
  /* Does not include output schema of `this` to be able to differentiate when handler only returns an error */
  in out TMergedParentOutputSchemaInput extends AnyObject | undefined,
  in out TUnparsedInput extends TSafeFnUnparsedInput,
  in out TPickArgs extends TRunnableSafeFnPickArgs,
> {
  readonly _internals: TSafeFnInternals<
    TCtx,
    TCtxInput,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput
  >;

  readonly _callBacks: TSafeFnCallBacks<
    TData,
    TRunErr,
    TCtx,
    TCtxInput,
    TInputSchema,
    TOutputSchema,
    TUnparsedInput
  >;

  readonly _mapErrHandler: ((e: any) => TRunErr) | undefined;

  constructor(
    internals: TSafeFnInternals<
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >,
    callBacks: TSafeFnCallBacks<
      TData,
      TRunErr,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >,
    mapErrHandler: ((e: TRunErr) => TRunErr) | undefined,
  ) {
    this._internals = internals;
    this._callBacks = callBacks;
    this._mapErrHandler = mapErrHandler;
  }

  createAction(): TSafeFnAction<TData, TRunErr, TOutputSchema, TUnparsedInput> {
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

  catch<TNewThrownHandlerRes extends TAnySafeFnCatchHandlerRes>(
    handler: (error: unknown) => TNewThrownHandlerRes,
  ): TRunnableSafeFn<
    TData,
    | Exclude<TRunErr, TSafeFnDefaultCatchHandlerErrError>
    | InferErrError<TNewThrownHandlerRes>,
    TCtx,
    TCtxInput,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    Exclude<TPickArgs, "catch">
  > {
    return new RunnableSafeFn(
      {
        ...this._internals,
        uncaughtErrorHandler: handler,
      } as TODO,
      this._callBacks as TODO,
      this._mapErrHandler,
    ) as TODO;
  }

  mapErr<TNewErrError>(
    handler: (error: TRunErr) => TNewErrError,
  ): TRunnableSafeFn<
    TData,
    TNewErrError,
    TCtx,
    TCtxInput,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    Exclude<TPickArgs, "mapErr">
  > {
    return new RunnableSafeFn(
      this._internals,
      this._callBacks,
      handler as TODO,
    ) as TODO;
  }

  onStart(
    onStartFn: TSafeFnOnStart<TUnparsedInput>,
  ): TRunnableSafeFn<
    TData,
    TRunErr,
    TCtx,
    TCtxInput,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    Exclude<TPickArgs, "onStart">
  > {
    return new RunnableSafeFn(
      this._internals,
      {
        ...this._callBacks,
        onStart: onStartFn,
      },
      this._mapErrHandler,
    ) as TODO;
  }
  onSuccess(
    onSuccessFn: TSafeFnOnSuccess<
      TData,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >,
  ): TRunnableSafeFn<
    TData,
    TRunErr,
    TCtx,
    TCtxInput,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    Exclude<TPickArgs, "onSuccess">
  > {
    return new RunnableSafeFn(
      this._internals,
      {
        ...this._callBacks,
        onSuccess: onSuccessFn,
      },
      this._mapErrHandler,
    ) as TODO;
  }
  onError(
    onErrorFn: TSafeFnOnError<
      TRunErr,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >,
  ): TRunnableSafeFn<
    TData,
    TRunErr,
    TCtx,
    TCtxInput,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    Exclude<TPickArgs, "onError">
  > {
    return new RunnableSafeFn(
      this._internals,
      {
        ...this._callBacks,
        onError: onErrorFn,
      },
      this._mapErrHandler,
    ) as TODO;
  }
  onComplete(
    onCompleteFn: TSafeFnOnComplete<
      TData,
      TRunErr,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >,
  ): TRunnableSafeFn<
    TData,
    TRunErr,
    TCtx,
    TCtxInput,
    TInputSchema,
    TMergedInputSchemaInput,
    TOutputSchema,
    TMergedParentOutputSchemaInput,
    TUnparsedInput,
    Exclude<TPickArgs, "onComplete">
  > {
    return new RunnableSafeFn(
      this._internals,
      {
        ...this._callBacks,
        onComplete: onCompleteFn,
      },
      this._mapErrHandler,
    ) as TODO;
  }

  /*
################################
||                            ||
||            Run             ||
||                            ||
################################
  */
  run(
    ...args: TSafeFnRunArgs<TUnparsedInput>
  ): TSafeFnRunReturn<TData, TRunErr, TOutputSchema> {
    const resPromise = (async (): Promise<
      Awaited<TSafeFnRunReturn<TData, TRunErr, TOutputSchema>>
    > => {
      const res = await RunnableSafeFn._run(
        this._internals,
        this._callBacks,
        this._mapErrHandler,
        args[0],
        false,
      );
      if (res.ok) {
        return ok(res.value.value);
      }
      return err(res.error.public);
    })();

    return new ResultAsync(resPromise);
  }

  /*
################################
||                            ||
||          Internal          ||
||                            ||
################################
*/

  static async _parseInput<T extends ZodTypeAny | undefined>(
    input: unknown,
    inputSchema: T,
  ): Promise<
    ActionResult<
      TSchemaOutputOrFallback<T, never>,
      TSafeFnInputParseErrorNoZod<TSchemaInputOrFallback<T, never>>
    >
  > {
    if (inputSchema === undefined) {
      throw new Error("No input schema defined");
    }

    const res = await inputSchema.safeParseAsync(input);
    if (res.success) {
      return actionOk(res.data);
    }
    return actionErr({
      code: "INPUT_PARSING",
      cause: mapZodError(res.error),
    } as TSafeFnInputParseErrorNoZod<TSchemaInputOrFallback<T, never>>);
  }
  static async _parseOutput<T extends ZodTypeAny | undefined>(
    input: unknown,
    inputSchema: T,
  ): Promise<
    ActionResult<
      TSchemaOutputOrFallback<T, never>,
      TSafeFnOutputParseErrorNoZod<TSchemaInputOrFallback<T, never>>
    >
  > {
    if (inputSchema === undefined) {
      throw new Error("No input schema defined");
    }

    const res = await inputSchema.safeParseAsync(input);
    if (res.success) {
      return actionOk(res.data);
    }
    return actionErr({
      code: "OUTPUT_PARSING",
      cause: mapZodError(res.error),
    } as TSafeFnOutputParseErrorNoZod<TSchemaInputOrFallback<T, never>>);
  }

  static async _run<
    TData,
    TRunErr,
    TCtx,
    TCtxInput extends AnyCtxInput,
    TInputSchema extends TSafeFnInput,
    TOutputSchema extends TSafeFnInput,
    TUnparsedInput extends TSafeFnUnparsedInput,
  >(
    internals: TSafeFnInternals<
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >,
    callBacks: TSafeFnCallBacks<
      TData,
      TRunErr,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >,
    mapErrHandler: ((e: any) => TRunErr) | undefined,
    args: TSafeFnRunArgs<TUnparsedInput>[0],
    asProcedure: boolean,
    callbackPromises: Promise<void>[] = [],
  ): Promise<
    TSafeFnInternalRunReturn2<
      TData,
      TRunErr,
      TCtx,
      TCtxInput,
      TInputSchema,
      TOutputSchema,
      TUnparsedInput
    >
  > {
    let value: TSafeFnReturnData<TData, TOutputSchema> = undefined as TODO;
    let input: TSchemaOutputOrFallback<TInputSchema, undefined> =
      undefined as TODO;
    let ctx: TCtx | undefined = undefined;
    let ctxInput: TCtxInput = [] as TODO;
    let unsafeRawInput: TUnparsedInput = args as TUnparsedInput;

    const getError = async (
      publicError: any,
    ): Promise<
      ActionErr<
        never,
        TSafeFnInternalRunReturnError<
          TRunErr,
          TCtx,
          TCtxInput,
          TInputSchema,
          TOutputSchema,
          TUnparsedInput
        >
      >
    > => {
      if (callBacks.onError !== undefined) {
        callbackPromises.push(
          RunnableSafeFn.callbackSandbox(callBacks.onError)({
            error: publicError,
            ctx: ctx as TODO,
            ctxInput,
            input,
            // TODO: check if this is correct?
            unsafeRawInput: unsafeRawInput as TODO,
          }),
        );
      }

      if (callBacks.onComplete !== undefined) {
        callbackPromises.push(
          RunnableSafeFn.callbackSandbox(callBacks.onComplete)({
            result: err(mapErrHandler?.(publicError) ?? publicError) as TODO,
            ctx: ctx as TODO,
            ctxInput,
            input,
            unsafeRawInput: unsafeRawInput as TODO,
          }),
        );
      }

      if (!asProcedure) {
        await Promise.all(callbackPromises);
      }

      return actionErr({
        public: mapErrHandler?.(publicError) ?? publicError,
        private: {
          input,
          ctx: ctx as TODO,
          ctxInput,
          unsafeRawInput,
          handlerRes: value,
          callbackPromises,
        },
      });
    };

    try {
      if (callBacks.onStart !== undefined) {
        callbackPromises.push(
          RunnableSafeFn.callbackSandbox(callBacks.onStart)({
            unsafeRawInput: args as TODO,
          }),
        );
      }

      const parsedInputRes =
        internals.inputSchema === undefined
          ? undefined
          : await RunnableSafeFn._parseInput(args, internals.inputSchema);

      if (parsedInputRes !== undefined) {
        if (!parsedInputRes.ok) {
          return await getError(parsedInputRes.error);
        }
        input = parsedInputRes.value;
      }

      const parentRes: AnyTSafeFnInternalRunReturn2 | undefined =
        internals.parent === undefined
          ? undefined
          : await RunnableSafeFn._run(
              internals.parent._internals,
              internals.parent._callBacks,
              internals.parent._mapErrHandler,
              args,
              true,
            );

      if (parentRes !== undefined) {
        if (parentRes.ok) {
          Array.prototype.push.apply(
            callbackPromises,
            parentRes.value.callbackPromises,
          );
          ctx = parentRes.value.value;
          ctxInput = [
            ...parentRes.value.ctxInput,
            parentRes.value.input,
          ] as TODO;
        } else {
          Array.prototype.push.apply(
            callbackPromises,
            parentRes.error.private.callbackPromises,
          );
          ctxInput =
            parentRes.error.private.ctxInput === undefined
              ? []
              : ([
                  ...parentRes.error.private.ctxInput,
                  parentRes.error.private.input,
                ] as TODO);

          return await getError(parentRes.error.public);
        }
      }

      const handlerRes = await internals.handler({
        input,
        unsafeRawInput: args as TODO,
        ctx: ctx as TODO,
        ctxInput,
      });

      if (handlerRes.isErr()) {
        return await getError(handlerRes.error);
      }
      value = handlerRes.value;

      if (internals.outputSchema !== undefined) {
        const parsedOutput = await RunnableSafeFn._parseOutput(
          value,
          internals.outputSchema,
        );
        if (!parsedOutput.ok) {
          return await getError(parsedOutput.error);
        }
        value = parsedOutput.value;
      }

      if (callBacks.onSuccess !== undefined) {
        callbackPromises.push(
          RunnableSafeFn.callbackSandbox(callBacks.onSuccess)({
            value,
            input,
            ctx: ctx as TODO,
            ctxInput,
            unsafeRawInput: args as TODO,
          }),
        );
      }

      if (callBacks.onComplete !== undefined) {
        callbackPromises.push(
          RunnableSafeFn.callbackSandbox(callBacks.onComplete)({
            result: ok(value) as TODO,
            ctx: ctx as TODO,
            ctxInput,
            input,
            unsafeRawInput: args as TODO,
          }),
        );
      }

      if (!asProcedure) {
        await Promise.all(callbackPromises);
      }

      return actionOk({
        value,
        input,
        ctx: ctx as TODO,
        ctxInput,
        unsafeRawInput: args as TUnparsedInput,
        callbackPromises,
      });
    } catch (error) {
      if (isFrameworkError(error)) {
        throw error;
      }

      const handlerErr = internals.uncaughtErrorHandler(error);
      if (handlerErr.isOk()) {
        throw new Error("uncaught error handler returned ok");
      }

      if (
        asProcedure &&
        internals.uncaughtErrorHandler ===
          SafeFnBuilder.safeFnDefaultUncaughtErrorHandler
      ) {
        throw error;
      }

      return await getError(handlerErr.error);
    }
  }

  static callbackSandbox<TFn extends (...args: any[]) => void>(fn: TFn): TFn {
    return ((...args: Parameters<TFn>) => {
      try {
        return fn(...args);
      } catch (error) {
        console.error(error);
      }
    }) as TFn;
  }

  async _runAsAction(
    ...args: TSafeFnActionArgs<TUnparsedInput>
  ): TSafeFnActionReturn<TData, TRunErr, TOutputSchema> {
    const res = await RunnableSafeFn._run(
      this._internals,
      this._callBacks,
      this._mapErrHandler,
      args[0],
      false,
    );

    if (res.ok) {
      return actionOk(res.value.value);
    }
    return actionErr(res.error.public);
  }
}
