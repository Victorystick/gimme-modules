var fs = require( 'fs' );
var path = require( 'path' );
var mkdirp = require( 'mkdirp' );
var source = require( './source' );

module.exports = function file ( input, output ) {
	if ( typeof output === 'string' ) {
		mkdirp.sync( path.dirname( output ) );
		output = fs.createWriteStream( output );
	}

	var result = source( fs.readFileSync( input, { encoding: 'utf8' } ) );
	output.write( result.code );

	if ( output !== process.stdout) output.end();

	return result;
};
