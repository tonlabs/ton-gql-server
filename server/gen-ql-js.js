//@flow

import { makeFieldTypeName, Writer } from 'ton-labs-dev-ops/dist/src/gen.js';
import type { SchemaMember, SchemaType, TypeDef } from 'ton-labs-dev-ops/src/schema.js';
import { parseTypeDef } from 'ton-labs-dev-ops/dist/src/schema.js';

const DbTypeCategory = {
    unresolved: 'unresolved',
    scalar: 'scalar',
    union: 'union',
    struct: 'struct',
};

type DbJoin = {
    collection: string,
    on: string,
}

type DbType = {
    name: string,
    category: $Keys<typeof DbTypeCategory>,
    collection?: string,
    fields: DbField[],
}

type DbField = {
    name: string,
    arrayDepth: number,
    join?: DbJoin,
    type: DbType,
}

function scalarType(name: string): DbType {
    return {
        name,
        category: DbTypeCategory.scalar,
        fields: []
    }
}

const scalarTypes = {
    int: scalarType('Int'),
    uint64: scalarType('String'),
    uint1024: scalarType('String'),
    float: scalarType('Float'),
    boolean: scalarType('Boolean'),
    string: scalarType('String'),
};

function unresolvedType(name: string): DbType {
    return {
        name,
        category: DbTypeCategory.unresolved,
        fields: [],
    }
}

