const path = require('path');

const render = require('../../docs/render');
const demofile = require('../../../util/demofile');
const fileutil = require('../../../util/file');


////////////////////////////////////////////////////////////////////////////////


function make(spec_files, template, out_dir) {
    
    var variables = {
        sections: []
    };

    var specs = [];
    for (var i = 0; i < spec_files.length; i++) {
        var yaml_result = fileutil.readYAML(spec_files[i]);
        if (!yaml_result.ok)
            return yaml_result;
        
        specs.push(yaml_result.yaml);
    }
    
    specs.forEach(function(spec) {
        var name = Object.keys(spec)[0];
        variables.sections.push({
            name: name,
            description: spec[name].doc
        });
    });
        
    return render.render({
        vars: variables,
        template: template,
        html: path.join(out_dir, "configure.html"),
        text: path.join(out_dir, "configure.txt")
    });
}


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    make: make,
    needs_all_specs: true
};
