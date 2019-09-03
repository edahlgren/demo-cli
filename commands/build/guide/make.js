const path = require('path');

const render = require('../../docs/render');
const demofile = require('../../../util/demofile');


////////////////////////////////////////////////////////////////////////////////


function make(demo_file, template, out_dir) {
    
    // Parse the demofile
    var demo = demofile.parse(demo_file, checks);
    if (!demo.ok)
        return demo;

    var variables = {
        build_files: [],
        configs: demo.build.configs
    };
    
    demo.source.forEach(function(repo) {
        repo.notable.build.forEach(function(file) {
            variables.build_files.push({
                file: path.join(repo.directory, file.path),
                description: file.description
            });
        });
    });

    return render.render({
        vars: variables,
        template: template,
        html: path.join(out_dir, "build.html"),
        text: path.join(out_dir, "build.txt")
    });        
}

const checks = [
    {
        exec: function(data) {
            return data.source && data.source.length > 0;
        },
        issue: "need a 'source' section with at least 1 repo"
    },
    {
        exec: function(data) {
            if (!data.source)
                return false;

            for (var i = 0; i < data.source.length; i++) {
                if (!data.source[i].notable)
                    return false;
                if (!data.source[i].notable.build)
                    return false;
                if (data.source[i].notable.build.length == 0)
                    return false;
            }

            return true;
        },
        issue: "need at least 1 notable build file for each repo under 'source'"
    },
    {
        exec: function(data) {
            return data.build;
        },
        issue: "need a 'build' section"
    },
    {
        exec: function(data) {
            return data.build && data.build.configs &&
                data.build.configs.length > 0;
        },
        issue: "need at least 1 config under 'build'"
    },
    {
        exec: function(data) {
            if (!data.build || !data.build.configs)
                return false;
            
            for (var i = 0; i < data.build.configs.length; i++) {
                if (!data.build.configs[i].description)
                    return false;
                if (!data.build.configs[i].name)
                    return false;
                if (!data.build.configs[i].script)
                    return false;
            }
            
            return true;
        },
        issue: "need a description, name, and script for each config under 'build'"
    }
];


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    make: make
};
