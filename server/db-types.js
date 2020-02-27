/*
 * Copyright 2018-2020 TON DEV SOLUTIONS LTD.
 *
 * Licensed under the SOFTWARE EVALUATION License (the "License"); you may not use
 * this file except in compliance with the License.  You may obtain a copy of the
 * License at:
 *
 * http://www.ton.dev/licenses
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific TON DEV software governing permissions and
 * limitations under the License.
 */

// @flow


declare function BigInt(a: any): any;

/**
 * Query parameters
 */
export class QParams {
    values: { [string]: any };
    count: number;

    constructor() {
        this.count = 0;
        this.values = {};
    }

    clear() {
        this.count = 0;
        this.values = {};
    }

    add(value: any): string {
        this.count += 1;
        const name = `v${this.count.toString()}`;
        this.values[name] = value;
        return name;
    }
}

/**
 * Abstract interface for objects that acts as a helpers to perform queries over documents
 * using query filters.
 */
type QType = {
    /**
     * Generates an Arango QL condition for specified field based on specified filter.
     * The condition must be a string expression that evaluates to boolean.
     *
     * @param {string} path Path from document root to concrete field
     * @param {any} filter Filter that will be applied to this field
     * @return {string} Arango QL condition text
     */
    ql: (params: QParams, path: string, filter: any) => string,
    /**
     * Tests value in document from Arango DB against specified filter.
     *
     * @param {any} value Value that must be tested against filter
     * @param {any} filter Filter used to test a value
     * @return true if value matches filter
     */
    test: (parent: any, value: any, filter: any) => boolean,
}


/**
 * Generates AQL condition for complex filter.
 *
 * @param {string} path Path to document field.
 * @param {object} filter A filter object specified by user.
 * @param {object} fieldTypes A map of available values for filter fields to helpers.
 * @param {function} qlField Function that generates condition for a concrete field.
 * @return {string} AQL condition
 */
function qlFields(
    path: string,
    filter: any,
    fieldTypes: { [string]: QType },
    qlField: (field: any, path: string, filterKey: string, filterValue: any) => string
): string {
    const conditions: string[] = [];
    Object.entries(filter).forEach(([filterKey, filterValue]) => {
        const fieldType = fieldTypes[filterKey];
        if (fieldType) {
            conditions.push(qlField(fieldType, path, filterKey, filterValue))
        }
    });
    return qlCombine(conditions, 'AND', 'false');
}

/**
 * Test document value against complex filter.
 *
 * @param {any} value Value of the field in document.
 * @param {object} filter A filter object specified by user.
 * @param {object} fieldTypes A map of available values for filter fields to helpers.
 * @param {function} testField Function that performs test value against a selected field.
 * @return {string} AQL condition
 */
function testFields(
    value: any,
    filter: any,
    fieldTypes: { [string]: QType },
    testField: (fieldType: any, value: any, filterKey: string, filterValue: any) => boolean
): boolean {
    const failed = Object.entries(filter).find(([filterKey, filterValue]) => {
        const fieldType = fieldTypes[filterKey];
        return !(fieldType && testField(fieldType, value, filterKey, filterValue));
    });
    return !failed;
}


function combine(path: string, key: string): string {
    return key !== '' ? `${path}.${key}` : path;
}

function qlOp(params: QParams, path: string, op: string, filter: any): string {
    const paramName = params.add(filter);

    /*
     * Following TO_STRING cast required due to specific comparision of _key fields in Arango
     * For example this query:
     * ```FOR doc IN accounts FILTER doc._key >= "ff" RETURN doc._key````
     * Will return:
     * ```["fe03318161937ebb3682f69ac9f97beafbc4b9ee6e1f86d59e1bf8d27ab84867"]```
     */
    const isKeyOrderedComparision = path.endsWith('._key') && op !== '==' && op !== '!=';
    const fixedPath = isKeyOrderedComparision ? `TO_STRING(${path})` : path;
    const fixedValue = `@${paramName}`;
    return `${fixedPath} ${op} ${fixedValue}`;
}

function qlCombine(conditions: string[], op: string, defaultConditions: string): string {
    if (conditions.length === 0) {
        return defaultConditions;
    }
    if (conditions.length === 1) {
        return conditions[0];
    }
    return '(' + conditions.join(`) ${op} (`) + ')';
}

function qlIn(params: QParams, path: string, filter: any): string {
    const conditions = filter.map(value => qlOp(params, path, '==', value));
    return qlCombine(conditions, 'OR', 'false');
}

// Scalars

function undefinedToNull(v: any): any {
    return v !== undefined ? v : null;
}

