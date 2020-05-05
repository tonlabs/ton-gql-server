"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AggregationHelperFactory = exports.AggregationFn = void 0;

var _resolversGenerated = require("./resolvers-generated");

const AggregationFn = {
  COUNT: 'COUNT',
  MIN: 'MIN',
  MAX: 'MAX',
  SUM: 'SUM',
  AVERAGE: 'AVERAGE'
};
exports.AggregationFn = AggregationFn;

// Query Builders

/**
 * Returns query parts in form of:
 * { collect: 'a<i> = <exprs0>', result: 'a<i>'} if exprs.length === 1
 * or
 * { collect: 'a<i> = <exprs0>, b<i> = <exprs1>, ..'., result: '{ a: a<i>, b: b<i>, ... }'}
 * if exprs.length > 1
 *
 * @param exprs
 * @param context
 * @return {{result: string, collects: string}}
 */
function queryParts(context, ...exprs) {
  const n = 'abcdef';

  const v = i => `${n[i]}${context.index}`; // 'a0' | 'b0' | ...


  const collectExpr = (x, i) => `${v(i)} = ${x}`; // 'a0 = expr[0]' | 'b0 = expr[1]' | ...


  const returnExpr = (x, i) => `${n[i]}: ${v(i)}`; // 'a: a0' | 'b: b0' | ...


  return {
    collect: exprs.map(collectExpr).join(', '),
    // 'a0 = expr[0], b0 = expr[1], ...'
    result: exprs.length === 1 ? `${v(0)}` // 'a0'
    : `{ ${exprs.map(returnExpr).join(', ')} }` // '{ a: a0, b: b0, ... }'

  };
}

const countField = {
  type: 'string',
  path: ''
};

function count(context) {
  return queryParts(context, 'COUNT(doc)');
}

function simple(context) {
  const fn = context.fn;
  return queryParts(context, context.isArray ? `${fn}(${fn}(${context.field.path}))` : `${fn}(${context.field.path})`);
}

function bigIntToNum(hex) {
  return `TO_NUMBER(CONCAT("0x", ${hex}))`;
}

function bigIntHiPart(path, prefix) {
  return bigIntToNum(`SUBSTRING(${path}, ${prefix}, LENGTH(${path}) - ${prefix + 8})`);
}

function bigIntLoPart(path, prefix) {
  return bigIntToNum(`RIGHT(SUBSTRING(${path}, ${prefix}), 8)`);
}

function bigIntSumExpr(part, context) {
  const path = context.field.path;
  const prefix = context.bigIntPrefix;
  return context.isArray ? `SUM(SUM((${path})[* RETURN ${part('CURRENT', prefix)}]))` : `SUM(${part(path, prefix)})`;
}

function bigIntSum(context) {
  return queryParts(context, bigIntSumExpr(bigIntHiPart, context), bigIntSumExpr(bigIntLoPart, context));
}

function bigIntAvg(context) {
  return queryParts(context, bigIntSumExpr(bigIntHiPart, context), bigIntSumExpr(bigIntLoPart, context), context.isArray ? `SUM(COUNT(${context.field.path}))` : `COUNT(doc)`);
} // Result converters


function convertNone(context, value) {
  return value;
}

function bigIntString(context, value) {
  if (typeof value === 'number') {
    return value.toString();
  } //$FlowFixMe


  return BigInt(`0x${value.substr(context.bigIntPrefix)}`).toString();
} //$FlowFixMe


function bigIntFromParts(parts) {
  const h = BigInt(`0x${Math.round(parts.a).toString(16)}00000000`);
  const l = BigInt(Math.round(parts.b));
  return h + l;
}

function bigIntParts(context, value) {
  return bigIntFromParts(value).toString();
}

function bigIntPartsAvg(context, value) {
  const sum = bigIntFromParts(value);
  const count = Number(value.c || 0);
  const avg = count > 0 ? sum / BigInt(Math.round(count)) : sum;
  return avg.toString();
}

