"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ensureProtocol = ensureProtocol;
exports.STATS = exports.BLOCKCHAIN_DB = exports.QRequestsMode = void 0;

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
const QRequestsMode = {
  kafka: 'kafka',
  rest: 'rest,'
};
exports.QRequestsMode = QRequestsMode;

function ensureProtocol(address, defaultProtocol) {
  return /^\w+:\/\//gi.test(address) ? address : `${defaultProtocol}://${address}`;
}

function sortedIndex(fields) {
  return fields;
}

const BLOCKCHAIN_DB = {
  name: 'blockchain',
  collections: {
    blocks: {
      name: 'blocks',
      indexes: [sortedIndex(['seq_no', 'gen_utime']), sortedIndex(['gen_utime']), sortedIndex(['workchain_id', 'shard', 'seq_no']), sortedIndex(['workchain_id', 'seq_no']), sortedIndex(['workchain_id', 'gen_utime']), sortedIndex(['master.min_shard_gen_utime'])]
    },
    accounts: {
      name: 'accounts',
      indexes: [sortedIndex(['last_trans_lt']), sortedIndex(['balance'])]
    },
    messages: {
      name: 'messages',
      indexes: [sortedIndex(['block_id']), sortedIndex(['value', 'created_at']), sortedIndex(['src', 'value', 'created_at']), sortedIndex(['dst', 'value', 'created_at']), sortedIndex(['src', 'created_at']), sortedIndex(['dst', 'created_at']), sortedIndex(['created_lt']), sortedIndex(['created_at'])]
    },
    transactions: {
      name: 'transactions',
      indexes: [sortedIndex(['block_id']), sortedIndex(['in_msg']), sortedIndex(['out_msgs[*]']), sortedIndex(['account_addr', 'now']), sortedIndex(['now']), sortedIndex(['lt']), sortedIndex(['account_addr', 'orig_status', 'end_status'])]
    },
    blocks_signatures: {
      name: 'blocks_signatures',
      indexes: []
    }
  }
};
exports.BLOCKCHAIN_DB = BLOCKCHAIN_DB;
const STATS = {
  prefix: 'qserver.',
  doc: {
    count: 'doc.count'
  },
  query: {
    count: 'query.count',
    time: 'query.time',
    active: 'query.active'
  },
  subscription: {
    active: 'subscription.active'
  },
  waitFor: {
    active: 'waitfor.active'
  }
};
exports.STATS = STATS;

