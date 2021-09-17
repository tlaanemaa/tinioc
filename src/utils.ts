import { FactoryOf } from "./types";

/**
 * Declare an injectable dependency.
 *
 * This function is mostly useful for the types it provides. It doesn't do anything
 * with the argument provided to it and just passes it through.
 */
export const declareDependency = <T>(dependency: FactoryOf<T>): FactoryOf<T> =>
  dependency;

/**
 * Error class for dependency-not-found errors.
 *
 * This can be used to in an `instanceof` check to see if the error was thrown because
 * a dependency was not found.
 */
export class DependencyNotFoundError extends Error {
  constructor(id: string | symbol) {
    super(`Dependency "${String(id)}" not found!`);
  }
}
