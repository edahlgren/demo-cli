// TODO: run, debug, and test


/////////////////////////////////////////////////////////////////
// Dependencies
/////////////////////////////////////////////////////////////////

const fs = require('fs');
const path = require('path');
const cli = require('command-line-args');
const findPort = require('get-port');
const stdin = require('readline-sync');
const proc = require('child_process');

/////////////////////////////////////////////////////////////////
// CLI and usage
/////////////////////////////////////////////////////////////////

// The CLI, using a spec compatible with the command-line-args
// package.
const cliSpec = [
    { name: 'image', defaultOption: true },
    { name: 'share' },
    { name: 'no-share', type: Boolean },
    { name: 'port', type: Number },
    { name: 'no-port', type: Boolean }
];

// Usage examples.
const example1 = "$ demo shell dm/ant-colony-search";
const example3 = "$ demo shell dm/ant-colony-search --port=4000";
const example5 = "$ demo shell dm/ant-colony-search --share=/home/ants/shared";

// The help message content for 'demo help shell'
const usageSpec = {
    title: 'Demo CLI - demo shell',
    shortDescription: 'Get shell access to a demo',
    examples: [
        {
            snippet: example1,
            desc: "Get shell access to dm/ant-colony-search"
        },
        {
            snippet: example5,
            desc: "Share /home/ants/shared with the demo"
        },
        {
            snippet: example3,
            desc: "View demo files at localhost:4000"
        },
    ],
    formats: [
        'demo shell <demo-image> [options ...]',
        'demo shell --image <demo-image> [options ...]'
    ],
    options: [
        { name: '--share', summary: "Share a specific directory with the demo."},
        { name: '--no-share', summary: "Don't share any directory with the demo"},
        { name: '--port', summary: "Access demo files over http at this specific port"},
        { name: '--no-port', summary: "Don't allow access to demo files over http"}
    ],
    longDescription: [
        `Loads the files needed by <demo-image> into a lightweight virtual machine and gives you a shell to access and run these files.`,
        '',
        `Inside the shell, you will see only the files needed by the demo and these files won't conflict with the files on your computer or the files of other demos.`
    ],
    notes: [
        `Can't be called from inside the shell of another demo. Exit the demo before launching another shell.`,
        '',
        `Runs in a Linux container which is not a strong security layer. For more security, launch the demo in a virtual machine and inspect the demo contents before you run and rebuild any code`
    ]
};

/////////////////////////////////////////////////////////////////
//
// The shell command
//
/////////////////////////////////////////////////////////////////

// The entrypoint to 'demo shell ...'. Arguments are parsed
// but aren't validated yet. The command finishes executing
// any time the exit callback is called. It takes two
// arguments:
//
//   exit(code, error message)
//
// Or just one:
//
//   exit(code)
//
// Where code 0 means success and 1 means failure.
function exec(args, exit) {
    'use strict';

    // Check for required args and nonsense combinations. This
    // will call exit if the args can't be validated.
    validateArgs(args, exit);

    // Parse args into a useful configuration object
    parseArgs(args, function(config) {

        // Validate the config and ask the user to confirm their
        // choices. This will call exit if the config can't be
        // validated.
        validateConfig(config, exit);

        // Create the shared directory if needed. This will
        // call exit if the shared directory can't be created.
        if (config.createShare) {
            createSharedDirectory(config.share, exit);
        }

        // Launch the demo shell.
        var result = launchShell(config);

        // Print instructions to re-run.
        printRerun(result);
        
        // Exit with a failure message if launching the shell failed.
        if (result.error || result.status > 0) {
            exit(1, msgFailure(result));
        }

        // Success, exit cleanly.
        exit(0);
    });
}

function validateArgs(args, exit) {
    // Check for required args.
    if (!args.hasOwnProperty('image')) {
        exit(1, "needs an image as an argument");
    }
    // Check for nonsense combos.
    if (args.hasOwnProperty('share') &&
        args.hasOwnProperty('no-share') &&
        args.noShare) {
        exit(1, "cannot combine --share and --no-share");
    }
    if (args.hasOwnProperty('port') &&
        args.hasOwnProperty('no-port') &&
        args.noPort) {
        exit(1, "cannot combine --port and --no-port");
    }
}

