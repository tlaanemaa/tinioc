import { FactoryOf } from "./types";

/**
 * Declare an injectable component.
 *
 * This function is mostly useful for the types it provides. It doesn't do anything
 * with the argument provided to it and just passes it through.
 */
export const declareInjectable = <T>(binding: FactoryOf<T>): FactoryOf<T> =>
  binding;

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
