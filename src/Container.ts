import { ID, FactoryOf } from "./types";
import { DependencyNotFoundError } from "./errors";

export class Container {
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
   * Returns a cloned instance of the container
   */
  public clone(): Container {
    const clonedContainer = new Container();
    Object.entries(this.dependencies).forEach(([id, dependency]) =>
      clonedContainer.register(id, dependency)
    );
    return clonedContainer;
  }

  /**
   * Get a dependency
   */
  public get<T>(id: ID): T {
    const dependency = this.dependencies[id];
    if (dependency === undefined) throw new DependencyNotFoundError(id);

    return dependency({ get: this.get.bind(this) });
  }
}
