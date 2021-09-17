export class DependencyNotFoundError extends Error {
  constructor(id: string | symbol) {
    super(`Dependency "${String(id)}" not found!`);
  }
}
