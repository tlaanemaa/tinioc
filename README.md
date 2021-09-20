# Tinioc

[![Node.js CI](https://github.com/tlaanemaa/tinioc/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/tlaanemaa/tinioc/actions/workflows/node.js.yml)

_A tiny inversion of control container for all coding styles_

## Overview

The core idea behind tinioc is to enable the benefits of inversion of control (IoC) with minimum limitations and magic. Inversion of control, making implementations depend on interfaces and not the other way around, has huge decoupling benefits. It allows you to write code in a manner that leaves your components decoupled from each other thus making it easier to change their implementation or replace them completely. This has, however, often come with the overhead of added magic, libraries enabling IoC, perform complex dependency graph resolutions under the hood to know what to inject where. These libraries are often also quite thick and come with restrictions on your implementation, for example, you have to use classes to get the most use out of them.  
This is what tinioc attempts to solve. It brings most of the benefits of IoC without the magic or constraints. The whole container implementation is in a single file, about 100 files long with comments, you can easily look through it and understand every step that's taken if you wish. It also doesn't constrain you to classes, you're free to use whatever you want. This is achieved by the simple concept of an injector function, instead of making the library resolve the dependency graph, it just gives you the injector function so you can inject whatever you need, wherever you need it.  
Here's an example of how the injector function is used to inject a dependency into another:

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
You may notice that we use an Id and a type separately to inject the logger here, this is what enables us to get the IoC benefits. As you see, we're not mentioning the concrete logger implementation anywhere, this means we can change the implementation and as long as it fits within the same interface, we don't have to worry about anything! We can even replace it with a new logger completely, just as long as it fits within the interface. Our dependant components are happy because they get a dependency whose interface they can trust and our dependency is happy because it's free to change within that interface. Decoupling!

### Dependency injections

As mentioned above, dependency injections are done with the `inject` function, provided to your component's factory as the first argument. This function can also be passed on if you find a need for that, for example into a class constructor, up to you!  
The function doesn't guarantee any type information on its own. This seems like a downside at first but is what actually enables us to perform IoC well. You see, we don't want to actually touch the implementation in the injection process, we just want the ID so that we can keep them decoupled. The type <-> id pair will be kept in a bindings file, close to each other, so it's easy to find and use.

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

To facilitate the injection, we need a dependency injection container. This is also where our interfaces, ids, and implementations will be connected to each other. Here's an example of a container:

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
import { IMyComponent, MY_COMPONENT } from "../bindings";
import { container } from "./container";

export const controller: RequestHandler = (req, res, next) => {
  const myFavoriteNumber = container
    .get<IMyComponent>(MY_COMPONENT)
    .getMyFavoriteNumber();

  res.json({ myFavoriteNumber });
};
```

Notice how we use the `get` method in exactly the same way as we used `inject` before, that's because they're the exact same method!  
Now, let's say you want to put some request context into the container before you get your component. This can be easily achieved with `container.createChild` like so:

```ts
// controller.ts

import { RequestHandler } from "express";
import { IMyComponent, MY_COMPONENT } from "../bindings";
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
