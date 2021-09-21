# Tinioc

[![Node.js CI](https://github.com/tlaanemaa/tinioc/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/tlaanemaa/tinioc/actions/workflows/node.js.yml)

_A tiny inversion of control container for all coding styles_

## Overview

The core idea here is to give you the main benefits of inversion of control, decoupling, and ease of testing, with minimal magic and constraints on your coding style. Inversion of control (IoC) brings massive benefits but applying it often means using a library that does things under the hood which might not be obvious, some magic is happening. This tends to drive people away because, as engineers, we like to know how our stuff works. That is compounded by the fact that IoC libraries often constraint you to some specific coding style, most often object-oriented design with classes.

Tinioc attempts to solve that. The library's dead simple, the whole container implementation is around 100 lines of simple code so you can easily go through it in one sitting. It also sets minimal constraints on your coding style, you can use functions or classes or whatever you like to use. The only constraint placed is that your components should be registered as factory functions, within that constraint you're free to do whatever you want. This simplicity and freedom are enabled by the simple concept of an injector function. Tinioc doesn't build dependency graphs, it doesn't even deal with dependency scopes, all it does is give you an injector function to inject your dependencies where you need them. This way you're free to use it however you want.

Here's an example of how the injector function is used to inject a dependency into a component:

```ts
// myComponent.ts

import { Inject } from "tinioc";
import { INumbersDB, NUMBERS_DB } from "../bindings";

export const myComponent = (inject: Inject): IMyComponent => ({
  getMyFavoriteNumber: async () => {
    const numbersDB = inject<INumbersDB>(NUMBERS_DB);
    return numbersDB.getById("favorite_number") ?? 7;
  },
});
```

As you can see, injecting a dependency is as easy as calling a function, and it's also type-safe if you're using typescript!
You may notice that we use an id and a type separately to inject the logger here, this is how we get the IoC benefits. The concrete logger implementation isn't mentioned anywhere so we can change the implementation and as long as it fits within the same interface, we're good! Our dependant components are happy because they get a dependency whose interface they can trust and our dependency is happy because it's free to change within that interface. Decoupling!

There are also testing benefits here, we can easily pass in a mocked inject function that returns mocked dependencies.

### Dependency injections

As mentioned above, dependency injections are done with the `inject` function, provided to your component's factory as the first argument. This function can also be passed on if you find a need for that, for example into a class constructor, up to you!  
The function doesn't guarantee any type information on its own. This seems like a downside at first but is what enables us to perform IoC well. You see, we don't want to touch the implementation in the injection process, we just want the ID so that we can keep them decoupled. The type <-> id pair will be kept in a bindings file, close to each other, so it's easy to find and use.

### Bindings

An Id <-> type pair looks something like this:

```ts
// bindings.ts

export const NUMBERS_DB = Symbol.for("numbers_db");
export interface INumbersDB {
  getById(id: string): number | undefined;
  setById(id: string, value: number): void;
}

export const MY_COMPONENT = Symbol.for("my_component");
export interface IMyComponent {
  getMyFavoriteNumber(): number;
}
```

This is what we'll be using to inject our dependency and this is also what we'll be writing our implementation against. Keeping the bindings in a central place like this gives us a simple overview of all the components we've got in our system

### Container

To facilitate the injection, we need a dependency injection container. This is also where our interfaces, ids, and implementations will be connected. Here's an example of a container:

```ts
// container.ts

import { Container } from "tinioc";
import * as bindings from "./bindings";
import { numbersDB } from "./numbersDB";
import { myComponent } from "./database/numbersDB";

export const container = new Container();

container.bind<bindings.INumbersDB>(bindings.NUMBERS_DB, numbersDB);
container.bind<bindings.IMyComponent>(bindings.MY_COMPONENT, myComponent);
```

That's it! Now you've got a fully functional IoC container set up.  
For smaller applications, it's usually enough to use a single global container but you can also split your project into submodules with each having its own container. Then, if one submodule needs to access dependencies from another, you'll just use `container.extend` to create a parent-child relationship between them.

### Getting access to the components

Getting access to components is very straightforward, here's an example of an express controller using a component:

```ts
// controller.ts

import { RequestHandler } from "express";
import { IMyComponent, MY_COMPONENT } from "./bindings";
import { container } from "./container";

export const controller: RequestHandler = (req, res, next) => {
  const myFavoriteNumber = container
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
import { IMyComponent, MY_COMPONENT } from "./bindings";
import { container } from "./container";

export const controller: RequestHandler = (req, res, next) => {
  const ctx = { correlationId: req.header("correlation-id") };
  const myFavoriteNumber = container
    .createChild()
    .bind<IRequestContext>(REQUEST_CONTEXT, () => ctx)
    .get<IMyComponent>(MY_COMPONENT)
    .getMyFavoriteNumber();

  res.json({ myFavoriteNumber });
};
```

And just like that, you've got your request context available everywhere within that child container. Just be sure to create a child container when adding transient components like that tho, else you'll pollute your root container. The child container makes use of the same child-parent relationship we saw earlier with `container.extend`, it just does it the other way around.

If for some reason the component is not found, a `BindingNotFoundError` will be thrown. You can also import that error class from `tinioc` and use it in `instanceof` checks to handle that specific error if you wish.

## Container API

```ts
declare type ID = string | symbol;
declare type Inject = <T>(id: ID) => T;
declare type FactoryOf<T> = (inject: Inject) => T;

declare class Container {
  parents: Container[];
  bind<T>(id: ID, value: FactoryOf<T>): this;
  get<T>(id: ID): T;
  extend(...containers: Container[]): this;
  createChild(): Container;
}
```

## Example

I know engineers like to tinker with stuff so I've created a fully functional microservice that showcases how tinioc is used. You can find it here: https://github.com/tlaanemaa/tinioc-example
