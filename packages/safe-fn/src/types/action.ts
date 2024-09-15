import type {
  InferActionErrError,
  InferActionOkData,
  ResultAsyncToActionResult,
} from "../result";
import type { AnyRunnableSafeFn } from "../runnable-safe-fn";
import type { SafeFnReturn, SafeFnRunArgs } from "../types/run";
import type { AnySafeFnCatchHandlerRes } from "./error";
import type { AnySafeFnHandlerRes } from "./handler";
import type { SafeFnInput, SafeFnOutput } from "./schema";

export type AnySafeFnAction = SafeFnAction<any, any, any, any, any, any>;

/**
 * @param T the action created through `createAction()`
 * @returns the return value of the action after execution without throwing. This is a `ActionResult<T,E>`.
 */
export type InferSafeFnActionReturn<T extends AnySafeFnAction> = Awaited<
  ReturnType<T>
>;
/**
 * @param T the action created through `createAction()`
 * @returns the input necessary to run the action.
 */
export type InferSafeFnActionArgs<T extends AnySafeFnAction> = Parameters<T>[0];

/**
 * @param T the action created through `createAction()`
 * @returns the `.value` type of the returned `ActionResult` assuming it's ok
 */
export type InferSafeFnActionOkData<T extends AnySafeFnAction> =
  InferActionOkData<InferSafeFnActionReturn<T>>;

/**
 * @param T the action created through `createAction()`
 * @returns the `.error` type of the returned `ActionResult` assuming it's not ok
 */
export type InferSafeFnActionError<T extends AnySafeFnAction> =
  InferActionErrError<InferSafeFnActionReturn<T>>;

/**
 * @param TUnparsedInput the unparsed input type. Either inferred from TInputSchema or provided by `unparsedInput<>()`
 * @param TParent the parent safe function or undefined
 * @returns the input necessary to run the action created through `createAction()`.
 */
export type SafeFnActionArgs<TUnparsedInput> = SafeFnRunArgs<TUnparsedInput>;

export type SafeFnActionReturn<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends SafeFnInput,
  in out TOutputSchema extends SafeFnOutput,
  in out THandlerRes extends AnySafeFnHandlerRes,
  in out TCatchHandlerRes extends AnySafeFnCatchHandlerRes,
> = Promise<
  ResultAsyncToActionResult<
    SafeFnReturn<
      TParent,
      TInputSchema,
      TOutputSchema,
      THandlerRes,
      TCatchHandlerRes,
      true
    >
  >
>;
export type SafeFnAction<
  in out TParent extends AnyRunnableSafeFn | undefined,
  in out TInputSchema extends SafeFnInput,
  in out TOutputSchema extends SafeFnOutput,
  in out TUnparsedInput,
  in out THandlerRes extends AnySafeFnHandlerRes,
  in out TCatchHandlerRes extends AnySafeFnCatchHandlerRes,
> = (
  ...args: SafeFnActionArgs<TUnparsedInput>
) => SafeFnActionReturn<
  TParent,
  TInputSchema,
  TOutputSchema,
  THandlerRes,
  TCatchHandlerRes
>;
