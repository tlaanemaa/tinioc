/**
 * Error class for binding-not-found errors.
 *
 * This can be used to in an `instanceof` check to see if the error was thrown because
 * a binding was not found.
 */
export class BindingNotFoundError extends Error {
  constructor(id: string | symbol) {
    super(`Binding "${String(id)}" not found!`);
  }
}
