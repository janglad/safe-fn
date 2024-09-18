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
