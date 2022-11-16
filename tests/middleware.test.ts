import { middlewareWrapper } from '../src/middleware'
import assert from 'node:assert/strict'

interface WithUser {
  user: {
    id: string
  }
}

interface WithBody {
  body: {
    name: number
  }
}

const withUser = middlewareWrapper<[], [WithUser]>(req => {
  return {
    user: {
      id: '0',
    },
  }
})

const withUserArr = middlewareWrapper<[], [WithUser]>(req => {
  return [
    {
      user: {
        id: '0',
      },
    },
  ]
})

const withUserAndBody = middlewareWrapper<[], [WithUser, WithBody]>(req => {
  return {
    user: {
      id: '0',
    },
    body: {
      name: 1,
    },
  }
})

const withUserAndBodyArr = middlewareWrapper<[], [WithUser, WithBody]>(req => {
  return [
    {
      user: {
        id: '0',
      },
    },
    {
      body: {
        name: 1,
      },
    },
  ]
})

const testRequest = async (
  obj: object,
  func: (req: any, res: any, next: () => void) => void | Promise<void>,
) => {
  await func(obj, {}, () => {})
  return obj
}

async function test() {
  assert.deepEqual(await testRequest({}, withUser), {
    user: {
      id: '0',
    },
  })
  assert.deepEqual(await testRequest({}, withUserArr), {
    user: {
      id: '0',
    },
  })
  assert.deepEqual(await testRequest({ user: { test: true } }, withUserAndBody), {
    user: {
      test: true,
      id: '0',
    },
    body: {
      name: 1,
    },
  })
  assert.deepEqual(await testRequest({}, withUserAndBodyArr), {
    user: {
      id: '0',
    },
    body: {
      name: 1,
    },
  })
}

test().then(() => console.log('Cool!'))
