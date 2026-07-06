/**
 * Safely extract a route parameter as a string.
 * Express 5 types params as `string | string[]` — this asserts it's a string.
 * Throws if the param is missing or is an array.
 */
export function param(value: string | string[] | undefined): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && value.length > 0) return value[0]!
  throw new Error('Missing or invalid route parameter')
}
