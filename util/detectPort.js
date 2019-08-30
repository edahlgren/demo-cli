const detectPort = require('detect-port');

function asyncFunction() {
    return function(port) {
        return detectPort(port)
            .then(function(_port) {
                return {
                    port: _port,
                    error: null
                };
            })
            .catch(function(err) {
                return {
                    port: -1,
                    error: err
                };
            });
    };
}

module.exports = asyncFunction;
