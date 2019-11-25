"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

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

var MODE = {
  production: 'production',
  development: 'development'
};
program.option('-h, --host <host>', 'listening address', process.env.Q_SERVER_HOST || getIp()).option('-p, --port <port>', 'listening port', process.env.Q_SERVER_PORT || '4000').option('-d, --db-server <address>', 'database server:port', process.env.Q_DATABASE_SERVER || 'arangodb:8529').option('-n, --db-name <name>', 'database name', process.env.Q_DATABASE_NAME || 'blockchain').option('-n, --db-version <version>', 'database schema version', process.env.Q_DATABASE_VERSION || '2').parse(process.argv);
var options = program;
var env = {
  ssl: (process.env.Q_SSL || '') === 'true',
  database_server: options.dbServer,
  database_name: options.dbName,
  database_version: options.dbVersion,
  server_host: options.host,
  server_port: options.port
};
var config = {
  server: {
    host: env.server_host,
    port: Number.parseInt(env.server_port),
    ssl: env.ssl ? {
      port: 4001,
      key: 'server/ssl/server.key',
      cert: 'server/ssl/server.crt'
    } : null
  },
  database: {
    server: env.database_server,
    name: env.database_name,
    version: env.database_version
  },
  listener: {
    restartTimeout: 1000
  }
};
console.log('Using config:', config);
var _default = config;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9jb25maWcuanMiXSwibmFtZXMiOlsicHJvZ3JhbSIsInJlcXVpcmUiLCJnZXRJcCIsImlwdjQiLCJPYmplY3QiLCJ2YWx1ZXMiLCJvcyIsIm5ldHdvcmtJbnRlcmZhY2VzIiwiZmxhdE1hcCIsIngiLCJmaW5kIiwiZmFtaWx5IiwiaW50ZXJuYWwiLCJhZGRyZXNzIiwiTU9ERSIsInByb2R1Y3Rpb24iLCJkZXZlbG9wbWVudCIsIm9wdGlvbiIsInByb2Nlc3MiLCJlbnYiLCJRX1NFUlZFUl9IT1NUIiwiUV9TRVJWRVJfUE9SVCIsIlFfREFUQUJBU0VfU0VSVkVSIiwiUV9EQVRBQkFTRV9OQU1FIiwiUV9EQVRBQkFTRV9WRVJTSU9OIiwicGFyc2UiLCJhcmd2Iiwib3B0aW9ucyIsInNzbCIsIlFfU1NMIiwiZGF0YWJhc2Vfc2VydmVyIiwiZGJTZXJ2ZXIiLCJkYXRhYmFzZV9uYW1lIiwiZGJOYW1lIiwiZGF0YWJhc2VfdmVyc2lvbiIsImRiVmVyc2lvbiIsInNlcnZlcl9ob3N0IiwiaG9zdCIsInNlcnZlcl9wb3J0IiwicG9ydCIsImNvbmZpZyIsInNlcnZlciIsIk51bWJlciIsInBhcnNlSW50Iiwia2V5IiwiY2VydCIsImRhdGFiYXNlIiwibmFtZSIsInZlcnNpb24iLCJsaXN0ZW5lciIsInJlc3RhcnRUaW1lb3V0IiwiY29uc29sZSIsImxvZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBaUJBOztBQWpCQTs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBLElBQU1BLE9BQU8sR0FBR0MsT0FBTyxDQUFDLFdBQUQsQ0FBdkI7O0FBRUEsU0FBU0MsS0FBVCxHQUF5QjtBQUNyQixNQUFNQyxJQUFJLEdBQUlDLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjQyxlQUFHQyxpQkFBSCxFQUFkLENBQUQsQ0FDUkMsT0FEUSxDQUNBLFVBQUFDLENBQUM7QUFBQSxXQUFJQSxDQUFKO0FBQUEsR0FERCxFQUVSQyxJQUZRLENBRUgsVUFBQUQsQ0FBQztBQUFBLFdBQUlBLENBQUMsQ0FBQ0UsTUFBRixLQUFhLE1BQWIsSUFBdUIsQ0FBQ0YsQ0FBQyxDQUFDRyxRQUE5QjtBQUFBLEdBRkUsQ0FBYjtBQUdBLFNBQU9ULElBQUksSUFBSUEsSUFBSSxDQUFDVSxPQUFwQjtBQUNIOztBQUVELElBQU1DLElBQUksR0FBRztBQUNUQyxFQUFBQSxVQUFVLEVBQUUsWUFESDtBQUVUQyxFQUFBQSxXQUFXLEVBQUU7QUFGSixDQUFiO0FBYUFoQixPQUFPLENBQ0ZpQixNQURMLENBQ1ksbUJBRFosRUFDaUMsbUJBRGpDLEVBRVFDLE9BQU8sQ0FBQ0MsR0FBUixDQUFZQyxhQUFaLElBQTZCbEIsS0FBSyxFQUYxQyxFQUdLZSxNQUhMLENBR1ksbUJBSFosRUFHaUMsZ0JBSGpDLEVBSVFDLE9BQU8sQ0FBQ0MsR0FBUixDQUFZRSxhQUFaLElBQTZCLE1BSnJDLEVBS0tKLE1BTEwsQ0FLWSwyQkFMWixFQUt5QyxzQkFMekMsRUFNUUMsT0FBTyxDQUFDQyxHQUFSLENBQVlHLGlCQUFaLElBQWlDLGVBTnpDLEVBT0tMLE1BUEwsQ0FPWSxzQkFQWixFQU9vQyxlQVBwQyxFQVFRQyxPQUFPLENBQUNDLEdBQVIsQ0FBWUksZUFBWixJQUErQixZQVJ2QyxFQVNLTixNQVRMLENBU1ksNEJBVFosRUFTMEMseUJBVDFDLEVBVVFDLE9BQU8sQ0FBQ0MsR0FBUixDQUFZSyxrQkFBWixJQUFrQyxHQVYxQyxFQVdLQyxLQVhMLENBV1dQLE9BQU8sQ0FBQ1EsSUFYbkI7QUFhQSxJQUFNQyxPQUF1QixHQUFHM0IsT0FBaEM7QUFFQSxJQUFNbUIsR0FBRyxHQUFHO0FBQ1JTLEVBQUFBLEdBQUcsRUFBRSxDQUFDVixPQUFPLENBQUNDLEdBQVIsQ0FBWVUsS0FBWixJQUFxQixFQUF0QixNQUE4QixNQUQzQjtBQUVSQyxFQUFBQSxlQUFlLEVBQUVILE9BQU8sQ0FBQ0ksUUFGakI7QUFHUkMsRUFBQUEsYUFBYSxFQUFFTCxPQUFPLENBQUNNLE1BSGY7QUFJUkMsRUFBQUEsZ0JBQWdCLEVBQUVQLE9BQU8sQ0FBQ1EsU0FKbEI7QUFLUkMsRUFBQUEsV0FBVyxFQUFFVCxPQUFPLENBQUNVLElBTGI7QUFNUkMsRUFBQUEsV0FBVyxFQUFFWCxPQUFPLENBQUNZO0FBTmIsQ0FBWjtBQTZCQSxJQUFNQyxNQUFlLEdBQUc7QUFDcEJDLEVBQUFBLE1BQU0sRUFBRTtBQUNKSixJQUFBQSxJQUFJLEVBQUVsQixHQUFHLENBQUNpQixXQUROO0FBRUpHLElBQUFBLElBQUksRUFBRUcsTUFBTSxDQUFDQyxRQUFQLENBQWdCeEIsR0FBRyxDQUFDbUIsV0FBcEIsQ0FGRjtBQUdKVixJQUFBQSxHQUFHLEVBQUVULEdBQUcsQ0FBQ1MsR0FBSixHQUNDO0FBQ0VXLE1BQUFBLElBQUksRUFBRSxJQURSO0FBRUVLLE1BQUFBLEdBQUcsRUFBRSx1QkFGUDtBQUdFQyxNQUFBQSxJQUFJLEVBQUU7QUFIUixLQURELEdBTUM7QUFURixHQURZO0FBWXBCQyxFQUFBQSxRQUFRLEVBQUU7QUFDTkwsSUFBQUEsTUFBTSxFQUFFdEIsR0FBRyxDQUFDVyxlQUROO0FBRU5pQixJQUFBQSxJQUFJLEVBQUU1QixHQUFHLENBQUNhLGFBRko7QUFHTmdCLElBQUFBLE9BQU8sRUFBRTdCLEdBQUcsQ0FBQ2U7QUFIUCxHQVpVO0FBaUJwQmUsRUFBQUEsUUFBUSxFQUFFO0FBQ05DLElBQUFBLGNBQWMsRUFBRTtBQURWO0FBakJVLENBQXhCO0FBc0JBQyxPQUFPLENBQUNDLEdBQVIsQ0FBWSxlQUFaLEVBQTZCWixNQUE3QjtlQUNlQSxNIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMTkgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuaW1wb3J0IG9zIGZyb20gJ29zJztcbmNvbnN0IHByb2dyYW0gPSByZXF1aXJlKCdjb21tYW5kZXInKTtcblxuZnVuY3Rpb24gZ2V0SXAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBpcHY0ID0gKE9iamVjdC52YWx1ZXMob3MubmV0d29ya0ludGVyZmFjZXMoKSk6IGFueSlcbiAgICAgICAgLmZsYXRNYXAoeCA9PiB4KVxuICAgICAgICAuZmluZCh4ID0+IHguZmFtaWx5ID09PSAnSVB2NCcgJiYgIXguaW50ZXJuYWwpO1xuICAgIHJldHVybiBpcHY0ICYmIGlwdjQuYWRkcmVzcztcbn1cblxuY29uc3QgTU9ERSA9IHtcbiAgICBwcm9kdWN0aW9uOiAncHJvZHVjdGlvbicsXG4gICAgZGV2ZWxvcG1lbnQ6ICdkZXZlbG9wbWVudCcsXG59O1xuXG50eXBlIFByb2dyYW1PcHRpb25zID0ge1xuICAgIGRiU2VydmVyOiBzdHJpbmcsXG4gICAgZGJOYW1lOiBzdHJpbmcsXG4gICAgZGJWZXJzaW9uOiBzdHJpbmcsXG4gICAgaG9zdDogc3RyaW5nLFxuICAgIHBvcnQ6IHN0cmluZyxcbn1cblxucHJvZ3JhbVxuICAgIC5vcHRpb24oJy1oLCAtLWhvc3QgPGhvc3Q+JywgJ2xpc3RlbmluZyBhZGRyZXNzJyxcbiAgICAgICAgcHJvY2Vzcy5lbnYuUV9TRVJWRVJfSE9TVCB8fCBnZXRJcCgpKVxuICAgIC5vcHRpb24oJy1wLCAtLXBvcnQgPHBvcnQ+JywgJ2xpc3RlbmluZyBwb3J0JyxcbiAgICAgICAgcHJvY2Vzcy5lbnYuUV9TRVJWRVJfUE9SVCB8fCAnNDAwMCcpXG4gICAgLm9wdGlvbignLWQsIC0tZGItc2VydmVyIDxhZGRyZXNzPicsICdkYXRhYmFzZSBzZXJ2ZXI6cG9ydCcsXG4gICAgICAgIHByb2Nlc3MuZW52LlFfREFUQUJBU0VfU0VSVkVSIHx8ICdhcmFuZ29kYjo4NTI5JylcbiAgICAub3B0aW9uKCctbiwgLS1kYi1uYW1lIDxuYW1lPicsICdkYXRhYmFzZSBuYW1lJyxcbiAgICAgICAgcHJvY2Vzcy5lbnYuUV9EQVRBQkFTRV9OQU1FIHx8ICdibG9ja2NoYWluJylcbiAgICAub3B0aW9uKCctbiwgLS1kYi12ZXJzaW9uIDx2ZXJzaW9uPicsICdkYXRhYmFzZSBzY2hlbWEgdmVyc2lvbicsXG4gICAgICAgIHByb2Nlc3MuZW52LlFfREFUQUJBU0VfVkVSU0lPTiB8fCAnMicpXG4gICAgLnBhcnNlKHByb2Nlc3MuYXJndik7XG5cbmNvbnN0IG9wdGlvbnM6IFByb2dyYW1PcHRpb25zID0gcHJvZ3JhbTtcblxuY29uc3QgZW52ID0ge1xuICAgIHNzbDogKHByb2Nlc3MuZW52LlFfU1NMIHx8ICcnKSA9PT0gJ3RydWUnLFxuICAgIGRhdGFiYXNlX3NlcnZlcjogb3B0aW9ucy5kYlNlcnZlcixcbiAgICBkYXRhYmFzZV9uYW1lOiBvcHRpb25zLmRiTmFtZSxcbiAgICBkYXRhYmFzZV92ZXJzaW9uOiBvcHRpb25zLmRiVmVyc2lvbixcbiAgICBzZXJ2ZXJfaG9zdDogb3B0aW9ucy5ob3N0LFxuICAgIHNlcnZlcl9wb3J0OiBvcHRpb25zLnBvcnQsXG59O1xuXG5leHBvcnQgdHlwZSBRQ29uZmlnID0ge1xuICAgIHNlcnZlcjoge1xuICAgICAgICBob3N0OiBzdHJpbmcsXG4gICAgICAgIHBvcnQ6IG51bWJlcixcbiAgICAgICAgc3NsOiA/e1xuICAgICAgICAgICAgcG9ydDogbnVtYmVyLFxuICAgICAgICAgICAga2V5OiBzdHJpbmcsXG4gICAgICAgICAgICBjZXJ0OiBzdHJpbmcsXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBkYXRhYmFzZToge1xuICAgICAgICBzZXJ2ZXI6IHN0cmluZyxcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICB2ZXJzaW9uOiBzdHJpbmcsXG4gICAgfSxcbiAgICBsaXN0ZW5lcjoge1xuICAgICAgICByZXN0YXJ0VGltZW91dDogbnVtYmVyXG4gICAgfVxufVxuXG5jb25zdCBjb25maWc6IFFDb25maWcgPSB7XG4gICAgc2VydmVyOiB7XG4gICAgICAgIGhvc3Q6IGVudi5zZXJ2ZXJfaG9zdCxcbiAgICAgICAgcG9ydDogTnVtYmVyLnBhcnNlSW50KGVudi5zZXJ2ZXJfcG9ydCksXG4gICAgICAgIHNzbDogZW52LnNzbFxuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgcG9ydDogNDAwMSxcbiAgICAgICAgICAgICAgICBrZXk6ICdzZXJ2ZXIvc3NsL3NlcnZlci5rZXknLFxuICAgICAgICAgICAgICAgIGNlcnQ6ICdzZXJ2ZXIvc3NsL3NlcnZlci5jcnQnLFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgOiBudWxsLFxuICAgIH0sXG4gICAgZGF0YWJhc2U6IHtcbiAgICAgICAgc2VydmVyOiBlbnYuZGF0YWJhc2Vfc2VydmVyLFxuICAgICAgICBuYW1lOiBlbnYuZGF0YWJhc2VfbmFtZSxcbiAgICAgICAgdmVyc2lvbjogZW52LmRhdGFiYXNlX3ZlcnNpb24sXG4gICAgfSxcbiAgICBsaXN0ZW5lcjoge1xuICAgICAgICByZXN0YXJ0VGltZW91dDogMTAwMFxuICAgIH1cbn07XG5cbmNvbnNvbGUubG9nKCdVc2luZyBjb25maWc6JywgY29uZmlnKTtcbmV4cG9ydCBkZWZhdWx0IGNvbmZpZztcbiJdfQ==