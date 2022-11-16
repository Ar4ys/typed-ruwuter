import type { MergeMutations } from './middleware'

/**
 * Performs a deep merge of `source` into `target`.
 * Mutates target.
 * Can copy values by reference
 */
export function mergeMutations<T extends Record<any, any>, U extends Record<any, any>>(
  target: T,
  source: U,
): MergeMutations<T, U> {
  const isObject = (obj: unknown): obj is object => Boolean(obj) && typeof obj === 'object'

  if (!isObject(target)) {
    throw new Error('mergeMutations target must be an object')
  } else if (!isObject(source)) {
    throw new Error('mergeMutations source must be an object')
  }

  // Deep merging is hard to type correctly so we use `any`
  const anyTarget = target as any

  for (const [key, sourceValue] of Object.entries(source)) {
    const targetValue = anyTarget[key]

    // TODO: What should we do with arrays?
    // if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
    //   anyTarget[key] = targetValue.concat(sourceValue);
    // }

    if (isObject(targetValue) && isObject(sourceValue)) {
      anyTarget[key] = mergeMutations({ ...targetValue }, sourceValue)
    } else {
      anyTarget[key] = sourceValue
    }
  }

  return anyTarget
}
