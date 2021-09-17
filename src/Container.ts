import { ID, FactoryOf } from "./types";
import { DependencyNotFoundError } from "./errors";

export class Container {
  /**
   * Parent container.
   *
   * Any dependency that is not found in this container will be looked for in the parent, if it exists.
   */
  public parent?: Container;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly dependencies: Record<ID, FactoryOf<any>> = {};

  /**
   * Register a new dependency
   */
  public register<T>(id: ID, dependency: FactoryOf<T>): this {
    this.dependencies[id] = dependency;
    return this;
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
   * Get a dependency from local or parent's dependencies
   */
  private getDependency(id: ID): FactoryOf<any> | undefined {
    return this.dependencies[id] ?? this.parent?.getDependency(id);
  }

  /**
   * Get a dependency
   */
  public get<T>(id: ID): T {
    const dependency = this.getDependency(id);
    if (typeof dependency !== "function") throw new DependencyNotFoundError(id);

    return dependency({ get: this.get.bind(this) });
  }
}
