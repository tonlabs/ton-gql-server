"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _utils = require("./utils");

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
function toJSON(value) {
  try {
    return JSON.stringify((0, _utils.toLog)(value));
  } catch (error) {
    return JSON.stringify(`${value}`);
  }
}

function str(arg) {
  const s = typeof arg === 'string' ? arg : toJSON(arg);
  return s.split('\n').join('\\n').split('\t').join('\\t');
}

function format(name, args) {
  return `${Date.now()}\t${name}\t${args.map(str).join('\t')}`;
}

class QLogs {
  create(name) {
    return {
      error(...args) {
        console.error(format(name, args));
      },

      debug(...args) {
        console.debug(format(name, args));
      }

    };
  }

}

exports.default = QLogs;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9sb2dzLmpzIl0sIm5hbWVzIjpbInRvSlNPTiIsInZhbHVlIiwiSlNPTiIsInN0cmluZ2lmeSIsImVycm9yIiwic3RyIiwiYXJnIiwicyIsInNwbGl0Iiwiam9pbiIsImZvcm1hdCIsIm5hbWUiLCJhcmdzIiwiRGF0ZSIsIm5vdyIsIm1hcCIsIlFMb2dzIiwiY3JlYXRlIiwiY29uc29sZSIsImRlYnVnIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBa0JBOztBQWxCQTs7Ozs7Ozs7Ozs7Ozs7O0FBeUJBLFNBQVNBLE1BQVQsQ0FBZ0JDLEtBQWhCLEVBQW9DO0FBQ2hDLE1BQUk7QUFDQSxXQUFPQyxJQUFJLENBQUNDLFNBQUwsQ0FBZSxrQkFBTUYsS0FBTixDQUFmLENBQVA7QUFDSCxHQUZELENBRUUsT0FBT0csS0FBUCxFQUFjO0FBQ1osV0FBT0YsSUFBSSxDQUFDQyxTQUFMLENBQWdCLEdBQUVGLEtBQU0sRUFBeEIsQ0FBUDtBQUNIO0FBQ0o7O0FBRUQsU0FBU0ksR0FBVCxDQUFhQyxHQUFiLEVBQStCO0FBQzNCLFFBQU1DLENBQUMsR0FBRyxPQUFPRCxHQUFQLEtBQWUsUUFBZixHQUEwQkEsR0FBMUIsR0FBZ0NOLE1BQU0sQ0FBQ00sR0FBRCxDQUFoRDtBQUNBLFNBQU9DLENBQUMsQ0FBQ0MsS0FBRixDQUFRLElBQVIsRUFBY0MsSUFBZCxDQUFtQixLQUFuQixFQUEwQkQsS0FBMUIsQ0FBZ0MsSUFBaEMsRUFBc0NDLElBQXRDLENBQTJDLEtBQTNDLENBQVA7QUFDSDs7QUFFRCxTQUFTQyxNQUFULENBQWdCQyxJQUFoQixFQUE4QkMsSUFBOUIsRUFBOEM7QUFDMUMsU0FBUSxHQUFFQyxJQUFJLENBQUNDLEdBQUwsRUFBVyxLQUFJSCxJQUFLLEtBQUlDLElBQUksQ0FBQ0csR0FBTCxDQUFTVixHQUFULEVBQWNJLElBQWQsQ0FBbUIsSUFBbkIsQ0FBeUIsRUFBM0Q7QUFDSDs7QUFFYyxNQUFNTyxLQUFOLENBQVk7QUFDMUJDLEVBQUFBLE1BQU0sQ0FBQ04sSUFBRCxFQUFxQjtBQUMxQixXQUFPO0FBQ05QLE1BQUFBLEtBQUssQ0FBQyxHQUFHUSxJQUFKLEVBQVU7QUFDZE0sUUFBQUEsT0FBTyxDQUFDZCxLQUFSLENBQWNNLE1BQU0sQ0FBQ0MsSUFBRCxFQUFPQyxJQUFQLENBQXBCO0FBQ0EsT0FISzs7QUFJTk8sTUFBQUEsS0FBSyxDQUFDLEdBQUdQLElBQUosRUFBVTtBQUNkTSxRQUFBQSxPQUFPLENBQUNDLEtBQVIsQ0FBY1QsTUFBTSxDQUFDQyxJQUFELEVBQU9DLElBQVAsQ0FBcEI7QUFDQTs7QUFOSyxLQUFQO0FBUUE7O0FBVnlCIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuXG5pbXBvcnQgeyB0b0xvZyB9IGZyb20gXCIuL3V0aWxzXCI7XG5cbmV4cG9ydCB0eXBlIFFMb2cgPSB7XG4gICAgZXJyb3I6ICguLi5hcmdzOiBhbnkpID0+IHZvaWQsXG4gICAgZGVidWc6ICguLi5hcmdzOiBhbnkpID0+IHZvaWQsXG59XG5cbmZ1bmN0aW9uIHRvSlNPTih2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodG9Mb2codmFsdWUpKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYCR7dmFsdWV9YCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzdHIoYXJnOiBhbnkpOiBzdHJpbmcge1xuICAgIGNvbnN0IHMgPSB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyA/IGFyZyA6IHRvSlNPTihhcmcpO1xuICAgIHJldHVybiBzLnNwbGl0KCdcXG4nKS5qb2luKCdcXFxcbicpLnNwbGl0KCdcXHQnKS5qb2luKCdcXFxcdCcpO1xufVxuXG5mdW5jdGlvbiBmb3JtYXQobmFtZTogc3RyaW5nLCBhcmdzOiBzdHJpbmdbXSkge1xuICAgIHJldHVybiBgJHtEYXRlLm5vdygpfVxcdCR7bmFtZX1cXHQke2FyZ3MubWFwKHN0cikuam9pbignXFx0Jyl9YDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUUxvZ3Mge1xuXHRjcmVhdGUobmFtZTogc3RyaW5nKTogUUxvZyB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGVycm9yKC4uLmFyZ3MpIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihmb3JtYXQobmFtZSwgYXJncykpO1xuXHRcdFx0fSxcblx0XHRcdGRlYnVnKC4uLmFyZ3MpIHtcblx0XHRcdFx0Y29uc29sZS5kZWJ1Zyhmb3JtYXQobmFtZSwgYXJncykpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufVxuIl19