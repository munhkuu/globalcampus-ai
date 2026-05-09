export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/** Extract a human-readable string from any thrown value. */
export function formatError(error: unknown): string {
  if (error instanceof AppError) return error.message
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unexpected error occurred'
}

/** Wrap an async function and return a typed ActionResult instead of throwing. */
export async function safeAction<T>(
  fn: () => Promise<T>
): Promise<{ data: T; error?: never } | { data?: never; error: string }> {
  try {
    const data = await fn()
    return { data }
  } catch (err) {
    return { error: formatError(err) }
  }
}
