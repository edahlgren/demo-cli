const fs = require('fs');
const path = require('path');

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

    if (hasImage) {
        exit(1, 'demo up <demo-image> not yet implemented');
    }
    
    // Use the Demofile passed in
    if (hasDemofile) {
        demofileUp(args.demofile, true /* assertNotUp */, exit);
    }
    // Look for a Demofile in the current directory
    else {
        if (!fs.existsSync('Demofile')) {
            exit(1, "Run demo up --help, need a demo image or a demo file");
        }

        // Use that one.
        var file = path.join(process.cwd(), 'Demofile');
        demofileUp(file, true /* assertNotUp */, exit);
    }

    console.log("Demo is up, now run 'demo shell' to enter it");    
}

function demofileUp(file, assertNotUp, exit) {
    try {
        doDemofileUp(file, assertNotUp, exit);
    } catch (error) {
        exit(1, 'demo up exited unexpectedly: ' + error.toString());
    }
}

function doDemofileUp(file, assertNotUp, exit) {
    var data = toml.parse(file, exit);
    assertHasDataForUp(data, exit);

    if (isUp(data.docker.name, exit)) {
        if (assertNotUp) {
            exit(0, "Demo is already up, run 'demo shell' to enter it");
        }
        return;
    }
        
    var hasSharedDirectory = data.up.shared_directory.length > 0;
    if (hasSharedDirectory) {
        assertDirectoryExists(data.up.shared_directory, exit);

        // Make it an absolute path if it's not already
        if (!path.isAbsolute(data.up.shared_directory)) {
            data.up.shared_directory =
                path.join(process.cwd(), data.up.shared_directory);
        }
    }

    var hasHttpPort = data.up.http_port > 0;
    if (hasHttpPort) {
        assertPortFree(data.up.http_port, exit);
    }    
    
    var result = docker.run({
        name: data.docker.name,
        image: data.docker.image,
        
        hasShared: hasSharedDirectory,
        sharedDirectory: data.up.shared_directory,
        
        hasPort: hasHttpPort,
        httpPort: data.up.http_port
    });
    
    if (result.error || result.status > 0) {
        exit(1, msgFailure(result));
    }
}

function assertHasDataForUp(data, exit) {
    if (!data.docker) {
        exit(1, "Malformed Demofile: needs a [docker] section");
    }
    if (!data.docker.name) {
        exit(1, "Malformed Demofile: needs a 'name' field under [docker] section");
    }
    if (!data.docker.image) {
        exit(1, "Malformed Demofile: needs an 'image' field under [docker] section");
    }

    if (!data.up) {
        exit(1, "Malformed Demofile: needs an [up] section");
    }
    if (!data.up.shared_directory) {
        exit(1, "Malformed Demofile: needs a 'shared_directory' field under [up] section");
    }
    if (!data.up.http_port) {
        exit(1, "Malformed Demofile: needs an 'http_port' field under [up] section");
    }
}

function isUp(containerName, exit) {
    try {
        let result = docker.inspect(containerName);
        if (result == docker.CONTAINER_STOPPED) {
            exit(1, "Run 'docker rm " + containerName + "' to prevent a docker naming collision, use a different container_name in Demofile"); 
        }
        return (result == docker.CONTAINER_RUNNING);
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
    exec: exec,
    withDemofile: demofileUp
};
