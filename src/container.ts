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
}
