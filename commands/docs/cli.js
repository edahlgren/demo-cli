const help = require('../../util/help.js');


////////////////////////////////////////////////////////////////////////////////


const cli = [
    { name: 'make', type: Boolean },
    { name: 'help', alias: 'h', type: Boolean }
];


////////////////////////////////////////////////////////////////////////////////


function parseConfig(args) {

    // Parse command args
    var make = args.hasOwnProperty('make') && args.make;
    return {
        ok: true,
        make: make
    };
}


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    spec: cli,
    parse: parseConfig,
    help: help.common
};
