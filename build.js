
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
        'demo bulid',
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

    // TODO: implement --help
    // TODO: implement interactively choose a build
    // TODO: implement build by name to avoid interactive prompt

    demofileBuild(exit);
    exit(0);
}

function demofileBuild(exit) {
    try {
        doDemofileBuild(exit);
    } catch (error) {
        exit(1, 'demo bulid exited unexpectedly: ' + error.toString());
    }        
}

function doDemofileBuild(exit) {
    // Parse the internal Demofile
    var data = toml.parse('/setup/Demofile', exit);
    assertHasDataForBuild(data, exit);

    // Get the default config
    var config = data.build[data.build.default];

    // Print the run we're executing
    printBuild(data.build.default, config);

    // Change directory if necessary
    var cwd = process.cwd();
    var needsSwitch = (cwd !== config.dir);
    if (needsSwitch) {
        process.chdir(config.dir);
    }
    
    // Run the demo
    var result = proc.spawnSync(config.exec);

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
    console.log("Running: [" + bare + "]:");
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
