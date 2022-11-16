import express from 'express'
import { ControllerBuilder } from '../src/controller'
import { middlewareWrapper } from '../src/middleware'

const app = express()

interface WithIdParam {
  params: {
    id: number
  }
}

const paramsValidator = middlewareWrapper<[], [WithIdParam]>(request => {
  console.log('Validating request params: `id` must be number')

  if (Number.isNaN(Number(request.params.id)))
    throw new Error('Validation Error: param `id` must be number')

  return {
    params: {
      id: Number(request.params.id),
    },
  }
})

interface WithAuth {
  user: {
    id: number
    name: string
  }
}

const users = [{ id: 0, name: 'User' }]

const authGuard = middlewareWrapper<[WithIdParam], [WithAuth]>(request => {
  console.log('Authenticating user...')
  const user = users[request.params.id]
  if (!user) throw new Error('Forbidden')
  return { user }
})

const testController = new ControllerBuilder({ mergeParams: true })
  .use(paramsValidator)
  .use(authGuard)
  .all(async (request, response) => {
    console.log('Sending response...')
    response
      .status(200)
      .send(`Hello fellow user with name "${request.user.name}" and id "${request.user.id}"\n`)
  })

app.get('/:id', testController.build())
app.listen(5000, () => console.log('App listening on port 5000'))