function main(schemaDef: TypeDef) {

    let dbTypes: DbType[] = [];
    let lastReportedType: string = '';

    function reportType(name: string, field: string, type: string) {
        if (name !== lastReportedType) {
            console.log(name);
            lastReportedType = name;
        }
        console.log(`    ${field}: ${type}`);

    }

    function getIntType(t: SchemaType): string {
        if (t.int && t.int.unsigned) {
            return `u${(t.int.unsigned: any)}`;
        } else if (t.int && t.int.signed) {
            return `i${(t.int.signed: any)}`;
        } else {
            return 'i32';
        }
    }

    function parseDbField(
        typeName: string,
        schemaField: SchemaMember<SchemaType>,
    ): DbField {
        let schemaType = schemaField;
        const field: DbField = {
            name: schemaField.name,
            arrayDepth: 0,
            type: scalarTypes.string,
        };
        while (schemaType.array) {
            field.arrayDepth += 1;
            schemaType = schemaType.array;
        }
        const join = (schemaType: any)._.join;
        if (join) {
            field.join = join;
        }
        if (schemaType.union || schemaType.struct) {
            field.type = unresolvedType(makeFieldTypeName(typeName, schemaField.name));
        } else if (schemaType.ref) {
            field.type = unresolvedType(schemaType.ref.name);
        } else if (schemaType.bool) {
            field.type = scalarTypes.boolean;
        } else if (schemaType.int) {
            const uintSize: number = (schemaType.int: any).unsigned;
            if (uintSize) {
                if (uintSize >= 128) {
                    reportType(typeName, field.name, 'u1024');
                    field.type = scalarTypes.uint1024;
                } else if (uintSize >= 64) {
                    reportType(typeName, field.name, 'u64');
                    field.type = scalarTypes.uint64;
                } else if (uintSize >= 32) {
                    reportType(typeName, field.name, 'u32');
                    field.type = scalarTypes.float;
                } else {
                    reportType(typeName, field.name, `u${uintSize}`);
                    field.type = scalarTypes.int;
                }
            } else {
                const intSize: number = (schemaType.int: any).signed;
                if (intSize && intSize > 32) {
                    throw new Error(`Integer type with size ${intSize} bit does not supported`);
                } else {
                    reportType(typeName, field.name, 'i32');
                    field.type = scalarTypes.int;
                }
            }
        } else if (schemaType.float) {
            reportType(typeName, field.name, 'float');
            field.type = scalarTypes.float;
        } else if (schemaType.string) {
            field.type = scalarTypes.string;
        } else {
            field.type = scalarTypes.string;
            console.log('>>> Invalid field type: ', JSON.stringify(schemaType));
            process.exit(1);
        }
        return field;
    }

    function unwrapArrays(type: SchemaType): SchemaType {
        if (type.array) {
            return unwrapArrays(type.array);
        }
        return type;
    }

    function parseDbType(
        name: string,
        schemaType: SchemaType
    ) {
        const struct = schemaType.union || schemaType.struct;
        if (!struct) {
            console.log('>>>', `?? ${name}: ${JSON.stringify(schemaType).substr(0, 20)}`);
            return;
        }
        const type: DbType = {
            name,
            category: schemaType.union ? DbTypeCategory.union : DbTypeCategory.struct,
            fields: [],
            collection: (schemaType: any)._.collection,
        };

        if (type.collection) {
            type.fields.push({
                name: 'id',
                arrayDepth: 0,
                type: scalarTypes.string,
            });
        }
        struct.forEach((field) => {
            type.fields.push(parseDbField(name, field));
            const unwrapped = unwrapArrays(field);
            const ownType = (unwrapped.struct || unwrapped.union) ? unwrapped : null;
            if (ownType) {
                parseDbType(makeFieldTypeName(name, field.name), ownType);
            }
        });
        dbTypes.push(type);
    }

    function parseDbTypes(types: SchemaMember<SchemaType>[]) {
        types.forEach((type: SchemaMember<SchemaType>) => {
            parseDbType(type.name, type);
        });
        const unresolved: Map<string, DbType> = new Map<string, DbType>();
        const resolving: Set<string> = new Set<string>();
        const resolved: Map<string, DbType> = new Map<string, DbType>();
        const orderedResolved: DbType[] = [];
        dbTypes.forEach(t => unresolved.set(t.name, t));
        const resolveType = (type: DbType) => {
            if (resolved.has(type.name)) {
                return;
            }
            if (resolving.has(type.name)) {
                console.log('>>>', `Circular reference to type ${type.name}`);
                process.exit(1);
            }
            resolving.add(type.name);
            type.fields.forEach((field) => {
                if (field.type.category === DbTypeCategory.unresolved) {
                    let type = resolved.get(field.type.name);
                    if (!type) {
                        type = unresolved.get(field.type.name);
                        if (type) {
                            resolveType(type);
                        } else {
                            console.log('>>>', `Referenced type not found: ${field.type.name}`);
                            process.exit(1);
                        }
                    }
                    if (type) {
                        field.type = type;
                    }
                }
            });
            resolving.delete(type.name);
            orderedResolved.push(type);
            unresolved.delete(type.name);
            resolved.set(type.name, type);
        };
        dbTypes.forEach(resolveType);
        dbTypes = orderedResolved;
    }

// Generators

    const ql = new Writer();
    const js = new Writer();

    function unionVariantType(type: DbType, variant: DbField): string {
        return `${type.name}${variant.name}Variant`;
    }

    function genQLTypeDeclarationsForUnionVariants(type: DbType) {
        type.fields.forEach((variant) => {
            ql.writeBlockLn(`
        type ${unionVariantType(type, variant)} {
            ${variant.name}: ${variant.type.name}
        }

        `);
        });
    }

    function genQLTypeDeclaration(type: DbType) {
        if (type.category === DbTypeCategory.union) {
            genQLTypeDeclarationsForUnionVariants(type);
            ql.writeLn(`union ${type.name} = `);
            type.fields.forEach(variant => {
                ql.writeLn(`\t| ${unionVariantType(type, variant)}`);
            });
            ql.writeLn();
        } else {
            ql.writeLn(`type ${type.name} {`);
            type.fields.forEach(field => {
                const typeDeclaration =
                    '['.repeat(field.arrayDepth) +
                    field.type.name +
                    ']'.repeat(field.arrayDepth);
                ql.writeLn(`\t${field.name}: ${typeDeclaration}`);
            });
            ql.writeLn(`}`);
        }
        ql.writeLn();
    }

    function preventTwice(name: string, names: Set<string>, work: () => void) {
        if (!names.has(name)) {
            names.add(name);
            work();
        }
    }

    function genQLFiltersForArrayFields(type: DbType, qlNames: Set<string>) {
        type.fields.forEach((field) => {
            let itemTypeName = field.type.name;
            for (let i = 0; i < field.arrayDepth; i += 1) {
                const filterName = `${itemTypeName}ArrayFilter`;
                preventTwice(filterName, qlNames, () => {
                    ql.writeLn(`input ${filterName} {`);
                    ['any', 'all'].forEach((op) => {
                        ql.writeLn(`\t${op}: ${itemTypeName}Filter`);
                    });
                    ql.writeLn('}');
                    ql.writeLn();

                });
                itemTypeName += 'Array';
            }
        });
    }

    function genQLFilter(type: DbType, qlNames: Set<string>) {
        if (type.fields.length === 0) {
            return;
        }
        genQLFiltersForArrayFields(type, qlNames);
        ql.writeLn(`input ${type.name}Filter {`);
        type.fields.forEach((field) => {
            const typeDeclaration = field.type.name + "Array".repeat(field.arrayDepth);
            ql.writeLn(`\t${field.name}: ${typeDeclaration}Filter`);
        });
        ql.writeLn(`}`);
        ql.writeLn();
    }

    function genQLScalarTypesFilter(name: string) {
        ql.writeLn(`input ${name}Filter {`);
        ['eq', 'ne', 'gt', 'lt', 'ge', 'le'].forEach((op) => {
            ql.writeLn(`\t${op}: ${name}`);
        });
        ['in', 'notIn'].forEach((op) => {
            ql.writeLn(`\t${op}: [${name}]`);
        });
        ql.writeLn('}');
        ql.writeLn();
    }

    function genQLQueries(types: DbType[]) {
        ql.writeBlockLn(`
        enum QueryOrderByDirection {
            ASC
            DESC
        }

        input QueryOrderBy {
            path: String
            direction: QueryOrderByDirection
        }

        type Query {
        `);

        types.forEach((type: DbType) => {
            ql.writeLn(`\t${type.collection || ''}(filter: ${type.name}Filter, orderBy: [QueryOrderBy], limit: Int): [${type.name}]`);
        });

        ql.writeBlockLn(`
            select(query: String!, bindVarsJson: String!): String!
        }

        `);
    }

    function genQLSubscriptions(types: DbType[]) {
        ql.writeLn('type Subscription {');
        types.forEach((type) => {
            ql.writeLn(`\t${type.collection || ''}(filter: ${type.name}Filter): ${type.name}`);
        });
        ql.writeLn('}');
    }


    function genJSFiltersForArrayFields(type: DbType, jsNames: Set<string>) {
        type.fields.forEach((field) => {
            let itemTypeName = field.type.name;
            for (let i = 0; i < field.arrayDepth; i += 1) {
                const filterName = `${itemTypeName}Array`;
                preventTwice(filterName, jsNames, () => {
                    js.writeBlockLn(`
                const ${filterName} = array(${itemTypeName});
                `);
                });
                itemTypeName += 'Array';
            }
        });
    }

    function genJSStructFilter(type: DbType) {
        js.writeBlockLn(`
        const ${type.name} = struct({
    `);
        type.fields.forEach((field) => {
            let typeDeclaration: ?string = null;
            const join = field.join;
            if (join) {
                typeDeclaration = `join${field.arrayDepth > 0 ? 'Array' : ''}('${join.on}', '${field.type.collection || ''}', ${field.type.name})`;
            } else if (field.arrayDepth > 0) {
                typeDeclaration =
                    field.type.name +
                    'Array'.repeat(field.arrayDepth);
            } else if (field.type.category === DbTypeCategory.scalar) {
                if (field.type === scalarTypes.uint64) {
                    typeDeclaration = 'bigUInt1';
                } else if (field.type === scalarTypes.uint1024) {
                    typeDeclaration = 'bigUInt2';
                } else {
                    typeDeclaration = 'scalar';
                }
            } else if (field.type.fields.length > 0) {
                typeDeclaration = field.type.name;
            }
            if (typeDeclaration) {
                js.writeLn(`    ${field.name}: ${typeDeclaration},`);
            }
        });
        js.writeBlockLn(`
        }${type.collection ? ', true' : ''});

    `);
    }

    function genJSUnionResolver(type: DbType) {
        js.writeBlockLn(`
        const ${type.name}Resolver = {
            __resolveType(obj, context, info) {
        `);
        type.fields.forEach((variant) => {
            js.writeLn(`        if ('${variant.name}' in obj) {`);
            js.writeLn(`            return '${unionVariantType(type, variant)}';`);
            js.writeLn(`        }`);
        });
        js.writeBlockLn(`
                return null;
            }
        };

        `);
    }

    function genJSFilter(type: DbType, jsNames: Set<string>) {
        if (type.fields.length === 0) {
            return;
        }
        if (type.category === DbTypeCategory.union) {
            // genJSFiltersForUnionVariants(type, jsNames);
        }
        genJSFiltersForArrayFields(type, jsNames);
        genJSStructFilter(type);
        if (type.category === DbTypeCategory.union) {
            genJSUnionResolver(type);
        }


    }

    /**
     * Generate custom resolvers for types with:
     * - id field
     * - join fields
     * - u64 and higher fields
     * @param type
     */
    function genJSCustomResolvers(type: DbType) {
        const joinFields = type.fields.filter(x => !!x.join);
        const bigUIntFields = type.fields.filter((x: DbField) => (x.type === scalarTypes.uint64) || (x.type === scalarTypes.uint1024));
        const customResolverRequired = type.collection
            || joinFields.length > 0
            || bigUIntFields.length > 0;
        if (!customResolverRequired) {
            return;
        }
        js.writeLn(`        ${type.name}: {`);
        if (type.collection) {
            js.writeLn('            id(parent) {');
            js.writeLn('                return parent._key;');
            js.writeLn('            },');
        }
        joinFields.forEach((field) => {
            const onField = type.fields.find(x => x.name === (field.join && field.join.on) || '');
            if (!onField) {
                throw 'Join on field does not exist.';
            }
            const collection = field.type.collection;
            if (!collection) {
                throw 'Joined type is not a collection.';
            }
            js.writeLn(`            ${field.name}(parent) {`);
            if (field.arrayDepth === 0) {
                js.writeLn(`                return db.fetchDocByKey(db.${collection}, parent.${onField.name});`);
            } else if (field.arrayDepth === 1) {
                js.writeLn(`                return db.fetchDocsByKeys(db.${collection}, parent.${onField.name});`);
            } else {
                throw 'Joins on a nested arrays does not supported.';
            }
            js.writeLn(`            },`);
        });
        bigUIntFields.forEach((field) => {
            const prefixLength = field.type === scalarTypes.uint64 ? 1 : 2;
            js.writeLn(`            ${field.name}(parent) {`);
            js.writeLn(`                return resolveBigUInt(${prefixLength}, parent.${field.name});`);
            js.writeLn(`            },`);
        });
        js.writeLn(`        },`);
    }


    function genJSTypeResolversForUnion(type: DbType) {
        if (type.category === DbTypeCategory.union) {
            js.writeLn(`        ${type.name}: ${type.name}Resolver,`);
        }
    }

    function generate(types: DbType[]) {

        // QL

        ['String', 'Boolean', 'Int', 'Float'].forEach(genQLScalarTypesFilter);
        types.forEach(type => genQLTypeDeclaration(type));
        const qlArrayFilters = new Set<string>();
        types.forEach(type => genQLFilter(type, qlArrayFilters));

        const collections = types.filter(t => !!t.collection);
        genQLQueries(collections);
        genQLSubscriptions(collections);

        // JS

        js.writeBlockLn(`
        const { scalar, bigUInt1, bigUInt2, resolveBigUInt, struct, array, join, joinArray } = require('./arango-types.js');
        `);
        const jsArrayFilters = new Set<string>();
        types.forEach(type => genJSFilter(type, jsArrayFilters));

        js.writeBlockLn(`
        function createResolvers(db) {
            return {
        `);
        types.forEach((type) => {
            genJSCustomResolvers(type);
            genJSTypeResolversForUnion(type);
        });
        js.writeLn('        Query: {');
        collections.forEach((type) => {
            js.writeLn(`            ${type.collection || ''}: db.collectionQuery(db.${type.collection || ''}, ${type.name}),`)
        });
        js.writeLn('            select: db.selectQuery(),');
        js.writeLn('        },');
        js.writeLn('        Subscription: {');
        collections.forEach((type) => {
            js.writeLn(`            ${type.collection || ''}: db.collectionSubscription(db.${type.collection || ''}, ${type.name}),`)
        });
        js.writeBlockLn(`
                }
            }
        }
        `);

        js.writeBlockLn(`
        module.exports = {
            createResolvers,
        `);
        types.forEach(type => js.writeLn(`    ${type.name},`));
        js.writeBlockLn(`
        };
        `);
    }

    const schema = parseTypeDef(schemaDef);

    if (schema.class) {
        parseDbTypes(schema.class.types);
        generate(dbTypes);
    }

    return {
        ql: ql.generated(),
        js: js.generated(),
    }
}

export default main;