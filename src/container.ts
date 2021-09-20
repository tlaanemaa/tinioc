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
   * Parent containers.
   *
   * Any binding that is not found in this container will be looked for in the parents, if they exists.
   */
  public parents: Container[] = [];

  /**
   * Bindings map
   */
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
   * Get a binding from local or parents' bindings
   */
  private _get(id: ID): AnyFactory | undefined {
    if (this.bindings[id]) return this.bindings[id];

    const parentWithBinding = this.parents.find((parent) => parent._get(id));
    return parentWithBinding?._get(id);
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
   * Extends the container's array of parents with the given containers.
   * This makes the given containers' contents available to this container,
   * effectively creating a dependency relationship.
   *
   * For example, if some components in your container depend on some components
   * in another container then you should extend your container with that other container
   * to make those dependencies available for your components.
   *
   * This will append to the list of parents, if a new unique container is provided, and not overwrite it.
   */
  public extend(...containers: Container[]): this {
    containers.forEach((container) => {
      if (!this.parents.includes(container)) {
        this.parents.push(container);
      }
    });

    return this;
  }

  /**
   * Creates and returns a child container
   */
  public createChild(): Container {
    const childContainer = new Container();
    childContainer.extend(this);
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
