import type { NextFunction, Request, Response } from 'express'
import { mergeMutations } from './merge-mutations'

type MergeRecordsOrReturnLast<T, U> = T extends Record<any, unknown>
  ? U extends Record<any, unknown>
    ? Remap<MergeMutations<T, U>>
    : U
  : U

/**
 * `Remap` type is a cool TS trickery.
 * If we have complex nested object made using types like `MergeMutations`, TS will show most of
 * those types when user "peeks" type definition in editor, even if they can be compiled to much
 * smaller result object. `Remap` does exactly this - it just loops over all fields in an object
 * and reassign them in order to force TS to show simple object type, without all intermediate types.
 *
 * TODO: Should we really care about "peek type definition" readability?
 * This hugely impacts our flexibility, as type structure becomes a public interface, instead of
 * being an implementation detail. We will need to either:
 * - limit ourselves to type structures, that are considered "human readable"
 * - make public facing wrappers that will hide private types (like {@link Mutations Mutations})
 *
 * Other similar projects:
 * - {@link https://trpc.io/ tRPC} - does not care at all about this problem
 */
type Remap<U> = U extends infer O ? { [K in keyof O]: O[K] } : never

// prettier-ignore
export type MergeMutations<T, U> = (
  & Omit<T, keyof U>
  & Omit<U, keyof T>
  & { [K in keyof T & keyof U]: MergeRecordsOrReturnLast<T[K], U[K]>; }
);

type MergeMutationsList<T extends unknown[]> = T extends [infer U, ...infer X]
  ? X extends []
    ? U
    : MergeMutations<U, MergeMutationsList<X>>
  : unknown

/**
 * `Mutations` interface is a cool TS trickery.
 * When user 'peeks' type definition in editor - TS "compiles" types and shows user end result...
 * except interfaces. If TS stumbles upon an interface - it leaves it as is. This little trick gives
 * us ability to hide `MergeMutations` callback-hell and instead show user a clean list of mutations.
 *
 * In ideal world we would like to make `Middleware` accept input mutations tuple directly, so that type
 * peek can be even cleaner, without `Mutations<>`. But it is not possible because of the way TS handles
 * tuples: `Generic<[1, 2]>` is not assignable to `Generic<[string]>`, which is roughly what is going on
 * in `ControllerBuilder` under the hood.
 *
 * @example
 * ```ts
 * const middleware = middlewareWrapper<[WithAuth, WithBody, WithHeader], []>(() => {});
 * // Peek Type with Mutations
 * const middleware: Middleware<Mutations<[WithAuth, WithBody, WithHeader]>, []>;
 * // Peek Type without Mutations
 * const middleware: Middleware<MergeMutations<WithAuth, MergeMutations<WithBody, WithHeader>>, []>
 * ```
 */
export interface Mutations<T extends unknown[]> {
  _: MergeMutationsList<T>
}

const MiddlewareOutType = Symbol('MiddlewareOutBrand')

export type UnknownRequest = Request<unknown, unknown, unknown, unknown>

export interface Middleware<
  In extends Mutations<Record<any, any>[]>,
  Out extends Record<any, any>[],
> {
  [MiddlewareOutType]?: Out
  (
    req: MergeMutations<UnknownRequest, In['_']>,
    // We cannot check `In`, because then TS starts comparing tuples and throws errors,
    // when tuples are of different size/structure
    // req: unknown extends In['_'] ? UnknownRequest : MergeMutations<UnknownRequest, In['_']>,
    res: Response,
    next: NextFunction,
  ): Promise<void> | void
}

// TODO: Better Name. Maybe `MiddlewareHandler`?
interface MiddlewareFunc<In extends Mutations<Record<any, any>[]>, Out extends Record<any, any>[]> {
  [MiddlewareOutType]?: Out
  (req: MergeMutations<UnknownRequest, In['_']>, res: Response):
    | Out
    | MergeMutationsList<Out>
    | Promise<Out | MergeMutationsList<Out>>
}

export function middlewareWrapper<In extends Record<any, any>[], Out extends Record<any, any>[]>(
  middleware: MiddlewareFunc<Mutations<In>, Out>,
): Middleware<Mutations<In>, Out> {
  return async (request, response, next) => {
    try {
      const mutations = await middleware(request, response)
      // Middleware can return nothing if `Out` is an empty tuple
      if (!mutations) return next()
      const mutationsList = Array.isArray(mutations) ? mutations : [mutations]
      for (const mutation of mutationsList) mergeMutations(request, mutation)
      // TODO: Is it safe to call `next` after sending response? How express will react to it?
      next()
    } catch (error) {
      next(error)
    }
  }
}
