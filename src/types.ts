/**
 * Dependency ID type.
 * This is what will be used to register them.
 */
export type ID = string | symbol;

/**
 * This is the context that gets passed into each dependency on initialization
 */
export type Context = {
  readonly get: <T>(id: ID) => T;
};

/**
 * Utility type to derive the dependency factory type from dependency type
 */
export type FactoryOf<T> = (context: Context) => T;
