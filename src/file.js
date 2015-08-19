var fs = require( 'fs' );
var source = require( './source' );

module.exports = function file ( input, output ) {
	if ( typeof output === 'string' ) {
		output = fs.createWriteStream( output );
	}

	var result = source( fs.readFileSync( input, { encoding: 'utf8' } ) );
	output.write( result.code );
	return result;
};