// parseArgs: parse command args into a config object.
//
// TODO: Check if the port that was passed by --port
// is actually free as a precaution.
//
// Usage:
//
//   function cmd(args, exit) {
//       ...
//       parseArgs(args, function(config) {
//
//         // use the config to execute the command
//
//       });
//   }
//
// Config structure:
//
//  {
//    image:         // image name
//
//    noShare:       // --no-share is present / true
//    explicitShare: // --share is present
//    createShare:   // shared directory need to be created
//    share:         // full path to the shared directory
//
//    undefinedPort: // free port requested but couldn't be found
//    noPort:        // --no-port is present / true
//    explicitPort:  // --port is present
//    port:          // port to use
// }
function parseArgs(args, configFn) {
    // Get the name of the shared directory to use
    var shared = getShared(args);

    // Get or find a port to use.
    getPort(args, function(port) {

        // Parse everything into a set of configuration
        // options.
        var config = makeConfig(args, shared, port);
        return configFn(config);
    });
}

function getShared(args) {
    if (args.hasOwnProperty('no-share') &&
        args.noShare) {
        return "";
    }
    var dir = 'shared';
    if (args.hasOwnProperty('share')) {
        dir = args.share;
    }
    if (!path.isAbsolute(dir)) {
        dir = path.resolve(dir);
    }
    return dir;
}

const PORT_UNDEFINED = -1;
const PORT_NONE = 0;

function getPort(args, done) {
    if (args.hasOwnProperty('no-port') &&
        args.noPort) {
        done(PORT_NONE);
        return;
    }
    if (args.hasOwnProperty('port')) {
        done(args.port);
        return;
    }
    findPort().then(function(port) {
        try {
            done(port);
        } catch (error) {
            console.log('demo shell done error: ' + error);
        }
    }).catch(function(err) {
        done(PORT_UNDEFINED);
    });
}

function makeConfig(args, shared, port) {
    var noShare = shared === "";
    return {
        // Image
        image: args.image,
        name: args.image,

        // Shared dir
        noShare: noShare,
        explicitShare: !noShare && args.hasOwnProperty('share'),
        createShare: noShare ? false : !fs.existsSync(shared),
        share: shared,

        // Port for serving demo files
        undefinedPort: port == PORT_UNDEFINED,
        noPort: port == PORT_NONE,
        explicitPort: args.hasOwnProperty('port'),
        port: port
    };
}

function validateConfig(config, exit) {
    if (config.undefinedPort) {
        exit(1, "cannot find free port");
    }

    // Confirm the config is what the user wants.
    printChoices(config);
    if (!stdin.keyInYN("Are you sure you want these options?")) {
        // Bail out.
        console.log("\n... Not launching demo shell.");
        console.log("---");
        console.log("Run 'demo help shell' to learn more.");
        exit(0);
    }
}

const msgSharedNone = `  1. No shared directory

    * You can only edit demo files using a command line text editor like
      vi or emacs from within the demo shell.`;

function msgSharedNeedsCreate(cfg) {
    var chosenBy = cfg.explicitShare ? "you" : "us";
    
    return `  1. Shared directory (will be created): ${cfg.share}

    * This command will create this directory on your local filesystem and
      mount it into the demo as an empty directory.
    * You will need to sync files into this directory from inside the demo.
      Run 'demo help sync' to learn how.`;
}

function msgSharedExists(cfg) {
    var chosenBy = cfg.explicitShare ? "you" : "us";
    
    return `  1. Shared directory (already exists): ${cfg.share}

    * This command will simply mount this directory into the demo, exposing
      all of its files and subdirectories to the demo.
    * Be careful about what data you expose to any demo. Best practice is
      to use an empty directory or data from this demo.`;
}

const msgPortNone = `  2. No access to demo files over http

    * You can only view and edit files from within the demo's shell using 
      Linux command line programs like cat, less, emacs, and vi. This means
      that you won't be able to view any graphics, pdfs, or interative
      notebooks in the demo from your browser`;

function msgPort(cfg) {
    return `  2. Demo files will be browseable at: localhost:${cfg.port}

    * Copy any file out of the demo using wget or curl.
    * View graphics, pdfs, and interactive notebooks and any other files in
      the demo from your browser.`;
}


function printChoices(config) {
    // Print header message.
    console.log("\nYour configuration of a demo shell for '" + config.image + "':");

    // Delimiter
    console.log("");

    // Print shared directory configuration.
    if (config.noShare) {
        console.log(msgSharedNone);
    }
    else if (config.createShare) {
        console.log(msgSharedNeedsCreate(config));
    }
    else {
        console.log(msgSharedExists(config));
    }

    // Delimiter
    console.log("");

    if (config.noPort) {
        console.log(msgPortNone);
    }
    else {
        console.log(msgPort(config));
    }
    
    // Delimiter
    console.log("");
}

