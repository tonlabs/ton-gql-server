"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _arangoProvider = require("./arango-provider");

var _collection = require("./collection");

var _auth = require("../auth");

var _config = require("../config");

var _logs = _interopRequireDefault(require("../logs"));

var _resolversGenerated = require("../graphql/resolvers-generated");

var _opentracing = require("opentracing");

var _tracer = require("../tracer");

var _utils = require("../utils");

var _dataBroker = require("./data-broker");

var _dataProvider = require("./data-provider");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
function createBroker(brokerName, logs, config) {
  const arangoDb = (dbName, segment, config) => new _arangoProvider.ArangoProvider(logs.create(`${brokerName}_${dbName}`), segment, config);

  return new _dataBroker.QDataBroker({
    mutable: arangoDb('mutable', _dataProvider.dataSegment.MUTABLE, config.mutable),
    immutableHot: arangoDb('hot', _dataProvider.dataSegment.IMMUTABLE, config.immutableHot),
    immutableCold: config.immutableCold.map(x => arangoDb('cold', _dataProvider.dataSegment.IMMUTABLE, x)),
    immutableColdCache: _dataProvider.missingDataCache
  });
}

class QData {
  constructor(config, logs, auth, tracer, stats) {
    this.config = config;
    this.log = logs.create('data');
    this.auth = auth;
    this.tracer = tracer;
    this.statPostCount = new _tracer.StatsCounter(stats, _config.STATS.post.count, []);
    this.statPostFailed = new _tracer.StatsCounter(stats, _config.STATS.post.failed, []);
    this.broker = createBroker('fast', logs, config.data);
    this.slowQueriesBroker = createBroker('slow', logs, config.slowQueriesData);
    this.collections = [];
    this.collectionsByName = new Map();

    const addCollection = (name, docType) => {
      const collection = new _collection.QCollection({
        name,
        docType,
        logs,
        auth,
        tracer,
        stats,
        broker: this.broker,
        slowQueriesBroker: this.slowQueriesBroker,
        isTests: config.isTests || false
      });
      this.collections.push(collection);
      this.collectionsByName.set(name, collection);
      return collection;
    };

    this.transactions = addCollection('transactions', _resolversGenerated.Transaction);
    this.messages = addCollection('messages', _resolversGenerated.Message);
    this.accounts = addCollection('accounts', _resolversGenerated.Account);
    this.blocks = addCollection('blocks', _resolversGenerated.Block);
    this.blocks_signatures = addCollection('blocks_signatures', _resolversGenerated.BlockSignatures);
  }

  start() {
    this.broker.start();
    this.slowQueriesBroker.start();
  }

  dropCachedDbInfo() {
    this.collections.forEach(x => x.dropCachedDbInfo());
  }

  async query(segment, text, vars, orderBy) {
    return (0, _utils.wrap)(this.log, 'QUERY', {
      text,
      vars
    }, async () => {
      return this.broker.query({
        segment,
        text,
        vars,
        orderBy
      });
    });
  }

  async finishOperations(operationIds) {
    let count = 0;
    this.collections.forEach(x => count += x.finishOperations(operationIds));
    return count;
  }

}

