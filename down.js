
const proc = require('child_process');
const fs = require('fs');
const toml = require('toml');

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

    // Check for image or demo file.
    var hasImage = args.hasOwnProperty('image');
    var hasDemofile = args.hasOwnProperty('demofile');
    if (!hasImage && !hasDemofile) {
        exit(1, "Run demo down --help, need a demo image or a demo file");
    }

    // Handle easy case first: configuration is already specified.
    if (hasDemofile) {
        try {
            doDemofileDown(args, exit);
        } catch (error) {
            exit(1, "'demo down' exited unexpected: " + error.toString());
        }
    }

    exit(1, "'demo down <demo-image>' not yet implemented");
}

function doDemofileDown(args, exit) {
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
    } catch (error) {
        console.error("Malformed Demofile:");
        console.log(JSON.stringify(data));
        exit(1, "Run 'demo up <demo-image>' to interactively recreate it");
    }

    // Replace slashes with dots, otherwise docker gets mad.
    data.demo = data.container.replace('/', '.');

    try {
        let result = dockerInspect(data.demo);
        if (result != INSPECT_EXISTS_RUNNING) {
            exit(0, "Demo isn't up, so cannot bring it down");
        }
    } catch (error) {
        console.error(error);
        exit(1, "Failed to use 'docker inspect' to run pre-checks, run with 'demo up --force' to skip pre-checks");
    }

    var result = dockerKill(data.demo);
    if (result.error || result.status > 0) {
        exit(1, msgFailure(result));
    }
    
    console.log("Demo is down");
    exit(0);
}

function dockerKill(name) {
    return proc.spawnSync("docker", ["kill", name]);
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