const scalarEq: QType = {
    ql(params: QParams, path, filter) {
        return qlOp(params, path, '==', filter);
    },
    test(parent, value, filter) {
        return value === filter;
    },
};

const scalarNe: QType = {
    ql(params, path, filter) {
        return qlOp(params, path, '!=', filter);
    },
    test(parent, value, filter) {
        return value !== filter;
    },
};

const scalarLt: QType = {
    ql(params, path, filter) {
        return qlOp(params, path, '<', filter);
    },
    test(parent, value, filter) {
        return value < filter;
    },
};

const scalarLe: QType = {
    ql(params, path, filter) {
        return qlOp(params, path, '<=', filter);
    },
    test(parent, value, filter) {
        return value <= filter;
    },
};

const scalarGt: QType = {
    ql(params, path, filter) {
        return qlOp(params, path, '>', filter);
    },
    test(parent, value, filter) {
        return value > filter;
    },
};

const scalarGe: QType = {
    ql(params, path, filter) {
        return qlOp(params, path, '>=', filter);
    },
    test(parent, value, filter) {
        return value >= filter;
    },
};

const scalarIn: QType = {
    ql(params, path, filter) {
        return qlIn(params, path, filter);
    },
    test(parent, value, filter) {
        return filter.includes(value);
    },
};

const scalarNotIn: QType = {
    ql(params, path, filter) {
        return `NOT (${qlIn(params, path, filter)})`;
    },
    test(parent, value, filter) {
        return !filter.includes(value);
    }
};

const scalarOps = {
    eq: scalarEq,
    ne: scalarNe,
    lt: scalarLt,
    le: scalarLe,
    gt: scalarGt,
    ge: scalarGe,
    in: scalarIn,
    notIn: scalarNotIn,
};

function createScalar(): QType {
    return {
        ql(params, path, filter) {
            return qlFields(path, filter, scalarOps, (op, path, filterKey, filterValue) => {
                return op.ql(params, path, filterValue);
            });
        },
        test(parent, value, filter) {
            return testFields(value, filter, scalarOps, (op, value, filterKey, filterValue) => {
                return op.test(parent, undefinedToNull(value), filterValue);
            });
        },
    };
}

function resolveBigUInt(prefixLength: number, value: any): string {
    if (value === null || value === undefined) {
        return value;
    }
    return (typeof value === 'number')
        ? `0x${value.toString(16)}`
        : `0x${value.toString().substr(prefixLength)}`;
}

function convertBigUInt(prefixLength: number, value: any): string {
    if (value === null || value === undefined) {
        return value;
    }
    const hex = BigInt(value).toString(16);
    const len = hex.length.toString(16);
    const missingZeros = prefixLength - len.length;
    const prefix = missingZeros > 0 ? `${'0'.repeat(missingZeros)}${len}` : len;
    return `${prefix}${hex}`;
}

function createBigUInt(prefixLength: number): QType {
    return {
        ql(params, path, filter) {
            return qlFields(path, filter, scalarOps, (op, path, filterKey, filterValue) => {
                const converted = (op === scalarOps.in || op === scalarOps.notIn)
                    ? filterValue.map(x => convertBigUInt(prefixLength, x))
                    : convertBigUInt(prefixLength, filterValue);
                return op.ql(params, path, converted);
            });
        },
        test(parent, value, filter) {
            return testFields(value, filter, scalarOps, (op, value, filterKey, filterValue) => {
                const converted = (op === scalarOps.in || op === scalarOps.notIn)
                    ? filterValue.map(x => convertBigUInt(prefixLength, x))
                    : convertBigUInt(prefixLength, filterValue);
                return op.test(parent, value, converted);
            });
        },
    };
}

const scalar: QType = createScalar();
const bigUInt1: QType = createBigUInt(1);
const bigUInt2: QType = createBigUInt(2);

// Structs

function struct(fields: { [string]: QType }, isCollection?: boolean): QType {
    return {
        ql(params, path, filter) {
            return qlFields(path, filter, fields, (fieldType, path, filterKey, filterValue) => {
                const fieldName = isCollection && (filterKey === 'id') ? '_key' : filterKey;
                return fieldType.ql(params, combine(path, fieldName), filterValue);
            });
        },
        test(parent, value, filter) {
            if (!value) {
                return false;
            }
            return testFields(value, filter, fields, (fieldType, value, filterKey, filterValue) => {
                const fieldName = isCollection && (filterKey === 'id') ? '_key' : filterKey;
                return fieldType.test(value, value[fieldName], filterValue);
            });
        }
    }
}

