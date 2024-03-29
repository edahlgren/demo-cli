const fs = require('fs');
const path = require('path');

const demofile = require('../../util/demofile');
const type = require('../../util/type');


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

    
    // Parse and check the contents of the Demofile
    var data = demofile.parse(Demofile, checks);
    if (!data.ok)
        return data;


    // The config
    return {
        ok: true,
        image: data.image,
        instance: demofile.getInstance(data.image, data.instance),
        shared_directory: (data.shared_directory ? data.shared_directory : ''),
        skipConfirmation: skipConfirmation,
        quiet: quiet
    };
}

const checks = [
    // Check for the image field
    {
        exec: function(data) {
            return data.image;
        },
        issue: "the 'image' field is required"
    },
    
    // Check that the value of the image field is a string
    {
        exec: function(data) {
            return type.isString(data.image);
        },
        issue: "the value of 'image' must be a string"
    },
    
    // Check that the value of the instance field is a string
    // if it's provided
    {
        exec: function(data) {
            if (data.instance)
                return type.isString(data.instance);
            return true;
        },
        issue: "the value of 'instance' must be a string"
    },

    // Check that the value of the shared directory is a string
    // if it's provided
    {
        exec: function(data) {
            if (data.shared_directory)
                return type.isString(data.shared_directory);
            return true;
        },
        issue: "In your Demofile, the value of 'shared_directory' must be a string and a file path."
    }
];


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    spec: cli,
    parse: parseConfig
};
