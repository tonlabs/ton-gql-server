"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.infoResolvers = void 0;

var _utils = require("../utils");

const {
  version
} = (0, _utils.packageJson)();

async function info(_parent, _args, context) {
  const latency = await context.data.getLatency();
  return {
    version,
    time: Date.now(),
    lastBlockTime: latency.lastBlockTime,
    blocksLatency: latency.blocks.latency,
    transactionsLatency: latency.transactions.latency,
    messagesLatency: latency.messages.latency,
    latency: latency.latency,
    endpoints: context.config.endpoints
  };
}

const infoResolvers = {
  Query: {
    info
  }
};
exports.infoResolvers = infoResolvers;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZ3JhcGhxbC9pbmZvLmpzIl0sIm5hbWVzIjpbInZlcnNpb24iLCJpbmZvIiwiX3BhcmVudCIsIl9hcmdzIiwiY29udGV4dCIsImxhdGVuY3kiLCJkYXRhIiwiZ2V0TGF0ZW5jeSIsInRpbWUiLCJEYXRlIiwibm93IiwibGFzdEJsb2NrVGltZSIsImJsb2Nrc0xhdGVuY3kiLCJibG9ja3MiLCJ0cmFuc2FjdGlvbnNMYXRlbmN5IiwidHJhbnNhY3Rpb25zIiwibWVzc2FnZXNMYXRlbmN5IiwibWVzc2FnZXMiLCJlbmRwb2ludHMiLCJjb25maWciLCJpbmZvUmVzb2x2ZXJzIiwiUXVlcnkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFFQTs7QUFHQSxNQUFNO0FBQUVBLEVBQUFBO0FBQUYsSUFBYyx5QkFBcEI7O0FBYUEsZUFBZUMsSUFBZixDQUFvQkMsT0FBcEIsRUFBa0NDLEtBQWxDLEVBQThDQyxPQUE5QyxFQUErRjtBQUMzRixRQUFNQyxPQUFPLEdBQUcsTUFBTUQsT0FBTyxDQUFDRSxJQUFSLENBQWFDLFVBQWIsRUFBdEI7QUFDQSxTQUFPO0FBQ0hQLElBQUFBLE9BREc7QUFFSFEsSUFBQUEsSUFBSSxFQUFFQyxJQUFJLENBQUNDLEdBQUwsRUFGSDtBQUdIQyxJQUFBQSxhQUFhLEVBQUVOLE9BQU8sQ0FBQ00sYUFIcEI7QUFJSEMsSUFBQUEsYUFBYSxFQUFFUCxPQUFPLENBQUNRLE1BQVIsQ0FBZVIsT0FKM0I7QUFLSFMsSUFBQUEsbUJBQW1CLEVBQUVULE9BQU8sQ0FBQ1UsWUFBUixDQUFxQlYsT0FMdkM7QUFNSFcsSUFBQUEsZUFBZSxFQUFFWCxPQUFPLENBQUNZLFFBQVIsQ0FBaUJaLE9BTi9CO0FBT0hBLElBQUFBLE9BQU8sRUFBRUEsT0FBTyxDQUFDQSxPQVBkO0FBUUhhLElBQUFBLFNBQVMsRUFBRWQsT0FBTyxDQUFDZSxNQUFSLENBQWVEO0FBUnZCLEdBQVA7QUFVSDs7QUFFTSxNQUFNRSxhQUFhLEdBQUc7QUFDekJDLEVBQUFBLEtBQUssRUFBRTtBQUNIcEIsSUFBQUE7QUFERztBQURrQixDQUF0QiIsInNvdXJjZXNDb250ZW50IjpbIi8vIEBmbG93XG5cbmltcG9ydCB7IHBhY2thZ2VKc29uIH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHR5cGUgeyBHcmFwaFFMUmVxdWVzdENvbnRleHRFeCB9IGZyb20gXCIuL2NvbnRleHRcIjtcblxuY29uc3QgeyB2ZXJzaW9uIH0gPSBwYWNrYWdlSnNvbigpO1xuXG50eXBlIEluZm8gPSB7XG4gICAgdmVyc2lvbjogc3RyaW5nLFxuICAgIHRpbWU6IG51bWJlcixcbiAgICBsYXN0QmxvY2tUaW1lOiBudW1iZXIsXG4gICAgYmxvY2tzTGF0ZW5jeTogbnVtYmVyLFxuICAgIHRyYW5zYWN0aW9uc0xhdGVuY3k6IG51bWJlcixcbiAgICBtZXNzYWdlc0xhdGVuY3k6IG51bWJlcixcbiAgICBsYXRlbmN5OiBudW1iZXIsXG4gICAgZW5kcG9pbnRzOiBzdHJpbmdbXSxcbn1cblxuYXN5bmMgZnVuY3Rpb24gaW5mbyhfcGFyZW50OiBhbnksIF9hcmdzOiBhbnksIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dEV4KTogUHJvbWlzZTxJbmZvPiB7XG4gICAgY29uc3QgbGF0ZW5jeSA9IGF3YWl0IGNvbnRleHQuZGF0YS5nZXRMYXRlbmN5KCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdmVyc2lvbixcbiAgICAgICAgdGltZTogRGF0ZS5ub3coKSxcbiAgICAgICAgbGFzdEJsb2NrVGltZTogbGF0ZW5jeS5sYXN0QmxvY2tUaW1lLFxuICAgICAgICBibG9ja3NMYXRlbmN5OiBsYXRlbmN5LmJsb2Nrcy5sYXRlbmN5LFxuICAgICAgICB0cmFuc2FjdGlvbnNMYXRlbmN5OiBsYXRlbmN5LnRyYW5zYWN0aW9ucy5sYXRlbmN5LFxuICAgICAgICBtZXNzYWdlc0xhdGVuY3k6IGxhdGVuY3kubWVzc2FnZXMubGF0ZW5jeSxcbiAgICAgICAgbGF0ZW5jeTogbGF0ZW5jeS5sYXRlbmN5LFxuICAgICAgICBlbmRwb2ludHM6IGNvbnRleHQuY29uZmlnLmVuZHBvaW50cyxcbiAgICB9O1xufVxuXG5leHBvcnQgY29uc3QgaW5mb1Jlc29sdmVycyA9IHtcbiAgICBRdWVyeToge1xuICAgICAgICBpbmZvLFxuICAgIH0sXG59O1xuIl19