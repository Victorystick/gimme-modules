var path = require( 'path' );
var fs = require( 'fs' );
var file = require( './file' );

module.exports = function ( input, directory ) {
	var file = path.resolve( input );
	var source = path.dirname( file );
	var target = path.resolve( directory );

	fs.mkdirSync( directory );

	// source dir, eg. `src`
	// target dir, eg. `target`
	// entry file, eg. `index.js`
	recursive( source, target, file, {} );
};

function recursive ( source, target, input, visited ) {
	if ( visited[ input ] ) return;
	visited[ input ] = true;

	var output = target + input.slice(source.length);

	var result = file( input, output );

	result.imports.forEach( function ( file ) {
		if ( file[0] !== '.' ) return;

		if ( !path.extname( file ) ) {
			file += '.js';
		}

		file = path.resolve( path.dirname( input ), file );

		recursive( source, target, file, visited );
	});
}
