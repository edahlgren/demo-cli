const fs = require('fs');
const path = require('path');

const help = require('../../util/help.js');


////////////////////////////////////////////////////////////////////////////////


const cli = [
    { name: 'help', alias: 'h', type: Boolean },
    { name: 'make', type: Boolean },
    { name: 'demofile' },
    { name: 'out' }
];


const default_demofile = '/demo/demo.yml';
const default_out_dir = '/demo/docs/guides';


////////////////////////////////////////////////////////////////////////////////


function parseConfig(args) {

    // Parse command args
    var make = args.hasOwnProperty('make') && args.make;
    var demofile = (args.hasOwnProperty('demofile') ? args.demofile : default_demofile);
    var outdir = (args.hasOwnProperty('out') ? args.out : default_out_dir);

    if (!fs.existsSync(demofile))
        return { ok: false, error_msg: "demofile '" + demofile + "' doesn't exist" };

    return {
        ok: true,
        make: make,
        demofile: demofile,
        commands_out: path.join(outdir, 'commands'),
        specs_out: path.join(outdir, 'specs')
    };
}


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    spec: cli,
    parse: parseConfig,
    help: help.common
};
