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
  ActionResult = InferSafeFnActionReturn<TAction>,
  Result = ActionResultToResult<ActionResult>,
> = {
  isPending: boolean;
  isSuccess: boolean;
  result: Result | undefined;
  execute: (args: InferSafeFnActionArgs<TAction>) => Promise<Result>;
};

export const useServerAction = <TAction extends AnySafeFnAction>(
  action: TAction,
): UseServerActionReturn<TAction> => {
  type ActionResult = InferSafeFnActionReturn<TAction>;
  type ActionArgs = InferSafeFnActionArgs<TAction>;

  const [result, setResult] = useState<
    ActionResultToResult<ActionResult> | undefined
  >(undefined);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isTransitioning, startTransition] = useTransition();

  const resolveRef = useRef<
    ((args: ActionResultToResult<ActionResult>) => void) | undefined
  >(undefined);

  const _execute = async (args: ActionArgs): Promise<void> => {
    const res = (await action(args)) as ActionResult;
    const converted = actionResultToResult(
      res,
    ) as ActionResultToResult<ActionResult>;
    setResult(converted);
    resolveRef.current?.(converted);
    setIsExecuting(false);
  };

  const execute = async (
    args: ActionArgs,
  ): Promise<ActionResultToResult<ActionResult>> => {
    return new Promise((resolve) => {
      setIsExecuting(true);
      startTransition(() => {
        resolveRef.current = resolve;
        _execute(args).catch((e: unknown) => {
          // TODO: Handle error
          throw e;
        });
      });
    }) as Promise<ActionResultToResult<ActionResult>>;
  };

  return {
    result,
    isPending: isExecuting || isTransitioning,
    isSuccess: !!result?.isOk(),
    execute: execute,
  };
};
