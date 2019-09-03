const docutil = require('../../../commands/docs/util');


////////////////////////////////////////////////////////////////////////////////


function make(spec_file, example_file, constraints,
              template, out_dir) {

    return docutil.standard_spec_guide("data", spec_file, example_file,
                                       constraints, template, out_dir);
}


////////////////////////////////////////////////////////////////////////////////

module.exports = {
    make: make
};
