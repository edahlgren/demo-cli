#!/usr/bin/env node

const cli = require('command-line-args');

// Commands
const help = require('./commands/help/help');
const shell = require('./commands/shell/shell');
const down = require('./commands/down/down');
const run = require('./commands/run/run');
const build = require('./commands/build/build');
const share = require('./commands/share/share');
const sync = require('./commands/sync/sync');

const cliSpec = [
    { name: 'help', alias: 'h', type: Boolean },
    { name: 'command', defaultOption: true }
];

const example1 = "$ demo shell DEMONAME";
const example2 = "demo@DEMONAME$ demo run";
const example3 = "$ demo help shell";
const example4 = "$ demo --help";

const usageSpec = {
    title: 'Demo CLI',
    shortDescription: 'Run Demo Magazine demos',
    examples: [
        {
            snippet: example1,
            desc: "Enter a shell with a demo ready to run"
        },
        {
            snippet: example2,
            desc: "Run a demo inside its shell"
        },
        {
            snippet: example3,
            desc: "Learn about the 'demo shell' command"
        },
        {
            snippet: example4,
            desc: "Show this guide",
        }
    ],
    formats: [
        'demo [options]',
        'demo [options] <command> [command options]',
    ],
    commands: [
        { name: 'shell', summary: 'Get shell access to a demo'},
        { name: 'run', summary: 'Run a demo from inside a demo shell' },
        { name: 'rebuild', summary: 'Rebuild a demo from inside a demo shell' },
        { name: 'inspect', summary: 'Learn about a demo from inside a demo shell' },
        { name: 'help', summary: 'Learn about a command (e.g. `demo help shell`)' }
    ],
    options: [
        { name: '--help', summary: 'Show this guide' }
    ],
    longDescription: [
        "Demo CLI is a tool for loading, exploring, and running demos from Demo Magazine."
    ],
    notes: []
};

function exit(code, msg) {
    if (msg && code > 0) {
        console.error(msg);
    }
    if (msg && code == 0) {
        console.log(msg);
    }
    process.exit(code);
}

function main() {
    'use strict';
    
    // Parse the script arguments
    const args = cli(cliSpec, { stopAtFirstUnknown: true });
    const argv = args._unknown || [];

    if (args.help) {
        console.log(help.makeHelp(usageSpec));
        exit(0);
    }
    
    // Handle commands
    switch (args.command) {
    case 'help':
        // Does this throw an error?
        var helpArgs = cli(help.spec, { argv });
        help.exec(helpArgs, exit);
        break;
        
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
        
    default:
        exit(1, "command '" + args.command + "' not implemented");
    }
}

main();
