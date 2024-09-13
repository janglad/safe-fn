import { ResultAsync } from "neverthrow";
import { useRef, useState, useTransition } from "react";
import {
  actionResultToResult,
  type ActionResultPromiseToResultAsync,
  type ActionResultToResult,
  type AnySafeFnAction,
  type InferSafeFnActionArgs,
  type InferSafeFnActionError,
  type InferSafeFnActionOkData,
  type InferSafeFnActionReturn,
} from "safe-fn";
import type { UserServerActionCallbacks } from "./types";

type UseServerActionReturn<TAction extends AnySafeFnAction> = {
  isPending: boolean;
  isSuccess: boolean;
  result:
    | ActionResultToResult<Awaited<InferSafeFnActionReturn<TAction>>>
    | undefined;
  execute: (
    args: InferSafeFnActionArgs<TAction>,
  ) => ActionResultPromiseToResultAsync<InferSafeFnActionReturn<TAction>>;
};

const callbackCatch = (e: unknown): void => {
  console.error(e);
};

export const useServerAction = <TAction extends AnySafeFnAction>(
  action: TAction,
  callbacks: UserServerActionCallbacks<TAction>,
): UseServerActionReturn<TAction> => {
  type ActionArgs = InferSafeFnActionArgs<TAction>;
  /** Original `ActionResult<T,E>` */
  type ActionActionResult = Awaited<InferSafeFnActionReturn<TAction>>;
  /** Converted `ActionResult<T,E>` -\> `Result<T,E>` to be returned to the user  */
  type ActionResult = ActionResultToResult<ActionActionResult>;
  type ActionResultAsync = ActionResultPromiseToResultAsync<
    InferSafeFnActionReturn<TAction>
  >;

  const [result, setResult] = useState<ActionResult | undefined>(undefined);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isTransitioning, startTransition] = useTransition();

  const resolveRef = useRef<((args: ActionResult) => void) | undefined>(
    undefined,
  );

  const _execute = async (args: ActionArgs): Promise<void> => {
    if (callbacks.onStart !== undefined) {
      void ResultAsync.fromThrowable(callbacks.onStart, callbackCatch)(args);
    }

    const actionResult = (await action(args)) as ActionActionResult;
    const res = actionResultToResult(actionResult) as ActionResult;

    if (res.isOk() && callbacks.onSuccess !== undefined) {
      void ResultAsync.fromThrowable(
        callbacks.onSuccess,
        callbackCatch,
      )({
        unsafeRawInput: args,
        value: res.value as Awaited<InferSafeFnActionOkData<TAction>>,
      });
    } else if (res.isErr() && callbacks.onError !== undefined) {
      void ResultAsync.fromThrowable(
        callbacks.onError,
        callbackCatch,
      )({
        unsafeRawInput: args,
        error: res.error as Awaited<InferSafeFnActionError<TAction>>,
      });
    }

    if (callbacks.onComplete !== undefined) {
      void ResultAsync.fromThrowable(
        callbacks.onComplete,
        callbackCatch,
      )({
        unsafeRawInput: args,
        result: res as Awaited<InferSafeFnActionReturn<TAction>>,
      });
    }

    setResult(res);
    resolveRef.current?.(res);
    setIsExecuting(false);
  };

  const execute = (args: ActionArgs): ActionResultAsync => {
    const promise = new Promise((resolve) => {
      setIsExecuting(true);
      startTransition(() => {
        resolveRef.current = resolve;
        void _execute(args);
      });
    }) as Promise<ActionResult>;
    return ResultAsync.fromPromise(promise, (e) => {
      console.error("Unknown error", e);
    }).andThen((res) => res) as ActionResultAsync;
  };

  return {
    result,
    isPending: isExecuting || isTransitioning,
    isSuccess: !!result?.isOk(),
    execute,
  };
};
