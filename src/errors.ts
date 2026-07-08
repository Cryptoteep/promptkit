/**
 * promptkit — error classes
 */

/** Base class for all promptkit errors. */
export class PromptkitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PromptkitError'
  }
}

/** Thrown when prompt input fails validation. */
export class ValidationError extends PromptkitError {
  readonly input: unknown
  constructor(message: string, input?: unknown) {
    super(message)
    this.name = 'ValidationError'
    this.input = input
  }
}

/** Thrown when a template function returns a non-string. */
export class RenderError extends PromptkitError {
  constructor(message: string) {
    super(message)
    this.name = 'RenderError'
  }
}

/** Thrown when an assertion in an eval case fails. */
export class AssertionError extends PromptkitError {
  constructor(message: string) {
    super(message)
    this.name = 'AssertionError'
  }
}

/** Thrown when loading prompts from disk fails. */
export class LoaderError extends PromptkitError {
  readonly path: string
  constructor(message: string, path: string) {
    super(message)
    this.name = 'LoaderError'
    this.path = path
  }
}
