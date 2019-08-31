#!/usr/bin/env node

const cli = require('command-line-args');

const shell = require('./commands/shell/shell');
const down = require('./commands/down/down');
const run = require('./commands/run/run');
const build = require('./commands/build/build');
const share = require('./commands/share/share');
const sync = require('./commands/sync/sync');
const docs = require('./commands/docs/docs');

const demofile = require('./util/demofile.js');


////////////////////////////////////////////////////////////////////////////////


const cliSpec = [
    { name: 'help', alias: 'h', type: Boolean },
    { name: 'command', defaultOption: true }
];


////////////////////////////////////////////////////////////////////////////////


function main() {
    'use strict';
    
    // Parse the script arguments
    const args = cli(cliSpec, { stopAtFirstUnknown: true });
    const argv = args._unknown || [];

    // If --help is used with a command, forward it to the command,
    // which likely has its own help docs
    if (args.command && args.help) {
        argv.push("--help");
        args.help = false;
    }

    // Handle help
    if (args.help)
        handleHelp(demofile.isInsideDemo());
    
    // Handle a command
    else
        handleCommand(args.command, argv);
}

function handleHelp(inDemo) {
    if (!inDemo) {
        console.log("not implemented");
        exit(1);
    }
    docs.asyncLess('/demo/docs/guides/help.txt');
}

function handleCommand(command, argv) {

    // TODO: handle cli errors
    
    switch (command) {        
    case 'shell':
        // Does this throw an error?
        var shellArgs = cli(shell.spec, { argv });
        shell.exec(shellArgs, exit);
        break;
        
    case 'down':
        var downArgs = cli(down.spec, { argv });
        down.exec(downArgs, exit);
        break;
        
    case 'run':
        // Does this throw an error?
        var runArgs = cli(run.spec, { argv });
        run.exec(runArgs, exit);
        break;

    case 'build':
        // Does this throw an error?
        var buildArgs = cli(build.spec, { argv });
        build.exec(buildArgs, exit);
        break;

    case 'share':
        // Does this throw an error?
        var shareArgs = cli(share.spec, { argv });
        share.exec(shareArgs, exit);
        break;

    case 'sync':
        // Does this throw an error?
        var syncArgs = cli(sync.spec, { argv });
        sync.exec(syncArgs, exit);
        break;
        
    case 'docs':
        // Does this throw an error?
        var docsArgs = cli(docs.spec, { argv });
        docs.exec(docsArgs, exit);
        break;
        
    default:
        exit(1, "command '" + args.command + "' not implemented");
    }
}

function exit(code, msg) {
    if (msg && code > 0) {
        console.error(msg);
    }
    if (msg && code == 0) {
        console.log(msg);
    }
    process.exit(code);
}

main();