class AggregationHelperFactory {
  static create(collection, index, aggregation) {
    const field = _resolversGenerated.scalarFields.get(`${collection}.${aggregation.field || 'id'}`) || countField;
    const fn = aggregation.fn || AggregationFn.COUNT;
    const context = {
      index,
      field,
      fn,
      bigIntPrefix: field.type === 'uint1024' ? 2 : field.type === 'uint64' ? 1 : 0,
      isArray: field.path.includes('[*]')
    };

    if (context.fn === AggregationFn.COUNT) {
      return {
        context,
        buildQuery: count,
        convertResult: convertNone
      };
    }

    if (context.field.path === '') {
      throw new Error(`[${aggregation.field}] can't be aggregated`);
    }

    if (fn === AggregationFn.MIN || fn === AggregationFn.MAX) {
      return {
        context,
        buildQuery: simple,
        convertResult: context.bigIntPrefix > 0 ? bigIntString : convertNone
      };
    }

    if (field.type === 'number') {
      return {
        context,
        buildQuery: simple,
        convertResult: convertNone
      };
    }

    if (context.bigIntPrefix > 0) {
      return context.fn === AggregationFn.AVERAGE ? {
        context,
        buildQuery: bigIntAvg,
        convertResult: bigIntPartsAvg
      } : {
        context,
        buildQuery: bigIntSum,
        convertResult: bigIntParts
      };
    }

    throw new Error(`[${aggregation.field}] can't be used with [${fn}]`);
  }

  static createQuery(collection, filter, fields) {
    const filterSection = filter ? `FILTER ${filter}` : '';
    const helpers = fields.map((aggregation, i) => {
      return AggregationHelperFactory.create(collection, i, aggregation);
    });
    let text;
    const isSingleCount = fields.length === 1 && fields[0].fn === AggregationFn.COUNT;

    if (isSingleCount) {
      if (filterSection !== '') {
        text = `
                    FOR doc IN ${collection}
                    ${filterSection}
                    COLLECT WITH COUNT INTO a0
                    RETURN [a0]`;
      } else {
        text = `RETURN [LENGTH(${collection})]`;
      }
    } else {
      const queries = helpers.map(x => x.buildQuery(x.context));
      text = `
                FOR doc IN ${collection}
                ${filterSection}
                COLLECT AGGREGATE ${queries.map(x => x.collect).join(', ')}
                RETURN [${queries.map(x => x.result).join(', ')}]`;
    }

    return {
      text,
      helpers
    };
  }

  static convertResults(results, helpers) {
    return results.map((x, i) => {
      if (x === undefined || x === null) {
        return x;
      }

      const helper = helpers[i];
      return helper.convertResult(helper.context, x);
    });
  }

}

