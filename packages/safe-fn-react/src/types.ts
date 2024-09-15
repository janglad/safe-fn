import type {
  AnySafeFnAction,
  InferSafeFnActionArgs,
  InferSafeFnActionError,
  InferSafeFnActionOkData,
  InferSafeFnActionReturn,
} from "safe-fn";

export type UseServerActionOnStartArgs<TAction extends AnySafeFnAction> = {
  unsafeRawInput: InferSafeFnActionArgs<TAction>;
};
export type UseServerActionOnStart<TAction extends AnySafeFnAction> = (
  args: UseServerActionOnStartArgs<TAction>,
) => Promise<void>;

export type UseServerActionOnErrorArgs<TAction extends AnySafeFnAction> = {
  unsafeRawInput: InferSafeFnActionArgs<TAction>;
  error: InferSafeFnActionError<TAction>;
};
export type UseServerActionOnError<TAction extends AnySafeFnAction> = (
  args: UseServerActionOnErrorArgs<TAction>,
) => Promise<void>;

export type UseServerActionOnSuccessArgs<TAction extends AnySafeFnAction> = {
  unsafeRawInput: InferSafeFnActionArgs<TAction>;
  value: InferSafeFnActionOkData<TAction>;
};
export type UseServerActionOnSuccess<TAction extends AnySafeFnAction> = (
  args: UseServerActionOnSuccessArgs<TAction>,
) => Promise<void>;

export type UseServerActionOnCompleteArgs<TAction extends AnySafeFnAction> = {
  unsafeRawInput: InferSafeFnActionArgs<TAction>;
  // Result can be undefined when navigating away from the page
  result: InferSafeFnActionReturn<TAction> | undefined;
};
export type UseServerActionOnComplete<TAction extends AnySafeFnAction> = (
  args: UseServerActionOnCompleteArgs<TAction>,
) => Promise<void>;

export type UserServerActionCallbacks<TAction extends AnySafeFnAction> = {
  onStart?: UseServerActionOnStart<TAction>;
  onSuccess?: UseServerActionOnSuccess<TAction>;
  onError?: UseServerActionOnError<TAction>;
  onComplete?: UseServerActionOnComplete<TAction>;
};