exports.default = QData;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZGF0YS9kYXRhLmpzIl0sIm5hbWVzIjpbImNyZWF0ZUJyb2tlciIsImJyb2tlck5hbWUiLCJsb2dzIiwiY29uZmlnIiwiYXJhbmdvRGIiLCJkYk5hbWUiLCJzZWdtZW50IiwiQXJhbmdvUHJvdmlkZXIiLCJjcmVhdGUiLCJRRGF0YUJyb2tlciIsIm11dGFibGUiLCJkYXRhU2VnbWVudCIsIk1VVEFCTEUiLCJpbW11dGFibGVIb3QiLCJJTU1VVEFCTEUiLCJpbW11dGFibGVDb2xkIiwibWFwIiwieCIsImltbXV0YWJsZUNvbGRDYWNoZSIsIm1pc3NpbmdEYXRhQ2FjaGUiLCJRRGF0YSIsImNvbnN0cnVjdG9yIiwiYXV0aCIsInRyYWNlciIsInN0YXRzIiwibG9nIiwic3RhdFBvc3RDb3VudCIsIlN0YXRzQ291bnRlciIsIlNUQVRTIiwicG9zdCIsImNvdW50Iiwic3RhdFBvc3RGYWlsZWQiLCJmYWlsZWQiLCJicm9rZXIiLCJkYXRhIiwic2xvd1F1ZXJpZXNCcm9rZXIiLCJzbG93UXVlcmllc0RhdGEiLCJjb2xsZWN0aW9ucyIsImNvbGxlY3Rpb25zQnlOYW1lIiwiTWFwIiwiYWRkQ29sbGVjdGlvbiIsIm5hbWUiLCJkb2NUeXBlIiwiY29sbGVjdGlvbiIsIlFDb2xsZWN0aW9uIiwiaXNUZXN0cyIsInB1c2giLCJzZXQiLCJ0cmFuc2FjdGlvbnMiLCJUcmFuc2FjdGlvbiIsIm1lc3NhZ2VzIiwiTWVzc2FnZSIsImFjY291bnRzIiwiQWNjb3VudCIsImJsb2NrcyIsIkJsb2NrIiwiYmxvY2tzX3NpZ25hdHVyZXMiLCJCbG9ja1NpZ25hdHVyZXMiLCJzdGFydCIsImRyb3BDYWNoZWREYkluZm8iLCJmb3JFYWNoIiwicXVlcnkiLCJ0ZXh0IiwidmFycyIsIm9yZGVyQnkiLCJmaW5pc2hPcGVyYXRpb25zIiwib3BlcmF0aW9uSWRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBa0JBOztBQUNBOztBQUNBOztBQUVBOztBQUVBOztB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QyxJQUFLYSxLQUFLLElBQUliLENBQUMsQ0FBQ2dELGdCQUFGLENBQW1CQyxZQUFuQixDQUF4QztBQUNBLFdBQU9wQyxLQUFQO0FBQ0g7O0FBMUZzQiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDIwIFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcblxuaW1wb3J0IHsgQXJhbmdvUHJvdmlkZXIgfSBmcm9tICcuL2FyYW5nby1wcm92aWRlcic7XG5pbXBvcnQgeyBRQ29sbGVjdGlvbiB9IGZyb20gJy4vY29sbGVjdGlvbic7XG5pbXBvcnQgeyBBdXRoIH0gZnJvbSAnLi4vYXV0aCc7XG5pbXBvcnQgdHlwZSB7IFFDb25maWcsIFFEYXRhQnJva2VyQ29uZmlnLCBRQXJhbmdvQ29uZmlnIH0gZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0IHsgU1RBVFMgfSBmcm9tICcuLi9jb25maWcnO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSAnLi4vbG9ncyc7XG5pbXBvcnQgUUxvZ3MgZnJvbSAnLi4vbG9ncydcbmltcG9ydCB0eXBlIHsgT3JkZXJCeSwgUVR5cGUgfSBmcm9tICcuLi9maWx0ZXIvZGF0YS10eXBlcyc7XG5pbXBvcnQgeyBBY2NvdW50LCBCbG9jaywgQmxvY2tTaWduYXR1cmVzLCBNZXNzYWdlLCBUcmFuc2FjdGlvbiB9IGZyb20gJy4uL2dyYXBocWwvcmVzb2x2ZXJzLWdlbmVyYXRlZCc7XG5pbXBvcnQgeyBUcmFjZXIgfSBmcm9tICdvcGVudHJhY2luZyc7XG5pbXBvcnQgeyBTdGF0c0NvdW50ZXIgfSBmcm9tICcuLi90cmFjZXInO1xuaW1wb3J0IHR5cGUgeyBJU3RhdHMgfSBmcm9tICcuLi90cmFjZXInO1xuaW1wb3J0IHsgd3JhcCB9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7IFFEYXRhQnJva2VyIH0gZnJvbSAnLi9kYXRhLWJyb2tlcic7XG5pbXBvcnQgdHlwZSB7IFFEYXRhU2VnbWVudCB9IGZyb20gJy4vZGF0YS1wcm92aWRlcic7XG5pbXBvcnQgeyBkYXRhU2VnbWVudCwgbWlzc2luZ0RhdGFDYWNoZSB9IGZyb20gJy4vZGF0YS1wcm92aWRlcic7XG5cblxuZnVuY3Rpb24gY3JlYXRlQnJva2VyKFxuICAgIGJyb2tlck5hbWU6IHN0cmluZyxcbiAgICBsb2dzOiBRTG9ncyxcbiAgICBjb25maWc6IFFEYXRhQnJva2VyQ29uZmlnLFxuKTogUURhdGFCcm9rZXIge1xuICAgIGNvbnN0IGFyYW5nb0RiID0gKGRiTmFtZTogc3RyaW5nLCBzZWdtZW50OiBRRGF0YVNlZ21lbnQsIGNvbmZpZzogUUFyYW5nb0NvbmZpZyk6IEFyYW5nb1Byb3ZpZGVyID0+IChcbiAgICAgICAgbmV3IEFyYW5nb1Byb3ZpZGVyKGxvZ3MuY3JlYXRlKGAke2Jyb2tlck5hbWV9XyR7ZGJOYW1lfWApLCBzZWdtZW50LCBjb25maWcpXG4gICAgKTtcbiAgICByZXR1cm4gbmV3IFFEYXRhQnJva2VyKHtcbiAgICAgICAgbXV0YWJsZTogYXJhbmdvRGIoJ211dGFibGUnLCBkYXRhU2VnbWVudC5NVVRBQkxFLCBjb25maWcubXV0YWJsZSksXG4gICAgICAgIGltbXV0YWJsZUhvdDogYXJhbmdvRGIoJ2hvdCcsIGRhdGFTZWdtZW50LklNTVVUQUJMRSwgY29uZmlnLmltbXV0YWJsZUhvdCksXG4gICAgICAgIGltbXV0YWJsZUNvbGQ6IGNvbmZpZy5pbW11dGFibGVDb2xkLm1hcCh4ID0+IGFyYW5nb0RiKCdjb2xkJywgZGF0YVNlZ21lbnQuSU1NVVRBQkxFLCB4KSksXG4gICAgICAgIGltbXV0YWJsZUNvbGRDYWNoZTogbWlzc2luZ0RhdGFDYWNoZSxcbiAgICB9KVxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFFEYXRhIHtcbiAgICBjb25maWc6IFFDb25maWc7XG4gICAgbG9nOiBRTG9nO1xuXG4gICAgYnJva2VyOiBRRGF0YUJyb2tlcjtcbiAgICBzbG93UXVlcmllc0Jyb2tlcjogUURhdGFCcm9rZXI7XG5cbiAgICBhdXRoOiBBdXRoO1xuICAgIHRyYWNlcjogVHJhY2VyO1xuICAgIHN0YXRQb3N0Q291bnQ6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UG9zdEZhaWxlZDogU3RhdHNDb3VudGVyO1xuXG4gICAgdHJhbnNhY3Rpb25zOiBRQ29sbGVjdGlvbjtcbiAgICBtZXNzYWdlczogUUNvbGxlY3Rpb247XG4gICAgYWNjb3VudHM6IFFDb2xsZWN0aW9uO1xuICAgIGJsb2NrczogUUNvbGxlY3Rpb247XG4gICAgYmxvY2tzX3NpZ25hdHVyZXM6IFFDb2xsZWN0aW9uO1xuXG4gICAgY29sbGVjdGlvbnM6IFFDb2xsZWN0aW9uW107XG4gICAgY29sbGVjdGlvbnNCeU5hbWU6IE1hcDxzdHJpbmcsIFFDb2xsZWN0aW9uPjtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBjb25maWc6IFFDb25maWcsXG4gICAgICAgIGxvZ3M6IFFMb2dzLFxuICAgICAgICBhdXRoOiBBdXRoLFxuICAgICAgICB0cmFjZXI6IFRyYWNlcixcbiAgICAgICAgc3RhdHM6IElTdGF0cyxcbiAgICApIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMubG9nID0gbG9ncy5jcmVhdGUoJ2RhdGEnKTtcbiAgICAgICAgdGhpcy5hdXRoID0gYXV0aDtcbiAgICAgICAgdGhpcy50cmFjZXIgPSB0cmFjZXI7XG5cbiAgICAgICAgdGhpcy5zdGF0UG9zdENvdW50ID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMucG9zdC5jb3VudCwgW10pO1xuICAgICAgICB0aGlzLnN0YXRQb3N0RmFpbGVkID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMucG9zdC5mYWlsZWQsIFtdKTtcblxuICAgICAgICB0aGlzLmJyb2tlciA9IGNyZWF0ZUJyb2tlcignZmFzdCcsIGxvZ3MsIGNvbmZpZy5kYXRhKVxuICAgICAgICB0aGlzLnNsb3dRdWVyaWVzQnJva2VyID0gY3JlYXRlQnJva2VyKCdzbG93JywgbG9ncywgY29uZmlnLnNsb3dRdWVyaWVzRGF0YSk7XG5cbiAgICAgICAgdGhpcy5jb2xsZWN0aW9ucyA9IFtdO1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb25zQnlOYW1lID0gbmV3IE1hcCgpO1xuXG4gICAgICAgIGNvbnN0IGFkZENvbGxlY3Rpb24gPSAobmFtZTogc3RyaW5nLCBkb2NUeXBlOiBRVHlwZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29sbGVjdGlvbiA9IG5ldyBRQ29sbGVjdGlvbih7XG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICBkb2NUeXBlLFxuICAgICAgICAgICAgICAgIGxvZ3MsXG4gICAgICAgICAgICAgICAgYXV0aCxcbiAgICAgICAgICAgICAgICB0cmFjZXIsXG4gICAgICAgICAgICAgICAgc3RhdHMsXG4gICAgICAgICAgICAgICAgYnJva2VyOiB0aGlzLmJyb2tlcixcbiAgICAgICAgICAgICAgICBzbG93UXVlcmllc0Jyb2tlcjogdGhpcy5zbG93UXVlcmllc0Jyb2tlcixcbiAgICAgICAgICAgICAgICBpc1Rlc3RzOiBjb25maWcuaXNUZXN0cyB8fCBmYWxzZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9ucy5wdXNoKGNvbGxlY3Rpb24pO1xuICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uc0J5TmFtZS5zZXQobmFtZSwgY29sbGVjdGlvbik7XG4gICAgICAgICAgICByZXR1cm4gY29sbGVjdGlvbjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnRyYW5zYWN0aW9ucyA9IGFkZENvbGxlY3Rpb24oJ3RyYW5zYWN0aW9ucycsIFRyYW5zYWN0aW9uKTtcbiAgICAgICAgdGhpcy5tZXNzYWdlcyA9IGFkZENvbGxlY3Rpb24oJ21lc3NhZ2VzJywgTWVzc2FnZSk7XG4gICAgICAgIHRoaXMuYWNjb3VudHMgPSBhZGRDb2xsZWN0aW9uKCdhY2NvdW50cycsIEFjY291bnQpO1xuICAgICAgICB0aGlzLmJsb2NrcyA9IGFkZENvbGxlY3Rpb24oJ2Jsb2NrcycsIEJsb2NrKTtcbiAgICAgICAgdGhpcy5ibG9ja3Nfc2lnbmF0dXJlcyA9IGFkZENvbGxlY3Rpb24oJ2Jsb2Nrc19zaWduYXR1cmVzJywgQmxvY2tTaWduYXR1cmVzKTtcbiAgICB9XG5cbiAgICBzdGFydCgpIHtcbiAgICAgICAgdGhpcy5icm9rZXIuc3RhcnQoKTtcbiAgICAgICAgdGhpcy5zbG93UXVlcmllc0Jyb2tlci5zdGFydCgpO1xuICAgIH1cblxuICAgIGRyb3BDYWNoZWREYkluZm8oKSB7XG4gICAgICAgIHRoaXMuY29sbGVjdGlvbnMuZm9yRWFjaCgoeDogUUNvbGxlY3Rpb24pID0+IHguZHJvcENhY2hlZERiSW5mbygpKTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeShzZWdtZW50OiBRRGF0YVNlZ21lbnQsIHRleHQ6IHN0cmluZywgdmFyczogeyBbc3RyaW5nXTogYW55IH0sIG9yZGVyQnk6IE9yZGVyQnlbXSkge1xuICAgICAgICByZXR1cm4gd3JhcCh0aGlzLmxvZywgJ1FVRVJZJywgeyB0ZXh0LCB2YXJzIH0sIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmJyb2tlci5xdWVyeSh7XG4gICAgICAgICAgICAgICAgc2VnbWVudCxcbiAgICAgICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgICAgIHZhcnMsXG4gICAgICAgICAgICAgICAgb3JkZXJCeSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBmaW5pc2hPcGVyYXRpb25zKG9wZXJhdGlvbklkczogU2V0PHN0cmluZz4pOiBQcm9taXNlPG51bWJlcj4ge1xuICAgICAgICBsZXQgY291bnQgPSAwO1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb25zLmZvckVhY2goeCA9PiAoY291bnQgKz0geC5maW5pc2hPcGVyYXRpb25zKG9wZXJhdGlvbklkcykpKTtcbiAgICAgICAgcmV0dXJuIGNvdW50O1xuICAgIH1cbn1cbiJdfQ==