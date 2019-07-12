
const fs = require('fs');

const demo = require('./demo.js');
const toml = require('./toml.js');
const docker = require('./docker.js');

const forceSync = require('sync-rpc');
const detectPortSync = forceSync(require.resolve('./detectPort'));

const cliSpec = [
    { name: 'image', defaultOption: true },
    { name: 'demofile', alias: 'f' },
];

const usageSpec = {
    title: 'Demo CLI - demo up',
    shortDescription: 'Up a demo',
    examples: [],
    formats: [
        'demo up <demo-image>',
        'demo up -f <demo-file>'
    ],
    options: [],
    longDescription: ['This is a long description of demo up'],
    notes: []
};

function exec(args, exit) {
    'use strict';

    // This command doesn't work inside a demo shell
    if (demo.inside()) {
        exit(1, "Can't run 'demo up' from within a demo shell");
    }
    
    // Check for at least one valid configuration.
    var hasImage = args.hasOwnProperty('image');
    var hasDemofile = args.hasOwnProperty('demofile');
    if (!hasImage && !hasDemofile) {
        exit(1, "Run demo up --help, need a demo image or a demo file");
    }
    
    // Handle easy case first: configuration is already specified.
    if (hasDemofile) {
        demofileUp(args, exit);
        exit(0);
    }

    exit(1, 'demo up <demo-image> not yet implemented');
}

function demofileUp(args, exit) {
    try {
        doDemofileUp(args, exit);
    } catch (error) {
        exit(1, 'demo up exited unexpected: ' + error.toString());
    }
}

function doDemofileUp(args, exit) {
    var data = toml.parse(args.demofile, exit);
    assertHasDataForUp(data, exit);
    
    assertNotUp(data.container, exit);

    var hasSharedDirectory = data.up.sharedDirectory.length > 0;
    if (hasSharedDirectory) {
        assertDirectoryExists(data.up.sharedDirectory, exit);
    }

    var hasHttpPort = data.up.httpPort > 0;
    if (hasHttpPort) {
        assertPortFree(data.up.httpPort, exit);
    }    
    
    var result = dockerRun({
        name: data.container,
        image: data.image,
        
        hasShared: hasSharedDirectory,
        sharedDirectory: data.up.sharedDirectory,
        
        hasPort: hasHttpPort,
        httpPort: data.up.httpPort
    });
    
    if (result.error || result.status > 0) {
        exit(1, msgFailure(result));
    }
    
    console.log("Demo is up, now run 'demo shell' to enter it");
}

function assertHasDataForUp(data, exit) {
    // TODO: Check one-by-one and throw an error at each missing
    // config line.
    if (!(data.container
          && data.image
          && data.up.sharedDirectory
          && data.up.httpPort)) {

        console.error("Malformed Demofile:");
        console.log(JSON.stringify(data));
        exit(1, "Run 'demo up <demo-image>' to interactively recreate it");
    }
}

function assertNotUp(container, exit) {
    try {
        let result = docker.inspect(container);
        if (result == docker.CONTAINER_STOPPED) {
            exit(1, "Run 'docker rm " + data.name + "' to prevent a docker naming collision, use a different container_name in Demofile"); 
        }
        if (result == docker.CONTAINER_RUNNING) {
            exit(0, "Demo is already up, run 'demo shell' to enter it");
        }
    } catch (error) {
        console.error(error);
        exit(1, "Failed to use 'docker inspect' to run pre-checks, run with 'demo up --force' to skip pre-checks");
    }
}

function assertDirectoryExists(dir, exit) {
    if (!fs.existsSync(dir)) {
        exit(1, "Shared directory '" + dir + "' doesn't exist, create it and try again");
    }
}

function assertPortFree(port, exit) {
    let result = detectPortSync(port);
    if (result.error) {
        exit(1, "Failed to confirm that port '" + port + "' is free");
    }
    if (port != result.port) {
        exit(1, "Port " + port + " is busy, trying using " + result.port + " which is free");
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
