# Testing

## Initial setup

Clone and navigate to this repo:

```sh
git clone git@github.com:bugsnag/bugsnag-expo-performance.git
cd bugsnag-expo-performance
```

Install top level dependencies:

```sh
npm install
```

Build the package:

```sh
npm run build
```

## Unit tests

Runs the unit tests for each package.

```sh
npm run test
```

## Linting and formatting

Linting and formatting is done using Biome. See the [`biome.jsonc`](/biome.jsonc)  file for the configured linting and formatting rules

```sh
npm run lint # check linting errors

npm run lint:fix # fix linting errors

npm run format:check # check formatting errors

npm run format # fix formatting errors
```

## End to end

These tests are implemented with our notifier testing tool [Maze runner](https://github.com/bugsnag/maze-runner).

End to end tests are written in cucumber-style `.feature` files, and need Ruby-backed "steps" in order to know what to run. The tests are located in the top level [`features`](/features/) directory.


