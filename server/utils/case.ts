// Utility transform snake_case <-> camelCase (deep)
const isObject = (v: any) => v && typeof v === 'object' && !Array.isArray(v)

const camelKey = (k: string) => k.replace(/[_-](\w)/g, (_, c) => c.toUpperCase())
const snakeKey = (k: string) => k.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`)

export function toCamel(input: any): any {
  if (Array.isArray(input))
    return input.map(toCamel)
  if (!isObject(input))
    return input
  return Object.fromEntries(
    Object.entries(input).map(([k, v]) => [camelKey(k), toCamel(v)]),
  )
}

export function toSnake(input: any): any {
  if (Array.isArray(input))
    return input.map(toSnake)
  if (!isObject(input))
    return input
  return Object.fromEntries(
    Object.entries(input).map(([k, v]) => [snakeKey(k), toSnake(v)]),
  )
}
