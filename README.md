# vinyl-globby

[![build status][build-png]][build]
[![Davis Dependency status][dep-png]][dep]

[![NPM][npm-png]][npm]

Like globby, but returns vinyl objects instead of filepaths. Useful when you
want to know the relative path to a file from its associated glob pattern.

## Example

```js
var vinylGlobby = require("vinyl-globby");

// Standard interface
vinylGlobby(['**/*.js', '!foo.js'], function onGlob(err, files) {
  files[0].path; // Full file path
  files[0].base; // Base from start of glob
  files[0].relative; // Relative file path to base
});

// Emitter interface
var globber = vinylGlobby('**/*.js');
globber.on('match', onMatch);
globber.on('error', onError);
globber.on('end', onEnd);

// You can also abort the globbing, which will fire an "abort" event
globber.abort();
```

## Installation

`npm install vinyl-globby`

## Tests

`npm test`

## NPM scripts

 - `npm run cover` This runs the tests with code coverage
 - `npm run lint` This will run the linter on your code
 - `npm test` This will run the tests.
 - `npm run trace` This will run your tests in tracing mode.
 - `npm run travis` This is run by travis.CI to run your tests
 - `npm run view-cover` This will show code coverage in a browser

## Contributors

 - Matt Morgan

## MIT Licenced

  [build-png]: https://secure.travis-ci.org/mlmorg/vinyl-globby.png
  [build]: https://travis-ci.org/mlmorg/vinyl-globby
  [dep-png]: https://david-dm.org/mlmorg/vinyl-globby.png
  [dep]: https://david-dm.org/mlmorg/vinyl-globby
  [npm-png]: https://nodei.co/npm/vinyl-globby.png?stars&downloads
  [npm]: https://nodei.co/npm/vinyl-globby
