"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cleanError = cleanError;
exports.createError = createError;
exports.wrap = wrap;
exports.parseSelectionSet = parseSelectionSet;
exports.selectionToString = selectionToString;
exports.selectFields = selectFields;
exports.toLog = toLog;
exports.RegistryMap = void 0;

function cleanError(error) {
  if ('ArangoError' in error) {
    return error.ArangoError;
  }

  delete error.request;
  delete error.response;
  error.stack = '...';
  return error;
}

function createError(code, message, source = 'graphql') {
  const error = new Error(message);
  error.source = source;
  error.code = code;
  error.stack = '...';
  return error;
}

function isInternalServerError(error) {
  if ('type' in error && error.type === 'system') {
    return true;
  }

  if ('errno' in error && 'syscall' in error) {
    return true;
  }
}

async function wrap(log, op, args, fetch) {
  try {
    return await fetch();
  } catch (err) {
    let cleaned = cleanError(err);
    log.error('FAILED', op, args, cleaned);

    if (isInternalServerError(cleaned)) {
      cleaned = createError(500, 'Service temporary unavailable');
    }

    throw cleaned;
  }
}

class RegistryMap {
  constructor(name) {
    this.name = name;
    this.lastId = 0;
    this.items = new Map();
  }

  add(item) {
    let id = this.lastId;

    do {
      id = id < Number.MAX_SAFE_INTEGER ? id + 1 : 1;
    } while (this.items.has(id));

    this.lastId = id;
    this.items.set(id, item);
    return id;
  }

  remove(id) {
    if (!this.items.delete(id)) {
      console.error(`Failed to remove ${this.name}: item with id [${id}] does not exists`);
    }
  }

  entries() {
    return [...this.items.entries()];
  }

  values() {
    return [...this.items.values()];
  }

}

exports.RegistryMap = RegistryMap;

function parseSelectionSet(selectionSet, returnFieldSelection) {
  const fields = [];
  const selections = selectionSet && selectionSet.selections;

  if (selections) {
    for (const item of selections) {
      const name = item.name && item.name.value || '';

      if (name) {
        const field = {
          name,
          selection: parseSelectionSet(item.selectionSet, '')
        };

        if (returnFieldSelection !== '' && field.name === returnFieldSelection) {
          return field.selection;
        }

        fields.push(field);
      }
    }
  }

  return fields;
}

function selectionToString(selection) {
  return selection.filter(x => x.name !== '__typename').map(field => {
    const fieldSelection = selectionToString(field.selection);
    return `${field.name}${fieldSelection !== '' ? ` { ${fieldSelection} }` : ''}`;
  }).join(' ');
}

function selectFields(doc, selection) {
  if (selection.length === 0) {
    return doc;
  }

  const selected = {};

  if (doc._key) {
    selected._key = doc._key;
    selected.id = doc._key;
  }

  for (const item of selection) {
    const requiredForJoin = {
      in_message: ['in_msg'],
      out_messages: ['out_msg'],
      signatures: ['id'],
      src_transaction: ['id', 'msg_type'],
      dst_transaction: ['id', 'msg_type']
    }[item.name];

    if (requiredForJoin !== undefined) {
      requiredForJoin.forEach(field => {
        if (doc[field] !== undefined) {
          selected[field] = doc[field];
        }
      });
    }

    const value = doc[item.name];

    if (value !== undefined) {
      selected[item.name] = item.selection.length > 0 ? selectFields(value, item.selection) : value;
    }
  }

  return selected;
}

