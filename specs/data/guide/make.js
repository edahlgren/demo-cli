const path = require('path');

const docutil = require('../../../commands/docs/util');
const render = require('../../../commands/docs/render');


////////////////////////////////////////////////////////////////////////////////


function make(spec_file, example_file, constraints,
              template, out_dir) {

    var vars = docutil.spec_guide_vars(spec_file, example_file, constraints);
    if (!vars.ok)
        return vars;
    
    return render.render({
        vars: vars,
        template: template,
        html: path.join(out_dir, "data.html"),
        text: path.join(out_dir, "data.txt")
    });
}


////////////////////////////////////////////////////////////////////////////////

module.exports = {
    make: make
};
