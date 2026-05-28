import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts empty strings to null while preserving other values.
 * Useful for normalizing form data before sending to API endpoints.
 *
 * @param v - The value to normalize (string, null, or undefined)
 * @returns null if value is empty string, otherwise returns the original value or null
 *
 * @example
 * nil('') // returns null
 * nil('hello') // returns 'hello'
 * nil(null) // returns null
 * nil(undefined) // returns null
 */
export function nil(v?: string | null) {
  return v === '' ? null : v ?? null
}
