import { BindingNotFoundError } from "./utils";

/**
 * Dependency ID type.
 * This is what will be used to register them.
 */
type ID = string | symbol;

/**
 * Inject function type that allows bringing in additional dependencies
 */
export type Inject = <T>(id: ID) => T;

/**
 * Utility type to derive the dependency factory type from dependency type
 */
type FactoryOf<T> = (inject: Inject) => T;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFactory = FactoryOf<any>;

/**
 * Dependency injection container
 */
export class Container {
  /**
   * Parent container.
   *
   * Any binding that is not found in this container will be looked for in the parent, if it exists.
   */
  public parent?: Container;

  private readonly bindings: Record<ID, AnyFactory> = {};

  /**
   * Returns all binding IDs currently kept in this container
   */
  private getBindingIds() {
    return [
      ...Object.getOwnPropertySymbols(this.bindings),
      ...Object.getOwnPropertyNames(this.bindings),
    ];
  }

  /**
   * Register a new binding
   */
  public bind<T>(id: ID, value: FactoryOf<T>): this {
    this.bindings[id] = value;
    return this;
  }

  /**
   * Get a binding from local or parent's bindings
   */
  private _get(id: ID): AnyFactory | undefined {
    return this.bindings[id] ?? this.parent?._get(id);
  }

  /**
   * Get a binding
   */
  public get<T>(id: ID): T {
    const binding = this._get(id);
    if (typeof binding !== "function") throw new BindingNotFoundError(id);

    return binding(this.get.bind(this));
  }

  /**
   * Creates and returns a child container
   */
  public createChild(): Container {
    const childContainer = new Container();
    childContainer.parent = this;
    return childContainer;
  }

  /**
   * Merge given containers together into a new container.
   * The new container will have no relation to the provided containers,
   * its a fresh copy with all the bindings rebound to it.
   *
   * **PS!** Only bindings from the containers themselves will be copied.
   * The parents of the containers will not be looked at.
   */
  static merge(...containers: Container[]): Container {
    const mergedContainer = new Container();

    containers.forEach((container) => {
      container.getBindingIds().forEach((id) => {
        mergedContainer.bind(id, container.bindings[id]);
      });
    });

    return mergedContainer;
  }
}
