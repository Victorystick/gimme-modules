var babylon = require( 'babylon' );
var escodegen = require( 'escodegen' );
var modularize = require( './ast' );

var generateOptions = {
	// We want to preserve comments in the output.
	comments: true
};

module.exports = function source ( source ) {
	var ast = babylon.parse( source );

	var result = modularize( ast );

	ast = result.ast;

	// console.log( JSON.stringify( generatedAst, null, 2 ) );

	fixExportDeclarationsForBrokenESCodeGen( ast );

	result.code = escodegen.generate( ast, generateOptions ) + '\n';

	return result;
};

function fixExportDeclarationsForBrokenESCodeGen ( ast ) {
	if ( typeof ast !== 'object' || !ast ) {
		return;
	}

	for ( var name in ast ) {
		if ( name === 'type' ) {
			if ( ast[ name ] === 'ExportDefaultDeclaration' ) {
				ast[ name ] = 'ExportDeclaration';
				ast.default = true;
			} else if ( ast[ name ] === 'ExportNamedDeclaration' ) {
				ast[ name ] = 'ExportDeclaration';
			} else if ( ast[ name ] === 'ImportDefaultSpecifier' || ast[ name ] === 'ExportSpecifier' ) {
				ast.id = ast.local;
				ast.name = ast.exported;
			}
		}

		fixExportDeclarationsForBrokenESCodeGen( ast[ name ] );
	}
}
