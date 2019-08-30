// No deps
////////////////////////////////////////////////////////////////////////////////


const cli = [
    { name: 'dir', type: String, multiple: true, defaultOption: true },
    { name: 'complete', type: Boolean },
    { name: 'verbose', alias: 'v', type: Boolean }
];


////////////////////////////////////////////////////////////////////////////////


function parseConfig(args) {
    
    // Parse command args
    var verbose = args.hasOwnProperty('verbose') && args.verbose;
    var allowDelete = args.hasOwnProperty('complete') && args.complete;

    // Parse directory to share
    var directory = process.cwd();

    return {
        ok: true,
        verbose: verbose,
        allowDelete: allowDelete,
        directory: directory
    };
}


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    spec: cli,
    parse: parseConfig
};
