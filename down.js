const fs = require('fs');
const path = require('path');
const proc = require('child_process');

const demo = require('./demo.js');
const toml = require('./toml.js');
const docker = require('./docker.js');

const cliSpec = [
    { name: 'image', defaultOption: true },
    { name: 'demofile', alias: 'f' },
];

const usageSpec = {
    title: 'Demo CLI - demo down',
    shortDescription: 'Down a demo',
    examples: [],
    formats: [
        'demo down <demo-image>',
        'demo down -f <demo-file>'
    ],
    options: [],
    longDescription: ['This is a long description of demo down'],
    notes: []
};

function exec(args, exit) {
    'use strict';

    // This command doesn't work inside a demo shell
    if (demo.inside()) {
        exit(1, "Can't run 'demo down' from within a demo shell");
    }
    
    // Check for image or demo file.
    var hasImage = args.hasOwnProperty('image');
    var hasDemofile = args.hasOwnProperty('demofile');

    if (hasImage) {
        exit(1, 'demo down <demo-image> not yet implemented');
    }
    
    // Use the Demofile passed in
    if (hasDemofile) {
        demofileDown(args.demofile, exit);
    }
    // Look for a Demofile in the current directory
    else {
        if (!fs.existsSync('Demofile')) {
            exit(1, "Run demo up --help, need a demo image or a demo file");
        }

        // Use that one.
        var file = path.join(process.cwd(), 'Demofile');
        demofileDown(file, exit);
    }
}

function demofileDown(file, exit) {
    try {
        doDemofileDown(file, exit);
    } catch (error) {
        exit(1, "'demo down' exited unexpected: " + error.toString());
    }    
}

function doDemofileDown(file, exit) {
    var data = toml.parse(file, exit);
    assertHasDataForDown(data, exit);

    assertUp(data.docker.name, exit);
    
    var result = docker.kill({
        name: data.docker.name
    });
    
    if (result.error || result.status > 0) {
        exit(1, msgFailure(result));
    }

    console.log("Demo is down");
}

function assertHasDataForDown(data, exit) {
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