for (const [n, c] of Object.entries(BLOCKCHAIN_DB.collections)) {
  c.name = n;
  c.indexes.push(['_key']);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9jb25maWcuanMiXSwibmFtZXMiOlsiUVJlcXVlc3RzTW9kZSIsImthZmthIiwicmVzdCIsImVuc3VyZVByb3RvY29sIiwiYWRkcmVzcyIsImRlZmF1bHRQcm90b2NvbCIsInRlc3QiLCJzb3J0ZWRJbmRleCIsImZpZWxkcyIsIkJMT0NLQ0hBSU5fREIiLCJuYW1lIiwiY29sbGVjdGlvbnMiLCJibG9ja3MiLCJpbmRleGVzIiwiYWNjb3VudHMiLCJtZXNzYWdlcyIsInRyYW5zYWN0aW9ucyIsImJsb2Nrc19zaWduYXR1cmVzIiwiU1RBVFMiLCJwcmVmaXgiLCJkb2MiLCJjb3VudCIsInF1ZXJ5IiwidGltZSIsImFjdGl2ZSIsInN1YnNjcmlwdGlvbiIsIndhaXRGb3IiLCJuIiwiYyIsIk9iamVjdCIsImVudHJpZXMiLCJwdXNoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBOzs7Ozs7Ozs7Ozs7Ozs7QUFrQk8sTUFBTUEsYUFBYSxHQUFHO0FBQ3pCQyxFQUFBQSxLQUFLLEVBQUUsT0FEa0I7QUFFekJDLEVBQUFBLElBQUksRUFBRTtBQUZtQixDQUF0Qjs7O0FBeUNBLFNBQVNDLGNBQVQsQ0FBd0JDLE9BQXhCLEVBQXlDQyxlQUF6QyxFQUEwRTtBQUM3RSxTQUFPLGNBQWNDLElBQWQsQ0FBbUJGLE9BQW5CLElBQThCQSxPQUE5QixHQUF5QyxHQUFFQyxlQUFnQixNQUFLRCxPQUFRLEVBQS9FO0FBQ0g7O0FBRUQsU0FBU0csV0FBVCxDQUFxQkMsTUFBckIsRUFBaUQ7QUFDN0MsU0FBT0EsTUFBUDtBQUNIOztBQWNNLE1BQU1DLGFBQXFCLEdBQUc7QUFDakNDLEVBQUFBLElBQUksRUFBRSxZQUQyQjtBQUVqQ0MsRUFBQUEsV0FBVyxFQUFFO0FBQ1RDLElBQUFBLE1BQU0sRUFBRTtBQUNKRixNQUFBQSxJQUFJLEVBQUUsUUFERjtBQUVKRyxNQUFBQSxPQUFPLEVBQUUsQ0FDTE4sV0FBVyxDQUFDLENBQUMsUUFBRCxFQUFXLFdBQVgsQ0FB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QSxDQUFDLENBQUNmLE9BQUYsQ0FBVWtCLElBQVYsQ0FBZSxDQUFDLE1BQUQsQ0FBZjtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuXG5leHBvcnQgY29uc3QgUVJlcXVlc3RzTW9kZSA9IHtcbiAgICBrYWZrYTogJ2thZmthJyxcbiAgICByZXN0OiAncmVzdCwnXG59O1xuXG5leHBvcnQgdHlwZSBRRGJDb25maWcgPSB7XG4gICAgc2VydmVyOiBzdHJpbmcsXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGF1dGg6IHN0cmluZyxcbiAgICBtYXhTb2NrZXRzOiBudW1iZXIsXG59O1xuXG5leHBvcnQgdHlwZSBRQ29uZmlnID0ge1xuICAgIHNlcnZlcjoge1xuICAgICAgICBob3N0OiBzdHJpbmcsXG4gICAgICAgIHBvcnQ6IG51bWJlcixcbiAgICB9LFxuICAgIHJlcXVlc3RzOiB7XG4gICAgICAgIG1vZGU6ICdrYWZrYScgfCAncmVzdCcsXG4gICAgICAgIHNlcnZlcjogc3RyaW5nLFxuICAgICAgICB0b3BpYzogc3RyaW5nLFxuICAgIH0sXG4gICAgZGF0YWJhc2U6IFFEYkNvbmZpZyxcbiAgICBzbG93RGF0YWJhc2U6IFFEYkNvbmZpZyxcbiAgICBsaXN0ZW5lcjoge1xuICAgICAgICByZXN0YXJ0VGltZW91dDogbnVtYmVyXG4gICAgfSxcbiAgICBhdXRob3JpemF0aW9uOiB7XG4gICAgICAgIGVuZHBvaW50OiBzdHJpbmcsXG4gICAgfSxcbiAgICBqYWVnZXI6IHtcbiAgICAgICAgZW5kcG9pbnQ6IHN0cmluZyxcbiAgICAgICAgc2VydmljZTogc3RyaW5nLFxuICAgICAgICB0YWdzOiB7IFtzdHJpbmddOiBzdHJpbmcgfVxuICAgIH0sXG4gICAgc3RhdHNkOiB7XG4gICAgICAgIHNlcnZlcjogc3RyaW5nLFxuICAgIH0sXG4gICAgbWFtQWNjZXNzS2V5czogU2V0PHN0cmluZz4sXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbnN1cmVQcm90b2NvbChhZGRyZXNzOiBzdHJpbmcsIGRlZmF1bHRQcm90b2NvbDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gL15cXHcrOlxcL1xcLy9naS50ZXN0KGFkZHJlc3MpID8gYWRkcmVzcyA6IGAke2RlZmF1bHRQcm90b2NvbH06Ly8ke2FkZHJlc3N9YDtcbn1cblxuZnVuY3Rpb24gc29ydGVkSW5kZXgoZmllbGRzOiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gZmllbGRzO1xufVxuXG5leHBvcnQgdHlwZSBDb2xsZWN0aW9uSW5mbyA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgaW5kZXhlczogc3RyaW5nW11bXSxcbn07XG5cbmV4cG9ydCB0eXBlIERiSW5mbyA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgY29sbGVjdGlvbnM6IHtcbiAgICAgICAgW3N0cmluZ106IENvbGxlY3Rpb25JbmZvLFxuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IEJMT0NLQ0hBSU5fREI6IERiSW5mbyA9IHtcbiAgICBuYW1lOiAnYmxvY2tjaGFpbicsXG4gICAgY29sbGVjdGlvbnM6IHtcbiAgICAgICAgYmxvY2tzOiB7XG4gICAgICAgICAgICBuYW1lOiAnYmxvY2tzJyxcbiAgICAgICAgICAgIGluZGV4ZXM6IFtcbiAgICAgICAgICAgICAgICBzb3J0ZWRJbmRleChbJ3NlcV9ubycsICdnZW5fdXRpbWUnXSksXG4gICAgICAgICAgICAgICAgc29ydGVkSW5kZXgoWydnZW5fdXRpbWUnXSksXG4gICAgICAgICAgICAgICAgc29ydGVkSW5kZXgoWyd3b3JrY2hhaW5faWQnLCAnc2hhcmQnLCAnc2VxX25vJ10pLFxuICAgICAgICAgICAgICAgIHNvcnRlZEluZGV4KFsnd29ya2NoYWluX2lkJywgJ3NlcV9ubyddKSxcbiAgICAgICAgICAgICAgICBzb3J0ZWRJbmRleChbJ3dvcmtjaGFpbl9pZCcsICdnZW5fdXRpbWUnXSksXG4gICAgICAgICAgICAgICAgc29ydGVkSW5kZXgoWydtYXN0ZXIubWluX3NoYXJkX2dlbl91dGltZSddKSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIGFjY291bnRzOiB7XG4gICAgICAgICAgICBuYW1lOiAnYWNjb3VudHMnLFxuICAgICAgICAgICAgaW5kZXhlczogW1xuICAgICAgICAgICAgICAgIHNvcnRlZEluZGV4KFsnbGFzdF90cmFuc19sdCddKSxcbiAgICAgICAgICAgICAgICBzb3J0ZWRJbmRleChbJ2JhbGFuY2UnXSksXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICBtZXNzYWdlczoge1xuICAgICAgICAgICAgbmFtZTogJ21lc3NhZ2VzJyxcbiAgICAgICAgICAgIGluZGV4ZXM6IFtcbiAgICAgICAgICAgICAgICBzb3J0ZWRJbmRleChbJ2Jsb2NrX2lkJ10pLFxuICAgICAgICAgICAgICAgIHNvcnRlZEluZGV4KFsndmFsdWUnLCAnY3JlYXRlZF9hdCddKSxcbiAgICAgICAgICAgICAgICBzb3J0ZWRJbmRleChbJ3NyYycsICd2YWx1ZScsICdjcmVhdGVkX2F0J10pLFxuICAgICAgICAgICAgICAgIHNvcnRlZEluZGV4KFsnZHN0JywgJ3ZhbHVlJywgJ2NyZWF0ZWRfYXQnXSksXG4gICAgICAgICAgICAgICAgc29ydGVkSW5kZXgoWydzcmMnLCAnY3JlYXRlZF9hdCddKSxcbiAgICAgICAgICAgICAgICBzb3J0ZWRJbmRleChbJ2RzdCcsICdjcmVhdGVkX2F0J10pLFxuICAgICAgICAgICAgICAgIHNvcnRlZEluZGV4KFsnY3JlYXRlZF9sdCddKSxcbiAgICAgICAgICAgICAgICBzb3J0ZWRJbmRleChbJ2NyZWF0ZWRfYXQnXSksXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB0cmFuc2FjdGlvbnM6IHtcbiAgICAgICAgICAgIG5hbWU6ICd0cmFuc2FjdGlvbnMnLFxuICAgICAgICAgICAgaW5kZXhlczogW1xuICAgICAgICAgICAgICAgIHNvcnRlZEluZGV4KFsnYmxvY2tfaWQnXSksXG4gICAgICAgICAgICAgICAgc29ydGVkSW5kZXgoWydpbl9tc2cnXSksXG4gICAgICAgICAgICAgICAgc29ydGVkSW5kZXgoWydvdXRfbXNnc1sqXSddKSxcbiAgICAgICAgICAgICAgICBzb3J0ZWRJbmRleChbJ2FjY291bnRfYWRkcicsICdub3cnXSksXG4gICAgICAgICAgICAgICAgc29ydGVkSW5kZXgoWydub3cnXSksXG4gICAgICAgICAgICAgICAgc29ydGVkSW5kZXgoWydsdCddKSxcbiAgICAgICAgICAgICAgICBzb3J0ZWRJbmRleChbJ2FjY291bnRfYWRkcicsICdvcmlnX3N0YXR1cycsICdlbmRfc3RhdHVzJ10pLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IHtcbiAgICAgICAgICAgIG5hbWU6ICdibG9ja3Nfc2lnbmF0dXJlcycsXG4gICAgICAgICAgICBpbmRleGVzOiBbXSxcbiAgICAgICAgfSxcbiAgICB9XG59O1xuXG5leHBvcnQgY29uc3QgU1RBVFMgPSB7XG4gICAgcHJlZml4OiAncXNlcnZlci4nLFxuICAgIGRvYzoge1xuICAgICAgICBjb3VudDogJ2RvYy5jb3VudCcsXG4gICAgfSxcbiAgICBxdWVyeToge1xuICAgICAgICBjb3VudDogJ3F1ZXJ5LmNvdW50JyxcbiAgICAgICAgdGltZTogJ3F1ZXJ5LnRpbWUnLFxuICAgICAgICBhY3RpdmU6ICdxdWVyeS5hY3RpdmUnLFxuICAgIH0sXG4gICAgc3Vic2NyaXB0aW9uOiB7XG4gICAgICAgIGFjdGl2ZTogJ3N1YnNjcmlwdGlvbi5hY3RpdmUnLFxuICAgIH0sXG4gICAgd2FpdEZvcjoge1xuICAgICAgICBhY3RpdmU6ICd3YWl0Zm9yLmFjdGl2ZScsXG4gICAgfSxcbn07XG5cbmZvciAoY29uc3QgW24sIGNdIG9mIChPYmplY3QuZW50cmllcyhCTE9DS0NIQUlOX0RCLmNvbGxlY3Rpb25zKTogQXJyYXk8YW55PikpIHtcbiAgICBjLm5hbWUgPSBuO1xuICAgIGMuaW5kZXhlcy5wdXNoKFsnX2tleSddKTtcbn1cbiJdfQ==