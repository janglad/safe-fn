import type { AnyRunnableSafeFn } from "../runnable-safe-fn";
import type { TSafeFnUnparsedInput } from "./schema";

/*
################################
||                            ||
||          Internal          ||
||                            ||
################################
*/
export type TODO = any;
export type TPrettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type TOrFallback<T, TFallback, TFilter = never> = [T] extends [TFilter]
  ? TFallback
  : T;
export type TMaybePromise<T> = T | Promise<T>;

/**
 * Return `A` & `B` if `A` is not `T` and `B` is not `T`, otherwise return `A` or `B` depending on if they are `T`.
 */
export type TIntersectIfNotT<A, B, T> = [A] extends [T]
  ? [B] extends [T]
    ? T
    : B
  : [B] extends [T]
    ? A
    : A & B;

export type AnyObject = Record<PropertyKey, unknown>;

export type FirstTupleElOrUndefined<T extends TSafeFnUnparsedInput> =
  T extends [] ? undefined : T[0];

export type TIsAny<T> = 0 extends 1 & T ? true : false;

export type IsAnyRunnableSafeFn<T> = T extends AnyRunnableSafeFn ? true : false;
