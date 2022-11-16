import { RequestHandler, Router, RouterOptions } from 'express'
import type { Middleware, Mutations, todo } from './middleware'

// This is an immutable abstraction over an actual express router.
// In future, however, we can implement our own router from scratch (only ~1k lines, see https://github.com/pillarjs/router)
export class ControllerBuilder<M extends Record<any, any>[] = []> {
  private router: Router

  constructor(params?: RouterOptions) {
    this.router = Router(params)
  }

  use<Out extends Record<any, any>[] = []>(
    middleware: Middleware<Mutations<M>, Out>,
  ): ControllerBuilder<[...M, ...Out]> {
    const cloned = this.clone<Out>()
    cloned.router.use(middleware as unknown as RequestHandler)
    return cloned
  }

  all<Out extends Record<any, any>[] = []>(
    path: string,
    middleware: Middleware<Mutations<M>, Out>,
  ): ControllerBuilder<[...M, ...Out]>
  all<Out extends Record<any, any>[] = []>(
    middleware: Middleware<Mutations<M>, Out>,
  ): ControllerBuilder<[...M, ...Out]>
  all<Out extends Record<any, any>[] = []>(
    ...args:
      | [middleware: Middleware<Mutations<M>, Out>]
      | [path: string, middleware: Middleware<Mutations<M>, Out>]
  ): ControllerBuilder<[...M, ...Out]> {
    const cloned = this.clone<Out>()
    const [path, middleware] = args.length === 2 ? args : ['*', args[0]]
    cloned.router.all(path, middleware as unknown as RequestHandler)
    return cloned
  }

  build(): Router {
    return this.clone().router
  }

  private clone<Out extends Record<any, any>[] = []>(): ControllerBuilder<[...M, ...Out]> {
    const cloned = new ControllerBuilder<[...M, ...Out]>()
    const sourceRouter = this.router as any
    const targetRouter = cloned.router as any

    targetRouter.params = { ...sourceRouter.params }
    targetRouter._params = [...sourceRouter._params]
    targetRouter.caseSensitive = sourceRouter.caseSensitive
    targetRouter.mergeParams = sourceRouter.mergeParams
    targetRouter.strict = sourceRouter.strict
    targetRouter.stack = [...sourceRouter.stack]

    return cloned
  }
}
