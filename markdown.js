const fs = require('fs');
const through = require('through');
const pdf = require('markdown-pdf');
const cli = require('command-line-args');

// Output path
const output = 'out.pdf';

// Input path
const cliSpec = [
    { name: 'css' },
    { name: 'highlight' },
    { name: 'html' },
    { name: 'file', defaultOption: true }
];

const args = cli(cliSpec);
if (!args.file) {
    console.log("Need a path to a file");
    process.exit(1);
}

// Try to read in the css.
var cssContent = [];

var htmlPath = (args.html ? args.html : 'out.html');
var html = [];

html = html.concat([
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Code+Pro:300,400">',
    '<style type="text/css">'    
]);
if (args.css && args.css.length > 0) {
    html.push(fs.readFileSync(args.css, 'utf8'));
}
if (args.highlight && args.highlight.length > 0) {
    html.push(fs.readFileSync(args.highlight, 'utf8'));
}
html = html.concat([
    '</style>',
    '</head>',
    '<body>',
    '<div class="container">'
]);

function preProcessHtml() {
    return through(function(data) {
        html.push(data.toString());
        this.queue(data);
    });
}

function finishHtml() {
    html = html.concat([
        '</div>',
        '</body>',
        '</html>'
    ]);
    
    var fd = fs.openSync(htmlPath, 'w');
    html.forEach(function(line) {
        fs.writeSync(fd, line + '\n');
    });
    fs.closeSync(fd);
    console.log("Created", htmlPath);
}

var options = {
    cssPath: (args.css ? args.css : 'pdf.css'),
    highlightPath: (args.highlight ? args.highlight : 'highlight.css'),
    preProcessHtml: preProcessHtml,
    remarkable: {
        html: true,
        breaks: true
        //plugins: [ require('remarkable-classy') ],
        //syntax: [ 'footnote', 'sup', 'sub' ]
    }    
};

pdf(options).from(args.file).to(output, function() {
    console.log("Created", output)
    finishHtml();
});
