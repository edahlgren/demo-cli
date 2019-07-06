#!/usr/bin/env node

/////////////////////////////////////////////////////////////////
// How it works
// ------------
//
// Check if in a demo:
//
//   Does /setup exist?
//   Does /setup.sh exist?
//   Does metadata file exist (e.g. Demofile)
//
// Where should the metadata file exist?
//
//   /setup/Demofile
//
// What should be in the /setup directory?
//
//   /setup/setup.sh
//   /setup/Demofile
//
//   ... everything else gets moved out of the directory
//   ... to keep it clean as a setup step.
//
// What format should the Demofile have?
//
//   TOML sounds nice. Let's try it out.
//
/////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////
// Dependencies
/////////////////////////////////////////////////////////////////

const cli = require('command-line-args');
const usage = require('command-line-usage');
const chalk = require('chalk');

/////////////////////////////////////////////////////////////////
// Design CLI args
/////////////////////////////////////////////////////////////////

const mainSpec = [
    { name: 'command', defaultOption: true }
];

// 'help'
// - e.g. demo help shell
const helpSpec = [
    { name: 'subcommand', defaultOption: true }
];

// 'shell'
// - e.g. demo shell <demo-image>
// - e.g. demo shell -i <demo-image>
// - e.g. demo shell --image <demo-image>
const shellSpec = [
    { name: 'image', alias: 'i', defaultOption: true }
];

/////////////////////////////////////////////////////////////////
// Design usage guide
/////////////////////////////////////////////////////////////////

const gray = chalk.gray;
const b = chalk.blue;
const m = chalk.magenta;
const CLI_TITLE = chalk.bold.underline('Demo CLI');
const CLI_DESC1 = 'A tool for loading, exploring, and';
const CLI_DESC2 = 'running demos from Demo Magazine';
const CLI_USAGE = 'Usage: demo <command> [options ...]';

const USAGE_HEADER = `${b(String.raw` ____`)}
${b(String.raw`|  _ \\`)}    ${CLI_TITLE}
${b(String.raw`| | | |`)}
${m(String.raw`| |_| |`)}   ${CLI_DESC1}
${m(String.raw`|____/`)}    ${CLI_DESC2}
`;

const generalUsage = [
    {
        content: USAGE_HEADER,
        raw: true
    },
    {
        header: 'Quick Start',
        content: '  Enter a shell and run a demo by name:\n\n    $ demo shell NAME\n    demo@NAME$ demo run',
        raw: true
    },
    {
        header: 'Usage and Commands',
        content: '  Learn about a command:\n\n    $ demo help <command>',
        raw: true
    },
    {
        content: 'Commands:',
    },
    {
        content: [
            { name: 'shell', summary: 'Get shell access to a demo'},
            { name: 'run', summary: 'Run a demo from inside a demo shell' },
            { name: 'rebuild', summary: 'Rebuild a demo from inside a demo shell' },
            { name: 'inspect', summary: 'Learn about a demo from inside a demo shell' },
            { name: 'help', summary: 'Learn about a command (e.g. `demo help shell`)' }
        ]
    },
    {
        header: 'Getting help',
        content: '  Show this guide:\n\n    $ demo -h\n    $ demo --help\n\n  Print debugging information:\n\n    $ demo -v\n    $ demo --verbose\n\n  Get help with a specific command:\n\n    $ demo help <command>',
        raw: true
    }
];

const shellDescription = `Loads the files needed by <demo-image> into a lightweight virtual machine and gives you a shell to access and run these files. 

Inside the shell, you will see only the files needed by the demo and these files won't conflict with the files on your computer or the files of other concurrently running demos.`;

const shellExamples = `  Get shell access to a demo:

    $ demo shell demomag/dm-ant-search
    demo@dm-ant-search$

  Exit the shell:

    demo@dm-ant-search$ exit`;

const shellOptions = `  These are all equivalent:

    $ demo shell <demo-image>
    $ demo shell -i <demo-image>
    $ demo shell --image <demo-image>`;

const SHELL_TITLE = chalk.bold.underline('Demo CLI - demo shell');
const SHELL_DESC = 'Get shell access to a demo';

const SHELL_HEADER = `${b(String.raw` ____`)}
${b(String.raw`|  _ \\`)}    ${SHELL_TITLE}
${b(String.raw`| | | |`)}
${m(String.raw`| |_| |`)}   ${SHELL_DESC}
${m(String.raw`|____/`)}
`;

const shellUsage = [
    {
        content: SHELL_HEADER,
        raw: true
    },
    {
        header: 'Examples',
        content: shellExamples,
        raw: true
    },
    {
        header: 'Description'
    },
    {
        content: 'demo shell <demo-image>'
    },
    {
        content: {
            options: {
                columns: [
                    { name: 'one', padding: { left: '    ', right: '' }, maxWidth: 80 },
                ]
            },
            data: [
                {
                    one: shellDescription
                }
            ]
        }
    },
    {
        content: ['demo shell -i <demo-image>', 'demo shell --image <demo-image>']
    },
    {
        content: {
            options: {
                columns: [
                    { name: 'one', padding: { left: '    ', right: '' }, maxWidth: 80 },
                ]
            },
            data: [
                {
                    one: 'Same as `demo shell <demo-image>`'
                }
            ]
        }
    },
    {
        header: 'Helpful notes',
        content: [
            '* `demo shell` can\'t be called from inside the shell of another demo. Exit the demo before launching another.',
            '',
            '* The shell isn\'t a strong security layer between demo files and your computer. Inspect demo files before you run them.'
        ]
    }
];

/////////////////////////////////////////////////////////////////
// Handle specific commands
/////////////////////////////////////////////////////////////////

// Handle 'demo help <command>'
function handleHelpCommand(argv) {
    'use strict';

    // Parse shell command args
    const args = cli(helpSpec, { argv });
    
    // Handle usage mistakes
    if (!args.hasOwnProperty('subcommand')) {
        // TODO: Show shell specific usage guide if no arg is given.
        return { code: 1 };
    }

    var helpPage = {};
    switch (args.subcommand) {
    case 'shell':
        helpPage = usage(shellUsage);
        break;
    default:
        return { code: 2, msg: 'demo help "' + args.subcommand + '" not implemented' };
    }

    console.log(helpPage);
    return { code: 0 };
}

// Handle 'demo shell <demo-image>'
function handleShellCommand(argv) {
    'use strict';

    // Parse shell command args
    const args = cli(shellSpec, { argv });

    // Handle usage mistakes
    if (!args.hasOwnProperty('image')) {
        // TODO: Show shell specific usage guide if no arg is given.
        return { code: 1 };
    }

    // Mock success
    console.log('shell image: ', args.image);
    return { code: 0 };
}

/////////////////////////////////////////////////////////////////
// Entry point
/////////////////////////////////////////////////////////////////

function main() {
    'use strict';

    // Create usage guide
    const usageGuide = usage(generalUsage);
    
    // Parse the script arguments
    const args = cli(mainSpec, { stopAtFirstUnknown: true });
    const argv = args._unknown || [];

    // Handle commands
    var err = {};
    switch (args.command) {
    case 'help':
        err = handleHelpCommand(argv);
        break;
    case 'shell':
        err = handleShellCommand(argv);
        break;
    default:
        err = { code: 1 };
        break;
    }

    // Handle error
    switch (err.code) {
    case 0:
        process.exit(0);
    case 1:
        console.log(usageGuide);
        process.exit(1);
    default:
        console.log('Error: ', err.msg);
        process.exit(err.code);
    }
}

// Run it!
main();
