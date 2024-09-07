import { useRef, useState, useTransition } from "react";
import {
  actionResultToResult,
  type ActionResultToResult,
  type AnySafeFnAction,
  type InferSafeFnActionArgs,
  type InferSafeFnActionReturn,
} from "safe-fn";

type UseServerActionReturn<
  TAction extends AnySafeFnAction,
  // Original `ActionResult<T,E>`
  TActionActionResult = Awaited<InferSafeFnActionReturn<TAction>>,
  // Converted `ActionResult<T,E>` -> `Result<T,E>` to be returned to the user
  TActionResult = ActionResultToResult<TActionActionResult>,
> = {
  isPending: boolean;
  isSuccess: boolean;
  result: TActionResult | undefined;
  execute: (args: InferSafeFnActionArgs<TAction>) => Promise<TActionResult>;
};

export const useServerAction = <TAction extends AnySafeFnAction>(
  action: TAction,
): UseServerActionReturn<TAction> => {
  type ActionArgs = InferSafeFnActionArgs<TAction>;
  /** Original `ActionResult<T,E>` */
  type ActionActionResult = Awaited<InferSafeFnActionReturn<TAction>>;
  /** Converted `ActionResult<T,E>` -\> `Result<T,E>` to be returned to the user  */
  type ActionResult = ActionResultToResult<ActionActionResult>;

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

  const execute = async (args: ActionArgs): Promise<ActionResult> => {
    return new Promise((resolve) => {
      setIsExecuting(true);
      startTransition(() => {
        resolveRef.current = resolve;
        _execute(args).catch((e: unknown) => {
          // TODO: Handle error
          throw e;
        });
      });
    }) as Promise<ActionResult>;
  };

  return {
    result,
    isPending: isExecuting || isTransitioning,
    isSuccess: !!result?.isOk(),
    execute: execute,
  };
};
