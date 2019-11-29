"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ensureProtocol = ensureProtocol;
exports["default"] = exports.QRequestsMode = void 0;

var _os = _interopRequireDefault(require("os"));

/*
 * Copyright 2018-2019 TON DEV SOLUTIONS LTD.
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
var program = require('commander');

function getIp() {
  var ipv4 = Object.values(_os["default"].networkInterfaces()).flatMap(function (x) {
    return x;
  }).find(function (x) {
    return x.family === 'IPv4' && !x.internal;
  });
  return ipv4 && ipv4.address;
}

program.option('-h, --host <host>', 'listening address', process.env.Q_SERVER_HOST || getIp()).option('-p, --port <port>', 'listening port', process.env.Q_SERVER_PORT || '4000').option('-m, --requests-mode <mode>', 'Requests mode (kafka | rest)', process.env.Q_REQUESTS_MODE || 'kafka').option('-r, --requests-server <url>', 'Requests server url', process.env.Q_REQUESTS_SERVER || 'kafka:9092').option('-t, --requests-topic <name>', 'Requests topic name', process.env.Q_REQUESTS_TOPIC || 'requests').option('-d, --db-server <address>', 'database server:port', process.env.Q_DATABASE_SERVER || 'arangodb:8529').option('-n, --db-name <name>', 'database name', process.env.Q_DATABASE_NAME || 'blockchain').option('-n, --db-version <version>', 'database schema version', process.env.Q_DATABASE_VERSION || '2').parse(process.argv);
var options = program;
var QRequestsMode = {
  kafka: 'kafka',
  rest: 'rest,'
};
exports.QRequestsMode = QRequestsMode;
var config = {
  server: {
    host: options.host,
    port: Number.parseInt(options.port)
  },
  requests: {
    mode: options.requestsMode,
    server: options.requestsServer,
    topic: options.requestsTopic
  },
  database: {
    server: options.dbServer,
    name: options.dbName,
    version: options.dbVersion
  },
  listener: {
    restartTimeout: 1000
  }
};
console.log('Using config:', config);
var _default = config;
exports["default"] = _default;

function ensureProtocol(address, defaultProtocol) {
  return /^\w+:\/\//gi.test(address) ? address : "".concat(defaultProtocol, "://'").concat(address);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9jb25maWcuanMiXSwibmFtZXMiOlsicHJvZ3JhbSIsInJlcXVpcmUiLCJnZXRJcCIsImlwdjQiLCJPYmplY3QiLCJ2YWx1ZXMiLCJvcyIsIm5ldHdvcmtJbnRlcmZhY2VzIiwiZmxhdE1hcCIsIngiLCJmaW5kIiwiZmFtaWx5IiwiaW50ZXJuYWwiLCJhZGRyZXNzIiwib3B0aW9uIiwicHJvY2VzcyIsImVudiIsIlFfU0VSVkVSX0hPU1QiLCJRX1NFUlZFUl9QT1JUIiwiUV9SRVFVRVNUU19NT0RFIiwiUV9SRVFVRVNUU19TRVJWRVIiLCJRX1JFUVVFU1RTX1RPUElDIiwiUV9EQVRBQkFTRV9TRVJWRVIiLCJRX0RBVEFCQVNFX05BTUUiLCJRX0RBVEFCQVNFX1ZFUlNJT04iLCJwYXJzZSIsImFyZ3YiLCJvcHRpb25zIiwiUVJlcXVlc3RzTW9kZSIsImthZmthIiwicmVzdCIsImNvbmZpZyIsInNlcnZlciIsImhvc3QiLCJwb3J0IiwiTnVtYmVyIiwicGFyc2VJbnQiLCJyZXF1ZXN0cyIsIm1vZGUiLCJyZXF1ZXN0c01vZGUiLCJyZXF1ZXN0c1NlcnZlciIsInRvcGljIiwicmVxdWVzdHNUb3BpYyIsImRhdGFiYXNlIiwiZGJTZXJ2ZXIiLCJuYW1lIiwiZGJOYW1lIiwidmVyc2lvbiIsImRiVmVyc2lvbiIsImxpc3RlbmVyIiwicmVzdGFydFRpbWVvdXQiLCJjb25zb2xlIiwibG9nIiwiZW5zdXJlUHJvdG9jb2wiLCJkZWZhdWx0UHJvdG9jb2wiLCJ0ZXN0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBaUJBOztBQWpCQTs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBLElBQU1BLE9BQU8sR0FBR0MsT0FBTyxDQUFDLFdBQUQsQ0FBdkI7O0FBRUEsU0FBU0MsS0FBVCxHQUF5QjtBQUNyQixNQUFNQyxJQUFJLEdBQUlDLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjQyxlQUFHQyxpQkFBSCxFQUFkLENBQUQsQ0FDUkMsT0FEUSxDQUNBLFVBQUFDLENBQUM7QUFBQSxXQUFJQSxDQUFKO0FBQUEsR0FERCxFQUVSQyxJQUZRLENBRUgsVUFBQUQsQ0FBQztBQUFBLFdBQUlBLENBQUMsQ0FBQ0UsTUFBRixLQUFhLE1BQWIsSUFBdUIsQ0FBQ0YsQ0FBQyxDQUFDRyxRQUE5QjtBQUFBLEdBRkUsQ0FBYjtBQUdBLFNBQU9ULElBQUksSUFBSUEsSUFBSSxDQUFDVSxPQUFwQjtBQUNIOztBQWNEYixPQUFPLENBQ0ZjLE1BREwsQ0FDWSxtQkFEWixFQUNpQyxtQkFEakMsRUFFUUMsT0FBTyxDQUFDQyxHQUFSLENBQVlDLGFBQVosSUFBNkJmLEtBQUssRUFGMUMsRUFHS1ksTUFITCxDQUdZLG1CQUhaLEVBR2lDLGdCQUhqQyxFQUlRQyxPQUFPLENBQUNDLEdBQVIsQ0FBWUUsYUFBWixJQUE2QixNQUpyQyxFQU1LSixNQU5MLENBTVksNEJBTlosRUFNMEMsOEJBTjFDLEVBT1FDLE9BQU8sQ0FBQ0MsR0FBUixDQUFZRyxlQUFaLElBQStCLE9BUHZDLEVBUUtMLE1BUkwsQ0FRWSw2QkFSWixFQVEyQyxxQkFSM0MsRUFTUUMsT0FBTyxDQUFDQyxHQUFSLENBQVlJLGlCQUFaLElBQWlDLFlBVHpDLEVBVUtOLE1BVkwsQ0FVWSw2QkFWWixFQVUyQyxxQkFWM0MsRUFXUUMsT0FBTyxDQUFDQyxHQUFSLENBQVlLLGdCQUFaLElBQWdDLFVBWHhDLEVBYUtQLE1BYkwsQ0FhWSwyQkFiWixFQWF5QyxzQkFiekMsRUFjUUMsT0FBTyxDQUFDQyxHQUFSLENBQVlNLGlCQUFaLElBQWlDLGVBZHpDLEVBZUtSLE1BZkwsQ0FlWSxzQkFmWixFQWVvQyxlQWZwQyxFQWdCUUMsT0FBTyxDQUFDQyxHQUFSLENBQVlPLGVBQVosSUFBK0IsWUFoQnZDLEVBaUJLVCxNQWpCTCxDQWlCWSw0QkFqQlosRUFpQjBDLHlCQWpCMUMsRUFrQlFDLE9BQU8sQ0FBQ0MsR0FBUixDQUFZUSxrQkFBWixJQUFrQyxHQWxCMUMsRUFtQktDLEtBbkJMLENBbUJXVixPQUFPLENBQUNXLElBbkJuQjtBQXFCQSxJQUFNQyxPQUF1QixHQUFHM0IsT0FBaEM7QUFFTyxJQUFNNEIsYUFBYSxHQUFHO0FBQ3pCQyxFQUFBQSxLQUFLLEVBQUUsT0FEa0I7QUFFekJDLEVBQUFBLElBQUksRUFBRTtBQUZtQixDQUF0Qjs7QUF5QlAsSUFBTUMsTUFBZSxHQUFHO0FBQ3BCQyxFQUFBQSxNQUFNLEVBQUU7QUFDSkMsSUFBQUEsSUFBSSxFQUFFTixPQUFPLENBQUNNLElBRFY7QUFFSkMsSUFBQUEsSUFBSSxFQUFFQyxNQUFNLENBQUNDLFFBQVAsQ0FBZ0JULE9BQU8sQ0FBQ08sSUFBeEI7QUFGRixHQURZO0FBS3BCRyxFQUFBQSxRQUFRLEVBQUU7QUFDTkMsSUFBQUEsSUFBSSxFQUFFWCxPQUFPLENBQUNZLFlBRFI7QUFFTlAsSUFBQUEsTUFBTSxFQUFFTCxPQUFPLENBQUNhLGNBRlY7QUFHTkMsSUFBQUEsS0FBSyxFQUFFZCxPQUFPLENBQUNlO0FBSFQsR0FMVTtBQVVwQkMsRUFBQUEsUUFBUSxFQUFFO0FBQ05YLElBQUFBLE1BQU0sRUFBRUwsT0FBTyxDQUFDaUIsUUFEVjtBQUVOQyxJQUFBQSxJQUFJLEVBQUVsQixPQUFPLENBQUNtQixNQUZSO0FBR05DLElBQUFBLE9BQU8sRUFBRXBCLE9BQU8sQ0FBQ3FCO0FBSFgsR0FWVTtBQWVwQkMsRUFBQUEsUUFBUSxFQUFFO0FBQ05DLElBQUFBLGNBQWMsRUFBRTtBQURWO0FBZlUsQ0FBeEI7QUFvQkFDLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLGVBQVosRUFBNkJyQixNQUE3QjtlQUNlQSxNOzs7QUFFUixTQUFTc0IsY0FBVCxDQUF3QnhDLE9BQXhCLEVBQXlDeUMsZUFBekMsRUFBMEU7QUFDN0UsU0FBTyxjQUFjQyxJQUFkLENBQW1CMUMsT0FBbkIsSUFBOEJBLE9BQTlCLGFBQTJDeUMsZUFBM0MsaUJBQWlFekMsT0FBakUsQ0FBUDtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMTkgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuaW1wb3J0IG9zIGZyb20gJ29zJztcbmNvbnN0IHByb2dyYW0gPSByZXF1aXJlKCdjb21tYW5kZXInKTtcblxuZnVuY3Rpb24gZ2V0SXAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBpcHY0ID0gKE9iamVjdC52YWx1ZXMob3MubmV0d29ya0ludGVyZmFjZXMoKSk6IGFueSlcbiAgICAgICAgLmZsYXRNYXAoeCA9PiB4KVxuICAgICAgICAuZmluZCh4ID0+IHguZmFtaWx5ID09PSAnSVB2NCcgJiYgIXguaW50ZXJuYWwpO1xuICAgIHJldHVybiBpcHY0ICYmIGlwdjQuYWRkcmVzcztcbn1cblxudHlwZSBQcm9ncmFtT3B0aW9ucyA9IHtcbiAgICByZXF1ZXN0c01vZGU6ICdrYWZrYScgfCAncmVzdCcsXG4gICAgcmVxdWVzdHNTZXJ2ZXI6IHN0cmluZyxcbiAgICByZXF1ZXN0c1RvcGljOiBzdHJpbmcsXG4gICAgZGJOYW1lOiBzdHJpbmcsXG4gICAgZGJTZXJ2ZXI6IHN0cmluZyxcbiAgICBkYk5hbWU6IHN0cmluZyxcbiAgICBkYlZlcnNpb246IHN0cmluZyxcbiAgICBob3N0OiBzdHJpbmcsXG4gICAgcG9ydDogc3RyaW5nLFxufVxuXG5wcm9ncmFtXG4gICAgLm9wdGlvbignLWgsIC0taG9zdCA8aG9zdD4nLCAnbGlzdGVuaW5nIGFkZHJlc3MnLFxuICAgICAgICBwcm9jZXNzLmVudi5RX1NFUlZFUl9IT1NUIHx8IGdldElwKCkpXG4gICAgLm9wdGlvbignLXAsIC0tcG9ydCA8cG9ydD4nLCAnbGlzdGVuaW5nIHBvcnQnLFxuICAgICAgICBwcm9jZXNzLmVudi5RX1NFUlZFUl9QT1JUIHx8ICc0MDAwJylcblxuICAgIC5vcHRpb24oJy1tLCAtLXJlcXVlc3RzLW1vZGUgPG1vZGU+JywgJ1JlcXVlc3RzIG1vZGUgKGthZmthIHwgcmVzdCknLFxuICAgICAgICBwcm9jZXNzLmVudi5RX1JFUVVFU1RTX01PREUgfHwgJ2thZmthJylcbiAgICAub3B0aW9uKCctciwgLS1yZXF1ZXN0cy1zZXJ2ZXIgPHVybD4nLCAnUmVxdWVzdHMgc2VydmVyIHVybCcsXG4gICAgICAgIHByb2Nlc3MuZW52LlFfUkVRVUVTVFNfU0VSVkVSIHx8ICdrYWZrYTo5MDkyJylcbiAgICAub3B0aW9uKCctdCwgLS1yZXF1ZXN0cy10b3BpYyA8bmFtZT4nLCAnUmVxdWVzdHMgdG9waWMgbmFtZScsXG4gICAgICAgIHByb2Nlc3MuZW52LlFfUkVRVUVTVFNfVE9QSUMgfHwgJ3JlcXVlc3RzJylcblxuICAgIC5vcHRpb24oJy1kLCAtLWRiLXNlcnZlciA8YWRkcmVzcz4nLCAnZGF0YWJhc2Ugc2VydmVyOnBvcnQnLFxuICAgICAgICBwcm9jZXNzLmVudi5RX0RBVEFCQVNFX1NFUlZFUiB8fCAnYXJhbmdvZGI6ODUyOScpXG4gICAgLm9wdGlvbignLW4sIC0tZGItbmFtZSA8bmFtZT4nLCAnZGF0YWJhc2UgbmFtZScsXG4gICAgICAgIHByb2Nlc3MuZW52LlFfREFUQUJBU0VfTkFNRSB8fCAnYmxvY2tjaGFpbicpXG4gICAgLm9wdGlvbignLW4sIC0tZGItdmVyc2lvbiA8dmVyc2lvbj4nLCAnZGF0YWJhc2Ugc2NoZW1hIHZlcnNpb24nLFxuICAgICAgICBwcm9jZXNzLmVudi5RX0RBVEFCQVNFX1ZFUlNJT04gfHwgJzInKVxuICAgIC5wYXJzZShwcm9jZXNzLmFyZ3YpO1xuXG5jb25zdCBvcHRpb25zOiBQcm9ncmFtT3B0aW9ucyA9IHByb2dyYW07XG5cbmV4cG9ydCBjb25zdCBRUmVxdWVzdHNNb2RlID0ge1xuICAgIGthZmthOiAna2Fma2EnLFxuICAgIHJlc3Q6ICdyZXN0LCdcbn07XG5cbmV4cG9ydCB0eXBlIFFDb25maWcgPSB7XG4gICAgc2VydmVyOiB7XG4gICAgICAgIGhvc3Q6IHN0cmluZyxcbiAgICAgICAgcG9ydDogbnVtYmVyLFxuICAgIH0sXG4gICAgcmVxdWVzdHM6IHtcbiAgICAgICAgbW9kZTogJ2thZmthJyB8ICdyZXN0JyxcbiAgICAgICAgc2VydmVyOiBzdHJpbmcsXG4gICAgICAgIHRvcGljOiBzdHJpbmcsXG4gICAgfSxcbiAgICBkYXRhYmFzZToge1xuICAgICAgICBzZXJ2ZXI6IHN0cmluZyxcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICB2ZXJzaW9uOiBzdHJpbmcsXG4gICAgfSxcbiAgICBsaXN0ZW5lcjoge1xuICAgICAgICByZXN0YXJ0VGltZW91dDogbnVtYmVyXG4gICAgfVxufVxuXG5jb25zdCBjb25maWc6IFFDb25maWcgPSB7XG4gICAgc2VydmVyOiB7XG4gICAgICAgIGhvc3Q6IG9wdGlvbnMuaG9zdCxcbiAgICAgICAgcG9ydDogTnVtYmVyLnBhcnNlSW50KG9wdGlvbnMucG9ydCksXG4gICAgfSxcbiAgICByZXF1ZXN0czoge1xuICAgICAgICBtb2RlOiBvcHRpb25zLnJlcXVlc3RzTW9kZSxcbiAgICAgICAgc2VydmVyOiBvcHRpb25zLnJlcXVlc3RzU2VydmVyLFxuICAgICAgICB0b3BpYzogb3B0aW9ucy5yZXF1ZXN0c1RvcGljLFxuICAgIH0sXG4gICAgZGF0YWJhc2U6IHtcbiAgICAgICAgc2VydmVyOiBvcHRpb25zLmRiU2VydmVyLFxuICAgICAgICBuYW1lOiBvcHRpb25zLmRiTmFtZSxcbiAgICAgICAgdmVyc2lvbjogb3B0aW9ucy5kYlZlcnNpb24sXG4gICAgfSxcbiAgICBsaXN0ZW5lcjoge1xuICAgICAgICByZXN0YXJ0VGltZW91dDogMTAwMFxuICAgIH1cbn07XG5cbmNvbnNvbGUubG9nKCdVc2luZyBjb25maWc6JywgY29uZmlnKTtcbmV4cG9ydCBkZWZhdWx0IGNvbmZpZztcblxuZXhwb3J0IGZ1bmN0aW9uIGVuc3VyZVByb3RvY29sKGFkZHJlc3M6IHN0cmluZywgZGVmYXVsdFByb3RvY29sOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiAvXlxcdys6XFwvXFwvL2dpLnRlc3QoYWRkcmVzcykgPyBhZGRyZXNzIDogYCR7ZGVmYXVsdFByb3RvY29sfTovLycke2FkZHJlc3N9YDtcbn1cblxuIl19