function createSharedDirectory(dir, exit) {
    console.log("... Creating shared directory (" + dir + ") ...");
    try {
        fs.mkdirSync(dir, { recursive: true });
    }
    catch (err) {
        console.log("   ... failed to create " +
                    dir + ": " + err.toString());
        console.log("Try another directory or use the --share option.");
        console.log("---");
        console.log("Run 'demo help shell' to learn more.");
        exit(1);
    }
}

// This command:
//
//   docker inspect -f '{{.State.Running}}' name
//
// Returns:
//   1. error if name doesn't exist
//   2. false if name does exist and container isn't running
//   3. true if name does exist and container is running
//
// So:
//
//   Case 1: Run docker run --name name
//   Case 2: Run docker run name and re-execute docker run --name name
//   Case 3: Run docker exec with name
//
// At the moment, don't check if shares or port mappings would
// conflict, but add that in later.

//
// I just learned that exiting from the run shell force quits you
// from the exec shell. So probably what we want is to run the
// demo in the background if it's not already running.

function launchShell(config) {
    var result = dockerInspect(config.name);

    if (result == INSPECT_NOEXIST) {
        return dockerRun(config);
    }

    if (result == INSPECT_EXISTS_RUNNING) {
        return dockerExec(config);
    }

    if (result == INSPECT_EXISTS_STOPPED) {
        var removed = dockerRemove(config.name);
        if (!removed) {
            return {
                status: 1,
                error: Error("failed to remove " + config.name + " from docker ps")
            };
        }
        return dockerRun(config);
    }

    if (result == INSPECT_ERROR) {
        return {
            status: 1,
            error: Error("failed to launch or kill 'docker inspect'")
        };
    }

    return {
        status: 1,
        error: Error("ran 'docker inspect -f {{.State.Running}} " + name + "', but output is not expected ('true' or 'false')")
    };
}

const INSPECT_UNDEFINED = -2;
const INSPECT_ERROR = -1;
const INSPECT_NOEXIST  = 0;
const INSPECT_EXISTS_STOPPED  = 1;
const INSPECT_EXISTS_RUNNING = 2;

function dockerInspect(name) {
    var result = proc.spawnSync("docker", ["inspect", "-f", "'{{.State.Running}}'", name]);
    if (result.error) {
        return INSPECT_ERROR;
    }
    
    if (result.status > 0) {
        return INSPECT_NOEXIST;
    }

    var falseMatch = '/false\n$/';    
    if (falseMatch.test(result.stdout)) {
        return INSPECT_EXISTS_STOPPED;
    }

    var trueMatch = '/true\n$/';
    if (trueMatch.test(result.stdout)) {
        return INSPECT_EXISTS_STOPPED;
    }
    
    return INSPECT_UNDEFINED;
}

function dockerRemove(name) {
    var result = proc.spawnSync("docker", ["rm", name]);
    if (result.error || result.status > 0) {
        return false;
    }
    return true;
}

// docker exec -w /root -it name /bin/bash
function dockerExec(config) {
    var args = ['exec'];

    // Working dir is /root (home dir)
    args.push('-w');
    args.push('/root');

    // Attach stdin and tty
    args.push('-it');

    args.push(config.name);
    args.push('/bin/bash');

    // Finally Run the command
    return proc.spawnSync("docker", args, { stdio: 'inherit' });
}

        dockerRun(config)function dockerRun(config) {
    // docker run
    var args = ['run'];

    // Pass back a name for the container
    args.push('--name');
    args.push(config.name);
    
    // Working dir is /root (home dir)
    args.push('-w');
    args.push('/root');

    // Add shared directory if needed.
    if (!config.noShare) {
        args.push('-v');
        args.push(config.share + ":/root/shared");
    }

    // Expose port if needed.
    if (!config.noPort) {
        args.push('-p');
        args.push(config.port + ":4444");
    }

    // Attach stdin and tty
    args.push('-it');

    // Add image name
    args.push(config.image);

    // Finally Run the command
    return proc.spawnSync("docker", args, { stdio: 'inherit' });
}

function printRerun(result) {
    console.log();
    console.log("To rerun manually, execute: ");
    console.log(result.args.join(' '));
    console.log();
}

function msgFailure(result) {
    if (result.error) {
        return result.error.toString();
    }
    return result.stderr.toString();
}

/////////////////////////////////////////////////////////////////
//
// Exports
//
/////////////////////////////////////////////////////////////////

module.exports = {
    spec: cliSpec,
    usage: usageSpec,
    exec: exec
};
