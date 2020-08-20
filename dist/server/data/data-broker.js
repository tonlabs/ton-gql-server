"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.QDataBroker = void 0;

var _dataProvider = require("./data-provider");

class QDataBroker {
  constructor(options) {
    this.mutable = options.mutable;
    this.immutableHot = options.immutableHot;
    this.immutableCold = options.immutableCold;
    this.immutableColdCache = options.immutableColdCache;
  }

  start() {
    this.mutable.start();
    this.immutableHot.start();
    this.immutableCold.forEach(x => x.start());
  }

  async query(params) {
    if (params.segment === _dataProvider.dataSegment.MUTABLE) {
      return this.mutable.query(params.text, params.vars);
    }

    return combineResults(await Promise.all([this.immutableHot.query(params.text, params.vars), this.queryImmutableCold(params)]), params.orderBy);
  }

  async queryImmutableCold(params) {
    if (this.immutableCold.length === 0) {
      return [];
    }

    const key = JSON.stringify({
      text: params.text,
      vars: params.vars,
      orderBy: params.orderBy
    });
    let docs = await this.immutableColdCache.get(key);

    if (isNullOrUndefined(docs)) {
      const results = await Promise.all(this.immutableCold.map(x => x.query(params.text, params.vars)));
      docs = combineResults(results, params.orderBy);
      await this.immutableColdCache.set(key, docs);
    }

    return docs;
  }

}

exports.QDataBroker = QDataBroker;

function combineResults(results, orderBy) {
  const docs = collectDistinctDocs(results);

  if (orderBy.length > 0) {
    docs.sort((a, b) => compareDocs(a, b, orderBy));
  }

  return docs;
}

function collectDistinctDocs(source) {
  const distinctDocs = [];
  const distinctKeys = new Set();
  source.forEach(docs => {
    docs.forEach(doc => {
      if (!doc._key) {
        distinctDocs.push(doc);
      } else if (!distinctKeys.has(doc._key)) {
        distinctDocs.push(doc);
        distinctKeys.add(doc._key);
      }
    });
  });
  return distinctDocs;
}

function compareDocs(a, b, orderBy) {
  for (let i = 0; i < orderBy.length; i += 1) {
    const field = orderBy[i];
    const path = field.path.split('.');
    const aValue = getValue(a, path, 0);
    const bValue = getValue(a, path, 0);
    let comparison = compareValues(aValue, bValue);

    if (comparison !== 0) {
      return field.direction === 'DESC' ? -comparison : comparison;
    }
  }

  return 0;
}

function getValue(value, path, pathIndex) {
  if (isNullOrUndefined(value) || pathIndex >= path.length) {
    return value;
  }

  return getValue(value[path[pathIndex]], path, pathIndex + 1);
}

function compareValues(a, b) {
  const aHasValue = !isNullOrUndefined(a);
  const bHasValue = !isNullOrUndefined(b);

  if (!aHasValue) {
    return bHasValue ? -1 : 0;
  }

  if (!bHasValue) {
    return 1;
  }

  return a === b ? 0 : a < b ? -1 : 0;
}

