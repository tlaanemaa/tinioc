import { ID } from "./types";

export class Scope {
  private parent?: Scope;
  private readonly instances = new Map<ID, unknown>();

  /**
   * Sets a new instance value to an ID in the scope
   */
  public set(id: ID, instance: unknown): this {
    this.instances.set(id, instance);
    return this;
  }

  /**
   * Checks if the ID exists in this scope or it's parent
   */
  public has(id: ID): boolean {
    return this.instances.has(id) || (!!this.parent && this.parent.has(id));
  }

  /**
   * Returns the value associated with the ID if it exists in this scope or
   * it's parent
   */
  public get(id: ID): unknown | undefined {
    if (this.instances.has(id)) {
      return this.instances.get(id);
    } else if (this.parent && this.parent.has(id)) {
      return this.parent.get(id);
    }
  }

  /**
   * Deletes the ID and it's instance from the scope.
   * Returns `true` if an instance existed
   */
  public delete(id: ID): boolean {
    return this.instances.delete(id);
  }

  /**
   * Creates a child scope.
   * All `has` and `get` calls done against the child will fall back
   * to this scope if no match is found on the child.
   */
  public createChild(): Scope {
    const child = new Scope();
    child.parent = this;
    return child;
  }
}
