const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');


////////////////////////////////////////////////////////////////////////////////


const cli = [
    { name: 'image', defaultOption: true },
    { name: 'demofile', alias: 'f' },
    { name: 'yes', alias: 'y', type: Boolean },
    { name: 'quiet', alias: 'q', type: Boolean },
];


////////////////////////////////////////////////////////////////////////////////


function parseConfig(args) {
    
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


module.exports = {
    spec: cli,
    parse: parseConfig
};
