var estraverse = require( 'estraverse' );

module.exports = function detectFormat ( ast ) {
	var format = 'unknown',
		depth = 0;

	estraverse.traverse( ast, {
		enter: function ( node ) {
			if ( /^Function/.test( node.type ) ) {
				depth += 1;
				return;
			}

			if ( depth > 0 ) return;

			if ( isDefineCall( node ) && couldBe( 'amd' ) ) {
				format = 'amd';
				this.break();
			}

			if ( isRequireCall( node ) && couldBe( 'cjs' ) ) {
				format = 'cjs';
				this.break();
			}

			if ( node.type === 'AssignmentExpression' ) {
				if ( isModuleExports( node.left ) || isExportsStatic( node.left ) && couldBe( 'cjs' ) ) {
					format = 'cjs';
					this.break();
				}
			}
		},

		leave: function ( node ) {
			if ( /^Function/.test( node.type ) ) {
				depth -= 1;
				return;
			}
		}
	});

	return format;

	function couldBe ( alt ) {
		return format === 'unknown' || format === alt;
	}
};

function isModuleExports ( node ) {
	return node.type === 'MemberExpression' &&
		node.object.type === 'Identifier' &&
		node.object.name === 'module' &&
		node.property.name === 'exports';
}

function isExportsStatic ( node ) {
	return node.type === 'MemberExpression' &&
		node.object.type === 'Identifier' &&
		node.object.name === 'exports' &&
		!node.computed &&
		node.property.name;
}

function isRequireCall ( node ) {
	return node.type === 'CallExpression' &&
		node.callee.name === 'require' &&
		node.arguments.length === 1 &&
		typeof node.arguments[ 0 ].value === 'string';
}

function isDefineCall ( node ) {
	return node.type === 'CallExpression' &&
		node.callee.name === 'define' &&
		// At least the function
		node.arguments.length >= 1 &&
		// At most a name, a dependency array and the function
		node.arguments.length <= 3;
}