function isNullOrUndefined(v) {
  return v === null || typeof v === 'undefined';
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZGF0YS9kYXRhLWJyb2tlci5qcyJdLCJuYW1lcyI6WyJRRGF0YUJyb2tlciIsImNvbnN0cnVjdG9yIiwib3B0aW9ucyIsIm11dGFibGUiLCJpbW11dGFibGVIb3QiLCJpbW11dGFibGVDb2xkIiwiaW1tdXRhYmxlQ29sZENhY2hlIiwic3RhcnQiLCJmb3JFYWNoIiwieCIsInF1ZXJ5IiwicGFyYW1zIiwic2VnbWVudCIsImRhdGFTZWdtZW50IiwiTVVUQUJMRSIsInRleHQiLCJ2YXJzIiwiY29tYmluZVJlc3VsdHMiLCJQcm9taXNlIiwiYWxsIiwicXVlcnlJbW11dGFibGVDb2xkIiwib3JkZXJCeSIsImxlbmd0aCIsImtleSIsIkpTT04iLCJzdHJpbmdpZnkiLCJkb2NzIiwiZ2V0IiwiaXNOdWxsT3JVbmRlZmluZWQiLCJyZXN1bHRzIiwibWFwIiwic2V0IiwiY29sbGVjdERpc3RpbmN0RG9jcyIsInNvcnQiLCJhIiwiYiIsImNvbXBhcmVEb2NzIiwic291cmNlIiwiZGlzdGluY3REb2NzIiwiZGlzdGluY3RLZXlzIiwiU2V0IiwiZG9jIiwiX2tleSIsInB1c2giLCJoYXMiLCJhZGQiLCJpIiwiZmllbGQiLCJwYXRoIiwic3BsaXQiLCJhVmFsdWUiLCJnZXRWYWx1ZSIsImJWYWx1ZSIsImNvbXBhcmlzb24iLCJjb21wYXJlVmFsdWVzIiwiZGlyZWN0aW9uIiwidmFsdWUiLCJwYXRoSW5kZXgiLCJhSGFzVmFsdWUiLCJiSGFzVmFsdWUiLCJ2Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRUE7O0FBbUJPLE1BQU1BLFdBQU4sQ0FBa0I7QUFPckJDLEVBQUFBLFdBQVcsQ0FBQ0MsT0FBRCxFQUE4QjtBQUNyQyxTQUFLQyxPQUFMLEdBQWVELE9BQU8sQ0FBQ0MsT0FBdkI7QUFDQSxTQUFLQyxZQUFMLEdBQW9CRixPQUFPLENBQUNFLFlBQTVCO0FBQ0EsU0FBS0MsYUFBTCxHQUFxQkgsT0FBTyxDQUFDRyxhQUE3QjtBQUNBLFNB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QUFHRCxTQUFTRixRQUFULENBQWtCSyxLQUFsQixFQUE4QlIsSUFBOUIsRUFBOENTLFNBQTlDLEVBQXNFO0FBQ2xFLE1BQUk3QixpQkFBaUIsQ0FBQzRCLEtBQUQsQ0FBakIsSUFBNEJDLFNBQVMsSUFBSVQsSUFBSSxDQUFDMUIsTUFBbEQsRUFBMEQ7QUFDdEQsV0FBT2tDLEtBQVA7QUFDSDs7QUFDRCxTQUFPTCxRQUFRLENBQUNLLEtBQUssQ0FBQ1IsSUFBSSxDQUFDUyxTQUFELENBQUwsQ0FBTixFQUF5QlQsSUFBekIsRUFBK0JTLFNBQVMsR0FBRyxDQUEzQyxDQUFmO0FBQ0g7O0FBR0QsU0FBU0gsYUFBVCxDQUF1QnBCLENBQXZCLEVBQStCQyxDQUEvQixFQUErQztBQUMzQyxRQUFNdUIsU0FBUyxHQUFHLENBQUM5QixpQkFBaUIsQ0FBQ00sQ0FBRCxDQUFwQztBQUNBLFFBQU15QixTQUFTLEdBQUcsQ0FBQy9CLGlCQUFpQixDQUFDTyxDQUFELENBQXBDOztBQUNBLE1BQUksQ0FBQ3VCLFNBQUwsRUFBZ0I7QUFDWixXQUFPQyxTQUFTLEdBQUcsQ0FBQyxDQUFKLEdBQVEsQ0FBeEI7QUFDSDs7QUFDRCxNQUFJLENBQUNBLFNBQUwsRUFBZ0I7QUFDWixXQUFPLENBQVA7QUFDSDs7QUFDRCxTQUFPekIsQ0FBQyxLQUFLQyxDQUFOLEdBQVUsQ0FBVixHQUFlRCxDQUFDLEdBQUdDLENBQUosR0FBUSxDQUFDLENBQVQsR0FBYSxDQUFuQztBQUNIOztBQUdELFNBQVNQLGlCQUFULENBQTJCZ0MsQ0FBM0IsRUFBbUM7QUFDL0IsU0FBT0EsQ0FBQyxLQUFLLElBQU4sSUFBYyxPQUFPQSxDQUFQLEtBQWEsV0FBbEM7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbIi8vIEBmbG93XG5pbXBvcnQgdHlwZSB7IE9yZGVyQnkgfSBmcm9tICcuLi9maWx0ZXIvZGF0YS10eXBlcyc7XG5pbXBvcnQgeyBkYXRhU2VnbWVudCB9IGZyb20gJy4vZGF0YS1wcm92aWRlcic7XG5pbXBvcnQgdHlwZSB7IFFEYXRhUHJvdmlkZXIsIFFEYXRhQ2FjaGUsIFFEb2MsIFFEYXRhU2VnbWVudCB9IGZyb20gJy4vZGF0YS1wcm92aWRlcic7XG5cbmV4cG9ydCB0eXBlIFFEYXRhUXVlcnlQYXJhbXMgPSB7XG4gICAgc2VnbWVudDogUURhdGFTZWdtZW50O1xuICAgIHRleHQ6IHN0cmluZztcbiAgICB2YXJzOiB7IFtzdHJpbmddOiBhbnkgfTtcbiAgICBvcmRlckJ5OiBPcmRlckJ5W107XG59XG5cblxuZXhwb3J0IHR5cGUgUURhdGFCcm9rZXJPcHRpb25zID0ge1xuICAgIG11dGFibGU6IFFEYXRhUHJvdmlkZXI7XG4gICAgaW1tdXRhYmxlSG90OiBRRGF0YVByb3ZpZGVyO1xuICAgIGltbXV0YWJsZUNvbGQ6IFFEYXRhUHJvdmlkZXJbXTtcbiAgICBpbW11dGFibGVDb2xkQ2FjaGU6IFFEYXRhQ2FjaGU7XG59XG5cblxuZXhwb3J0IGNsYXNzIFFEYXRhQnJva2VyIHtcbiAgICBtdXRhYmxlOiBRRGF0YVByb3ZpZGVyO1xuICAgIGltbXV0YWJsZUhvdDogUURhdGFQcm92aWRlcjtcbiAgICBpbW11dGFibGVDb2xkOiBRRGF0YVByb3ZpZGVyW107XG4gICAgaW1tdXRhYmxlQ29sZENhY2hlOiBRRGF0YUNhY2hlO1xuXG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zOiBRRGF0YUJyb2tlck9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5tdXRhYmxlID0gb3B0aW9ucy5tdXRhYmxlO1xuICAgICAgICB0aGlzLmltbXV0YWJsZUhvdCA9IG9wdGlvbnMuaW1tdXRhYmxlSG90O1xuICAgICAgICB0aGlzLmltbXV0YWJsZUNvbGQgPSBvcHRpb25zLmltbXV0YWJsZUNvbGQ7XG4gICAgICAgIHRoaXMuaW1tdXRhYmxlQ29sZENhY2hlID0gb3B0aW9ucy5pbW11dGFibGVDb2xkQ2FjaGU7XG4gICAgfVxuXG5cbiAgICBzdGFydCgpIHtcbiAgICAgICAgdGhpcy5tdXRhYmxlLnN0YXJ0KCk7XG4gICAgICAgIHRoaXMuaW1tdXRhYmxlSG90LnN0YXJ0KCk7XG4gICAgICAgIHRoaXMuaW1tdXRhYmxlQ29sZC5mb3JFYWNoKHggPT4geC5zdGFydCgpKTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeShwYXJhbXM6IFFEYXRhUXVlcnlQYXJhbXMpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAocGFyYW1zLnNlZ21lbnQgPT09IGRhdGFTZWdtZW50Lk1VVEFCTEUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm11dGFibGUucXVlcnkocGFyYW1zLnRleHQsIHBhcmFtcy52YXJzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29tYmluZVJlc3VsdHMoYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgdGhpcy5pbW11dGFibGVIb3QucXVlcnkocGFyYW1zLnRleHQsIHBhcmFtcy52YXJzKSxcbiAgICAgICAgICAgIHRoaXMucXVlcnlJbW11dGFibGVDb2xkKHBhcmFtcyksXG4gICAgICAgIF0pLCBwYXJhbXMub3JkZXJCeSk7XG4gICAgfVxuXG5cbiAgICBhc3luYyBxdWVyeUltbXV0YWJsZUNvbGQocGFyYW1zOiBRRGF0YVF1ZXJ5UGFyYW1zKTogUHJvbWlzZTxRRG9jW10+IHtcbiAgICAgICAgaWYgKHRoaXMuaW1tdXRhYmxlQ29sZC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBrZXkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICB0ZXh0OiBwYXJhbXMudGV4dCxcbiAgICAgICAgICAgIHZhcnM6IHBhcmFtcy52YXJzLFxuICAgICAgICAgICAgb3JkZXJCeTogcGFyYW1zLm9yZGVyQnksXG4gICAgICAgIH0pO1xuICAgICAgICBsZXQgZG9jcyA9IGF3YWl0IHRoaXMuaW1tdXRhYmxlQ29sZENhY2hlLmdldChrZXkpO1xuICAgICAgICBpZiAoaXNOdWxsT3JVbmRlZmluZWQoZG9jcykpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbCh0aGlzLmltbXV0YWJsZUNvbGQubWFwKHggPT4geC5xdWVyeShwYXJhbXMudGV4dCwgcGFyYW1zLnZhcnMpKSk7XG4gICAgICAgICAgICBkb2NzID0gY29tYmluZVJlc3VsdHMocmVzdWx0cywgcGFyYW1zLm9yZGVyQnkpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5pbW11dGFibGVDb2xkQ2FjaGUuc2V0KGtleSwgZG9jcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRvY3M7XG4gICAgfVxufVxuXG5cbmZ1bmN0aW9uIGNvbWJpbmVSZXN1bHRzKHJlc3VsdHM6IGFueVtdW10sIG9yZGVyQnk6IE9yZGVyQnlbXSk6IGFueVtdIHtcbiAgICBjb25zdCBkb2NzID0gY29sbGVjdERpc3RpbmN0RG9jcyhyZXN1bHRzKTtcbiAgICBpZiAob3JkZXJCeS5sZW5ndGggPiAwKSB7XG4gICAgICAgIGRvY3Muc29ydCgoYTogUURvYywgYjogUURvYykgPT4gY29tcGFyZURvY3MoYSwgYiwgb3JkZXJCeSkpO1xuICAgIH1cbiAgICByZXR1cm4gZG9jcztcbn1cblxuXG5mdW5jdGlvbiBjb2xsZWN0RGlzdGluY3REb2NzKHNvdXJjZTogUURvY1tdW10pOiBRRG9jW10ge1xuICAgIGNvbnN0IGRpc3RpbmN0RG9jcyA9IChbXTogUURvY1tdKTtcbiAgICBjb25zdCBkaXN0aW5jdEtleXMgPSBuZXcgU2V0KCk7XG4gICAgc291cmNlLmZvckVhY2goKGRvY3MpID0+IHtcbiAgICAgICAgZG9jcy5mb3JFYWNoKChkb2MpID0+IHtcbiAgICAgICAgICAgIGlmICghZG9jLl9rZXkpIHtcbiAgICAgICAgICAgICAgICBkaXN0aW5jdERvY3MucHVzaChkb2MpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghZGlzdGluY3RLZXlzLmhhcyhkb2MuX2tleSkpIHtcbiAgICAgICAgICAgICAgICBkaXN0aW5jdERvY3MucHVzaChkb2MpO1xuICAgICAgICAgICAgICAgIGRpc3RpbmN0S2V5cy5hZGQoZG9jLl9rZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gZGlzdGluY3REb2NzO1xufVxuXG5cbmZ1bmN0aW9uIGNvbXBhcmVEb2NzKGE6IFFEb2MsIGI6IFFEb2MsIG9yZGVyQnk6IE9yZGVyQnlbXSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb3JkZXJCeS5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBjb25zdCBmaWVsZCA9IG9yZGVyQnlbaV07XG4gICAgICAgIGNvbnN0IHBhdGggPSBmaWVsZC5wYXRoLnNwbGl0KCcuJyk7XG4gICAgICAgIGNvbnN0IGFWYWx1ZSA9IGdldFZhbHVlKGEsIHBhdGgsIDApO1xuICAgICAgICBjb25zdCBiVmFsdWUgPSBnZXRWYWx1ZShhLCBwYXRoLCAwKTtcbiAgICAgICAgbGV0IGNvbXBhcmlzb24gPSBjb21wYXJlVmFsdWVzKGFWYWx1ZSwgYlZhbHVlKTtcbiAgICAgICAgaWYgKGNvbXBhcmlzb24gIT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBmaWVsZC5kaXJlY3Rpb24gPT09ICdERVNDJyA/IC1jb21wYXJpc29uIDogY29tcGFyaXNvbjtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gMDtcbn1cblxuXG5mdW5jdGlvbiBnZXRWYWx1ZSh2YWx1ZTogYW55LCBwYXRoOiBzdHJpbmdbXSwgcGF0aEluZGV4OiBudW1iZXIpOiBhbnkge1xuICAgIGlmIChpc051bGxPclVuZGVmaW5lZCh2YWx1ZSkgfHwgcGF0aEluZGV4ID49IHBhdGgubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGdldFZhbHVlKHZhbHVlW3BhdGhbcGF0aEluZGV4XV0sIHBhdGgsIHBhdGhJbmRleCArIDEpO1xufVxuXG5cbmZ1bmN0aW9uIGNvbXBhcmVWYWx1ZXMoYTogYW55LCBiOiBhbnkpOiBudW1iZXIge1xuICAgIGNvbnN0IGFIYXNWYWx1ZSA9ICFpc051bGxPclVuZGVmaW5lZChhKTtcbiAgICBjb25zdCBiSGFzVmFsdWUgPSAhaXNOdWxsT3JVbmRlZmluZWQoYik7XG4gICAgaWYgKCFhSGFzVmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGJIYXNWYWx1ZSA/IC0xIDogMDtcbiAgICB9XG4gICAgaWYgKCFiSGFzVmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIHJldHVybiBhID09PSBiID8gMCA6IChhIDwgYiA/IC0xIDogMCk7XG59XG5cblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQodjogYW55KSB7XG4gICAgcmV0dXJuIHYgPT09IG51bGwgfHwgdHlwZW9mIHYgPT09ICd1bmRlZmluZWQnO1xufVxuIl19