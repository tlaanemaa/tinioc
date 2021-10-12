import { BindingNotFoundError } from "./binding-not-found-error";
import { ID, FactoryOf, AnyFactory } from "./types";

export class Container {
  /**
   * Array of parent containers
   *
   * These allow setting up parent-child relationships between containers, thus enabling
   * hierarchical dependency injection systems. Multiple parents are supported, so you can essentially
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
   * container.register<IMyComponent>(MY_COMPONENT, myComponent)
   * ```
   * ---
   * The registered binding can later be injected with the `inject` function like so:
   * ```ts
   * const component = inject<IMyComponent>(MY_COMPONENT);
   * ```
   * It is suggested you keep your dependency ids and types close to each other,
   * preferably in a separate `bindings` file. That makes them easy to use and improves
   * maintainability.
   */
  public register<T>(id: ID, value: FactoryOf<T>): this {
    this.bindings.set(id, value);
    return this;
  }

  /**
   * Check if there is a binding registered for a given id.
   * This will check this container and also all of it's parents.
   *
   * Example:
   * ```ts
   * const myComponentIsRegistered = container.isRegistered(MY_COMPONENT)
   * ```
   */
  public isRegistered(id: ID): boolean {
    return (
      this.isRegisteredHere(id) ||
      this.parents.some((parent) => parent.isRegistered(id))
    );
  }

  /**
   * Check if there is a binding registered for a given id.
   * This will check only this container.
   *
   * Example:
   * ```ts
   * const myComponentIsRegistered = container.isRegisteredHere(MY_COMPONENT)
   * ```
   */
  public isRegisteredHere(id: ID): boolean {
    return this.bindings.has(id);
  }

  /**
   * Removes the binding for the given id.
   * This will only remove it from this container.
   *
   * Example:
   * ```ts
   * container.remove(MY_COMPONENT)
   * ```
   */
  public remove(id: ID): this {
    this.bindings.delete(id);
    return this;
  }

  /**
   * Recursively searches for the binding in this container and it's parents
   */
  private findBinding(id: ID): AnyFactory | undefined {
    if (this.bindings.has(id)) return this.bindings.get(id);

    for (let i = 0; i < this.parents.length; i += 1) {
      const binding = this.parents[i].findBinding(id);
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
    const binding = this.findBinding(id);
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
   * for example, if you've got request context you want to bind to the container before getting your component.
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
