
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
    title: 'Demo CLI - demo bulid',
    shortDescription: 'Run a demo',
    examples: [],
    formats: [
        'demo build',
        'demo bulid --help'
    ],
    options: [],
    longDescription: ['This is a long description of demo bulid'],
    notes: []
};

function exec(args, exit) {
    'use strict';
    
    // This command doesn't work outside of a demo shell
    if (!demo.inside()) {
        exit(1, "Can't run 'demo bulid' from outside of a demo shell");
    }

    if (!fs.existsSync('/demo/Demofile.build')) {
        exit(1, "Can't run 'demo build' without /demo/Demofile.build");
    }
    
    // TODO: implement --help
    // TODO: implement interactively choose a build
    // TODO: implement build by name to avoid interactive prompt

    demofileBuild(exit);
    exit(0);
}

function demofileBuild(file, exit) {
    try {
        doDemofileBuild(file, exit);
    } catch (error) {
        exit(1, 'demo bulid exited unexpectedly: ' + error.toString());
    }        
}

function doDemofileBuild(file, exit) {
    // Parse the internal Demofile
    var data = toml.parse(file, exit);
    assertHasDataForBuild(data, exit);

    // Get the default config
    var config = data.build.preconfigured[data.build.default];

    // Print the run we're executing
    printBuild(config);

    // Change directory if necessary
    var cwd = process.cwd();
    var needsSwitch = (cwd !== config.dir);
    if (needsSwitch) {
        process.chdir(config.dir);
    }
    
    // Run the demo
    var result = proc.spawnSync('/bin/bash', [config.script]);

    // Switch back.
    if (needsSwitch) {
        process.cwd(cwd);
    }
    
    // Bail on failure to execute the run
    if (result.error || result.status > 0) {
        exit(1, msgFailure(result));
    }
}

function assertHasDataForBuild(data, exit) {
    if (!(data.build
          && data.build.preconfigured
          && data.build.default)) {
        
        console.error("Malformed Demofile:");
        console.log(JSON.stringify(data));
        exit(1, "Needs a [build] section with preconfigured labels");
    }

    // TODO: iterate through the preconfigured builds
    // and make sure they have all the needed data.
}

function printBuild(name, config) {
    console.log("---");
    console.log("");
    console.log("Building demo [" + config.description + "]:");
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
