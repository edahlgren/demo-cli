const fs = require('fs');
const path = require('path');

const demo = require('./demo.js');
const toml = require('./toml.js');
const docker = require('./docker.js');
const up = require('./up.js');

// The CLI, using a spec compatible with the command-line-args
// package.
const cliSpec = [
    { name: 'image', defaultOption: true },
    { name: 'demofile', alias: 'f' },
    { name: 'up', type: Boolean },
];

const usageSpec = {
    title: 'Demo CLI - demo shell',
    shortDescription: 'Enter a demo shell',
    examples: [],
    formats: [
        'demo shell',
        'demo shell --up',
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
    var needsUp = args.hasOwnProperty('up') && args.up;
    
    if (hasImage) {
        exit(1, 'demo shell <demo-image> not yet implemented');
    }

    // Use the Demofile passed in
    if (hasDemofile) {
        if (needsUp) {
            up.withDemofile(args.demofile, false /* assertNotUp */, exit);
        }
        demofileShell(args.demofile, exit);
    }
    // Look for a Demofile in the current directory
    else {
        if (!fs.existsSync('Demofile')) {
            exit(1, "Run demo up --help, need a demo image or a demo file");
        }

        // Use that one.
        var file = path.join(process.cwd(), 'Demofile');
        if (needsUp) {
            up.withDemofile(file, false /* assertNotUp */, exit);
        }
        demofileShell(file, exit);
    }
}

function demofileShell(file, exit) {
    try {
        doDemofileShell(file, exit);
    } catch (error) {
        exit(1, 'demo up exited unexpectedly: ' + error.toString());
    }
}

function doDemofileShell(file, exit) {
    // Parse Demofile
    var data = toml.parse(file, exit);
    assertHasDataForShell(data, exit);

    // Assert that the container is actually running
    assertUp(data.docker.name, exit);

    // Exec /bin/bash into the container
    var result = docker.execBash({
        name: data.docker.name
    });

    // Bail on failure to execute the docker command
    if (result.error || result.status > 0) {
        exit(1, msgFailure(result));
    }
}

function assertHasDataForShell(data, exit) {
    if (!data.docker) {
        exit(1, "Malformed Demofile: needs a [docker] section");
    }
    if (!data.docker.name) {
        exit(1, "Malformed Demofile: needs a 'name' field under [docker] section");
    }
}

function assertUp(containerName, exit) {
    try {
        let result = docker.inspect(containerName);
        if (result != docker.CONTAINER_RUNNING) {
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