exports.AggregationHelperFactory = AggregationHelperFactory;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hZ2dyZWdhdGlvbnMuanMiXSwibmFtZXMiOlsiQWdncmVnYXRpb25GbiIsIkNPVU5UIiwiTUlOIiwiTUFYIiwiU1VNIiwiQVZFUkFHRSIsInF1ZXJ5UGFydHMiLCJjb250ZXh0IiwiZXhwcnMiLCJuIiwidiIsImkiLCJpbmRleCIsImNvbGxlY3RFeHByIiwieCIsInJldHVybkV4cHIiLCJjb2xsZWN0IiwibWFwIiwiam9pbiIsInJlc3VsdCIsImxlbmd0aCIsImNvdW50RmllbGQiLCJ0eXBlIiwicGF0aCIsImNvdW50Iiwic2ltcGxlIiwiZm4iLCJpc0FycmF5IiwiZmllbGQiLCJiaWdJbnRUb051bSIsImhleCIsImJpZ0ludEhpUGFydCIsInByZWZpeCIsImJpZ0ludExvUGFydCIsImJpZ0ludFN1bUV4cHIiLCJwYXJ0IiwiYmlnSW50UHJlZml4IiwiYmlnSW50U3VtIiwiYmlnSW50QXZnIiwiY29udmVydE5vbmUiLCJ2YWx1ZSIsImJpZ0ludFN0cmluZyIsInRvU3RyaW5nIiwiQmlnSW50Iiwic3Vic3RyIiwiYmlnSW50RnJvbVBhcnRzIiwicGFydHMiLCJoIiwiTWF0aCIsInJvdW5kIiwiYSIsImwiLCJiIiwiYmlnSW50UGFydHMiLCJiaWdJbnRQYXJ0c0F2ZyIsInN1bSIsIk51bWJlciIsImMiLCJhdmciLCJBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkiLCJjcmVhdGUiLCJjb2xsZWN0aW9uIiwiYWdncmVnYXRpb24iLCJzY2FsYXJGaWVsZHMiLCJnZXQiLCJpbmNsdWRlcyIsImJ1aWxkUXVlcnkiLCJjb252ZXJ0UmVzdWx0IiwiRXJyb3IiLCJjcmVhdGVRdWVyeSIsImZpbHRlciIsImZpZWxkcyIsImZpbHRlclNlY3Rpb24iLCJoZWxwZXJzIiwidGV4dCIsImlzU2luZ2xlQ291bnQiLCJxdWVyaWVzIiwiY29udmVydFJlc3VsdHMiLCJyZXN1bHRzIiwidW5kZWZpbmVkIiwiaGVscGVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FB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c0NvbnRlbnQiOlsiLy8gQGZsb3dcblxuaW1wb3J0IHR5cGUgeyBTY2FsYXJGaWVsZCB9IGZyb20gXCIuL2RiLXR5cGVzXCI7XG5pbXBvcnQgeyBzY2FsYXJGaWVsZHMgfSBmcm9tIFwiLi9yZXNvbHZlcnMtZ2VuZXJhdGVkXCI7XG5cbmV4cG9ydCBjb25zdCBBZ2dyZWdhdGlvbkZuID0ge1xuICAgIENPVU5UOiAnQ09VTlQnLFxuICAgIE1JTjogJ01JTicsXG4gICAgTUFYOiAnTUFYJyxcbiAgICBTVU06ICdTVU0nLFxuICAgIEFWRVJBR0U6ICdBVkVSQUdFJyxcbn1cblxuZXhwb3J0IHR5cGUgQWdncmVnYXRpb25GblR5cGUgPSAkS2V5czx0eXBlb2YgQWdncmVnYXRpb25Gbj47XG5cbmV4cG9ydCB0eXBlIEZpZWxkQWdncmVnYXRpb24gPSB7XG4gICAgZmllbGQ6IHN0cmluZyxcbiAgICBmbjogQWdncmVnYXRpb25GblR5cGUsXG59XG5cbnR5cGUgQWdncmVnYXRpb25Db250ZXh0ID0ge1xuICAgIGluZGV4OiBudW1iZXIsXG4gICAgZmllbGQ6IFNjYWxhckZpZWxkLFxuICAgIGZuOiBBZ2dyZWdhdGlvbkZuVHlwZSxcbiAgICBiaWdJbnRQcmVmaXg6IG51bWJlcixcbiAgICBpc0FycmF5OiBib29sZWFuLFxufVxuXG50eXBlIEFnZ3JlZ2F0aW9uUXVlcnlQYXJ0cyA9IHtcbiAgICBjb2xsZWN0OiBzdHJpbmcsXG4gICAgcmVzdWx0OiBzdHJpbmcsXG59XG5cbmV4cG9ydCB0eXBlIEFnZ3JlZ2F0aW9uSGVscGVyID0ge1xuICAgIGNvbnRleHQ6IEFnZ3JlZ2F0aW9uQ29udGV4dCxcbiAgICBidWlsZFF1ZXJ5OiAoY29udGV4dDogQWdncmVnYXRpb25Db250ZXh0KSA9PiBBZ2dyZWdhdGlvblF1ZXJ5UGFydHMsXG4gICAgY29udmVydFJlc3VsdDogKGNvbnRleHQ6IEFnZ3JlZ2F0aW9uQ29udGV4dCwgdmFsdWU6IGFueSkgPT4gYW55LFxufVxuXG4vLyBRdWVyeSBCdWlsZGVyc1xuXG4vKipcbiAqIFJldHVybnMgcXVlcnkgcGFydHMgaW4gZm9ybSBvZjpcbiAqIHsgY29sbGVjdDogJ2E8aT4gPSA8ZXhwcnMwPicsIHJlc3VsdDogJ2E8aT4nfSBpZiBleHBycy5sZW5ndGggPT09IDFcbiAqIG9yXG4gKiB7IGNvbGxlY3Q6ICdhPGk+ID0gPGV4cHJzMD4sIGI8aT4gPSA8ZXhwcnMxPiwgLi4nLiwgcmVzdWx0OiAneyBhOiBhPGk+LCBiOiBiPGk+LCAuLi4gfSd9XG4gKiBpZiBleHBycy5sZW5ndGggPiAxXG4gKlxuICogQHBhcmFtIGV4cHJzXG4gKiBAcGFyYW0gY29udGV4dFxuICogQHJldHVybiB7e3Jlc3VsdDogc3RyaW5nLCBjb2xsZWN0czogc3RyaW5nfX1cbiAqL1xuZnVuY3Rpb24gcXVlcnlQYXJ0cyhjb250ZXh0OiBBZ2dyZWdhdGlvbkNvbnRleHQsIC4uLmV4cHJzOiBzdHJpbmdbXSk6IEFnZ3JlZ2F0aW9uUXVlcnlQYXJ0cyB7XG4gICAgY29uc3QgbiA9ICdhYmNkZWYnO1xuICAgIGNvbnN0IHYgPSAoaSkgPT4gYCR7bltpXX0ke2NvbnRleHQuaW5kZXh9YDsgLy8gJ2EwJyB8ICdiMCcgfCAuLi5cbiAgICBjb25zdCBjb2xsZWN0RXhwciA9ICh4LCBpKSA9PiBgJHt2KGkpfSA9ICR7eH1gOyAvLyAnYTAgPSBleHByWzBdJyB8ICdiMCA9IGV4cHJbMV0nIHwgLi4uXG4gICAgY29uc3QgcmV0dXJuRXhwciA9ICh4LCBpKSA9PiBgJHtuW2ldfTogJHt2KGkpfWA7IC8vICdhOiBhMCcgfCAnYjogYjAnIHwgLi4uXG4gICAgcmV0dXJuIHtcbiAgICAgICAgY29sbGVjdDogZXhwcnMubWFwKGNvbGxlY3RFeHByKS5qb2luKCcsICcpLCAvLyAnYTAgPSBleHByWzBdLCBiMCA9IGV4cHJbMV0sIC4uLidcbiAgICAgICAgcmVzdWx0OiBleHBycy5sZW5ndGggPT09IDFcbiAgICAgICAgICAgID8gYCR7digwKX1gIC8vICdhMCdcbiAgICAgICAgICAgIDogYHsgJHtleHBycy5tYXAocmV0dXJuRXhwcikuam9pbignLCAnKX0gfWAsIC8vICd7IGE6IGEwLCBiOiBiMCwgLi4uIH0nXG4gICAgfVxufVxuXG5jb25zdCBjb3VudEZpZWxkOiBTY2FsYXJGaWVsZCA9IHtcbiAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICBwYXRoOiAnJyxcbn07XG5cbmZ1bmN0aW9uIGNvdW50KGNvbnRleHQ6IEFnZ3JlZ2F0aW9uQ29udGV4dCk6IEFnZ3JlZ2F0aW9uUXVlcnlQYXJ0cyB7XG4gICAgcmV0dXJuIHF1ZXJ5UGFydHMoY29udGV4dCwgJ0NPVU5UKGRvYyknKTtcbn1cblxuZnVuY3Rpb24gc2ltcGxlKGNvbnRleHQ6IEFnZ3JlZ2F0aW9uQ29udGV4dCk6IEFnZ3JlZ2F0aW9uUXVlcnlQYXJ0cyB7XG4gICAgY29uc3QgZm4gPSBjb250ZXh0LmZuO1xuICAgIHJldHVybiBxdWVyeVBhcnRzKGNvbnRleHQsIGNvbnRleHQuaXNBcnJheVxuICAgICAgICA/IGAke2ZufSgke2ZufSgke2NvbnRleHQuZmllbGQucGF0aH0pKWBcbiAgICAgICAgOiBgJHtmbn0oJHtjb250ZXh0LmZpZWxkLnBhdGh9KWBcbiAgICApO1xufVxuXG5mdW5jdGlvbiBiaWdJbnRUb051bShoZXg6IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBUT19OVU1CRVIoQ09OQ0FUKFwiMHhcIiwgJHsoaGV4OiBhbnkpfSkpYFxufVxuXG5mdW5jdGlvbiBiaWdJbnRIaVBhcnQocGF0aDogc3RyaW5nLCBwcmVmaXg6IG51bWJlcik6IHN0cmluZyB7XG4gICAgcmV0dXJuIGJpZ0ludFRvTnVtKGBTVUJTVFJJTkcoJHtwYXRofSwgJHtwcmVmaXh9LCBMRU5HVEgoJHtwYXRofSkgLSAke3ByZWZpeCArIDh9KWApO1xufVxuXG5mdW5jdGlvbiBiaWdJbnRMb1BhcnQocGF0aDogc3RyaW5nLCBwcmVmaXg6IG51bWJlcik6IHN0cmluZyB7XG4gICAgcmV0dXJuIGJpZ0ludFRvTnVtKGBSSUdIVChTVUJTVFJJTkcoJHtwYXRofSwgJHtwcmVmaXh9KSwgOClgKTtcbn1cblxuZnVuY3Rpb24gYmlnSW50U3VtRXhwcihwYXJ0OiAocGF0aDogc3RyaW5nLCBwcmVmaXg6IG51bWJlcikgPT4gc3RyaW5nLCBjb250ZXh0OiBBZ2dyZWdhdGlvbkNvbnRleHQpIHtcbiAgICBjb25zdCBwYXRoID0gY29udGV4dC5maWVsZC5wYXRoO1xuICAgIGNvbnN0IHByZWZpeCA9IGNvbnRleHQuYmlnSW50UHJlZml4O1xuICAgIHJldHVybiBjb250ZXh0LmlzQXJyYXlcbiAgICAgICAgPyBgU1VNKFNVTSgoJHtwYXRofSlbKiBSRVRVUk4gJHtwYXJ0KCdDVVJSRU5UJywgcHJlZml4KX1dKSlgXG4gICAgICAgIDogYFNVTSgke3BhcnQocGF0aCwgcHJlZml4KX0pYDtcbn1cblxuZnVuY3Rpb24gYmlnSW50U3VtKGNvbnRleHQ6IEFnZ3JlZ2F0aW9uQ29udGV4dCk6IEFnZ3JlZ2F0aW9uUXVlcnlQYXJ0cyB7XG4gICAgcmV0dXJuIHF1ZXJ5UGFydHMoXG4gICAgICAgIGNvbnRleHQsXG4gICAgICAgIGJpZ0ludFN1bUV4cHIoYmlnSW50SGlQYXJ0LCBjb250ZXh0KSxcbiAgICAgICAgYmlnSW50U3VtRXhwcihiaWdJbnRMb1BhcnQsIGNvbnRleHQpLFxuICAgICk7XG59XG5cbmZ1bmN0aW9uIGJpZ0ludEF2Zyhjb250ZXh0OiBBZ2dyZWdhdGlvbkNvbnRleHQpOiBBZ2dyZWdhdGlvblF1ZXJ5UGFydHMge1xuICAgIHJldHVybiBxdWVyeVBhcnRzKFxuICAgICAgICBjb250ZXh0LFxuICAgICAgICBiaWdJbnRTdW1FeHByKGJpZ0ludEhpUGFydCwgY29udGV4dCksXG4gICAgICAgIGJpZ0ludFN1bUV4cHIoYmlnSW50TG9QYXJ0LCBjb250ZXh0KSxcbiAgICAgICAgY29udGV4dC5pc0FycmF5XG4gICAgICAgICAgICA/IGBTVU0oQ09VTlQoJHtjb250ZXh0LmZpZWxkLnBhdGh9KSlgXG4gICAgICAgICAgICA6IGBDT1VOVChkb2MpYCxcbiAgICApO1xufVxuXG4vLyBSZXN1bHQgY29udmVydGVyc1xuXG5mdW5jdGlvbiBjb252ZXJ0Tm9uZShjb250ZXh0OiBBZ2dyZWdhdGlvbkNvbnRleHQsIHZhbHVlOiBhbnkpOiBhbnkge1xuICAgIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gYmlnSW50U3RyaW5nKGNvbnRleHQ6IEFnZ3JlZ2F0aW9uQ29udGV4dCwgdmFsdWU6IGFueSk6IGFueSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgfVxuICAgIC8vJEZsb3dGaXhNZVxuICAgIHJldHVybiBCaWdJbnQoYDB4JHt2YWx1ZS5zdWJzdHIoY29udGV4dC5iaWdJbnRQcmVmaXgpfWApLnRvU3RyaW5nKCk7XG59XG5cbi8vJEZsb3dGaXhNZVxuZnVuY3Rpb24gYmlnSW50RnJvbVBhcnRzKHBhcnRzOiB7IGE6IG51bWJlciwgYjogbnVtYmVyIH0pOiBCaWdJbnQge1xuICAgIGNvbnN0IGggPSBCaWdJbnQoYDB4JHtNYXRoLnJvdW5kKHBhcnRzLmEpLnRvU3RyaW5nKDE2KX0wMDAwMDAwMGApO1xuICAgIGNvbnN0IGwgPSBCaWdJbnQoTWF0aC5yb3VuZChwYXJ0cy5iKSk7XG4gICAgcmV0dXJuIGggKyBsO1xufVxuXG5mdW5jdGlvbiBiaWdJbnRQYXJ0cyhjb250ZXh0OiBBZ2dyZWdhdGlvbkNvbnRleHQsIHZhbHVlOiBhbnkpOiBhbnkge1xuICAgIHJldHVybiBiaWdJbnRGcm9tUGFydHModmFsdWUpLnRvU3RyaW5nKCk7XG59XG5cbmZ1bmN0aW9uIGJpZ0ludFBhcnRzQXZnKGNvbnRleHQ6IEFnZ3JlZ2F0aW9uQ29udGV4dCwgdmFsdWU6IGFueSk6IGFueSB7XG4gICAgY29uc3Qgc3VtID0gYmlnSW50RnJvbVBhcnRzKHZhbHVlKTtcbiAgICBjb25zdCBjb3VudCA9IE51bWJlcih2YWx1ZS5jIHx8IDApO1xuICAgIGNvbnN0IGF2ZyA9IGNvdW50ID4gMCA/IChzdW0gLyBCaWdJbnQoTWF0aC5yb3VuZChjb3VudCkpKSA6IHN1bTtcbiAgICByZXR1cm4gYXZnLnRvU3RyaW5nKCk7XG59XG5cbmV4cG9ydCBjbGFzcyBBZ2dyZWdhdGlvbkhlbHBlckZhY3Rvcnkge1xuICAgIHN0YXRpYyBjcmVhdGUoY29sbGVjdGlvbjogc3RyaW5nLCBpbmRleDogbnVtYmVyLCBhZ2dyZWdhdGlvbjogRmllbGRBZ2dyZWdhdGlvbik6IEFnZ3JlZ2F0aW9uSGVscGVyIHtcbiAgICAgICAgY29uc3QgZmllbGQgPSBzY2FsYXJGaWVsZHMuZ2V0KGAke2NvbGxlY3Rpb259LiR7YWdncmVnYXRpb24uZmllbGQgfHwgJ2lkJ31gKSB8fCBjb3VudEZpZWxkO1xuICAgICAgICBjb25zdCBmbiA9IGFnZ3JlZ2F0aW9uLmZuIHx8IEFnZ3JlZ2F0aW9uRm4uQ09VTlQ7XG4gICAgICAgIGNvbnN0IGNvbnRleHQ6IEFnZ3JlZ2F0aW9uQ29udGV4dCA9IHtcbiAgICAgICAgICAgIGluZGV4LFxuICAgICAgICAgICAgZmllbGQsXG4gICAgICAgICAgICBmbixcbiAgICAgICAgICAgIGJpZ0ludFByZWZpeDogKGZpZWxkLnR5cGUgPT09ICd1aW50MTAyNCcpID8gMiA6IChmaWVsZC50eXBlID09PSAndWludDY0JyA/IDEgOiAwKSxcbiAgICAgICAgICAgIGlzQXJyYXk6IGZpZWxkLnBhdGguaW5jbHVkZXMoJ1sqXScpLFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChjb250ZXh0LmZuID09PSBBZ2dyZWdhdGlvbkZuLkNPVU5UKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICAgICAgYnVpbGRRdWVyeTogY291bnQsXG4gICAgICAgICAgICAgICAgY29udmVydFJlc3VsdDogY29udmVydE5vbmUsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbnRleHQuZmllbGQucGF0aCA9PT0gJycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgWyR7YWdncmVnYXRpb24uZmllbGR9XSBjYW4ndCBiZSBhZ2dyZWdhdGVkYCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZm4gPT09IEFnZ3JlZ2F0aW9uRm4uTUlOIHx8IGZuID09PSBBZ2dyZWdhdGlvbkZuLk1BWCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgICAgIGJ1aWxkUXVlcnk6IHNpbXBsZSxcbiAgICAgICAgICAgICAgICBjb252ZXJ0UmVzdWx0OiBjb250ZXh0LmJpZ0ludFByZWZpeCA+IDBcbiAgICAgICAgICAgICAgICAgICAgPyBiaWdJbnRTdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgOiBjb252ZXJ0Tm9uZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgICAgICBidWlsZFF1ZXJ5OiBzaW1wbGUsXG4gICAgICAgICAgICAgICAgY29udmVydFJlc3VsdDogY29udmVydE5vbmUsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbnRleHQuYmlnSW50UHJlZml4ID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIChjb250ZXh0LmZuID09PSBBZ2dyZWdhdGlvbkZuLkFWRVJBR0UpXG4gICAgICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgIGJ1aWxkUXVlcnk6IGJpZ0ludEF2ZyxcbiAgICAgICAgICAgICAgICAgICAgY29udmVydFJlc3VsdDogYmlnSW50UGFydHNBdmcsXG4gICAgICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgYnVpbGRRdWVyeTogYmlnSW50U3VtLFxuICAgICAgICAgICAgICAgICAgICBjb252ZXJ0UmVzdWx0OiBiaWdJbnRQYXJ0cyxcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgWyR7YWdncmVnYXRpb24uZmllbGR9XSBjYW4ndCBiZSB1c2VkIHdpdGggWyR7Zm59XWApO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVRdWVyeShcbiAgICAgICAgY29sbGVjdGlvbjogc3RyaW5nLFxuICAgICAgICBmaWx0ZXI6IHN0cmluZyxcbiAgICAgICAgZmllbGRzOiBGaWVsZEFnZ3JlZ2F0aW9uW10sXG4gICAgKToge1xuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIGhlbHBlcnM6IEFnZ3JlZ2F0aW9uSGVscGVyW10sXG4gICAgfSB7XG4gICAgICAgIGNvbnN0IGZpbHRlclNlY3Rpb24gPSBmaWx0ZXIgPyBgRklMVEVSICR7ZmlsdGVyfWAgOiAnJztcbiAgICAgICAgY29uc3QgaGVscGVyczogQWdncmVnYXRpb25IZWxwZXJbXSA9IGZpZWxkcy5tYXAoKGFnZ3JlZ2F0aW9uLCBpKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gQWdncmVnYXRpb25IZWxwZXJGYWN0b3J5LmNyZWF0ZShjb2xsZWN0aW9uLCBpLCBhZ2dyZWdhdGlvbik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxldCB0ZXh0O1xuICAgICAgICBjb25zdCBpc1NpbmdsZUNvdW50ID0gKGZpZWxkcy5sZW5ndGggPT09IDEpICYmIChmaWVsZHNbMF0uZm4gPT09IEFnZ3JlZ2F0aW9uRm4uQ09VTlQpO1xuICAgICAgICBpZiAoaXNTaW5nbGVDb3VudCkge1xuICAgICAgICAgICAgaWYgKGZpbHRlclNlY3Rpb24gIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgdGV4dCA9IGBcbiAgICAgICAgICAgICAgICAgICAgRk9SIGRvYyBJTiAke2NvbGxlY3Rpb259XG4gICAgICAgICAgICAgICAgICAgICR7ZmlsdGVyU2VjdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgQ09MTEVDVCBXSVRIIENPVU5UIElOVE8gYTBcbiAgICAgICAgICAgICAgICAgICAgUkVUVVJOIFthMF1gO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0ZXh0ID0gYFJFVFVSTiBbTEVOR1RIKCR7Y29sbGVjdGlvbn0pXWA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBxdWVyaWVzID0gaGVscGVycy5tYXAoeCA9PiB4LmJ1aWxkUXVlcnkoeC5jb250ZXh0KSk7XG4gICAgICAgICAgICB0ZXh0ID0gYFxuICAgICAgICAgICAgICAgIEZPUiBkb2MgSU4gJHtjb2xsZWN0aW9ufVxuICAgICAgICAgICAgICAgICR7ZmlsdGVyU2VjdGlvbn1cbiAgICAgICAgICAgICAgICBDT0xMRUNUIEFHR1JFR0FURSAke3F1ZXJpZXMubWFwKHggPT4geC5jb2xsZWN0KS5qb2luKCcsICcpfVxuICAgICAgICAgICAgICAgIFJFVFVSTiBbJHtxdWVyaWVzLm1hcCh4ID0+IHgucmVzdWx0KS5qb2luKCcsICcpfV1gO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgaGVscGVycyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY29udmVydFJlc3VsdHMocmVzdWx0czogYW55W10sIGhlbHBlcnM6IEFnZ3JlZ2F0aW9uSGVscGVyW10pOiBhbnlbXSB7XG4gICAgICAgIHJldHVybiByZXN1bHRzLm1hcCgoeCwgaSkgPT4ge1xuICAgICAgICAgICAgaWYgKHggPT09IHVuZGVmaW5lZCB8fCB4ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBoZWxwZXIgPSBoZWxwZXJzW2ldO1xuICAgICAgICAgICAgcmV0dXJuIGhlbHBlci5jb252ZXJ0UmVzdWx0KGhlbHBlci5jb250ZXh0LCB4KTtcbiAgICAgICAgfSk7XG5cbiAgICB9XG59XG5cbiJdfQ==