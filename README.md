# Tinioc

[![Node.js CI](https://github.com/tlaanemaa/tinioc/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/tlaanemaa/tinioc/actions/workflows/node.js.yml)

_A tiny dependency injection container for all coding styles_

## Overview

Tinioc gives you the main benefits of dependency injection in a simple, minimal package:

- Decoupling
- Ease of testing
- Almost no constraints on your coding style
- A simple dependency injection container that's easy to understand
- No decorators, tinioc works just as well in plain JavaScript

Dependency injection brings massive benefits but applying it often means using a library that does things under the hood which might not be obvious, some magic is happening. This tends to drive people away because, as engineers, we like to know how our stuff works. That is compounded by the fact that dependency injection libraries often constraint you to some specific coding style, most often object-oriented design with classes.

Tinioc solves that. The library's dead simple, you can easily go through the whole container implementation in one sitting, [see for yourself](https://github.com/tlaanemaa/tinioc/blob/main/src/container.ts)! It also sets almost no constraints on your coding style, you can use functions or classes or whatever you like to use. The only constraint placed is that your components should be registered as factory functions, within that constraint you're free to do whatever you want. This simplicity and freedom are enabled by the simple concept of an injector function. Tinioc doesn't build dependency graphs, it doesn't even deal with dependency scopes, all it does is give you an injector function to inject your dependencies where you need them. This way you're free to use it however you want.

Here's an example of how the injector function is used to inject a dependency into a component:

```ts
// myComponent.ts

import { Inject } from "tinioc";
import { IMyComponent, INumbersDB, NUMBERS_DB } from "./bindings";

export const myComponent = (inject: Inject): IMyComponent => ({
  getMyFavoriteNumber: async () => {
    const numbersDB = inject<INumbersDB>(NUMBERS_DB);
    const favoriteNumber = await numbersDB.getById("favorite_number");
    return favoriteNumber ?? 7;
  },
});
```

As you can see, injecting a dependency is as easy as calling a function, and it's also type-safe if you're using typescript!
You may notice that we use an id and a type separately to inject the `numbersDB` here, this is how we get the decoupling benefits. The concrete `numbersDB` implementation isn't mentioned anywhere so we can change the implementation and as long as it fits within the same interface, we're good! Our dependant components are happy because they get a dependency whose interface they can trust and our dependency is happy because it's free to change within that interface. Decoupling!

There are also testing benefits here, we can easily pass in a mocked inject function that returns mocked dependencies.

### Dependency injections

As mentioned above, dependency injections are done with the `inject` function, provided to your component's factory as the first argument. This function can also be passed on if you find a need for that, for example into a class constructor, up to you!  
The function doesn't guarantee any type information on its own. This seems like a downside at first but is what gives us true decoupling. You see, we don't want to touch the implementation in the injection process, that would make us depend on that implementation. We just want the ID and the interface, so that we can keep our component decoupled from the other component's implementation. This way, the interface also forms a sort of contract between our components.

The id <-> type pair will be kept in a bindings file, close to each other, so it's easy to find and use.

### Bindings

An id <-> type pair looks something like this:

```ts
// bindings.ts

export const NUMBERS_DB = Symbol.for("numbers_db");
export interface INumbersDB {
  getById(id: string): Promise<number | undefined>;
  setById(id: string, value: number): Promise<void>;
}

export const MY_COMPONENT = Symbol.for("my_component");
export interface IMyComponent {
  getMyFavoriteNumber(): Promise<number>;
}
```

This is what we'll be using to inject our dependency and this is also what we'll be writing our implementation against. Keeping the bindings in a central place like this gives us a simple overview of all the components we've got in our system.

An easier (but not ideal) way to create id <-> type pairs is to keep them right next to your implementation. This seems convenient, it's all in one place and you can derive the interface from the implementation, less work. The problem is, it doesn't give much decoupling. That's because you're effectively depending on the implementation and not an abstraction, the interface. You also won't get the same typings help, if you introduce a breaking change to your component you won't be notified until you look at the components you broke.  
Nevertheless, here's an example of that:

```ts
// myComponent.ts

import { Inject } from "tinioc";
import { INumbersDB, NUMBERS_DB } from "./bindings";

export const myComponent = (inject: Inject) => ({
  getMyFavoriteNumber: async () => {
    const numbersDB = inject<INumbersDB>(NUMBERS_DB);
    const favoriteNumber = await numbersDB.getById("favorite_number");
    return favoriteNumber ?? 7;
  },
});

export const MY_COMPONENT = Symbol.for("my_component");
export type IMyComponent = ReturnType<typeof myComponent>;
```

### Container

To facilitate the injection, we need a dependency injection container. This is also where our interfaces, ids, and implementations will be connected. Here's an example of a container:

```ts
// container.ts

import { Container } from "tinioc";
import * as bindings from "./bindings";
import { numbersDB } from "./numbersDB";
import { myComponent } from "./myComponent";

export const container = new Container();

container.register<bindings.INumbersDB>(bindings.NUMBERS_DB, numbersDB);
container.register<bindings.IMyComponent>(bindings.MY_COMPONENT, myComponent);
```

That's it! Now you've got a fully functional dependency injection container set up.  
For smaller applications, it's usually enough to use a single global container but you can also split your project into submodules with each having its own container. Then, if one submodule needs to access dependencies from another, you'll just use `container.extend` to create a parent-child relationship between them.

### Getting access to the components

Getting access to components is very straightforward, here's an example of an express controller using a component:

```ts
// controller.ts

import { RequestHandler } from "express";
import { IMyComponent, MY_COMPONENT } from "./bindings";
import { container } from "./container";

export const controller: RequestHandler = async (req, res, next) => {
  const myFavoriteNumber = await container
    .get<IMyComponent>(MY_COMPONENT)
    .getMyFavoriteNumber();

  res.json({ myFavoriteNumber });
};
```

Notice how we use the `get` method in the same way as we used `inject` before, that's because they're the same method!  
Now, let's say you want to put some request context into the container before you get your component. This can be easily achieved with `container.createChild` like so:

```ts
// controller.ts

import { RequestHandler } from "express";
import {
  IMyComponent,
  MY_COMPONENT,
  IRequestContext,
  REQUEST_CONTEXT,
} from "./bindings";
import { container } from "./container";

export const controller: RequestHandler = async (req, res, next) => {
  const ctx = { correlationId: req.header("correlation-id") ?? "missing" };
  const myFavoriteNumber = await container
    .createChild()
    .register<IRequestContext>(REQUEST_CONTEXT, () => ctx)
    .get<IMyComponent>(MY_COMPONENT)
    .getMyFavoriteNumber();

  res.json({ myFavoriteNumber });
};
```

And just like that, you've got your request context available everywhere within that child container. Just be sure to create a child container when adding transient components like that tho, else you'll pollute your root container. The child container makes use of the same child-parent relationship we saw earlier with `container.extend`, it just does it the other way around.

If for some reason the component is not found, a `BindingNotFoundError` will be thrown. You can also import that error class from `tinioc` and use it in `instanceof` checks to handle that specific error if you wish.

### Async components

Thanks to tinioc's simplicity, working with async components is essentially the same as with regular components. An async component is just a component wrapped in a promise so you can just type it like that in the bindings file, and then `await` the injection.

Here's how you'd define the bindings for a connected [pg](https://www.npmjs.com/package/pg) client:

```ts
// bindings.ts

import { Client } from "pg";

export const DB_CLIENT = Symbol.for("db_client");
export type IDbClient = Promise<Client>;

export const MY_COMPONENT = Symbol.for("my_component");
export interface IMyComponent {
  getMyFavoriteNumber(): Promise<number>;
}
```

Here's how you'd implement it as a singleton component:

```ts
// dbClient.ts

import { Client } from "pg";
import { IDbClient } from "./bindings";

/**
 * Creates and connects a pg client
 */
const getConnectedClient = async () => {
  const client = new Client();
  await client.connect();
  return client;
};

const client = getConnectedClient();
export const dbClient = (): IDbClient => client;
```

And here's is how you'd inject it:

```ts
// myComponent.ts

import { Inject } from "tinioc";
import { IMyComponent, IDbClient, DB_CLIENT } from "./bindings";

export const myComponent = (inject: Inject): IMyComponent => ({
  getMyFavoriteNumber: async () => {
    const client = await inject<IDbClient>(DB_CLIENT);
    const res = await client.query("SELECT 7 as favoriteNumber");
    return res.rows[0].favoriteNumber;
  },
});
```

As you can see, there's nothing special to it. Easy-peasy!

## Container API

### container.register()

Register an id with a component in the container.

You can make use of the generic type on this method to enforce that the
registered component matches the required interface.

Example:

```ts
container.register<IMyComponent>(MY_COMPONENT, myComponent);
```

The registered binding can later be injected with the `inject` function like so:

```ts
const component = inject<IMyComponent>(MY_COMPONENT);
```

It is suggested you keep your dependency ids and types close to each other,
preferably in a separate `bindings` file. That makes them easy to use and improves
maintainability.

### container.isRegistered()

Check if there is a binding registered for a given id.
This will check this container and also all of it's parents.

Example:

```ts
const myComponentIsRegistered = container.isRegistered(MY_COMPONENT);
```

### container.isRegisteredHere()

Check if there is a binding registered for a given id.
This will check only this container.

Example:

```ts
const myComponentIsRegistered = container.isRegisteredHere(MY_COMPONENT);
```

### container.remove()

Removes the binding for the given id.
This will only remove it from this container.

Example:

```ts
container.remove(MY_COMPONENT);
```

### container.get()

Get a binding from the container

The binding will be first looked for in this container.
If it's not found here, it will be looked for in parents, in their order in the `parents` array.

- If the binding is found then its initialized and returned.
- If it's not found then a `BindingNotFoundError`
  is thrown

Example:

```ts
const component = container.get<IMyComponent>(MY_COMPONENT);
```

### container.createChild()

Creates and returns a child container.

This is effectively the reverse of extending.
The new container will have this container as the only parent.

Child containers are very useful when you want to register something for a single run,
for example, if you've got request context you want to register to the container before getting your component.
Using child containers allows you to register these temporary values without polluting the root container.

Example:

```ts
const child = container.createChild();
```

### container.extend()

Extends the container's array of parents with the given containers.
This makes the given containers' contents available to this container,
effectively creating a parent-child relationship.

For example, if some components in your container depend on some components
in another container, then you should extend your container with that other container,
to make those dependencies available for your components.

This will append to the list of parents and not overwrite it.
A new parent is only added if it doesn't already exist in the `parents` array.

Example:

```ts
container.extend(otherContainer1, otherContainer2);
```

### container.parents

Array of parent containers

These allow setting up parent-child relationships between containers, thus enabling
hierarchical dependency injection systems. Multiple parents are supported, so you can essentially
make your container "inherit" from several other containers

### All type declarations

```ts
declare type ID = string | symbol;
declare type Inject = <T>(id: ID) => T;
declare type FactoryOf<T> = (inject: Inject) => T;

declare class Container {
  parents: Container[];
  register<T>(id: ID, value: FactoryOf<T>): this;
  isRegistered(id: ID): boolean;
  isRegisteredHere(id: ID): boolean;
  remove(id: ID): this;
  get<T>(id: ID): T;
  extend(...containers: Container[]): this;
  createChild(): Container;
}

declare class BindingNotFoundError extends Error {
  constructor(id: string | symbol);
}
```

## Example

I know engineers like to tinker with stuff so I've created a fully functional microservice that showcases how tinioc is used. You can find it here: https://github.com/tlaanemaa/tinioc-example
