const fs = require('fs');
const path = require('path');
const proc = require('child_process');

const demo = require('./demo.js');
const toml = require('./toml.js');
const docker = require('./docker.js');
const up = require('./up.js');

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
    
    // Parse the command args
    var hasImage = args.hasOwnProperty('image');
    var hasDemofile = args.hasOwnProperty('demofile');

    var image = (hasImage ? args.image : '');
    var demofile = (hasDemofile ? args.demofile
                    : path.join(process.cwd(), 'Demofile'));
    
    if (hasImage) {
        exit(1, 'demo down <demo-image> not yet implemented');
    }
    if (!fs.existsSync(demofile)) {
        exit(1, "Need a demo file, run demo down --help to learn more");
    }

    // Actually execute the command.
    try {
        var config = downConfiguration({
            file: demofile,
            image: image
        });
        
        doDown(config);
    } catch (error) {
        exit(1, "---------\n'demo down' exited unexpectedly:\n\n" + error.toString());
    }
}

function downConfiguration(config) {
    var data = toml.parse(config.file);
    if (!data.shell) {
        throw new Error("Demofile needs a [shell] section");
    }
    if (!data.shell.container_name) {
        throw new Error("Demofile needs a 'name' field under [shell] section");
    }
    return {
        containerName: data.shell.container_name
    };    
}

function doDown(config) {
    var status = up.containerStatus(config.containerName);
    if (!up.isUp(status)) {
        throw new Error("Demo isn't up, run 'demo up' first");
    }

    docker.killContainer({
        containerName: config.containerName
    });

    console.log("");
    console.log("Demo is down. Relaunch a fresh container by running 'demo shell'");
}

module.exports = {
    spec: cliSpec,
    usage: usageSpec,
    exec: exec
};
