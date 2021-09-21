import { BindingNotFoundError } from "./utils";

type ID = string | symbol;

/**
 * Type of the injector function passed to component factories as the first argument
 */
export type Inject = <T>(id: ID) => T;

/**
 * Utility type to derive the component factory type from a component type
 */
type FactoryOf<T> = (inject: Inject) => T;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFactory = FactoryOf<any>;

export class Container {
  /**
   * Array of parent containers
   *
   * These allow setting up parent-child relationships between containers, thus enabling
   * hierarchical dependency injection systems. Multiple parents are supported so you can essentially
   * make your container "inherit" from several other containers
   */
  public parents: Container[] = [];
  private readonly bindings = new Map<ID, AnyFactory>();

  /**
   * Register an id with a component in the container.
   *
   * You can make use of the generic type on this method to enforce that the
   * registered component matches the required interface.
   *
   * Example:
   * ```ts
   * container.bind<IMyComponent>(MY_COMPONENT, myComponent)
   * ```
   * ---
   * The registered binding can later be injected with the `inject` function like so:
   * ```ts
   * const component = inject<IMyComponent>(MY_COMPONENT);
   * ```
   * It is suggested you keep your dependency ids and types close to each other,
   * preferably in a separate `bindings` file. This makes them easy to use and improves
   * maintainability.
   */
  public bind<T>(id: ID, value: FactoryOf<T>): this {
    this.bindings.set(id, value);
    return this;
  }

  private _get(id: ID): AnyFactory | undefined {
    if (this.bindings.has(id)) return this.bindings.get(id);

    for (let i = 0; i < this.parents.length; i += 1) {
      const binding = this.parents[i]._get(id);
      if (binding !== undefined) return binding;
    }
  }

  /**
   * Get a binding from the container
   *
   * The binding will be first looked for in this container.
   * If it's not found here, it will be looked for in parents, in their order in the `parents` array.
   * - If the binding is found then its initialized and returned.
   * - If it's not found then a `BindingNotFoundError`
   * is thrown
   *
   * Example:
   * ```ts
   * const component = container.get<IMyComponent>(MY_COMPONENT);
   * ```
   */
  public get<T>(id: ID): T {
    const binding = this._get(id);
    if (binding === undefined) throw new BindingNotFoundError(id);

    return binding(this.get.bind(this));
  }

  /**
   * Extends the container's array of parents with the given containers.
   * This makes the given containers' contents available to this container,
   * effectively creating a parent-child relationship.
   *
   * For example, if some components in your container depend on some components
   * in another container, then you should extend your container with that other container,
   * to make those dependencies available for your components.
   *
   * This will append to the list of parents and not overwrite it.
   * A new parent is only added if it doesn't already exist in the `parents` array.
   *
   * Example:
   * ```ts
   * container.extend(otherContainer1, otherContainer2)
   * ```
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
   * Creates and returns a child container.
   *
   * This is effectively the reverse of extending.
   * The new container will have this container as the only parent.
   *
   * Child containers are very useful when you want to bind something for a single run,
   * for example if you've got request context you want to bind to the container before getting your service.
   * Using child containers allows you to bind these temporary values without polluting the root container.
   *
   * Example:
   * ```ts
   * const child = container.createChild()
   * ```
   */
  public createChild(): Container {
    const childContainer = new Container();
    childContainer.extend(this);
    return childContainer;
  }
}
