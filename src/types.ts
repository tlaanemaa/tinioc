/**
 * Dependency ID type.
 * This is what will be used to register them.
 */
export type ID = string | symbol;

/**
 * Inject function to allow bringing in additional dependencies
 */
export type Inject = <T>(id: ID) => T;

/**
 * Utility type to derive the dependency factory type from dependency type
 */
export type FactoryOf<T> = (inject: Inject) => T;
