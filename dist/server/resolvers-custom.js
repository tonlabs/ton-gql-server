"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.attachCustomResolvers = attachCustomResolvers;

var _fs = _interopRequireDefault(require("fs"));

var _kafkajs = require("kafkajs");

var _opentracing = require("opentracing");

var _arango = _interopRequireDefault(require("./arango"));

var _arangoCollection = require("./arango-collection");

var _auth = require("./auth");

var _config = require("./config");

var _path = _interopRequireDefault(require("path"));

var _nodeFetch = _interopRequireDefault(require("node-fetch"));

var _tracer = require("./tracer");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isObject(test) {
  return typeof test === 'object' && test !== null;
}

function overrideObject(original, overrides) {
  Object.entries(overrides).forEach(([name, overrideValue]) => {
    if (name in original && isObject(overrideValue) && isObject(original[name])) {
      overrideObject(original[name], overrideValue);
    } else {
      original[name] = overrideValue;
    }
  });
}

// Query
function info() {
  const pkg = JSON.parse(_fs.default.readFileSync(_path.default.resolve(__dirname, '..', '..', 'package.json')));
  return {
    version: pkg.version
  };
}

async function getAccountsCount(_parent, args, context) {
  const tracer = context.db.tracer;
  return _tracer.QTracer.trace(tracer, 'getAccountsCount', async () => {
    await (0, _arangoCollection.requireGrantedAccess)(context, args);
    const result = await context.db.query(`RETURN LENGTH(accounts)`, {});
    const counts = result;
    return counts.length > 0 ? counts[0] : 0;
  }, _tracer.QTracer.getParentSpan(tracer, context));
}

async function getTransactionsCount(_parent, args, context) {
  const tracer = context.db.tracer;
  return _tracer.QTracer.trace(tracer, 'getTransactionsCount', async () => {
    await (0, _arangoCollection.requireGrantedAccess)(context, args);
    const result = await context.db.query(`RETURN LENGTH(transactions)`, {});
    const counts = result;
    return counts.length > 0 ? counts[0] : 0;
  }, _tracer.QTracer.getParentSpan(tracer, context));
}

async function getAccountsTotalBalance(_parent, args, context) {
  const tracer = context.db.tracer;
  return _tracer.QTracer.trace(tracer, 'getAccountsTotalBalance', async () => {
    await (0, _arangoCollection.requireGrantedAccess)(context, args);
    /*
    Because arango can not sum BigInt's we need to sum separately:
    hs = SUM of high bits (from 24-bit and higher)
    ls = SUM of lower 24 bits
    And the total result is (hs << 24) + ls
     */

    const result = await context.db.query(`
            LET d = 16777216
            FOR a in accounts
            LET b = TO_NUMBER(CONCAT("0x", SUBSTRING(a.balance, 2)))
            COLLECT AGGREGATE
                hs = SUM(FLOOR(b / d)),
                ls = SUM(b % (d - 1))
            RETURN { hs, ls }
        `, {});
    const parts = result[0]; //$FlowFixMe

    return (BigInt(parts.hs) * BigInt(0x1000000) + BigInt(parts.ls)).toString();
  }, _tracer.QTracer.getParentSpan(tracer, context));
}

async function getManagementAccessKey(_parent, args, context) {
  return context.auth.getManagementAccessKey();
} // Mutation


async function postRequestsUsingRest(requests, context) {
  const config = context.config.requests;
  const url = `${(0, _config.ensureProtocol)(config.server, 'http')}/topics/${config.topic}`;
  const response = await (0, _nodeFetch.default)(url, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
    },
    redirect: 'follow',
    referrer: 'no-referrer',
    body: JSON.stringify({
      records: requests.map(request => ({
        key: request.id,
        value: request.body
      }))
    })
  });

  if (response.status !== 200) {
    const message = `Post requests failed: ${await response.text()}`;
    throw new Error(message);
  }
}

async function postRequestsUsingKafka(requests, context, span) {
  const ensureShared = async (name, createValue) => {
    if (context.shared.has(name)) {
      return context.shared.get(name);
    }

    const value = await createValue();
    context.shared.set(name, value);
    return value;
  };

  const config = context.config.requests;
  const producer = await ensureShared('producer', async () => {
    const kafka = await ensureShared('kafka', async () => new _kafkajs.Kafka({
      clientId: 'q-server',
      brokers: [config.server]
    }));
    const newProducer = kafka.producer();
    await newProducer.connect();
    return newProducer;
  });
  const messages = requests.map(request => {
    const keyBuffer = Buffer.from(request.id, 'base64');
    const traceBuffer = Buffer.from([]);
    context.db.tracer.inject(span, _opentracing.FORMAT_BINARY, traceBuffer);
    return {
      key: Buffer.concat([keyBuffer, traceBuffer]),
      value: Buffer.from(request.body, 'base64')
    };
  });
  await producer.send({
    topic: config.topic,
    messages
  });
}

async function checkPostRestrictions(contracts, requests, accessRights) {
  if (accessRights.restrictToAccounts.length === 0) {
    return;
  }

  const accounts = new Set(accessRights.restrictToAccounts);

  for (const request of requests) {
    const message = await contracts.parseMessage({
      bocBase64: request.body
    });

    if (!accounts.has(message.dst)) {
      throw _auth.Auth.unauthorizedError();
    }
  }
}

async function postRequests(_, args, context) {
  const requests = args.requests;

  if (!requests) {
    return [];
  }

  const tracer = context.db.tracer;
  return _tracer.QTracer.trace(tracer, "postRequests", async span => {
    span.setTag('params', requests);
    const accessRights = await (0, _arangoCollection.requireGrantedAccess)(context, args);
    await checkPostRestrictions(context.client.contracts, requests, accessRights);

    try {
      if (context.config.requests.mode === 'rest') {
        await postRequestsUsingRest(requests, context);
      } else {
        await postRequestsUsingKafka(requests, context, span);
      }

      context.db.log.debug('postRequests', 'POSTED', args, context.remoteAddress);
    } catch (error) {
      context.db.log.debug('postRequests', 'FAILED', args, context.remoteAddress);
      throw error;
    }

    return requests.map(x => x.id);
  }, context.parentSpan);
}

async function registerAccessKeys(_, args, context) {
  return context.auth.registerAccessKeys(args.account || '', args.keys || [], args.signedManagementAccessKey || '');
}

async function revokeAccessKeys(_, args, context) {
  return context.auth.revokeAccessKeys(args.account || '', args.keys || [], args.signedManagementAccessKey || '');
}

const resolversCustom = {
  Query: {
    info,
    getAccountsCount,
    getTransactionsCount,
    getAccountsTotalBalance,
    getManagementAccessKey
  },
  Mutation: {
    postRequests,
    registerAccessKeys,
    revokeAccessKeys
  }
};

