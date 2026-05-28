import type { ZodTypeAny } from 'zod'

export function safeParseOrThrow<T extends ZodTypeAny>(schema: T, data: unknown) {
  const res = schema.safeParse(data)
  if (!res.success) {
    const issues = res.error.issues.map(i => ({
      code: i.code,
      path: i.path,
      message: i.message,
      // zod internal kadang punya expected
      expected: (i as any).expected,
    }))
    const err = new Error(JSON.stringify(issues))
    ;(err as any).issues = issues
    throw err
  }
  return res.data
}
