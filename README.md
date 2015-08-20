gimme-modules
=============

Are you also fed up with all the module formats hanging around? We've had to work with IIFEs and globals, CommonJS, AMD, UMD, SystemJS etc. Which should you choose for your library to have maximal reach? Why ECMAScript modules, of course! There are excellent transpilers available, like [Babel](http://babeljs.io/) and [rollup](https://github.com/rollup/rollup), which let you target all the other formats.

Just say "_Gimme modules!_" and we'll deliver them.

Install the package
```sh
$ npm install -g gimme-modules
```

and tell your code to be written in ECMAScript 2015 modules instead!
```sh
# !! This example updates the code in-place.
$ gimme-modules --recursive --output src src/index.js
```

`gimme-modules` will crawl your code and try to convert the files in your project to ECMAScript modules, and put them in the `src/` directory.


To preview `gimme-modules`'s output for a single file, like this one:
```js
exports.a = require( './a.js' );
exports.b = require( './b.js' );
```

pass it as the only argument.
```sh
$ gimme-modules lib/index.js
```

Outputs:
```js
export { default as a } from './a.js';
export { default as b } from './b.js';
```


## API
Alternatively, you can use the Node API.
```js
var gimme = require( 'gimme-modules' );

// From the given entry point, convert all imported files
// recursively and output to the target directory.
gimme.recursive( 'lib/index.js', 'ecma/' );

// Convert one file and output to the given filename ...
gimme.file( 'src/file.js', 'ecma/file.js' );

// ... or to a Writeable Stream.
gimme.file( 'src/file.js', process.stdout );

// Convert any source string, or ESTree AST.
var result = gimme.source( '...' );
    result = gimme.ast( acorn.parse( '...' ) );

// The results have the following properties:
assert.ok( typeof result.code === 'string' );

```

## Licence
MIT
