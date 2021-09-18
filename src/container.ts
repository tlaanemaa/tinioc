import { ID, FactoryOf } from "./types";
import { DependencyNotFoundError } from "./utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDependencyDeclaration = FactoryOf<any>;

export class Container {
  /**
   * Parent container.
   *
   * Any dependency that is not found in this container will be looked for in the parent, if it exists.
   */
  public parent?: Container;

  private readonly dependencies: Record<ID, AnyDependencyDeclaration> = {};

  /**
   * Returns all dependency IDs currently kept in this container
   */
  private getDependencyIds() {
    return [
      ...Object.getOwnPropertySymbols(this.dependencies),
      ...Object.getOwnPropertyNames(this.dependencies),
    ];
  }

  /**
   * Register a new dependency
   */
  public bind<T>(id: ID, dependency: FactoryOf<T>): this {
    this.dependencies[id] = dependency;
    return this;
  }

  /**
   * Get a dependency from local or parent's dependencies
   */
  private _get(id: ID): AnyDependencyDeclaration | undefined {
    return this.dependencies[id] ?? this.parent?._get(id);
  }

  /**
   * Get a dependency
   */
  public get<T>(id: ID): T {
    const dependency = this._get(id);
    if (typeof dependency !== "function") throw new DependencyNotFoundError(id);

    return dependency({ get: this.get.bind(this) });
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
   * its a fresh copy with all the dependencies rebound to it.
   *
   * **PS!** Only dependencies from the containers themselves will be copied.
   * The parents of the containers will not be looked at.
   */
  static merge(...containers: Container[]): Container {
    const mergedContainer = new Container();

    containers.forEach((container) => {
      container.getDependencyIds().forEach((id) => {
        mergedContainer.bind(id, container.dependencies[id]);
      });
    });

    return mergedContainer;
  }
}
