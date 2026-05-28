// Global Error Response Types

/**
 * Standard error messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check the form and correct any errors.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  CONFLICT: 'A conflict occurred. The resource may have been modified.',
  TOO_MANY_REQUESTS: 'Too many requests. Please wait and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
  error: boolean
  status: number
  message: string
  errors?: Record<string, string[]>
  data?: unknown
}

/**
 * Validation error structure (422 responses)
 */
export interface ValidationErrorResponse extends ApiErrorResponse {
  status: 422
  errors: Record<string, string[]>
}

/**
 * Client error structure (400-499 responses)
 */
export interface ClientErrorResponse extends ApiErrorResponse {
  status: 400 | 401 | 403 | 404 | 409 | 422 | 429
}

/**
 * Server error structure (500-599 responses)
 */
export interface ServerErrorResponse extends ApiErrorResponse {
  status: 500 | 502 | 503 | 504
}

/**
 * Network/Fetch error structure
 */
export interface NetworkError extends Error {
  name: 'NetworkError'
  cause?: unknown
}

/**
 * Generic error structure that covers all possible error scenarios
 */
export interface GenericError {
  data: {
    status?: number
    statusCode?: number
    data?: ApiErrorResponse
    message?: string
    errors?: Record<string, string[]>
  }
  [key: string]: unknown
}

/**
 * Form error actions interface for error handling in forms
 */
export interface FormErrorActions {
  resetForm: () => void
  setFieldError: (field: string, message: string) => void
  setErrors: (errors: Record<string, string>) => void
  clearErrors: () => void
}

/**
 * Error handler result type
 */
export interface ErrorHandlerResult {
  handled: boolean
  shouldCloseForm: boolean
  showDialog: boolean
  message?: string
}

/**
 * Common HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const

/**
 * Error type guards
 */
export function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === 'object'
    && error !== null
    && 'error' in error
    && 'status' in error
    && 'message' in error
  )
}

export function isValidationError(error: unknown): error is ValidationErrorResponse {
  return (
    isApiErrorResponse(error)
    && error.status === HTTP_STATUS.UNPROCESSABLE_ENTITY
    && 'errors' in error
    && typeof error.errors === 'object'
    && error.errors !== null
  )
}

export function isClientError(error: unknown): error is ClientErrorResponse {
  return (
    isApiErrorResponse(error)
    && error.status >= 400
    && error.status < 500
  )
}

export function isServerError(error: unknown): error is ServerErrorResponse {
  return (
    isApiErrorResponse(error)
    && error.status >= 500
    && error.status < 600
  )
}

export function isNetworkError(error: unknown): error is NetworkError {
  return (
    error instanceof Error
    && error.name === 'NetworkError'
  )
}

export function toError(err: unknown): Error {
  if (err instanceof Error)
    return err
  return new Error(
    typeof err === 'string' ? err : 'Unknown error',
  )
}

export function getErrorMessage(error: unknown, fallback: string = ERROR_MESSAGES.UNKNOWN_ERROR): string {
  if (isNetworkError(error)) {
    return ERROR_MESSAGES.NETWORK_ERROR
  }

  if (typeof error === 'object' && error !== null && 'data' in error) {
    const e = error as GenericError

    return (
      e.data?.message
      ?? e.data?.data?.message
      ?? fallback
    )
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}
