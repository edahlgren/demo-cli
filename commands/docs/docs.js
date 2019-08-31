const fs = require('fs');
const proc = require('child_process');

const demofile = require('../../util/demofile.js');
const cli = require('./cli.js');
const makeDocs = require('./make.js');


////////////////////////////////////////////////////////////////////////////////


function exec(args, exit) {
    'use strict';

    
    // This command doesn't work inside a demo shell
    if (false && !demofile.isInsideDemo()) {
        exit(1, "Can't run 'demo docs' from outside of a demo shell");
    }

    
    // Parse the configuration from the command-line arguments
    //
    //   make:              Whether to re-make the docs 
    //
    var config = cli.parse(args, exit);
    if (!config.ok)
        exit(1, config.error_msg);


    // Make the docs
    if (config.make) {
        var result = makeDocs({
            demofile: './example/shared/demo.yml',
            template_dir: './commands/docs/templates',
            out_text_dir: './example/docs/text',
            out_html_dir: './example/docs/html',
            show_progress: true
        });
        if (!result.ok)
            exit(1, result.error_msg);
        else
            exit(0);
    }
    
    
    // Show the high-level docs guide
    asyncLess('/demo/docs/guides/docs.txt', exit);
}


////////////////////////////////////////////////////////////////////////////////


function asyncLess(file, exit) {
    if (!fs.existsSync(file))
        exit(1, "docs error: '" + file + "' doesn't exist");
    
    var p = proc.spawn('less', [file], {
        stdio: ['pipe', process.stdout, 'pipe']
    });

    // Deal with launch issues.
    p.on('error', (error) => {
        exit(1, "Failed to run less: " + error.toString());
    });

    // Buffer stderr in case of an abnormal exit.
    var stderr = "";
    p.stderr.on('data', (data) => {
        stderr += data.toString();
    });
    
    // Handle exit.
    p.on('exit', (code) => {
        process.exitCode = (code > 0 ? 1 : 0);
    });

    // Handle before exit
    // because we may miss some logs that nodejs hasn't flushed yet.
    process.on('beforeExit', function(code) {
        if (code > 0)
            exit(1, "docs error: less failed: " + stderr.toString());
    });
}


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    spec: cli.spec,
    exec: exec,
    asyncLess: asyncLess
};
