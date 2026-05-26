// server/utils/is-mock.ts
export function isMock(event?: any) {
  const rc = event ? useRuntimeConfig(event) : useRuntimeConfig()
  const flag = rc.public?.mock
  const hdr = event ? (getRequestHeader(event, 'x-mock') || '') : ''
  // true untuk true | 'true' | '1' atau header X-Mock: 1/true
  return flag === true || String(flag) === 'true' || String(flag) === '1' || hdr === '1' || hdr.toLowerCase() === 'true'
}
