/**
 * ID type used for binding and injecting components.
 */
export type ID = string | symbol;

/**
 * Type of the injector function passed to component factories as the first argument
 */
export type Inject = <T>(id: ID) => T;

/**
 * Utility type to derive the component factory type from a component type
 */
export type FactoryOf<T> = (inject: Inject) => T;

/**
 * A general factory type.
 * This is mostly useful when defining method param types
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFactory = FactoryOf<any>;
