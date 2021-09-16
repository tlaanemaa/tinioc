import { FactoryOf } from "./types";

/**
 * Declare an injectable dependency
 */
export const declareDependency = <T>(dependency: FactoryOf<T>): FactoryOf<T> =>
  dependency;
