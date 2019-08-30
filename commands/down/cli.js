const fs = require('fs');
const path = require('path');

const demofile = require('../../util/demofile');
const type = require('../../util/type');


////////////////////////////////////////////////////////////////////////////////


const cli = [
    { name: 'image', defaultOption: true },
    { name: 'demofile', alias: 'f' },
];


////////////////////////////////////////////////////////////////////////////////


function parseConfig(args) {

    // Parse the command args
    var hasImage = args.hasOwnProperty('image');
    var Demofile = (args.hasOwnProperty('demofile') ? args.demofile
                    : path.join(process.cwd(), 'demo.yml'));

    
    // Check for the things we don't implement yet
    if (hasImage) {
        return {
            ok: false,
            error_msg: 'demo down <demo-image> not yet implemented'
        };
    }
    if (!fs.existsSync(Demofile)) {
        return {
            ok: false,
            error_msg: "Need a demo file, run demo down --help to learn more"
        };
    }
    
    // Parse and check the contents of the Demofile
    var data = demofile.parse(Demofile, checks);
    if (!data.ok)
        return data;


    // The config
    return {
        ok: true,
        instance: demofile.getInstance(data.image, data.instance)
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
            return data.instance && !type.isString(data.instance);
        },
        issue: "the value of 'instance' must be a string"
    }
];


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    spec: cli,
    parse: parseConfig
};
