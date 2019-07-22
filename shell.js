const fs = require('fs');
const path = require('path');
const stdin = require('readline-sync');

const demo = require('./demo.js');
const toml = require('./toml.js');
const docker = require('./docker.js');
const pull = require('./pull.js');
const up = require('./up.js');

// The CLI, using a spec compatible with the command-line-args
// package.
const cliSpec = [
    { name: 'image', defaultOption: true },
    { name: 'demofile', alias: 'f' },
    { name: 'yes', alias: 'y', type: Boolean },
    { name: 'quiet', type: Boolean },
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

    // Parse the command args
    var hasImage = args.hasOwnProperty('image');
    var hasDemofile = args.hasOwnProperty('demofile');
    var skipConfirmation = args.hasOwnProperty('yes') && args.yes;
    var quiet = args.hasOwnProperty('quiet') && args.quiet;
    
    if (quiet) {
        skipConfirmation = true;
    }
    
    var image = (hasImage ? args.image : '');
    var demofile = (hasDemofile ? args.demofile
                    : path.join(process.cwd(), 'Demofile'));

    if (hasImage) {
        exit(1, 'demo shell <demo-image> not yet implemented');
    }
    if (!fs.existsSync(demofile)) {
        exit(1, "Need a demo file, run demo shell --help to learn more");
    }

    // Actually execute the command.
    try {
        var config = shellConfiguration({
            file: demofile,
            image: image,
        });
        config.quiet = quiet;
        config.skipConfirmation = skipConfirmation;
        
        doShell(config);
    } catch (error) {
        exit(1, "---------\n'demo shell' exited unexpectedly:\n\n" + error.toString());
    }
}

function shellConfiguration(config) {
    var data = toml.parse(config.file);
    if (!data.shell) {
        throw new Error("Demofile needs a [shell] section");
    }
    if (!data.shell.image) {
        throw new Error(1, "Demofile needs an 'image' field under [shell] section");
    }
    if (!data.shell.container_name) {
        throw new Error("Demofile needs a 'name' field under [shell] section");
    }
    if (!data.shell.shared_directory) {
        throw new Error(1, "Demofile needs a 'shared_directory' field under [shell] section");
    }
    return {
        dockerImage: data.shell.image,
        containerName: data.shell.container_name,
        sharedDir: data.shell.shared_directory
    };
}

function doShell(config) {    
    if (!config.quiet) {
        if (!config.skipConfirmation) {
            // Do a dry run
            console.log("Executing dry run ...");
            console.log("");
            printDryRun(config);
            
            if (!stdin.keyInYN("Do you want to continue?")) {
                return;
            }
            console.log("\n---------");
        }
    }

    // Ensure that the docker image is pulled
    pull.ensure({
        quiet: config.quiet,
        dockerImage: config.dockerImage
    });

    // Ensure that the demo is running in the background
    up.ensure({
        quiet: config.quiet,
        sharedDir: config.sharedDir,
        containerName: config.containerName,
        dockerImage: config.dockerImage
    });

    // Enter the shell
    enterShell({
        quiet: config.quiet,
        containerName: config.containerName
    });
}

function printDryRun(config) {
    var steps = [];
    var alreadyDone = [];
    
    var pullSteps = pull.ensure({
        dryRun: true,
        dockerImage: config.dockerImage
    });
    steps = steps.concat(pullSteps);
    if (pullSteps.length == 0) {
        alreadyDone.push("Downloaded, skipping 'docker pull'");
    }
    
    // Get the steps for ensuring the demo is up.
    var upSteps = up.ensure({
        dryRun: true,
        sharedDir: config.sharedDir,
        containerName: config.containerName,
        dockerImage: config.dockerImage
    });
    steps = steps.concat(upSteps);
    if (upSteps.length == 0) {
        alreadyDone.push("Up, skipping 'docker run'");
    }
    
    var shellSteps = enterShell({
        dryRun: true,
        containerName: config.containerName
    });
    steps = steps.concat(shellSteps);

    if (fs.existsSync(up.makeAbsolute(config.sharedDir))) {
        console.log("The directory '" + up.makeAbsolute(config.sharedDir) + "':");
        console.log("");
        console.log("  - Already exists and its contents will be visible inside the demo");
        console.log("");
    }
    
    if (alreadyDone.length > 0) {
        console.log("The demo is already:");
        console.log("");
        alreadyDone.forEach(function(status) {
            console.log("  - " + status);
        });
        console.log("");
    }
    
    console.log("This command will:");
    console.log("");

    steps.forEach(function(group) {
        for (let i = 0; i < group.length; i++) {
            let indent = "  - ";
            if (i > 0)
                indent = "    - ";
            
            console.log(indent + group[i]);
        }
    });
    console.log("");
}

function enterShell(config) {
    if (config.dryRun) {
        let commandLine = docker.execBash({
            dryRun: true,
            containerName: config.containerName
        });
        return [[
            "Run 'docker exec' to attach this terminal to the demo"
        ]];
    }

    if (!config.quiet)
        console.log("\nEntering shell ...");

    // Create some whitespace space to make shell prompt stand out
    console.log("");
    
    docker.execBash({containerName: config.containerName});
}

module.exports = {
    spec: cliSpec,
    usage: usageSpec,
    exec: exec
};
