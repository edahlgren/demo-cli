const fs = require('fs');
const yaml = require('js-yaml');

const path = require('path');
const stdin = require('readline-sync');

const demo = require('./demo.js');
const docker = require('./docker.js');
const pull = require('./pull.js');
const up = require('./up.js');


////////////////////////////////////////////////////////////////////////////////


const cliSpec = [
    { name: 'image', defaultOption: true },
    { name: 'demofile', alias: 'f' },
    { name: 'yes', alias: 'y', type: Boolean },
    { name: 'quiet', alias: 'q', type: Boolean },
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


////////////////////////////////////////////////////////////////////////////////


function exec(args, exit) {
    'use strict';

    
    // This command doesn't work inside a demo shell
    if (demo.inside()) {
        exit(1, "Can't run 'demo shell' from within a demo shell");
    }

    
    // Parse the configuration from the arguments
    var config = getConfig(args, exit);
    if (!config.ok)
        exit(1, config.error_msg);

    
    // Execute 'demo shell'
    var result = execShell(config);
    if (!result.ok)
        exit(1, "---------\n" +
             "'demo shell' exited unexpectedly:\n\n" + result.error_msg);
}


////////////////////////////////////////////////////////////////////////////////


function getConfig(args) {
    
    // Parse the command args
    var hasImage = args.hasOwnProperty('image');
    var Demofile = (args.hasOwnProperty('demofile') ? args.demofile
                    : path.join(process.cwd(), 'demo.yml'));

    var quiet = args.hasOwnProperty('quiet') && args.quiet;    
    var skipConfirmation = quiet || (args.hasOwnProperty('yes') && args.yes);

    
    // Check for the things we don't implement yet
    if (hasImage) {
        return {
            ok: false,
            error_msg: 'demo shell <demo-image> not yet implemented'
        };
    }
    if (!fs.existsSync(Demofile)) {
        return {
            ok: false,
            error_msg: "Need a demo file, run demo shell --help to learn more"
        };
    }

    
    // Parse the shell configuration from the demofile
    var file_result = parseDemofile(Demofile);
    if (!file_result.ok) {
        return {
            ok: false,
            error_msg: "Failed to parse " + Demofile + ": " + file_result.msg
        };
    }

    
    // Return the config
    return {
        ok: true,
        
        image: file_result.image,
        instance: file_result.instance,
        shared_directory: file_result.shared_directory,
        
        skipConfirmation: skipConfirmation,
        quiet: quiet
    };
}

function parseDemofile(file) {
    var data = {};
    try {
        data = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        return {
            ok: false,
            msg: "failed to read " + file + " as YAML: " + e.toString()
        };
    }
    
    function withHelp(msg) {
        return msg + " Run 'demo configure shell --check to learn more";
    }
    
    function isString(value) {
        return (typeof value === 'string' || value instanceof String);
    }
    
    if (!data.image)
        return {
            ok: false,
            msg: withHelp("Your Demofile needs an 'image' field.")
        };

    if (!isString(data.image))
        return {
            ok: false,
            msg: withHelp("In your Demofile, the value of 'image' must be a string.")
        };

    if (data.instance && !isString(data.instance))
        return {
            ok: false,
            msg: withHelp("In your Demofile, the value of 'instance' must be a string.")
        };

    if (data.shared_directory && !isString(data.shared_directory))
        return {
            ok: false,
            msg: withHelp("In your Demofile, the value of 'shared_directory' must be a string and a file path.")
        };

    var instance_base = data.image.replace('.', '-');
    return {
        ok: true,
        image: data.image,
        instance: (data.instance ? instance_base + "." + data.instance
                   : instance_base),
        shared_directory: (data.shared_directory ? data.shared_directory : '')
    };
}


////////////////////////////////////////////////////////////////////////////////


function execShell(config) {
    // Do a dry run if necessary
    if (!config.skipConfirmation) {
        var stop = execDryRun(config);
        if (stop)
            return { ok: true };
    }

    // Ensure that the docker image is pulled down
    try {
        pull.ensure({
            quiet: config.quiet,
            dockerImage: config.image
        });
    } catch (e) {
        return {
            ok: false,
            error_msg: "failed to download the demo: " + e.toString()
        };
    }

    // Ensure that the demo is up and running in the background
    try {
        up.ensure({
            quiet: config.quiet,
            dockerImage: config.image,
            containerName: config.instance,
            sharedDir: config.shared_directory
        });
    } catch (e) {
        return {
            ok: false,
            error_msg: "failed to launch the demo: " + e.toString()
        };
    }

    // Enter the shell
    try {
        enterShell({
            quiet: config.quiet,
            containerName: config.instance
        });
    } catch (e) {
        return {
            ok: false,
            error_msg: "failed to attach to the demo: " + e.toString()
        };
    }

    return { ok: true };
}

function execDryRun(config) {
    console.log("Executing dry run ...");
    console.log("");
    doDryRun(config);
            
    if (!stdin.keyInYN("Do you want to continue?")) {
        return true;
    }
    
    console.log("\n---------");
    return false;
}

function doDryRun(config) {
    var steps = [];
    var alreadyDone = [];
    
    var pullSteps = pull.ensure({
        dryRun: true,
        dockerImage: config.image
    });
    steps = steps.concat(pullSteps);
    if (pullSteps.length == 0) {
        alreadyDone.push("Downloaded, skipping 'docker pull'");
    }
    
    // Get the steps for ensuring the demo is up.
    var upSteps = up.ensure({
        dryRun: true,
        dockerImage: config.image,
        containerName: config.instance,
        sharedDir: config.shared_directory
    });
    steps = steps.concat(upSteps);
    if (upSteps.length == 0) {
        alreadyDone.push("Up, skipping 'docker run'");
    }
    
    var shellSteps = enterShell({
        dryRun: true,
        containerName: config.instance
    });
    steps = steps.concat(shellSteps);

    if (fs.existsSync(up.makeAbsolute(config.shared_directory))) {
        console.log("The directory '" + up.makeAbsolute(config.shared_directory) + "':");
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


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    spec: cliSpec,
    usage: usageSpec,
    exec: exec
};
