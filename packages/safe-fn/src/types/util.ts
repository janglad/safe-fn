export type TODO = any;
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type IsUnknown<T> = unknown extends T ? true : false;
export type DistributeUnion<T> = T extends any ? T : never;

export type TOrFallback<T, TFallback, TFilter = never> = [T] extends [TFilter]
  ? TFallback
  : T;
export type MaybePromise<T> = T | Promise<T>;

/**
 * Return `A` & `B` if `A` is not `T` and `B` is not `T`, otherwise return `A` or `B` depending on if they are `T`.
 */
export type UnionIfNotT<A, B, T> = [A] extends [T]
  ? [B] extends [T]
    ? T
    : B
  : [B] extends [T]
    ? A
    : A & B;

/**
 * Convert a type to a tuple.
 * @param T the type to convert
 * @returns an empty tuple if the type is `never`, otherwise the type itself
 */
export type TToTuple<T> = [T] extends [never] ? [] : [T];