function attachCustomResolvers(original) {
  overrideObject(original, resolversCustom);
  return original;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtY3VzdG9tLmpzIl0sIm5hbWVzIjpbImlzT2JqZWN0IiwidGVzdCIsIm92ZXJyaWRlT2JqZWN0Iiwib3JpZ2luYWwiLCJvdmVycmlkZXMiLCJPYmplY3QiLCJlbnRyaWVzIiwiZm9yRWFjaCIsIm5hbWUiLCJvdmVycmlkZVZhbHVlIiwiaW5mbyIsInBrZyIsIkpTT04iLCJwYXJzZSIsImZzIiwicmVhZEZpbGVTeW5jIiwicGF0aCIsInJlc29sdmUiLCJfX2Rpcm5hbWUiLCJ2ZXJzaW9uIiwiZ2V0QWNjb3VudHNDb3VudCIsIl9wYXJlbnQiLCJhcmdzIiwiY29udGV4dCIsInRyYWNlciIsImRiIiwiUVRyYWNlciIsInRyYWNlIiwicmVzdWx0IiwicXVlcnkiLCJjb3VudHMiLCJsZW5ndGgiLCJnZXRQYXJlbnRTcGFuIiwiZ2V0VHJhbnNhY3Rpb25zQ291bnQiLCJnZXRBY2NvdW50c1RvdGFsQmFsYW5jZSIsInBhcnRzIiwiQmlnSW50IiwiaHMiLCJscyIsInRvU3RyaW5nIiwiZ2V0TWFuYWdlbWVudEFjY2Vzc0tleSIsImF1dGgiLCJwb3N0UmVxdWVzdHNVc2luZ1Jlc3QiLCJyZXF1ZXN0cyIsImNvbmZpZyIsInVybCIsInNlcnZlciIsInRvcGljIiwicmVzcG9uc2UiLCJtZXRob2QiLCJtb2RlIiwiY2FjaGUiLCJjcmVkZW50aWFscyIsImhlYWRlcnMiLCJyZWRpcmVjdCIsInJlZmVycmVyIiwiYm9keSIsInN0cmluZ2lmeSIsInJlY29yZHMiLCJtYXAiLCJyZXF1ZXN0Iiwia2V5IiwiaWQiLCJ2YWx1ZSIsInN0YXR1cyIsIm1lc3NhZ2UiLCJ0ZXh0IiwiRXJyb3IiLCJwb3N0UmVxdWVzdHNVc2luZ0thZmthIiwic3BhbiIsImVuc3VyZVNoYXJlZCIsImNyZWF0ZVZhbHVlIiwic2hhcmVkIiwiaGFzIiwiZ2V0Iiwic2V0IiwicHJvZHVjZXIiLCJrYWZrYSIsIkthZmthIiwiY2xpZW50SWQiLCJicm9rZXJzIiwibmV3UHJvZHVjZXIiLCJjb25uZWN0IiwibWVzc2FnZXMiLCJrZXlCdWZmZXIiLCJCdWZmZXIiLCJmcm9tIiwidHJhY2VCdWZmZXIiLCJpbmplY3QiLCJGT1JNQVRfQklOQVJZIiwiY29uY2F0Iiwic2VuZCIsImNoZWNrUG9zdFJlc3RyaWN0aW9ucyIsImNvbnRyYWN0cyIsImFjY2Vzc1JpZ2h0cyIsInJlc3RyaWN0VG9BY2NvdW50cyIsImFjY291bnRzIiwiU2V0IiwicGFyc2VNZXNzYWdlIiwiYm9jQmFzZTY0IiwiZHN0IiwiQXV0aCIsInVuYXV0aG9yaXplZEVycm9yIiwicG9zdFJlcXVlc3RzIiwiXyIsInNldFRhZyIsImNsaWVudCIsImxvZyIsImRlYnVnIiwicmVtb3RlQWRkcmVzcyIsImVycm9yIiwieCIsInBhcmVudFNwYW4iLCJyZWdpc3RlckFjY2Vzc0tleXMiLCJhY2NvdW50Iiwia2V5cyIsInNpZ25lZE1hbmFnZW1lbnRBY2Nlc3NLZXkiLCJyZXZva2VBY2Nlc3NLZXlzIiwicmVzb2x2ZXJzQ3VzdG9tIiwiUXVlcnkiLCJNdXRhdGlvbiIsImF0dGFjaEN1c3RvbVJlc29sdmVycyJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOzs7O0FBRUEsU0FBU0EsUUFBVCxDQUFrQkMsSUFBbEIsRUFBc0M7QUFDbEMsU0FBTyxPQUFPQSxJQUFQLEtBQWdCLFFBQWhCLElBQTRCQSxJQUFJLEtBQUssSUFBNUM7QUFDSDs7QUFFRCxTQUFTQyxjQUFULENBQXdCQyxRQUF4QixFQUF1Q0MsU0FBdkMsRUFBdUQ7QUFDbkRDLEVBQUFBLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlRixTQUFmLEVBQTBCRyxPQUExQixDQUFrQyxDQUFDLENBQUNDLElBQUQsRUFBT0MsYUFBUCxDQUFELEtBQTJCO0FBQ3pELFFBQUtELElBQUksSUFBSUwsUUFBVCxJQUFzQkgsUUFBUSxDQUFDUyxhQUFELENBQTlCLElBQWlEVCxRQUFRLENBQUNHLFFBQVEsQ0FBQ0ssSUFBRCxDQUFULENBQTdELEVBQStFO0FBQzNFTixNQUFBQSxjQUFjLENBQUNDLFFBQVEsQ0FBQ0ssSUFBRCxDQUFULEVBQWlCQyxhQUFqQixDQUFkO0FBQ0gsS0FGRCxNQUVPO0FBQ0hOLE1BQUFBLFFBQVEsQ0FBQ0ssSUFBRCxDQUFSLEdBQWlCQyxhQUFqQjtBQUNIO0FBQ0osR0FORDtBQU9IOztBQWVEO0FBRUEsU0FBU0MsSUFBVCxHQUFzQjtBQUNsQixRQUFNQyxHQUFHLEdBQUdDLElBQUksQ0FBQ0MsS0FBTCxDQUFZQyxZQUFHQyxZQUFILENBQWdCQyxjQUFLQyxPQUFMLENBQWFDLFNBQWIsRUFBd0IsSUFBeEIsRUFBOEIsSUFBOUIsRUFBb0MsY0FBcEMsQ0FBaEIsQ0FBWixDQUFaO0FBQ0EsU0FBTztBQUNIQyxJQUFBQSxPQUFPLEVBQUVSLEdBQUcsQ0FBQ1E7QUFEVixHQUFQO0FBR0g7O0FBRUQsZUFBZUMsZ0JBQWYsQ0FBZ0NDLE9BQWhDLEVBQXlDQyxJQUF6QyxFQUErQ0MsT0FBL0MsRUFBa0c7QUFDOUYsUUFBTUMsTUFBTSxHQUFHRCxPQUFPLENBQUNFLEVBQVIsQ0FBV0QsTUFBMUI7QUFDQSxTQUFPRSxnQkFBUUMsS0FBUixDQUFjSCxNQUFkLEVBQXNCLGtCQUF0QixFQUEwQyxZQUFZO0FBQ3pELFVBQU0sNENBQXFCRCxPQUFyQixFQUE4QkQsSUFBOUIsQ0FBTjtBQUNBLFVBQU1NLE1BQVcsR0FBRyxNQUFNTCxPQUFPLENBQUNFLEVBQVIsQ0FBV0ksS0FBWCxDQUFrQix5QkFBbEIsRUFBNEMsRUFBNUMsQ0FBMUI7QUFDQSxVQUFNQyxNQUFNLEdBQUlGLE1BQWhCO0FBQ0EsV0FBT0UsTUFBTSxDQUFDQyxNQUFQLEdBQWdCLENBQWhCLEdBQW9CRCxNQUFNLENBQUMsQ0FBRCxDQUExQixHQUFnQyxDQUF2QztBQUNILEdBTE0sRUFLSkosZ0JBQVFNLGFBQVIsQ0FBc0JSLE1BQXRCLEVBQThCRCxPQUE5QixDQUxJLENBQVA7QUFNSDs7QUFFRCxlQUFlVSxvQkFBZixDQUFvQ1osT0FBcEMsRUFBNkNDLElBQTdDLEVBQW1EQyxPQUFuRCxFQUFzRztBQUNsRyxRQUFNQyxNQUFNLEdBQUdELE9BQU8sQ0FBQ0UsRUFBUixDQUFXRCxNQUExQjtBQUNBLFNBQU9FLGdCQUFRQyxLQUFSLENBQWNILE1BQWQsRUFBc0Isc0JBQXRCLEVBQThDLFlBQVk7QUFDN0QsVUFBTSw0Q0FBcUJELE9BQXJCLEVBQThCRCxJQUE5QixDQUFOO0FBQ0EsVUFBTU0sTUFBVyxHQUFHLE1BQU1MLE9BQU8sQ0FBQ0UsRUFBUixDQUFXSSxLQUFYLENBQWtCLDZCQUFsQixFQUFnRCxFQUFoRCxDQUExQjtBQUNBLFVBQU1DLE1BQU0sR0FBSUYsTUFBaEI7QUFDQSxXQUFPRSxNQUFNLENBQUNDLE1BQVAsR0FBZ0IsQ0FBaEIsR0FBb0JELE1BQU0sQ0FBQyxDQUFELENBQTFCLEdBQWdDLENBQXZDO0FBQ0gsR0FMTSxFQUtKSixnQkFBUU0sYUFBUixDQUFzQlIsTUFBdEIsRUFBOEJELE9BQTlCLENBTEksQ0FBUDtBQU1IOztBQUVELGVBQWVXLHVCQUFmLENBQXVDYixPQUF2QyxFQUFnREMsSUFBaEQsRUFBc0RDLE9BQXRELEVBQXlHO0FBQ3JHLFFBQU1DLE1BQU0sR0FBR0QsT0FBTyxDQUFDRSxFQUFSLENBQVdELE1BQTFCO0FBQ0EsU0FBT0UsZ0JBQVFDLEtBQVIsQ0FBY0gsTUFBZCxFQUFzQix5QkFBdEIsRUFBaUQsWUFBWTtBQUNoRSxVQUFNLDRDQUFxQkQsT0FBckIsRUFBOEJELElBQTlCLENBQU47QUFDQTs7Ozs7OztBQU1BLFVBQU1NLE1BQVcsR0FBRyxNQUFNTCxPQUFPLENBQUNFLEVBQVIsQ0FBV0ksS0FBWCxDQUFrQjs7Ozs7Ozs7U0FBbEIsRUFRdkIsRUFSdUIsQ0FBMUI7QUFTQSxVQUFNTSxLQUFLLEdBQUlQLE1BQUQsQ0FBdUMsQ0FBdkMsQ0FBZCxDQWpCZ0UsQ0FrQmhFOztBQUNBLFdBQU8sQ0FBQ1EsTUFBTSxDQUFDRCxLQUFLLENBQUNFLEVBQVAsQ0FBTixHQUFtQkQsTUFBTSxDQUFDLFNBQUQsQ0FBekIsR0FBdUNBLE1BQU0sQ0FBQ0QsS0FBSyxDQUFDRyxFQUFQLENBQTlDLEVBQTBEQyxRQUExRCxFQUFQO0FBQ0gsR0FwQk0sRUFvQkpiLGdCQUFRTSxhQUFSLENBQXNCUixNQUF0QixFQUE4QkQsT0FBOUIsQ0FwQkksQ0FBUDtBQXFCSDs7QUFFRCxlQUFlaUIsc0JBQWYsQ0FBc0NuQixPQUF0QyxFQUErQ0MsSUFBL0MsRUFBcURDLE9BQXJELEVBQXdHO0FBQ3BHLFNBQU9BLE9BQU8sQ0FBQ2tCLElBQVIsQ0FBYUQsc0JBQWIsRUFBUDtBQUNILEMsQ0FFRDs7O0FBRUEsZUFBZUUscUJBQWYsQ0FBcUNDLFFBQXJDLEVBQTBEcEIsT0FBMUQsRUFBMkc7QUFDdkcsUUFBTXFCLE1BQU0sR0FBR3JCLE9BQU8sQ0FBQ3FCLE1BQVIsQ0FBZUQsUUFBOUI7QUFDQSxRQUFNRSxHQUFHLEdBQUksR0FBRSw0QkFBZUQsTUFBTSxDQUFDRSxNQUF0QixFQUE4QixNQUE5QixDQUFzQyxXQUFVRixNQUFNLENBQUNHLEtBQU0sRUFBNUU7QUFDQSxRQUFNQyxRQUFRLEdBQUcsTUFBTSx3QkFBTUgsR0FBTixFQUFXO0FBQzlCSSxJQUFBQSxNQUFNLEVBQUUsTUFEc0I7QUFFOUJDLElBQUFBLElBQUksRUFBRSxNQUZ3QjtBQUc5QkMsSUFBQUEsS0FBSyxFQUFFLFVBSHVCO0FBSTlCQyxJQUFBQSxXQUFXLEVBQUUsYUFKaUI7QUFLOUJDLElBQUFBLE9BQU8sRUFBRTtBQUNMLHNCQUFnQjtBQURYLEtBTHFCO0FBUTlCQyxJQUFBQSxRQUFRLEVBQUUsUUFSb0I7QUFTOUJDLElBQUFBLFFBQVEsRUFBRSxhQVRvQjtBQVU5QkMsSUFBQUEsSUFBSSxFQUFFNUMsSUFBSSxDQUFDNkMsU0FBTCxDQUFlO0FBQ2pCQyxNQUFBQSxPQUFPLEVBQUVmLFFBQVEsQ0FBQ2dCLEdBQVQsQ0FBY0MsT0FBRCxLQUFjO0FBQ2hDQyxRQUFBQSxHQUFHLEVBQUVELE9BQU8sQ0FBQ0UsRUFEbUI7QUFFaENDLFFBQUFBLEtBQUssRUFBRUgsT0FBTyxDQUFDSjtBQUZpQixPQUFkLENBQWI7QUFEUSxLQUFmO0FBVndCLEdBQVgsQ0FBdkI7O0FBaUJBLE1BQUlSLFFBQVEsQ0FBQ2dCLE1BQVQsS0FBb0IsR0FBeEIsRUFBNkI7QUFDekIsVUFBTUMsT0FBTyxHQUFJLHlCQUF3QixNQUFNakIsUUFBUSxDQUFDa0IsSUFBVCxFQUFnQixFQUEvRDtBQUNBLFVBQU0sSUFBSUMsS0FBSixDQUFVRixPQUFWLENBQU47QUFDSDtBQUNKOztBQUVELGVBQWVHLHNCQUFmLENBQXNDekIsUUFBdEMsRUFBMkRwQixPQUEzRCxFQUE2RjhDLElBQTdGLEVBQXdIO0FBQ3BILFFBQU1DLFlBQVksR0FBRyxPQUFPOUQsSUFBUCxFQUFhK0QsV0FBYixLQUFpRDtBQUNsRSxRQUFJaEQsT0FBTyxDQUFDaUQsTUFBUixDQUFlQyxHQUFmLENBQW1CakUsSUFBbkIsQ0FBSixFQUE4QjtBQUMxQixhQUFPZSxPQUFPLENBQUNpRCxNQUFSLENBQWVFLEdBQWYsQ0FBbUJsRSxJQUFuQixDQUFQO0FBQ0g7O0FBQ0QsVUFBTXVELEtBQUssR0FBRyxNQUFNUSxXQUFXLEVBQS9CO0FBQ0FoRCxJQUFBQSxPQUFPLENBQUNpRCxNQUFSLENBQWVHLEdBQWYsQ0FBbUJuRSxJQUFuQixFQUF5QnVELEtBQXpCO0FBQ0EsV0FBT0EsS0FBUDtBQUNILEdBUEQ7O0FBU0EsUUFBTW5CLE1BQU0sR0FBR3JCLE9BQU8sQ0FBQ3FCLE1BQVIsQ0FBZUQsUUFBOUI7QUFDQSxRQUFNaUMsUUFBa0IsR0FBRyxNQUFNTixZQUFZLENBQUMsVUFBRCxFQUFhLFlBQVk7QUFDbEUsVUFBTU8sS0FBWSxHQUFHLE1BQU1QLFlBQVksQ0FBQyxPQUFELEVBQVUsWUFBWSxJQUFJUSxjQUFKLENBQVU7QUFDbkVDLE1BQUFBLFFBQVEsRUFBRSxVQUR5RDtBQUVuRUMsTUFBQUEsT0FBTyxFQUFFLENBQUNwQyxNQUFNLENBQUNFLE1BQVI7QUFGMEQsS0FBVixDQUF0QixDQUF2QztBQUlBLFVBQU1tQyxXQUFXLEdBQUdKLEtBQUssQ0FBQ0QsUUFBTixFQUFwQjtBQUNBLFVBQU1LLFdBQVcsQ0FBQ0MsT0FBWixFQUFOO0FBQ0EsV0FBT0QsV0FBUDtBQUVILEdBVDRDLENBQTdDO0FBVUEsUUFBTUUsUUFBUSxHQUFHeEMsUUFBUSxDQUFDZ0IsR0FBVCxDQUFjQyxPQUFELElBQWE7QUFDdkMsVUFBTXdCLFNBQVMsR0FBR0MsTUFBTSxDQUFDQyxJQUFQLENBQVkxQixPQUFPLENBQUNFLEVBQXBCLEVBQXdCLFFBQXhCLENBQWxCO0FBQ0EsVUFBTXlCLFdBQVcsR0FBR0YsTUFBTSxDQUFDQyxJQUFQLENBQVksRUFBWixDQUFwQjtBQUNBL0QsSUFBQUEsT0FBTyxDQUFDRSxFQUFSLENBQVdELE1BQVgsQ0FBa0JnRSxNQUFsQixDQUF5Qm5CLElBQXpCLEVBQStCb0IsMEJBQS9CLEVBQThDRixXQUE5QztBQUNBLFdBQU87QUFDSDFCLE1BQUFBLEdBQUcsRUFBRXdCLE1BQU0sQ0FBQ0ssTUFBUCxDQUFjLENBQUNOLFNBQUQsRUFBWUcsV0FBWixDQUFkLENBREY7QUFFSHhCLE1BQUFBLEtBQUssRUFBRXNCLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZMUIsT0FBTyxDQUFDSixJQUFwQixFQUEwQixRQUExQjtBQUZKLEtBQVA7QUFJSCxHQVJnQixDQUFqQjtBQVNBLFFBQU1vQixRQUFRLENBQUNlLElBQVQsQ0FBYztBQUNoQjVDLElBQUFBLEtBQUssRUFBRUgsTUFBTSxDQUFDRyxLQURFO0FBRWhCb0MsSUFBQUE7QUFGZ0IsR0FBZCxDQUFOO0FBSUg7O0FBRUQsZUFBZVMscUJBQWYsQ0FDSUMsU0FESixFQUVJbEQsUUFGSixFQUdJbUQsWUFISixFQUlFO0FBQ0UsTUFBSUEsWUFBWSxDQUFDQyxrQkFBYixDQUFnQ2hFLE1BQWhDLEtBQTJDLENBQS9DLEVBQWtEO0FBQzlDO0FBQ0g7O0FBQ0QsUUFBTWlFLFFBQVEsR0FBRyxJQUFJQyxHQUFKLENBQVFILFlBQVksQ0FBQ0Msa0JBQXJCLENBQWpCOztBQUNBLE9BQUssTUFBTW5DLE9BQVgsSUFBK0JqQixRQUEvQixFQUF5QztBQUNyQyxVQUFNc0IsT0FBTyxHQUFHLE1BQU00QixTQUFTLENBQUNLLFlBQVYsQ0FBdUI7QUFDekNDLE1BQUFBLFNBQVMsRUFBRXZDLE9BQU8sQ0FBQ0o7QUFEc0IsS0FBdkIsQ0FBdEI7O0FBR0EsUUFBSSxDQUFDd0MsUUFBUSxDQUFDdkIsR0FBVCxDQUFhUixPQUFPLENBQUNtQyxHQUFyQixDQUFMLEVBQWdDO0FBQzVCLFlBQU1DLFdBQUtDLGlCQUFMLEVBQU47QUFDSDtBQUNKO0FBQ0o7O0FBRUQsZUFBZUMsWUFBZixDQUNJQyxDQURKLEVBRUlsRixJQUZKLEVBR0lDLE9BSEosRUFJcUI7QUFDakIsUUFBTW9CLFFBQXNCLEdBQUdyQixJQUFJLENBQUNxQixRQUFwQzs7QUFDQSxNQUFJLENBQUNBLFFBQUwsRUFBZTtBQUNYLFdBQU8sRUFBUDtBQUNIOztBQUVELFFBQU1uQixNQUFNLEdBQUdELE9BQU8sQ0FBQ0UsRUFBUixDQUFXRCxNQUExQjtBQUNBLFNBQU9FLGdCQUFRQyxLQUFSLENBQWNILE1BQWQsRUFBc0IsY0FBdEIsRUFBc0MsTUFBTzZDLElBQVAsSUFBc0I7QUFDL0RBLElBQUFBLElBQUksQ0FBQ29DLE1BQUwsQ0FBWSxRQUFaLEVBQXNCOUQsUUFBdEI7QUFDQSxVQUFNbUQsWUFBWSxHQUFHLE1BQU0sNENBQXFCdkUsT0FBckIsRUFBOEJELElBQTlCLENBQTNCO0FBQ0EsVUFBTXNFLHFCQUFxQixDQUFDckUsT0FBTyxDQUFDbUYsTUFBUixDQUFlYixTQUFoQixFQUEyQmxELFFBQTNCLEVBQXFDbUQsWUFBckMsQ0FBM0I7O0FBQ0EsUUFBSTtBQUNBLFVBQUl2RSxPQUFPLENBQUNxQixNQUFSLENBQWVELFFBQWYsQ0FBd0JPLElBQXhCLEtBQWlDLE1BQXJDLEVBQTZDO0FBQ3pDLGNBQU1SLHFCQUFxQixDQUFDQyxRQUFELEVBQVdwQixPQUFYLENBQTNCO0FBQ0gsT0FGRCxNQUVPO0FBQ0gsY0FBTTZDLHNCQUFzQixDQUFDekIsUUFBRCxFQUFXcEIsT0FBWCxFQUFvQjhDLElBQXBCLENBQTVCO0FBQ0g7O0FBQ0Q5QyxNQUFBQSxPQUFPLENBQUNFLEVBQVIsQ0FBV2tGLEdBQVgsQ0FBZUMsS0FBZixDQUFxQixjQUFyQixFQUFxQyxRQUFyQyxFQUErQ3RGLElBQS9DLEVBQXFEQyxPQUFPLENBQUNzRixhQUE3RDtBQUNILEtBUEQsQ0FPRSxPQUFPQyxLQUFQLEVBQWM7QUFDWnZGLE1BQUFBLE9BQU8sQ0FBQ0UsRUFBUixDQUFXa0YsR0FBWCxDQUFlQyxLQUFmLENBQXFCLGNBQXJCLEVBQXFDLFFBQXJDLEVBQStDdEYsSUFBL0MsRUFBcURDLE9BQU8sQ0FBQ3NGLGFBQTdEO0FBQ0EsWUFBTUMsS0FBTjtBQUNIOztBQUNELFdBQU9uRSxRQUFRLENBQUNnQixHQUFULENBQWFvRCxDQUFDLElBQUlBLENBQUMsQ0FBQ2pELEVBQXBCLENBQVA7QUFDSCxHQWhCTSxFQWdCSnZDLE9BQU8sQ0FBQ3lGLFVBaEJKLENBQVA7QUFpQkg7O0FBZUQsZUFBZUMsa0JBQWYsQ0FDSVQsQ0FESixFQUVJbEYsSUFGSixFQUdJQyxPQUhKLEVBSW1CO0FBQ2YsU0FBT0EsT0FBTyxDQUFDa0IsSUFBUixDQUFhd0Usa0JBQWIsQ0FDSDNGLElBQUksQ0FBQzRGLE9BQUwsSUFBZ0IsRUFEYixFQUVINUYsSUFBSSxDQUFDNkYsSUFBTCxJQUFhLEVBRlYsRUFHSDdGLElBQUksQ0FBQzhGLHlCQUFMLElBQWtDLEVBSC9CLENBQVA7QUFJSDs7QUFFRCxlQUFlQyxnQkFBZixDQUNJYixDQURKLEVBRUlsRixJQUZKLEVBR0lDLE9BSEosRUFJbUI7QUFDZixTQUFPQSxPQUFPLENBQUNrQixJQUFSLENBQWE0RSxnQkFBYixDQUNIL0YsSUFBSSxDQUFDNEYsT0FBTCxJQUFnQixFQURiLEVBRUg1RixJQUFJLENBQUM2RixJQUFMLElBQWEsRUFGVixFQUdIN0YsSUFBSSxDQUFDOEYseUJBQUwsSUFBa0MsRUFIL0IsQ0FBUDtBQUlIOztBQUVELE1BQU1FLGVBQWUsR0FBRztBQUNwQkMsRUFBQUEsS0FBSyxFQUFFO0FBQ0g3RyxJQUFBQSxJQURHO0FBRUhVLElBQUFBLGdCQUZHO0FBR0hhLElBQUFBLG9CQUhHO0FBSUhDLElBQUFBLHVCQUpHO0FBS0hNLElBQUFBO0FBTEcsR0FEYTtBQVFwQmdGLEVBQUFBLFFBQVEsRUFBRTtBQUNOakIsSUFBQUEsWUFETTtBQUVOVSxJQUFBQSxrQkFGTTtBQUdOSSxJQUFBQTtBQUhNO0FBUlUsQ0FBeEI7O0FBZU8sU0FBU0kscUJBQVQsQ0FBK0J0SCxRQUEvQixFQUFtRDtBQUN0REQsRUFBQUEsY0FBYyxDQUFDQyxRQUFELEVBQVdtSCxlQUFYLENBQWQ7QUFDQSxTQUFPbkgsUUFBUDtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQGZsb3dcblxuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0IHsgS2Fma2EsIFByb2R1Y2VyIH0gZnJvbSBcImthZmthanNcIjtcbmltcG9ydCB7IFNwYW4sIEZPUk1BVF9CSU5BUlkgfSBmcm9tICdvcGVudHJhY2luZyc7XG5pbXBvcnQgdHlwZSB7IFRPTkNvbnRyYWN0cyB9IGZyb20gXCJ0b24tY2xpZW50LWpzL3R5cGVzXCI7XG5pbXBvcnQgQXJhbmdvIGZyb20gXCIuL2FyYW5nb1wiO1xuaW1wb3J0IHsgcmVxdWlyZUdyYW50ZWRBY2Nlc3MgfSBmcm9tIFwiLi9hcmFuZ28tY29sbGVjdGlvblwiO1xuaW1wb3J0IHR5cGUgeyBHcmFwaFFMUmVxdWVzdENvbnRleHQgfSBmcm9tIFwiLi9hcmFuZ28tY29sbGVjdGlvblwiO1xuaW1wb3J0IHsgQXV0aCB9IGZyb20gXCIuL2F1dGhcIjtcbmltcG9ydCB7IGVuc3VyZVByb3RvY29sIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBmZXRjaCBmcm9tICdub2RlLWZldGNoJztcbmltcG9ydCB0eXBlIHsgQWNjZXNzS2V5LCBBY2Nlc3NSaWdodHMgfSBmcm9tIFwiLi9hdXRoXCI7XG5pbXBvcnQgeyBRVHJhY2VyIH0gZnJvbSBcIi4vdHJhY2VyXCI7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KHRlc3Q6IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0eXBlb2YgdGVzdCA9PT0gJ29iamVjdCcgJiYgdGVzdCAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gb3ZlcnJpZGVPYmplY3Qob3JpZ2luYWw6IGFueSwgb3ZlcnJpZGVzOiBhbnkpIHtcbiAgICBPYmplY3QuZW50cmllcyhvdmVycmlkZXMpLmZvckVhY2goKFtuYW1lLCBvdmVycmlkZVZhbHVlXSkgPT4ge1xuICAgICAgICBpZiAoKG5hbWUgaW4gb3JpZ2luYWwpICYmIGlzT2JqZWN0KG92ZXJyaWRlVmFsdWUpICYmIGlzT2JqZWN0KG9yaWdpbmFsW25hbWVdKSkge1xuICAgICAgICAgICAgb3ZlcnJpZGVPYmplY3Qob3JpZ2luYWxbbmFtZV0sIG92ZXJyaWRlVmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3JpZ2luYWxbbmFtZV0gPSBvdmVycmlkZVZhbHVlO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbnR5cGUgSW5mbyA9IHtcbiAgICB2ZXJzaW9uOiBzdHJpbmcsXG59XG5cbnR5cGUgUmVxdWVzdCA9IHtcbiAgICBpZDogc3RyaW5nLFxuICAgIGJvZHk6IHN0cmluZyxcbn1cblxuZXhwb3J0IHR5cGUgR3JhcGhRTFJlcXVlc3RDb250ZXh0RXggPSBHcmFwaFFMUmVxdWVzdENvbnRleHQgJiB7XG4gICAgZGI6IEFyYW5nbyxcbn1cblxuLy8gUXVlcnlcblxuZnVuY3Rpb24gaW5mbygpOiBJbmZvIHtcbiAgICBjb25zdCBwa2cgPSBKU09OLnBhcnNlKChmcy5yZWFkRmlsZVN5bmMocGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJy4uJywgJ3BhY2thZ2UuanNvbicpKTogYW55KSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdmVyc2lvbjogcGtnLnZlcnNpb24sXG4gICAgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0QWNjb3VudHNDb3VudChfcGFyZW50LCBhcmdzLCBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHRFeCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgY29uc3QgdHJhY2VyID0gY29udGV4dC5kYi50cmFjZXI7XG4gICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodHJhY2VyLCAnZ2V0QWNjb3VudHNDb3VudCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dCwgYXJncyk7XG4gICAgICAgIGNvbnN0IHJlc3VsdDogYW55ID0gYXdhaXQgY29udGV4dC5kYi5xdWVyeShgUkVUVVJOIExFTkdUSChhY2NvdW50cylgLCB7fSk7XG4gICAgICAgIGNvbnN0IGNvdW50cyA9IChyZXN1bHQ6IG51bWJlcltdKTtcbiAgICAgICAgcmV0dXJuIGNvdW50cy5sZW5ndGggPiAwID8gY291bnRzWzBdIDogMDtcbiAgICB9LCBRVHJhY2VyLmdldFBhcmVudFNwYW4odHJhY2VyLCBjb250ZXh0KSlcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0VHJhbnNhY3Rpb25zQ291bnQoX3BhcmVudCwgYXJncywgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0RXgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGNvbnN0IHRyYWNlciA9IGNvbnRleHQuZGIudHJhY2VyO1xuICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRyYWNlciwgJ2dldFRyYW5zYWN0aW9uc0NvdW50JywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgY29uc3QgcmVzdWx0OiBhbnkgPSBhd2FpdCBjb250ZXh0LmRiLnF1ZXJ5KGBSRVRVUk4gTEVOR1RIKHRyYW5zYWN0aW9ucylgLCB7fSk7XG4gICAgICAgIGNvbnN0IGNvdW50cyA9IChyZXN1bHQ6IG51bWJlcltdKTtcbiAgICAgICAgcmV0dXJuIGNvdW50cy5sZW5ndGggPiAwID8gY291bnRzWzBdIDogMDtcbiAgICB9LCBRVHJhY2VyLmdldFBhcmVudFNwYW4odHJhY2VyLCBjb250ZXh0KSlcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0QWNjb3VudHNUb3RhbEJhbGFuY2UoX3BhcmVudCwgYXJncywgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0RXgpOiBQcm9taXNlPFN0cmluZz4ge1xuICAgIGNvbnN0IHRyYWNlciA9IGNvbnRleHQuZGIudHJhY2VyO1xuICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRyYWNlciwgJ2dldEFjY291bnRzVG90YWxCYWxhbmNlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgLypcbiAgICAgICAgQmVjYXVzZSBhcmFuZ28gY2FuIG5vdCBzdW0gQmlnSW50J3Mgd2UgbmVlZCB0byBzdW0gc2VwYXJhdGVseTpcbiAgICAgICAgaHMgPSBTVU0gb2YgaGlnaCBiaXRzIChmcm9tIDI0LWJpdCBhbmQgaGlnaGVyKVxuICAgICAgICBscyA9IFNVTSBvZiBsb3dlciAyNCBiaXRzXG4gICAgICAgIEFuZCB0aGUgdG90YWwgcmVzdWx0IGlzIChocyA8PCAyNCkgKyBsc1xuICAgICAgICAgKi9cbiAgICAgICAgY29uc3QgcmVzdWx0OiBhbnkgPSBhd2FpdCBjb250ZXh0LmRiLnF1ZXJ5KGBcbiAgICAgICAgICAgIExFVCBkID0gMTY3NzcyMTZcbiAgICAgICAgICAgIEZPUiBhIGluIGFjY291bnRzXG4gICAgICAgICAgICBMRVQgYiA9IFRPX05VTUJFUihDT05DQVQoXCIweFwiLCBTVUJTVFJJTkcoYS5iYWxhbmNlLCAyKSkpXG4gICAgICAgICAgICBDT0xMRUNUIEFHR1JFR0FURVxuICAgICAgICAgICAgICAgIGhzID0gU1VNKEZMT09SKGIgLyBkKSksXG4gICAgICAgICAgICAgICAgbHMgPSBTVU0oYiAlIChkIC0gMSkpXG4gICAgICAgICAgICBSRVRVUk4geyBocywgbHMgfVxuICAgICAgICBgLCB7fSk7XG4gICAgICAgIGNvbnN0IHBhcnRzID0gKHJlc3VsdDogeyBoczogbnVtYmVyLCBsczogbnVtYmVyIH1bXSlbMF07XG4gICAgICAgIC8vJEZsb3dGaXhNZVxuICAgICAgICByZXR1cm4gKEJpZ0ludChwYXJ0cy5ocykgKiBCaWdJbnQoMHgxMDAwMDAwKSArIEJpZ0ludChwYXJ0cy5scykpLnRvU3RyaW5nKCk7XG4gICAgfSwgUVRyYWNlci5nZXRQYXJlbnRTcGFuKHRyYWNlciwgY29udGV4dCkpXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldE1hbmFnZW1lbnRBY2Nlc3NLZXkoX3BhcmVudCwgYXJncywgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0RXgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiBjb250ZXh0LmF1dGguZ2V0TWFuYWdlbWVudEFjY2Vzc0tleSgpO1xufVxuXG4vLyBNdXRhdGlvblxuXG5hc3luYyBmdW5jdGlvbiBwb3N0UmVxdWVzdHNVc2luZ1Jlc3QocmVxdWVzdHM6IFJlcXVlc3RbXSwgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0RXgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjb25maWcgPSBjb250ZXh0LmNvbmZpZy5yZXF1ZXN0cztcbiAgICBjb25zdCB1cmwgPSBgJHtlbnN1cmVQcm90b2NvbChjb25maWcuc2VydmVyLCAnaHR0cCcpfS90b3BpY3MvJHtjb25maWcudG9waWN9YDtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgbW9kZTogJ2NvcnMnLFxuICAgICAgICBjYWNoZTogJ25vLWNhY2hlJyxcbiAgICAgICAgY3JlZGVudGlhbHM6ICdzYW1lLW9yaWdpbicsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIH0sXG4gICAgICAgIHJlZGlyZWN0OiAnZm9sbG93JyxcbiAgICAgICAgcmVmZXJyZXI6ICduby1yZWZlcnJlcicsXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHJlY29yZHM6IHJlcXVlc3RzLm1hcCgocmVxdWVzdCkgPT4gKHtcbiAgICAgICAgICAgICAgICBrZXk6IHJlcXVlc3QuaWQsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHJlcXVlc3QuYm9keSxcbiAgICAgICAgICAgIH0pKSxcbiAgICAgICAgfSksXG4gICAgfSk7XG4gICAgaWYgKHJlc3BvbnNlLnN0YXR1cyAhPT0gMjAwKSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBgUG9zdCByZXF1ZXN0cyBmYWlsZWQ6ICR7YXdhaXQgcmVzcG9uc2UudGV4dCgpfWA7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHBvc3RSZXF1ZXN0c1VzaW5nS2Fma2EocmVxdWVzdHM6IFJlcXVlc3RbXSwgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0RXgsIHNwYW46IFNwYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBlbnN1cmVTaGFyZWQgPSBhc3luYyAobmFtZSwgY3JlYXRlVmFsdWU6ICgpID0+IFByb21pc2U8YW55PikgPT4ge1xuICAgICAgICBpZiAoY29udGV4dC5zaGFyZWQuaGFzKG5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gY29udGV4dC5zaGFyZWQuZ2V0KG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgY3JlYXRlVmFsdWUoKTtcbiAgICAgICAgY29udGV4dC5zaGFyZWQuc2V0KG5hbWUsIHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH07XG5cbiAgICBjb25zdCBjb25maWcgPSBjb250ZXh0LmNvbmZpZy5yZXF1ZXN0cztcbiAgICBjb25zdCBwcm9kdWNlcjogUHJvZHVjZXIgPSBhd2FpdCBlbnN1cmVTaGFyZWQoJ3Byb2R1Y2VyJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBrYWZrYTogS2Fma2EgPSBhd2FpdCBlbnN1cmVTaGFyZWQoJ2thZmthJywgYXN5bmMgKCkgPT4gbmV3IEthZmthKHtcbiAgICAgICAgICAgIGNsaWVudElkOiAncS1zZXJ2ZXInLFxuICAgICAgICAgICAgYnJva2VyczogW2NvbmZpZy5zZXJ2ZXJdXG4gICAgICAgIH0pKTtcbiAgICAgICAgY29uc3QgbmV3UHJvZHVjZXIgPSBrYWZrYS5wcm9kdWNlcigpO1xuICAgICAgICBhd2FpdCBuZXdQcm9kdWNlci5jb25uZWN0KCk7XG4gICAgICAgIHJldHVybiBuZXdQcm9kdWNlcjtcblxuICAgIH0pO1xuICAgIGNvbnN0IG1lc3NhZ2VzID0gcmVxdWVzdHMubWFwKChyZXF1ZXN0KSA9PiB7XG4gICAgICAgIGNvbnN0IGtleUJ1ZmZlciA9IEJ1ZmZlci5mcm9tKHJlcXVlc3QuaWQsICdiYXNlNjQnKTtcbiAgICAgICAgY29uc3QgdHJhY2VCdWZmZXIgPSBCdWZmZXIuZnJvbShbXSk7XG4gICAgICAgIGNvbnRleHQuZGIudHJhY2VyLmluamVjdChzcGFuLCBGT1JNQVRfQklOQVJZLCB0cmFjZUJ1ZmZlcik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBrZXk6IEJ1ZmZlci5jb25jYXQoW2tleUJ1ZmZlciwgdHJhY2VCdWZmZXJdKSxcbiAgICAgICAgICAgIHZhbHVlOiBCdWZmZXIuZnJvbShyZXF1ZXN0LmJvZHksICdiYXNlNjQnKSxcbiAgICAgICAgfTtcbiAgICB9KTtcbiAgICBhd2FpdCBwcm9kdWNlci5zZW5kKHtcbiAgICAgICAgdG9waWM6IGNvbmZpZy50b3BpYyxcbiAgICAgICAgbWVzc2FnZXMsXG4gICAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNoZWNrUG9zdFJlc3RyaWN0aW9ucyhcbiAgICBjb250cmFjdHM6IFRPTkNvbnRyYWN0cyxcbiAgICByZXF1ZXN0czogUmVxdWVzdFtdLFxuICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuKSB7XG4gICAgaWYgKGFjY2Vzc1JpZ2h0cy5yZXN0cmljdFRvQWNjb3VudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgYWNjb3VudHMgPSBuZXcgU2V0KGFjY2Vzc1JpZ2h0cy5yZXN0cmljdFRvQWNjb3VudHMpO1xuICAgIGZvciAoY29uc3QgcmVxdWVzdDogUmVxdWVzdCBvZiByZXF1ZXN0cykge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gYXdhaXQgY29udHJhY3RzLnBhcnNlTWVzc2FnZSh7XG4gICAgICAgICAgICBib2NCYXNlNjQ6IHJlcXVlc3QuYm9keSxcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghYWNjb3VudHMuaGFzKG1lc3NhZ2UuZHN0KSkge1xuICAgICAgICAgICAgdGhyb3cgQXV0aC51bmF1dGhvcml6ZWRFcnJvcigpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBwb3N0UmVxdWVzdHMoXG4gICAgXyxcbiAgICBhcmdzOiB7IHJlcXVlc3RzOiBSZXF1ZXN0W10sIGFjY2Vzc0tleT86IHN0cmluZyB9LFxuICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dEV4LFxuKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGNvbnN0IHJlcXVlc3RzOiA/KFJlcXVlc3RbXSkgPSBhcmdzLnJlcXVlc3RzO1xuICAgIGlmICghcmVxdWVzdHMpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IHRyYWNlciA9IGNvbnRleHQuZGIudHJhY2VyO1xuICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRyYWNlciwgXCJwb3N0UmVxdWVzdHNcIiwgYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgc3Bhbi5zZXRUYWcoJ3BhcmFtcycsIHJlcXVlc3RzKTtcbiAgICAgICAgY29uc3QgYWNjZXNzUmlnaHRzID0gYXdhaXQgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dCwgYXJncyk7XG4gICAgICAgIGF3YWl0IGNoZWNrUG9zdFJlc3RyaWN0aW9ucyhjb250ZXh0LmNsaWVudC5jb250cmFjdHMsIHJlcXVlc3RzLCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKGNvbnRleHQuY29uZmlnLnJlcXVlc3RzLm1vZGUgPT09ICdyZXN0Jykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHBvc3RSZXF1ZXN0c1VzaW5nUmVzdChyZXF1ZXN0cywgY29udGV4dCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGF3YWl0IHBvc3RSZXF1ZXN0c1VzaW5nS2Fma2EocmVxdWVzdHMsIGNvbnRleHQsIHNwYW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGV4dC5kYi5sb2cuZGVidWcoJ3Bvc3RSZXF1ZXN0cycsICdQT1NURUQnLCBhcmdzLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29udGV4dC5kYi5sb2cuZGVidWcoJ3Bvc3RSZXF1ZXN0cycsICdGQUlMRUQnLCBhcmdzLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MpO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcXVlc3RzLm1hcCh4ID0+IHguaWQpO1xuICAgIH0sIGNvbnRleHQucGFyZW50U3Bhbik7XG59XG5cbnR5cGUgTWFuYWdlbWVudEFyZ3MgPSB7XG4gICAgYWNjb3VudD86IHN0cmluZyxcbiAgICBzaWduZWRNYW5hZ2VtZW50QWNjZXNzS2V5Pzogc3RyaW5nLFxufVxuXG50eXBlIFJlZ2lzdGVyQWNjZXNzS2V5c0FyZ3MgPSBNYW5hZ2VtZW50QXJncyAmIHtcbiAgICBrZXlzOiBBY2Nlc3NLZXlbXSxcbn1cblxudHlwZSBSZXZva2VBY2Nlc3NLZXlzQXJncyA9IE1hbmFnZW1lbnRBcmdzICYge1xuICAgIGtleXM6IHN0cmluZ1tdLFxufVxuXG5hc3luYyBmdW5jdGlvbiByZWdpc3RlckFjY2Vzc0tleXMoXG4gICAgXyxcbiAgICBhcmdzOiBSZWdpc3RlckFjY2Vzc0tleXNBcmdzLFxuICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dEV4LFxuKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICByZXR1cm4gY29udGV4dC5hdXRoLnJlZ2lzdGVyQWNjZXNzS2V5cyhcbiAgICAgICAgYXJncy5hY2NvdW50IHx8ICcnLFxuICAgICAgICBhcmdzLmtleXMgfHwgW10sXG4gICAgICAgIGFyZ3Muc2lnbmVkTWFuYWdlbWVudEFjY2Vzc0tleSB8fCAnJyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJldm9rZUFjY2Vzc0tleXMoXG4gICAgXyxcbiAgICBhcmdzOiBSZXZva2VBY2Nlc3NLZXlzQXJncyxcbiAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHRFeCxcbik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIGNvbnRleHQuYXV0aC5yZXZva2VBY2Nlc3NLZXlzKFxuICAgICAgICBhcmdzLmFjY291bnQgfHwgJycsXG4gICAgICAgIGFyZ3Mua2V5cyB8fCBbXSxcbiAgICAgICAgYXJncy5zaWduZWRNYW5hZ2VtZW50QWNjZXNzS2V5IHx8ICcnKTtcbn1cblxuY29uc3QgcmVzb2x2ZXJzQ3VzdG9tID0ge1xuICAgIFF1ZXJ5OiB7XG4gICAgICAgIGluZm8sXG4gICAgICAgIGdldEFjY291bnRzQ291bnQsXG4gICAgICAgIGdldFRyYW5zYWN0aW9uc0NvdW50LFxuICAgICAgICBnZXRBY2NvdW50c1RvdGFsQmFsYW5jZSxcbiAgICAgICAgZ2V0TWFuYWdlbWVudEFjY2Vzc0tleSxcbiAgICB9LFxuICAgIE11dGF0aW9uOiB7XG4gICAgICAgIHBvc3RSZXF1ZXN0cyxcbiAgICAgICAgcmVnaXN0ZXJBY2Nlc3NLZXlzLFxuICAgICAgICByZXZva2VBY2Nlc3NLZXlzLFxuICAgIH0sXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzKG9yaWdpbmFsOiBhbnkpOiBhbnkge1xuICAgIG92ZXJyaWRlT2JqZWN0KG9yaWdpbmFsLCByZXNvbHZlcnNDdXN0b20pO1xuICAgIHJldHVybiBvcmlnaW5hbDtcbn1cbiJdfQ==