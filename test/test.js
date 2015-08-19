var fs = require( 'fs' );
var path = require( 'path' );
var assert = require( 'assert' );
var gimme = require( '../' );

describe( 'gimme-modules', function () {
	it( 'exists', function () {
		assert.ok( gimme );
	});

	it( 'has the expected methods', function () {
		assert.ok( gimme.ast );
		assert.ok( gimme.source );
		assert.ok( gimme.file );
		assert.ok( gimme.recursive );
	});

	it( 'detects module formats', function () {
		var dirs = fs.readdirSync( path.resolve( __dirname, 'format' ) );

		dirs.forEach( function ( dir ) {
			var absDir = path.resolve( __dirname, 'format', dir );

			fs.readdirSync( absDir ).forEach( function ( file ) {
				var absFile = path.resolve( absDir, file );

				var result = gimme.source( fs.readFileSync( absFile, { encoding: 'utf8' } ) );

				assert.equal( result.format, dir );
			});
		});
	});
});
