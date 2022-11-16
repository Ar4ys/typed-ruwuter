# typed-ruwuter

Simple strongly typed middleware-style router

## Why?

Allowing user to mutate `request` directly (imperative code) is almost impossible to type correctly. Also, we cannot check at compile-time if user follows the contract that he defined (if he defines it at all). Instead, we can make middlewares declarative: they will return mutations that we can check at compile-time against their interfaces and then apply to `request` under the hood.

> TODO: Better README: npm link, description, examples, installation instruction, docs
