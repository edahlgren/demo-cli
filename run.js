
const fs = require('fs');
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

    if (!fs.existsSync('/demo/Demofile.run')) {
        exit(1, "Can't run 'demo run' without /demo/Demofile.run");
    }
    
    // TODO: implement --help
    // TODO: implement interactively choose a run
    // TODO: implement run by name to avoid interactive prompt

    demofileRun('/demo/Demofile.run', exit);
    exit(0);
}

function demofileRun(file, exit) {
    try {
        doDemofileRun(file, exit);
    } catch (error) {
        exit(1, 'demo run exited unexpectedly: ' + error.toString());
    }        
}

function doDemofileRun(file, exit) {
    // Parse the internal Demofile
    var data = toml.parse(file, exit);
    assertHasDataForRun(data, exit);

    // Get the default config
    var config = data.run.preconfigured[data.run.default];

    // Read the script content
    var scriptContent = readScript(config.script, exit);
    
    // Print what we're executing
    printRun(config, scriptContent);

    // Run the demo
    var result = proc.spawnSync('/bin/bash', [config.script]);
    
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

function readScript(file, exit) {
    try {
        return fs.readFileSync(file, 'utf8');
    } catch (error) {
        exit(1, "Couldn't read script '" + file + "': " + error.toString());
    }
}

function printRun(config, script) {
    console.log("---");
    console.log("");
    console.log("Running demo [" + config.description + "]:");
    console.log("");
    console.log(script);
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
