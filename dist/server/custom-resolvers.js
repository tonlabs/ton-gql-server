"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.attachCustomResolvers = attachCustomResolvers;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var customResolvers = {
  MessageHeaderIntMsgInfo: ['src', 'dst'],
  MessageHeaderExtInMsgInfo: ['src', 'dst'],
  MessageHeaderExtOutMsgInfo: ['src', 'dst'],
  Account: ['addr'],
  AccountStorage: ['state'],
  BlockExtra: ['out_msg_descr'],
  TransactionDescriptionOrdinary: ['bounce']
};

function attachCustomResolvers(resolvers) {
  var attached = Object.assign({}, resolvers);
  Object.entries(customResolvers).forEach(function (_ref) {
    var _ref2 = (0, _slicedToArray2["default"])(_ref, 2),
        name = _ref2[0],
        fields = _ref2[1];

    var resolver = attached[name];

    if (!resolver) {
      resolver = {};
      attached[name] = resolver;
    }

    fields.forEach(function (field) {
      resolver[field] = function (parent) {
        var value = parent[field];
        return typeof value === 'string' ? (0, _defineProperty2["default"])({}, value, {}) : value;
      };
    });
  });
  return attached;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9jdXN0b20tcmVzb2x2ZXJzLmpzIl0sIm5hbWVzIjpbImN1c3RvbVJlc29sdmVycyIsIk1lc3NhZ2VIZWFkZXJJbnRNc2dJbmZvIiwiTWVzc2FnZUhlYWRlckV4dEluTXNnSW5mbyIsIk1lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvIiwiQWNjb3VudCIsIkFjY291bnRTdG9yYWdlIiwiQmxvY2tFeHRyYSIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25PcmRpbmFyeSIsImF0dGFjaEN1c3RvbVJlc29sdmVycyIsInJlc29sdmVycyIsImF0dGFjaGVkIiwiT2JqZWN0IiwiYXNzaWduIiwiZW50cmllcyIsImZvckVhY2giLCJuYW1lIiwiZmllbGRzIiwicmVzb2x2ZXIiLCJmaWVsZCIsInBhcmVudCIsInZhbHVlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBQUEsSUFBTUEsZUFBZSxHQUFHO0FBQ3BCQyxFQUFBQSx1QkFBdUIsRUFBRSxDQUFDLEtBQUQsRUFBUSxLQUFSLENBREw7QUFFcEJDLEVBQUFBLHlCQUF5QixFQUFFLENBQUMsS0FBRCxFQUFPLEtBQVAsQ0FGUDtBQUdwQkMsRUFBQUEsMEJBQTBCLEVBQUUsQ0FBQyxLQUFELEVBQVEsS0FBUixDQUhSO0FBSXBCQyxFQUFBQSxPQUFPLEVBQUUsQ0FBQyxNQUFELENBSlc7QUFLcEJDLEVBQUFBLGNBQWMsRUFBRSxDQUFDLE9BQUQsQ0FMSTtBQU1wQkMsRUFBQUEsVUFBVSxFQUFFLENBQUMsZUFBRCxDQU5RO0FBT3BCQyxFQUFBQSw4QkFBOEIsRUFBRSxDQUFDLFFBQUQ7QUFQWixDQUF4Qjs7QUFXQSxTQUFTQyxxQkFBVCxDQUErQkMsU0FBL0IsRUFBMEM7QUFDdEMsTUFBTUMsUUFBUSxHQUFHQyxNQUFNLENBQUNDLE1BQVAsQ0FBYyxFQUFkLEVBQWtCSCxTQUFsQixDQUFqQjtBQUNBRSxFQUFBQSxNQUFNLENBQUNFLE9BQVAsQ0FBZWIsZUFBZixFQUFnQ2MsT0FBaEMsQ0FBd0MsZ0JBQW9CO0FBQUE7QUFBQSxRQUFsQkMsSUFBa0I7QUFBQSxRQUFaQyxNQUFZOztBQUN4RCxRQUFJQyxRQUFRLEdBQUdQLFFBQVEsQ0FBQ0ssSUFBRCxDQUF2Qjs7QUFDQSxRQUFJLENBQUNFLFFBQUwsRUFBZTtBQUNYQSxNQUFBQSxRQUFRLEdBQUcsRUFBWDtBQUNBUCxNQUFBQSxRQUFRLENBQUNLLElBQUQsQ0FBUixHQUFpQkUsUUFBakI7QUFDSDs7QUFDREQsSUFBQUEsTUFBTSxDQUFDRixPQUFQLENBQWUsVUFBQ0ksS0FBRCxFQUFXO0FBQ3RCRCxNQUFBQSxRQUFRLENBQUNDLEtBQUQsQ0FBUixHQUFrQixVQUFDQyxNQUFELEVBQVk7QUFDMUIsWUFBTUMsS0FBSyxHQUFHRCxNQUFNLENBQUNELEtBQUQsQ0FBcEI7QUFDQSxlQUFPLE9BQU9FLEtBQVAsS0FBaUIsUUFBakIsd0NBQStCQSxLQUEvQixFQUF1QyxFQUF2QyxJQUE4Q0EsS0FBckQ7QUFDSCxPQUhEO0FBSUgsS0FMRDtBQU1ILEdBWkQ7QUFhQSxTQUFPVixRQUFQO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBjdXN0b21SZXNvbHZlcnMgPSB7XHJcbiAgICBNZXNzYWdlSGVhZGVySW50TXNnSW5mbzogWydzcmMnLCAnZHN0J10sXHJcbiAgICBNZXNzYWdlSGVhZGVyRXh0SW5Nc2dJbmZvOiBbJ3NyYycsJ2RzdCddLFxyXG4gICAgTWVzc2FnZUhlYWRlckV4dE91dE1zZ0luZm86IFsnc3JjJywgJ2RzdCddLFxyXG4gICAgQWNjb3VudDogWydhZGRyJ10sXHJcbiAgICBBY2NvdW50U3RvcmFnZTogWydzdGF0ZSddLFxyXG4gICAgQmxvY2tFeHRyYTogWydvdXRfbXNnX2Rlc2NyJ10sXHJcbiAgICBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uT3JkaW5hcnk6IFsnYm91bmNlJ11cclxufTtcclxuXHJcblxyXG5mdW5jdGlvbiBhdHRhY2hDdXN0b21SZXNvbHZlcnMocmVzb2x2ZXJzKSB7XHJcbiAgICBjb25zdCBhdHRhY2hlZCA9IE9iamVjdC5hc3NpZ24oe30sIHJlc29sdmVycyk7XHJcbiAgICBPYmplY3QuZW50cmllcyhjdXN0b21SZXNvbHZlcnMpLmZvckVhY2goKFtuYW1lLCBmaWVsZHNdKSA9PiB7XHJcbiAgICAgICAgbGV0IHJlc29sdmVyID0gYXR0YWNoZWRbbmFtZV07XHJcbiAgICAgICAgaWYgKCFyZXNvbHZlcikge1xyXG4gICAgICAgICAgICByZXNvbHZlciA9IHt9O1xyXG4gICAgICAgICAgICBhdHRhY2hlZFtuYW1lXSA9IHJlc29sdmVyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcclxuICAgICAgICAgICAgcmVzb2x2ZXJbZmllbGRdID0gKHBhcmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBwYXJlbnRbZmllbGRdO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyB7IFt2YWx1ZV06IHt9IH0gOiB2YWx1ZTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIGF0dGFjaGVkO1xyXG59XHJcblxyXG5leHBvcnQge1xyXG4gICAgYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzXHJcbn1cclxuIl19