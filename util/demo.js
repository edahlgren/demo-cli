
const fs = require('fs');

function insideDemo() {
    return fs.existsSync('/demo/demo.yml');
}

module.exports = {
    inside: insideDemo
};
