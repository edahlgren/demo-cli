// TODO: run, debug, and test


/////////////////////////////////////////////////////////////////
// Dependencies
/////////////////////////////////////////////////////////////////

const fs = require('fs');
const cli = require('command-line-args');
const findport = require('get-port');
const stdin = require('readline-sync');
const proc = require('child_process');

/////////////////////////////////////////////////////////////////
// CLI and usage
/////////////////////////////////////////////////////////////////

// The CLI, using a spec compatible with the command-line-args
// package.
const spec = [
    { name: 'image', defaultOption: true },
    { name: 'share' },
    { name: 'port', type: Number },
    { name: 'no-port', type: Boolean },
    { name: 'no-share', type: Boolean }
];

// Usage examples.
const example1 = 
`$ demo shell dm/ant-colony-search
demo@ant-colony-search$`;

const example2 = 
`$ demo shell --image dm/ant-colony-search
demo@ant-colony-search$`;

const example3 = 
`$ demo shell dm/ant-colony-search --with-port=4000
demo@ant-colony-search$`;

const example4 = 
`$ demo shell dm/ant-colony-search --no-port
demo@ant-colony-search$`;

const example5 = 
`$ demo shell dm/ant-colony-search --with-share=/home/john/ants/shared
demo@ant-colony-search$`;

const example6 = 
`$ demo shell dm/ant-colony-search --no-share
demo@ant-colony-search$`;

// The help message content for 'demo help shell'
const usage = {
    formats: [
        'demo shell <demo-image> [OPTIONS]',
        'demo shell --image <demo-image> [OPTIONS]'
    ],
    examples: [
        {
            snippet: example1,
            desc: "Basic: get shell access to a demo"
        },
        {
            snippet: example2,
            desc: "Same as above, but more explicit"
        },
        {
            snippet: example3,
            desc: "Choose a specific port to serve demo contents"
        },
        {
            snippet: example4,
            desc: "Don't serve demo contents"
        },
        {
            snippet: example5,
            desc: "Choose a specific directory to share demo content"
        },
        {
            snippet: example6,
            desc: "Don't share demo content with the host"
        }
    ],
    desc: {
        short: "Get shell access to a demo",
        long: [
            `Loads the files needed by <demo-image> into a lightweight virtual machine and gives you a shell to access and run these files.`,
            `Inside the shell, you will see only the files needed by the demo and these files won't conflict with the files on your computer or the files of other demos.`
        ],
    },
    notes: [
        `Can't be called from inside the shell of another demo. Exit the demo before launching another shell.`,
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
function cmd(args, exit) {
    'use strict';

    // Check for required args and nonsense combinations. This
    // will call exit if the args can't be validated.
    validateArgs(args, exit);

    // Parse args into a useful configuration object:
    //
    //  {
    //    image:         // image name
    //
    //    noShare:       // --no-share is present / true
    //    explicitShare: // --share is present
    //    createShare:   // shared directory needs to be created
    //    share:         // full path to shared directory
    //
    //    undefinedPort: // free port requested but couldn't be found
    //    noPort:        // --no-port is present / true
    //    explicitPort:  // --port is present
    //    port:          // port to use
    // }
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
        console.log("... Launching demo shell ...");
        var result = launchShell(config);

        // Exit with a failure message if launching the shell failed.
        if (result.error || result.signal > 0) {
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
        var cfg = makeConfig(args, shared, port);
        return configFn(cfg);
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
    }
    if (args.hasOwnProperty('port')) {
        done(args.port);
    }
    findport().then(function(port) {
        done(port);
    }).catch(function(err) {
        done(PORT_UNDEFINED);
    });
}

function makeConfig(args, shared, port) {
    var noShare = shared === "";
    return {
        // Image
        image: args.image,

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
    printChoices(args, shared, port);
    if (!stdin.keyInYN("Are you sure you want these options?")) {
        // Bail out.
        console.log("\n... Not launching demo shell.");
        console.log("---");
        console.log("Run 'demo help shell' to learn more.");
        exit(0);
    }
}

const msgSharedNone =
`  Shared directory: none

      Meaning: 

      * You can only edit demo files using a command line text editor like
        vi or emacs from within the demo shell.`;

function msgSharedNeedsCreate(cfg) {
    var chosenBy = cfg.explicitShare ? "you" : "us";
    
    return `  Shared directory (doesn't exist, chosen by ${chosenBy}): ${cfg.shared}

      Meaning:

      * This command will create this directory on your local filesystem and
        mount it into the demo as an empty directory.
      * You will need to sync files into this directory from inside the demo.
        Run 'demo help sync' to learn how.`;
}

function msgSharedExists(cfg) {
    var chosenBy = cfg.explicitShare ? "you" : "us";
    
    return `  Shared directory (exists, chosen by ${chosenBy}): ${cfg.shared}

      Meaning:

      * This command will simply mount this directory into the demo, exposing
        all of its files and subdirectories to the demo.
      * Be careful about what data you expose to any demo. Best practice is
        to use an empty directory or data from this demo.`;
}

const msgPortNone =
`  Access demo files over http: no

      Meaning: 

      * You can only view and edit files from within the demo's shell using 
        Linux command line programs like cat, less, emacs, and vi. This means
        that you won't be able to view any graphics, pdfs, or interative
        notebooks in the demo from your browser`;

function msgPort(cfg) {
    return `  Access demo files over http: yes, at localhost:${cfg.port}

      Meaning:

      * You can easily copy any file out of the demo using wget or curl.
      * You can easily view graphics, pdfs, and interactive notebooks
        in the demo from your browser.`;
}


function printChoices(args, sharedDir, port) {
    var cfg = config(args, sharedDir, port);
    
    // Print header message.
    console.log("Demo " + cfg.image + " will be launched with:");

    // Delimiter
    console.log("\n------\n");

    // Print shared directory configuration.
    if (cfg.noShare) {
        console.log(msgSharedNone);
    }
    else if (cfg.createShare) {
        console.log(msgSharedNeedsCreate(cfg));
    }
    else {
        console.log(msgSharedExists(cfg));
    }

    // Delimiter
    console.log("\n------\n");

    if (cfg.noPort) {
        console.log(msgPortNone);
    }
    else {
        console.log(msgPort(cfg));
    }
    
    // Delimiter
    console.log("\n------\n");
    
    console.log("Are you sure you want these options?");
    console.log("Type 'y' to confirm and anything else to abort ...");
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

function launchShell(config) {
    // Should probably check if the container needs to be
    // run or whether we can just use exec. Would be nice
    // to have an option for this.
    
    // docker run
    var args = ['run'];

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
        args.push(config.port + ":9555");
    }

    // Attach stdin and tty
    args.push('-it');

    // Add image name
    args.push(config.image);

    // Finally Run the command
    return proc.spawnSync("docker", args);
}

function msgFailure(result) {
    if (result.error) {
        return result.error.toString();
    }
    return result.stderr.toString();
}