// Arrays

function array(itemType: QType): QType {
    const ops = {
        all: {
            ql(params, path, filter) {
                const itemQl = itemType.ql(params, 'CURRENT', filter);
                return `LENGTH(${path}[* FILTER ${itemQl}]) == LENGTH(${path})`;
            },
            test(parent, value, filter) {
                const failedIndex = value.findIndex(x => !itemType.test(parent, x, filter));
                return failedIndex < 0;
            },
        },
        any: {
            ql(params, path, filter) {
                const paramName = `@v${params.count + 1}`;
                const itemQl = itemType.ql(params, 'CURRENT', filter);
                if (itemQl === `CURRENT == ${paramName}`) {
                    return `${paramName} IN ${path}[*]`;
                }
                return `LENGTH(${path}[* FILTER ${itemQl}]) > 0`;
            },
            test(parent, value, filter) {
                const succeededIndex = value.findIndex(x => itemType.test(parent, x, filter));
                return succeededIndex >= 0;
            }
        },
    };
    return {
        ql(params, path, filter) {
            return qlFields(path, filter, ops, (op, path, filterKey, filterValue) => {
                return op.ql(params, path, filterValue);
            });
        },
        test(parent, value, filter) {
            if (!value) {
                return false;
            }
            return testFields(value, filter, ops, (op, value, filterKey, filterValue) => {
                return op.test(parent, value, filterValue);
            });
        }
    }
}

// Enum Names

function createEnumNamesMap(values: { [string]: number }): Map<number, string> {
    const names: Map<number, string> = new Map();
    Object.entries(values).forEach(([name, value]) => {
        names.set(Number.parseInt((value: any)), name);
    });
    return names;
}

export function enumName(onField: string, values: { [string]: number }): QType {
    const resolveValue = (name) => {
        let value = values[name];
        if (value === undefined) {
            throw new Error(`Invalid value [${name}] for ${onField}_name`);
        }
        return value;
    };

    return {
        ql(params, path, filter) {
            const on_path = path.split('.').slice(0, -1).concat(onField).join('.');
            return qlFields(on_path, filter, scalarOps, (op, path, filterKey, filterValue) => {
                const resolved = (op === scalarOps.in || op === scalarOps.notIn)
                    ? filterValue.map(resolveValue)
                    : resolveValue(filterValue);
                return op.ql(params, path, resolved);
            });
        },
        test(parent, value, filter) {
            return testFields(value, filter, scalarOps, (op, value, filterKey, filterValue) => {
                const resolved = (op === scalarOps.in || op === scalarOps.notIn)
                    ? filterValue.map(resolveValue)
                    : resolveValue(filterValue);
                return op.test(parent, parent[onField], resolved);
            });
        },
    };
}

export function createEnumNameResolver(onField: string, values: { [string]: number }): (parent) => ?string {
    const names = createEnumNamesMap(values);
    return (parent) => {
        const value = parent[onField];
        const name = names.get(value);
        return name !== undefined ? name : null;
    };
}

// Joins

function join(onField: string, refCollection: string, refType: QType): QType {
    return {
        ql(params, path, filter) {
            const on_path = path.split('.').slice(0, -1).concat(onField).join('.');
            const alias = `${on_path.replace('.', '_')}`;
            const refQl = refType.ql(params, alias, filter);
            return `
                LENGTH(
                    FOR ${alias} IN ${refCollection}
                    FILTER (${alias}._key == ${on_path}) AND (${refQl})
                    LIMIT 1
                    RETURN 1
                ) > 0`;
        },
        test: refType.test,
    };
}

function joinArray(onField: string, refCollection: string, refType: QType): QType {
    return {
        ql(params, path, filter) {
            const refFilter = filter.all || filter.any;
            const all = !!filter.all;
            const on_path = path.split('.').slice(0, -1).concat(onField).join('.');
            const alias = `${on_path.replace('.', '_')}`;
            const refQl = refType.ql(params, alias, refFilter);
            return `
                (LENGTH(${on_path}) > 0)
                AND (LENGTH(
                    FOR ${alias} IN ${refCollection}
                    FILTER (${alias}._key IN ${on_path}) AND (${refQl})
                    ${!all ? 'LIMIT 1' : ''}
                    RETURN 1
                ) ${all ? `== LENGTH(${on_path})` : '> 0'})`;
        },
        test: refType.test,
    };
}

export {
    scalar,
    bigUInt1,
    bigUInt2,
    resolveBigUInt,
    convertBigUInt,
    struct,
    array,
    join,
    joinArray
}

export type {
    QType
}
