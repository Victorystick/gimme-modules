var detectFormat = require( './detectFormat' );
var modularize = require( './modularize/index' );

module.exports = function ast ( ast ) {
	var format = detectFormat( ast );

	var result = {
		ast: ast,
		code: '',
		exports: null,
		format: format,
		imports: null
	};

	if ( format === 'unknown' ) return result;

	return modularize[ format ]( ast, result );
};
