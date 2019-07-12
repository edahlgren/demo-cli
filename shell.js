
const demo = require('./demo.js');
const toml = require('./toml.js');
const docker = require('./docker.js');

// The CLI, using a spec compatible with the command-line-args
// package.
const cliSpec = [
    { name: 'image', defaultOption: true },
    { name: 'demofile', alias: 'f' },
];

const usageSpec = {
    title: 'Demo CLI - demo shell',
    shortDescription: 'Enter a demo shell',
    examples: [],
    formats: [
        'demo shell',
        'demo shell <demo-image>',
        'demo shell -f <demo-file>'
    ],
    options: [],
    longDescription: ['This is a long description of demo shell'],
    notes: []
};

function exec(args, exit) {
    'use strict';
    
    // This command doesn't work inside a demo shell
    if (demo.inside()) {
        exit(1, "Can't run 'demo shell' from within a demo shell");
    }
    
    // Check for image or demo file.
    var hasImage = args.hasOwnProperty('image');
    var hasDemofile = args.hasOwnProperty('demofile');
    if (!hasImage && !hasDemofile) {
        exit(1, "Run demo shell --help, need a demo image or a demo file");
    }

    // Handle easy case first: configuration is already specified.
    if (hasDemofile) {
        demofileShell(args, exit);
        exit(0);
    }

    exit(1, 'demo shell <demo-image> not yet implemented');
}

function demofileShell(args, exit) {
    try {
        doDemofileShell(args, exit);
    } catch (error) {
        exit(1, 'demo up exited unexpectedly: ' + error.toString());
    }
}

function doDemofileShell(args, exit) {
    // Parse Demofile
    var data = toml.parse(args.demofile, exit);
    assertHasDataForShell(data, exit);

    // Assert that the container is actually running
    assertUp(data.container, exit);

    // Exec /bin/bash into the container
    var result = docker.execBash({
        name: data.container
    });

    // Bail on failure to execute the docker command
    if (result.error || result.status > 0) {
        exit(1, msgFailure(result));
    }
}

function assertHasDataForShell(data, exit) {
    // TODO: Check one-by-one and throw an error at each missing
    // config line.
    if (!data.container) {
        console.error("Malformed Demofile:");
        console.log(JSON.stringify(data));
        exit(1, "Run 'demo shell <demo-image>' to interactively recreate it");
    }
}

function assertUp(container, exit) {
    try {
        if (docker.inspect(container) != docker.CONTAINER_RUNNING) {
            exit(0, "Demo isn't up, run 'demo up' first");
        }
    } catch (error) {
        console.error(error);
        exit(1, "Failed to use 'docker inspect' to run pre-checks, run with 'demo up --force' to skip pre-checks");
    }
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