function toLog(value, objs) {
  const typeOf = typeof value;

  switch (typeOf) {
    case "undefined":
    case "boolean":
    case "number":
    case "bigint":
    case "symbol":
      return value;

    case "string":
      if (value.length > 80) {
        return `${value.substr(0, 50)}… [${value.length}]`;
      }

      return value;

    case "function":
      return undefined;

    default:
      if (value === null) {
        return value;
      }

      if (objs && objs.includes(value)) {
        return undefined;
      }

      const newObjs = objs ? [...objs, value] : [value];

      if (Array.isArray(value)) {
        return value.map(x => toLog(x, newObjs));
      }

      const valueToLog = {};
      Object.entries(value).forEach(([n, v]) => {
        const propertyValueToLog = toLog(v, newObjs);

        if (propertyValueToLog !== undefined) {
          valueToLog[n] = propertyValueToLog;
        }
      });
      return valueToLog;
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci91dGlscy5qcyJdLCJuYW1lcyI6WyJjbGVhbkVycm9yIiwiZXJyb3IiLCJBcmFuZ29FcnJvciIsInJlcXVlc3QiLCJyZXNwb25zZSIsInN0YWNrIiwiY3JlYXRlRXJyb3IiLCJjb2RlIiwibWVzc2FnZSIsInNvdXJjZSIsIkVycm9yIiwiaXNJbnRlcm5hbFNlcnZlckVycm9yIiwidHlwZSIsIndyYXAiLCJsb2ciLCJvcCIsImFyZ3MiLCJmZXRjaCIsImVyciIsImNsZWFuZWQiLCJSZWdpc3RyeU1hcCIsImNvbnN0cnVjdG9yIiwibmFtZSIsImxhc3RJZCIsIml0ZW1zIiwiTWFwIiwiYWRkIiwiaXRlbSIsImlkIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsImhhcyIsInNldCIsInJlbW92ZSIsImRlbGV0ZSIsImNvbnNvbGUiLCJlbnRyaWVzIiwidmFsdWVzIiwicGFyc2VTZWxlY3Rpb25TZXQiLCJzZWxlY3Rpb25TZXQiLCJyZXR1cm5GaWVsZFNlbGVjdGlvbiIsImZpZWxkcyIsInNlbGVjdGlvbnMiLCJ2YWx1ZSIsImZpZWxkIiwic2VsZWN0aW9uIiwicHVzaCIsInNlbGVjdGlvblRvU3RyaW5nIiwiZmlsdGVyIiwieCIsIm1hcCIsImZpZWxkU2VsZWN0aW9uIiwiam9pbiIsInNlbGVjdEZpZWxkcyIsImRvYyIsImxlbmd0aCIsInNlbGVjdGVkIiwiX2tleSIsInJlcXVpcmVkRm9ySm9pbiIsImluX21lc3NhZ2UiLCJvdXRfbWVzc2FnZXMiLCJzaWduYXR1cmVzIiwic3JjX3RyYW5zYWN0aW9uIiwiZHN0X3RyYW5zYWN0aW9uIiwidW5kZWZpbmVkIiwiZm9yRWFjaCIsInRvTG9nIiwib2JqcyIsInR5cGVPZiIsInN1YnN0ciIsImluY2x1ZGVzIiwibmV3T2JqcyIsIkFycmF5IiwiaXNBcnJheSIsInZhbHVlVG9Mb2ciLCJPYmplY3QiLCJuIiwidiIsInByb3BlcnR5VmFsdWVUb0xvZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7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LElBQUksR0FBRyxDQUFDLEdBQUdBLElBQUosRUFBVXhCLEtBQVYsQ0FBSCxHQUFzQixDQUFDQSxLQUFELENBQTFDOztBQUNBLFVBQUk2QixLQUFLLENBQUNDLE9BQU4sQ0FBYzlCLEtBQWQsQ0FBSixFQUEwQjtBQUN0QixlQUFPQSxLQUFLLENBQUNPLEdBQU4sQ0FBVUQsQ0FBQyxJQUFJaUIsS0FBSyxDQUFDakIsQ0FBRCxFQUFJc0IsT0FBSixDQUFwQixDQUFQO0FBQ0g7O0FBQ0QsWUFBTUcsVUFBNkIsR0FBRyxFQUF0QztBQUNBQyxNQUFBQSxNQUFNLENBQUN2QyxPQUFQLENBQWVPLEtBQWYsRUFBc0JzQixPQUF0QixDQUE4QixDQUFDLENBQUNXLENBQUQsRUFBSUMsQ0FBSixDQUFELEtBQVk7QUFDdEMsY0FBTUMsa0JBQWtCLEdBQUdaLEtBQUssQ0FBQ1csQ0FBRCxFQUFJTixPQUFKLENBQWhDOztBQUNBLFlBQUlPLGtCQUFrQixLQUFLZCxTQUEzQixFQUFzQztBQUNsQ1UsVUFBQUEsVUFBVSxDQUFDRSxDQUFELENBQVYsR0FBZ0JFLGtCQUFoQjtBQUNIO0FBQ0osT0FMRDtBQU1BLGFBQU9KLFVBQVA7QUFoQ0o7QUFrQ0giLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFFMb2cgfSBmcm9tICcuL2xvZ3MnO1xuXG5leHBvcnQgZnVuY3Rpb24gY2xlYW5FcnJvcihlcnJvcjogYW55KTogYW55IHtcbiAgICBpZiAoJ0FyYW5nb0Vycm9yJyBpbiBlcnJvcikge1xuICAgICAgICByZXR1cm4gZXJyb3IuQXJhbmdvRXJyb3I7XG4gICAgfVxuICAgIGRlbGV0ZSBlcnJvci5yZXF1ZXN0O1xuICAgIGRlbGV0ZSBlcnJvci5yZXNwb25zZTtcbiAgICBlcnJvci5zdGFjayA9ICcuLi4nO1xuICAgIHJldHVybiBlcnJvcjtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRXJyb3IoY29kZTogbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcsIHNvdXJjZTogc3RyaW5nID0gJ2dyYXBocWwnKTogRXJyb3Ige1xuICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgIChlcnJvcjogYW55KS5zb3VyY2UgPSBzb3VyY2U7XG4gICAgKGVycm9yOiBhbnkpLmNvZGUgPSBjb2RlO1xuICAgIGVycm9yLnN0YWNrID0gJy4uLic7XG4gICAgcmV0dXJuIGVycm9yO1xufVxuXG5mdW5jdGlvbiBpc0ludGVybmFsU2VydmVyRXJyb3IoZXJyb3I6IEVycm9yKTogYm9vbGVhbiB7XG4gICAgaWYgKCd0eXBlJyBpbiBlcnJvciAmJiBlcnJvci50eXBlID09PSAnc3lzdGVtJykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKCdlcnJubycgaW4gZXJyb3IgJiYgJ3N5c2NhbGwnIGluIGVycm9yKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdyYXA8Uj4obG9nOiBRTG9nLCBvcDogc3RyaW5nLCBhcmdzOiBhbnksIGZldGNoOiAoKSA9PiBQcm9taXNlPFI+KSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IGZldGNoKCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGxldCBjbGVhbmVkID0gY2xlYW5FcnJvcihlcnIpO1xuICAgICAgICBsb2cuZXJyb3IoJ0ZBSUxFRCcsIG9wLCBhcmdzLCBjbGVhbmVkKTtcbiAgICAgICAgaWYgKGlzSW50ZXJuYWxTZXJ2ZXJFcnJvcihjbGVhbmVkKSkge1xuICAgICAgICAgICAgY2xlYW5lZCA9IGNyZWF0ZUVycm9yKDUwMCwgJ1NlcnZpY2UgdGVtcG9yYXJ5IHVuYXZhaWxhYmxlJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgY2xlYW5lZDtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBSZWdpc3RyeU1hcDxUPiB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGl0ZW1zOiBNYXA8bnVtYmVyLCBUPjtcbiAgICBsYXN0SWQ6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmxhc3RJZCA9IDA7XG4gICAgICAgIHRoaXMuaXRlbXMgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgYWRkKGl0ZW06IFQpOiBudW1iZXIge1xuICAgICAgICBsZXQgaWQgPSB0aGlzLmxhc3RJZDtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgaWQgPSBpZCA8IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSID8gaWQgKyAxIDogMTtcbiAgICAgICAgfSB3aGlsZSAodGhpcy5pdGVtcy5oYXMoaWQpKTtcbiAgICAgICAgdGhpcy5sYXN0SWQgPSBpZDtcbiAgICAgICAgdGhpcy5pdGVtcy5zZXQoaWQsIGl0ZW0pO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfVxuXG4gICAgcmVtb3ZlKGlkOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLml0ZW1zLmRlbGV0ZShpZCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byByZW1vdmUgJHt0aGlzLm5hbWV9OiBpdGVtIHdpdGggaWQgWyR7aWR9XSBkb2VzIG5vdCBleGlzdHNgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGVudHJpZXMoKTogW251bWJlciwgVF1bXSB7XG4gICAgICAgIHJldHVybiBbLi4udGhpcy5pdGVtcy5lbnRyaWVzKCldO1xuICAgIH1cblxuICAgIHZhbHVlcygpOiBUW10ge1xuICAgICAgICByZXR1cm4gWy4uLnRoaXMuaXRlbXMudmFsdWVzKCldO1xuICAgIH1cbn1cblxuZXhwb3J0IHR5cGUgRmllbGRTZWxlY3Rpb24gPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU2VsZWN0aW9uU2V0KHNlbGVjdGlvblNldDogYW55LCByZXR1cm5GaWVsZFNlbGVjdGlvbjogc3RyaW5nKTogRmllbGRTZWxlY3Rpb25bXSB7XG4gICAgY29uc3QgZmllbGRzOiBGaWVsZFNlbGVjdGlvbltdID0gW107XG4gICAgY29uc3Qgc2VsZWN0aW9ucyA9IHNlbGVjdGlvblNldCAmJiBzZWxlY3Rpb25TZXQuc2VsZWN0aW9ucztcbiAgICBpZiAoc2VsZWN0aW9ucykge1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2VsZWN0aW9ucykge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IChpdGVtLm5hbWUgJiYgaXRlbS5uYW1lLnZhbHVlKSB8fCAnJztcbiAgICAgICAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGQ6IEZpZWxkU2VsZWN0aW9uID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IHBhcnNlU2VsZWN0aW9uU2V0KGl0ZW0uc2VsZWN0aW9uU2V0LCAnJyksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAocmV0dXJuRmllbGRTZWxlY3Rpb24gIT09ICcnICYmIGZpZWxkLm5hbWUgPT09IHJldHVybkZpZWxkU2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZC5zZWxlY3Rpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpZWxkcy5wdXNoKGZpZWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmllbGRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VsZWN0aW9uVG9TdHJpbmcoc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKTogc3RyaW5nIHtcbiAgICByZXR1cm4gc2VsZWN0aW9uXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4Lm5hbWUgIT09ICdfX3R5cGVuYW1lJylcbiAgICAgICAgLm1hcCgoZmllbGQ6IEZpZWxkU2VsZWN0aW9uKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWVsZFNlbGVjdGlvbiA9IHNlbGVjdGlvblRvU3RyaW5nKGZpZWxkLnNlbGVjdGlvbik7XG4gICAgICAgICAgICByZXR1cm4gYCR7ZmllbGQubmFtZX0ke2ZpZWxkU2VsZWN0aW9uICE9PSAnJyA/IGAgeyAke2ZpZWxkU2VsZWN0aW9ufSB9YCA6ICcnfWA7XG4gICAgICAgIH0pLmpvaW4oJyAnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdEZpZWxkcyhkb2M6IGFueSwgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKTogYW55IHtcbiAgICBpZiAoc2VsZWN0aW9uLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZG9jO1xuICAgIH1cbiAgICBjb25zdCBzZWxlY3RlZDogYW55ID0ge307XG4gICAgaWYgKGRvYy5fa2V5KSB7XG4gICAgICAgIHNlbGVjdGVkLl9rZXkgPSBkb2MuX2tleTtcbiAgICAgICAgc2VsZWN0ZWQuaWQgPSBkb2MuX2tleTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHNlbGVjdGlvbikge1xuICAgICAgICBjb25zdCByZXF1aXJlZEZvckpvaW4gPSB7XG4gICAgICAgICAgICBpbl9tZXNzYWdlOiBbJ2luX21zZyddLFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzOiBbJ291dF9tc2cnXSxcbiAgICAgICAgICAgIHNpZ25hdHVyZXM6IFsnaWQnXSxcbiAgICAgICAgICAgIHNyY190cmFuc2FjdGlvbjogWydpZCcsICdtc2dfdHlwZSddLFxuICAgICAgICAgICAgZHN0X3RyYW5zYWN0aW9uOiBbJ2lkJywgJ21zZ190eXBlJ10sXG4gICAgICAgIH1baXRlbS5uYW1lXTtcbiAgICAgICAgaWYgKHJlcXVpcmVkRm9ySm9pbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXF1aXJlZEZvckpvaW4uZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZG9jW2ZpZWxkXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkW2ZpZWxkXSA9IGRvY1tmaWVsZF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdmFsdWUgPSBkb2NbaXRlbS5uYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNlbGVjdGVkW2l0ZW0ubmFtZV0gPSBpdGVtLnNlbGVjdGlvbi5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgPyBzZWxlY3RGaWVsZHModmFsdWUsIGl0ZW0uc2VsZWN0aW9uKVxuICAgICAgICAgICAgICAgIDogdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNlbGVjdGVkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9Mb2codmFsdWU6IGFueSwgb2Jqcz86IE9iamVjdFtdKTogYW55IHtcbiAgICBjb25zdCB0eXBlT2YgPSB0eXBlb2YgdmFsdWU7XG4gICAgc3dpdGNoICh0eXBlT2YpIHtcbiAgICBjYXNlIFwidW5kZWZpbmVkXCI6XG4gICAgY2FzZSBcImJvb2xlYW5cIjpcbiAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgY2FzZSBcImJpZ2ludFwiOlxuICAgIGNhc2UgXCJzeW1ib2xcIjpcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIGNhc2UgXCJzdHJpbmdcIjpcbiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA+IDgwKSB7XG4gICAgICAgICAgICByZXR1cm4gYCR7dmFsdWUuc3Vic3RyKDAsIDUwKX3igKYgWyR7dmFsdWUubGVuZ3RofV1gXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIGNhc2UgXCJmdW5jdGlvblwiOlxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmpzICYmIG9ianMuaW5jbHVkZXModmFsdWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG5ld09ianMgPSBvYmpzID8gWy4uLm9ianMsIHZhbHVlXSA6IFt2YWx1ZV07XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlLm1hcCh4ID0+IHRvTG9nKHgsIG5ld09ianMpKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2YWx1ZVRvTG9nOiB7IFtzdHJpbmddOiBhbnkgfSA9IHt9O1xuICAgICAgICBPYmplY3QuZW50cmllcyh2YWx1ZSkuZm9yRWFjaCgoW24sIHZdKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9wZXJ0eVZhbHVlVG9Mb2cgPSB0b0xvZyh2LCBuZXdPYmpzKTtcbiAgICAgICAgICAgIGlmIChwcm9wZXJ0eVZhbHVlVG9Mb2cgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHZhbHVlVG9Mb2dbbl0gPSBwcm9wZXJ0eVZhbHVlVG9Mb2c7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdmFsdWVUb0xvZ1xuICAgIH1cbn1cbiJdfQ==