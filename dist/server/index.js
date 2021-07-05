"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.main = main;

var _config = require("./config");

var _server = _interopRequireDefault(require("./server"));

var _logs = _interopRequireDefault(require("./logs"));

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
const program = require('commander');

Object.values(_config.programOptions).forEach(value => {
  const option = value;
  program.option(option.option, option.description);
});
program.parse(process.argv);
const configPath = program.config || process.env.Q_CONFIG;
const configData = configPath ? (0, _config.readConfigFile)(configPath) : {};
const config = (0, _config.createConfig)(program, // program args
configData, // config file
process.env, // os envs
_config.programOptions // defaults
);
const logs = new _logs.default();
const configLog = logs.create('config');
configLog.debug('USE', config);
const server = new _server.default({
  config,
  logs
});

function main() {
  (async () => {
    try {
      await server.start();
    } catch (error) {
      server.log.error('FAILED', 'START', error);
      process.exit(1);
    }
  })();
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zZXJ2ZXIvaW5kZXguanMiXSwibmFtZXMiOlsicHJvZ3JhbSIsInJlcXVpcmUiLCJPYmplY3QiLCJ2YWx1ZXMiLCJwcm9ncmFtT3B0aW9ucyIsImZvckVhY2giLCJ2YWx1ZSIsIm9wdGlvbiIsImRlc2NyaXB0aW9uIiwicGFyc2UiLCJwcm9jZXNzIiwiYXJndiIsImNvbmZpZ1BhdGgiLCJjb25maWciLCJlbnYiLCJRX0NPTkZJRyIsImNvbmZpZ0RhdGEiLCJsb2dzIiwiUUxvZ3MiLCJjb25maWdMb2ciLCJjcmVhdGUiLCJkZWJ1ZyIsInNlcnZlciIsIlRPTlFTZXJ2ZXIiLCJtYWluIiwic3RhcnQiLCJlcnJvciIsImxvZyIsImV4aXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFrQkE7O0FBRUE7O0FBQ0E7Ozs7QUFyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBU0EsTUFBTUEsT0FBTyxHQUFHQyxPQUFPLENBQUMsV0FBRCxDQUF2Qjs7QUFFQUMsTUFBTSxDQUFDQyxNQUFQLENBQWNDLHNCQUFkLEVBQThCQyxPQUE5QixDQUF1Q0MsS0FBRCxJQUFXO0FBQzdDLFFBQU1DLE1BQU0sR0FBS0QsS0FBakI7QUFDQU4sRUFBQUEsT0FBTyxDQUFDTyxNQUFSLENBQWVBLE1BQU0sQ0FBQ0EsTUFBdEIsRUFBOEJBLE1BQU0sQ0FBQ0MsV0FBckM7QUFDSCxDQUhEO0FBS0FSLE9BQU8sQ0FBQ1MsS0FBUixDQUFjQyxPQUFPLENBQUNDLElBQXRCO0FBRUEsTUFBTUMsVUFBVSxHQUFHWixPQUFPLENBQUNhLE1BQVIsSUFBa0JILE9BQU8sQ0FBQ0ksR0FBUixDQUFZQyxRQUFqRDtBQUNBLE1BQU1DLFVBQVUsR0FBR0osVUFBVSxHQUFHLDRCQUFlQSxVQUFmLENBQUgsR0FBZ0MsRUFBN0Q7QUFFQSxNQUFNQyxNQUFlLEdBQUcsMEJBQ3BCYixPQURvQixFQUNYO0FBQ1RnQixVQUZvQixFQUVSO0FBQ1pOLE9BQU8sQ0FBQ0ksR0FIWSxFQUdQO0FBQ2JWLHNCQUpvQixDQUlKO0FBSkksQ0FBeEI7QUFPQSxNQUFNYSxJQUFJLEdBQUcsSUFBSUMsYUFBSixFQUFiO0FBQ0EsTUFBTUMsU0FBUyxHQUFHRixJQUFJLENBQUNHLE1BQUwsQ0FBWSxRQUFaLENBQWxCO0FBQ0FELFNBQVMsQ0FBQ0UsS0FBVixDQUFnQixLQUFoQixFQUF1QlIsTUFBdkI7QUFFQSxNQUFNUyxNQUFNLEdBQUcsSUFBSUMsZUFBSixDQUFlO0FBQzFCVixFQUFBQSxNQUQwQjtBQUUxQkksRUFBQUE7QUFGMEIsQ0FBZixDQUFmOztBQUtPLFNBQVNPLElBQVQsR0FBZ0I7QUFDbkIsR0FBQyxZQUFZO0FBQ1QsUUFBSTtBQUNBLFlBQU1GLE1BQU0sQ0FBQ0csS0FBUCxFQUFOO0FBQ0gsS0FGRCxDQUVFLE9BQU9DLEtBQVAsRUFBYztBQUNaSixNQUFBQSxNQUFNLENBQUNLLEdBQVAsQ0FBV0QsS0FBWCxDQUFpQixRQUFqQixFQUEyQixPQUEzQixFQUFvQ0EsS0FBcEM7QUFDQWhCLE1BQUFBLE9BQU8sQ0FBQ2tCLElBQVIsQ0FBYSxDQUFiO0FBQ0g7QUFDSixHQVBEO0FBUUgiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5cbmltcG9ydCB7IGNyZWF0ZUNvbmZpZywgcHJvZ3JhbU9wdGlvbnMsIHJlYWRDb25maWdGaWxlIH0gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHR5cGUgeyBQcm9ncmFtT3B0aW9uLCBRQ29uZmlnIH0gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IFRPTlFTZXJ2ZXIgZnJvbSAnLi9zZXJ2ZXInO1xuaW1wb3J0IFFMb2dzIGZyb20gJy4vbG9ncyc7XG5cbmNvbnN0IHByb2dyYW0gPSByZXF1aXJlKCdjb21tYW5kZXInKTtcblxuT2JqZWN0LnZhbHVlcyhwcm9ncmFtT3B0aW9ucykuZm9yRWFjaCgodmFsdWUpID0+IHtcbiAgICBjb25zdCBvcHRpb24gPSAoKHZhbHVlOiBhbnkpOiBQcm9ncmFtT3B0aW9uKTtcbiAgICBwcm9ncmFtLm9wdGlvbihvcHRpb24ub3B0aW9uLCBvcHRpb24uZGVzY3JpcHRpb24pO1xufSk7XG5cbnByb2dyYW0ucGFyc2UocHJvY2Vzcy5hcmd2KTtcblxuY29uc3QgY29uZmlnUGF0aCA9IHByb2dyYW0uY29uZmlnIHx8IHByb2Nlc3MuZW52LlFfQ09ORklHO1xuY29uc3QgY29uZmlnRGF0YSA9IGNvbmZpZ1BhdGggPyByZWFkQ29uZmlnRmlsZShjb25maWdQYXRoKSA6IHt9O1xuXG5jb25zdCBjb25maWc6IFFDb25maWcgPSBjcmVhdGVDb25maWcoXG4gICAgcHJvZ3JhbSwgLy8gcHJvZ3JhbSBhcmdzXG4gICAgY29uZmlnRGF0YSwgLy8gY29uZmlnIGZpbGVcbiAgICBwcm9jZXNzLmVudiwgLy8gb3MgZW52c1xuICAgIHByb2dyYW1PcHRpb25zLCAvLyBkZWZhdWx0c1xuKTtcblxuY29uc3QgbG9ncyA9IG5ldyBRTG9ncygpO1xuY29uc3QgY29uZmlnTG9nID0gbG9ncy5jcmVhdGUoJ2NvbmZpZycpO1xuY29uZmlnTG9nLmRlYnVnKCdVU0UnLCBjb25maWcpO1xuXG5jb25zdCBzZXJ2ZXIgPSBuZXcgVE9OUVNlcnZlcih7XG4gICAgY29uZmlnLFxuICAgIGxvZ3MsXG59KTtcblxuZXhwb3J0IGZ1bmN0aW9uIG1haW4oKSB7XG4gICAgKGFzeW5jICgpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHNlcnZlci5zdGFydCgpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgc2VydmVyLmxvZy5lcnJvcignRkFJTEVEJywgJ1NUQVJUJywgZXJyb3IpO1xuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICB9XG4gICAgfSkoKTtcbn1cbiJdfQ==