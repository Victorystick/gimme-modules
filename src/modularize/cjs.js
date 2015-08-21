var estraverse = require( 'estraverse' );

module.exports = function cjs ( ast, result ) {
	var depth = 0;

	var exports = {};
	var imports = {};

	var tops = [];

	result.ast = estraverse.replace( ast, {
		enter: function ( node ) {
			var identifier, literal;

			if ( /^Function/.test( node.type ) ) {
				depth += 1;
				return;
			}

			if ( depth > 0 ) return;


			if ( node.type === 'VariableDeclarator' && node.init ) {
				if ( isRequireCall( node.init ) ) {
					literal = node.init.arguments[ 0 ];

					imports[ literal.value ] = true;

					tops.push({
						type: 'ImportDeclaration',
						specifiers: [
							{
								type: 'ImportDefaultSpecifier',
								local: node.id
							}
						],
						source: literal
					});
					this.remove();
					return;
				}
			}

			if ( node.type === 'ExpressionStatement' ) {
				node = node.expression;

				if ( node.type === 'Literal' && node.value === 'use strict' ) {
					this.remove();
					return;
				}

				if ( isRequireCall( node ) ) {
					literal = node.arguments[ 0 ];

					imports[ literal.value ] = true;

					return {
						type: 'ImportDeclaration',
						specifiers: [],
						source: literal
					};
				}

				if ( isAssignmentToExports( node ) ) {
					identifier = node.left.property;

					exports[ identifier.name ] = true;

					if ( isRequireCall( node.right ) ) {
						literal = node.right.arguments[ 0 ];

						imports[ literal.value ] = true;

						return {
							type: 'ExportNamedDeclaration',
							declaration: null,
							specifiers: [
								{
									type: 'ExportSpecifier',
									local: {
										type: 'Identifier',
										name: 'default'
									},
									exported: identifier
								}
							],
							source: literal
						};
					}

					return {
						type: 'ExportNamedDeclaration',
						declaration: {
							type: 'VariableDeclaration',
							kind: 'var',
							declarations: [
								{
									type: 'VariableDeclarator',
									id: identifier,
									init: node.right
								}
							]
						},
						specifiers: [],
						source: null
					};
				}

				if ( isAssignmentToModule( node ) ) {
					exports['default'] = true;

					return {
						type: 'ExportDefaultDeclaration',
						declaration: node.right
					};
				}
			}
		},

		leave: function ( node ) {
			if ( /^Function/.test( node.type ) ) {
				depth -= 1;
				return;
			}

			if ( node.type === 'VariableDeclaration' ) {
				if ( !node.declarations.length ) {
					this.remove();
					return;
				}
			}
		}
	});

	result.ast.body = tops.concat( result.ast.body );
	result.ast.sourceType = 'module';

	result.exports = Object.keys( exports );
	result.imports = Object.keys( imports );

	// console.log( JSON.stringify( result.ast, null, 2 ) );

	return result;
};

function isRequireCall ( node ) {
	return node.type === 'CallExpression' &&
		node.callee.name === 'require' &&
		node.arguments.length === 1 &&
		typeof node.arguments[ 0 ].value === 'string';
}

function isAssignmentToModule ( node ) {
	if ( node.type !== 'AssignmentExpression' ) return false;

	return isModuleExports( node.left );
}

function isAssignmentToExports ( node ) {
	if ( node.type !== 'AssignmentExpression' ) return false;

	return isExportsStatic( node.left );
}

function isModuleExports ( node ) {
	return node.type === 'MemberExpression' &&
		node.object.type === 'Identifier' &&
		node.object.name === 'module' &&
		node.property.name === 'exports';
}

function isExportsStatic ( node ) {
	return node.type === 'MemberExpression' &&
		(node.object.type === 'Identifier' && node.object.name === 'exports' ||
			isModuleExports( node.object ) ) &&
		!node.computed &&
		node.property.name;
}
