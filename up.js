
const fs = require('fs');
const toml = require('toml');
const proc = require('child_process');

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

    // Check for image or demo file.
    var hasImage = args.hasOwnProperty('image');
    var hasDemofile = args.hasOwnProperty('demofile');
    if (!hasImage && !hasDemofile) {
        exit(1, "Run demo up --help, need a demo image or a demo file");
    }

    // Handle easy case first: configuration is already specified.
    if (hasDemofile) {
        try {
            doDemofileUp(args, exit);
        } catch (error) {
            exit(1, 'demo up exited unexpected: ' + error.toString());
        }
    }

    exit(1, 'demo up <demo-image> not yet implemented');
}

function doDemofileUp(args, exit) {
    if (!fs.existsSync(args.demofile)) {
        exit(1, "No demo file or demo file '" + args.demofile + "' doesn't exist"); 
    }
    
    var contents = '';
    try {
        contents = fs.readFileSync(args.demofile, 'utf8');
    } catch (error) {
        exit(1, "Couldn't read demo file '" + args.demofile + "': " + error.toString());
    }
    
    var _data = {};
    try {
        _data = toml.parse(contents);
    } catch (error) {
        exit(1, "Couldn't read demo file '" + args.demofile + "': " + error.toString());
    }

    var data = {};
    try {
        data.container = _data.container;
        data.image = _data.image;
        data.up = {
            sharedDirectory: _data.up.shared_directory,
            httpPort: _data.up.http_port
        };
        if (!validData(data)) {
            throw new Error('Invalid Demofile');
        }
    } catch (error) {
        console.error("Malformed Demofile:");
        console.log(JSON.stringify(data));
        exit(1, "Run 'demo up <demo-image>' to interactively recreate it");
    }

    // Replace slashes with dots, otherwise docker gets mad.
    data.container = data.container.replace('/', '.');

    try {
        let result = dockerInspect(data.container);
        
        if (result == INSPECT_EXISTS_STOPPED) {
            exit(1, "Run 'docker rm " + data.name + "' to prevent a docker naming collision, use a different container_name in Demofile"); 
        }
    
        if (result == INSPECT_EXISTS_RUNNING) {
            exit(0, "Demo is already up, run 'demo shell' to enter it");
        }
    } catch (error) {
        console.error(error);
        exit(1, "Failed to use 'docker inspect' to run pre-checks, run with 'demo up --force' to skip pre-checks");
    }
    
    var hasSharedDirectory = data.up.sharedDirectory.length > 0;
    if (hasSharedDirectory) {
        if (!fs.existsSync(data.up.sharedDirectory)) {
            exit(1, "Shared directory '" + data.up.sharedDirectory + "' doesn't exist, create it and try again");
        }
    }
    
    var hasHttpPort = data.up.httpPort > 0;
    if (hasHttpPort) {
        let result = detectPortSync(data.up.httpPort);
        if (result.error) {
            exit(1, "Failed to confirm that port '" + data.up.httpPort + "' is free");
        }
        if (data.up.httpPort != result.port) {
            exit(1, "Port " + data.up.httpPort + " is busy, trying using " + result.port + " which is free");
        }
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
    exit(0);
}

function validData(data) {
    return data.container
        && data.image
        && data.up.sharedDirectory
        && data.up.httpPort;
}

function dockerRun(config) {    
    console.log("Executing 'docker run' with:");
    console.log(JSON.stringify(config, null, 4));
                
    // docker run
    var args = ['run'];

    // Run it in detached mode (in the background).
    args.push('-d');

    // Remove it when it's killed.
    args.push('--rm');
    
    // Pass back a name for the container
    //
    args.push('--name');
    args.push(config.name);
    
    // Working dir is /root (home dir)
    args.push('-w');
    args.push('/root');

    // Add shared directory if needed.
    if (config.hasShared) {
        args.push('-v');
        args.push(config.sharedDirectory + ":/root/shared");
    }

    // Expose port if needed.
    if (config.hasPort) {
        args.push('-p');
        args.push(config.httpPort + ":4444");
    }

    // Attach stdin and tty
    args.push('-it');

    // Add image name
    args.push(config.image);

    // Finally Run the command
    return proc.spawnSync("docker", args, { stdio: 'inherit' });
}

const INSPECT_NOEXIST  = 0;
const INSPECT_EXISTS_STOPPED  = 1;
const INSPECT_EXISTS_RUNNING = 2;

function dockerInspect(name) {
    var result = proc.spawnSync("docker", ["inspect", "-f", "'{{.State.Running}}'", name]);
    if (result.error) {
        throw new Error("failed to launch 'docker inspect'");
    }
    
    if (result.status > 0) {
        return INSPECT_NOEXIST;
    }

    // Check stdout for true or false
    var out = result.stdout.toString();
    
    var falseMatch = "'false'\n";
    if (out === falseMatch) {
        return INSPECT_EXISTS_STOPPED;
    }
    
    var trueMatch = "'true'\n";
    if (out === trueMatch) {
        return INSPECT_EXISTS_RUNNING;
    }

    throw new Error("'docker inspect' failed: " + result.stderr.toString());
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
