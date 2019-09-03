const path = require('path');
const render = require('../../docs/render');


////////////////////////////////////////////////////////////////////////////////


function make(demo_file, template, out_dir) {
    
    return render.render({
        vars: {},
        template: template,
        html: path.join(out_dir, "sync.html"),
        text: path.join(out_dir, "sync.txt")
    });        
}


////////////////////////////////////////////////////////////////////////////////


module.exports = {
    make: make
};
