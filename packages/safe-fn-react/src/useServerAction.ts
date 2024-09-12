import { ResultAsync } from "neverthrow";
import { useRef, useState, useTransition } from "react";
import {
  actionResultToResult,
  type ActionResultPromiseToResultAsync,
  type ActionResultToResult,
  type AnySafeFnAction,
  type InferSafeFnActionArgs,
  type InferSafeFnActionReturn,
} from "safe-fn";

type UseServerActionReturn<
  TAction extends AnySafeFnAction,
  THotActionActionResult = InferSafeFnActionReturn<TAction>,
  // Original `ActionResult<T,E>`
  TActionActionResult = Awaited<THotActionActionResult>,
  // Converted `ActionResult<T,E>` -> `Result<T,E>` to be returned to the user
  TActionResult = ActionResultToResult<TActionActionResult>,
  TActionResultAsync = ActionResultPromiseToResultAsync<THotActionActionResult>,
> = {
  isPending: boolean;
  isSuccess: boolean;
  result: TActionResult | undefined;
  execute: (args: InferSafeFnActionArgs<TAction>) => TActionResultAsync;
};

export const useServerAction = <TAction extends AnySafeFnAction>(
  action: TAction,
): UseServerActionReturn<TAction> => {
  type ActionArgs = InferSafeFnActionArgs<TAction>;
  type THotActionActionResult = InferSafeFnActionReturn<TAction>;
  /** Original `ActionResult<T,E>` */
  type ActionActionResult = Awaited<THotActionActionResult>;
  /** Converted `ActionResult<T,E>` -\> `Result<T,E>` to be returned to the user  */
  type ActionResult = ActionResultToResult<ActionActionResult>;
  type ActionResultAsync =
    ActionResultPromiseToResultAsync<THotActionActionResult>;

  const [result, setResult] = useState<ActionResult | undefined>(undefined);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isTransitioning, startTransition] = useTransition();

  const resolveRef = useRef<((args: ActionResult) => void) | undefined>(
    undefined,
  );

  const _execute = async (args: ActionArgs): Promise<void> => {
    const res = (await action(args)) as ActionActionResult;
    const converted = actionResultToResult(res) as ActionResult;
    setResult(converted);
    resolveRef.current?.(converted);
    setIsExecuting(false);
  };

  const execute = (args: ActionArgs): ActionResultAsync => {
    const promise = new Promise((resolve) => {
      setIsExecuting(true);
      startTransition(() => {
        resolveRef.current = resolve;
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        _execute(args);
      });
    }) as Promise<ActionResult>;
    return ResultAsync.fromPromise(
      promise,
      () => new Error("Unknown error"),
    ).andThen((res) => res) as ActionResultAsync;
  };

  return {
    result,
    isPending: isExecuting || isTransitioning,
    isSuccess: !!result?.isOk(),
    execute: execute,
  };
};
