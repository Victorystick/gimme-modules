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

// 	var imports = result.imports;
// 	var exports = result.exports;
//
// 	var depth = 0;
//
// 	var tops = [];
//
// 	// var inImport = false;
// 	var inExport = false;
//
// 	var generatedAst = estraverse.replace( ast, {
// 		enter: function ( node ) {
// 			switch (node.type) {
// 				case 'FunctionExpression':
// 				case 'FunctionDeclaration':
// 					depth += 1;
// 					return;
//
// 				case 'VariableDeclaration':
// 					if ( depth === 0 && formatCompatible( result, 'cjs') && !inExport ) {
// 						node.declarations.map(function ( node ) {
// 							if ( isRequireCall( node.init ) ) {
// 								setFormat( result, 'cjs' );
// 								// inImport = true;
//
// 								imports[ node.init.arguments[ 0 ].value ] = true;
//
// 								return {
// 									type: 'ImportDeclaration',
// 									specifiers: [
// 										{
// 											type: 'ImportDefaultSpecifier',
// 											local: node.id
// 										}
// 									],
// 									source: node.init.arguments[ 0 ]
// 								};
// 							}
// 						}).forEach( function ( imp, i ) {
// 							if (imp) {
// 								tops.push(imp);
// 								node.declarations.splice( i, 1 );
// 							}
// 						});
//
// 						if ( !node.declarations.length ) this.remove();
// 					}
// 					return;
//
// 				case 'ExpressionStatement':
// 					node = node.expression;
//
// 					// Modules are always strict. Remove 'use strict'.
// 					if ( node.type === 'Literal' && node.value === 'use strict' ) {
// 						return this.remove();
// 					}
//
// 					if ( depth === 0 ) {
// 						if ( formatCompatible( result, 'amd' ) ) {
// 							if ( isDefineCall( node ) ) {
// 								setFormat( result, 'amd' );
//
// 								// Remove one level of depth. What's declared in the function
// 								// passed to define is considered the module-global scope.
// 								depth -= 1;
//
// 								// if ( node.arguments.some( exportImport ) ) {
// 								//
// 								// }
// 							}
// 						}
//
// 						if ( formatCompatible( result, 'cjs' ) ) {
// 							if ( isRequireCall( node ) ) {
// 								setFormat( result, 'cjs' );
// 								imports[ node.arguments[ 0 ].value ] = true;
// 								return {
// 									type: 'ImportDeclaration',
// 									specifiers: [],
// 									source: node.arguments[ 0 ]
// 								};
// 							}
//
// 							if ( node.type === 'AssignmentExpression' ) {
// 								if ( isModuleExports( node.left ) ) {
// 									// If we write to `module.exports`.
// 									setFormat( result, 'cjs' );
//
// 									exports['default'] = true;
// 									inExport = true;
// 									return {
// 										type: 'ExportDefaultDeclaration',
// 										declaration: node.right
// 									};
//
// 								} else if ( isExportsStatic( node.left ) ) {
// 									// If we write to `exports.<static>`.
// 									setFormat( result, 'cjs' );
//
// 									exports[ node.left.property.name ] = true;
// 									inExport = true;
//
// 									if ( isRequireCall( node.right ) ) {
// 										imports[ node.right.arguments[ 0 ].value ] = true;
//
// 										return {
// 											type: 'ExportNamedDeclaration',
// 											declaration: null,
// 											specifiers: [
// 												{
// 													type: 'ExportSpecifier',
// 													local: {
// 														type: 'Identifier',
// 														name: 'default'
// 													},
// 													exported: node.left.property
// 												}
// 											],
// 											source: {
// 												type: 'Literal',
// 												value: node.right.arguments[ 0 ].value
// 											}
// 										};
// 									}
//
// 									return {
// 										type: 'ExportNamedDeclaration',
// 										declaration: {
// 											type: 'VariableDeclaration',
// 											kind: 'var',
// 											declarations: [
// 												{
// 													type: 'VariableDeclarator',
// 													id: {
// 														type: 'Identifier',
// 														name: node.left.property.name
// 													},
// 													init: node.right
// 												}
// 											]
// 										},
// 										specifiers: [],
// 										source: null
// 									};
// 								}
// 							}
// 						}
// 					}
// 					break;
//
// 				case 'ExportDefaultDeclaration':
// 				case 'ExportNamedDeclaration':
// 					inExport = true;
// 					break;
//
// 				// case 'ImportDeclaration':
// 				// 	inImport = true;
// 			}
// 		},
//
// 		leave: function ( node ) {
// 			switch (node.type) {
// 				case 'FunctionExpression':
// 				case 'FunctionDeclaration':
// 					depth -= 1;
// 					break;
//
// 				case 'ExportDefaultDeclaration':
// 				case 'ExportNamedDeclaration':
// 					inExport = false;
// 					break;
//
// 				// case 'ImportDeclaration':
// 				// 	inImport = false;
// 			}
// 		}
// 	});
//
// 	generatedAst.body = tops.concat(generatedAst.body);
// 	generatedAst.sourceType = 'module';
//
// 	result.ast = generatedAst;
// 	result.imports = Object.keys( imports );
// 	result.exports = Object.keys( exports );
//
// 	return result;
// };
