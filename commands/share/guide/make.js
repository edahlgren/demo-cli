const path = require('path');
const render = require('../../docs/render');


////////////////////////////////////////////////////////////////////////////////


function make(demo_file, template, out_dir) {
    
    return render.render({
        vars: {},
        template: template,
        html: path.join(out_dir, "share.html"),
        text: path.join(out_dir, "share.txt")
    });        
}


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    make: make
};
