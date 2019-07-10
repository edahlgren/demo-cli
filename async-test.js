const forceSync = require('sync-rpc');
const detectPortSync = forceSync(require.resolve('./detectPort'));

var result = detectPortSync(4000);
console.log(JSON.stringify(result));
