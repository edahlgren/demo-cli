
const proc = require('child_process');
const demo = require('./demo.js');
const toml = require('./toml.js');

// The CLI, using a spec compatible with the command-line-args
// package.
const cliSpec = [
    { name: 'help', alias: 'h', type: Boolean }
];

const usageSpec = {
    title: 'Demo CLI - demo run',
    shortDescription: 'Run a demo',
    examples: [],
    formats: [
        'demo run',
        'demo run --help'
    ],
    options: [],
    longDescription: ['This is a long description of demo run'],
    notes: []
};

function exec(args, exit) {
    'use strict';
    
    // This command doesn't work outside of a demo shell
    if (!demo.inside()) {
        exit(1, "Can't run 'demo run' from outside of a demo shell");
    }

    // TODO: implement --help
    // TODO: implement interactively choose a run
    // TODO: implement run by name to avoid interactive prompt

    demofileRun(exit);
    exit(0);
}

function demofileRun(exit) {
    try {
        doDemofileRun(exit);
    } catch (error) {
        exit(1, 'demo run exited unexpectedly: ' + error.toString());
    }        
}

function doDemofileRun(exit) {
    // Parse the internal Demofile
    var data = toml.parse('/setup/Demofile', exit);
    assertHasDataForRun(data, exit);

    // Get the default config
    var config = data.run[data.run.default];

    // Print the run we're executing
    printRun(data.run.default, config);

    // Run the demo
    var result = proc.spawnSync(config.exec, config.args);
    
    // Bail on failure to execute the run
    if (result.error || result.status > 0) {
        exit(1, msgFailure(result));
    }
}

function assertHasDataForRun(data, exit) {
    if (!(data.run
          && data.run.preconfigured
          && data.run.default)) {
        
        console.error("Malformed Demofile:");
        console.log(JSON.stringify(data));
        exit(1, "Needs a [run] section with preconfigured labels");
    }

    // TODO: iterate through the preconfigured runs
    // and make sure they have all the needed data.
}

function printRun(name, config) {
    console.log("Running: [" + name + "]:");
    console.log(config.doc);
    console.log("");
    console.log('\t' + config.exec + ' ' + config.args.join(' '));
    console.log("");
    console.log("---");
}

function msgFailure(result) {
    if (result.error) {
        return result.error.toString();
    }
    return result.stderr.toString();
}

module.exports = {
    spec: cliSpec,
    usage: usageSpec,
    exec: exec
};
