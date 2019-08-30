# (docs help) - {{title}}

Find and generate documentation about this demo

## Quick reference

Show this guide

```
$ demo docs
```

Re-generate the help guides in /docs/help

```
$ demo docs --make
```

## Summary

The 'demo docs' command prints a map of all documentation in this demo. See 'Overview' below.

The 'demo docs --make' command uses a Demofile to create markdown guides, which then are converted to plain text and html for easy viewing.

|                             |
| --------------------------- |
| ___Input                    |
| /demo/Demofile              |
| /demo/docs/templates/*.md   |
| /demo/docs/templates/*.html |
| ___Output                   |
| /docs/help/*.txt            |
| /docs/help/*.html           |

## Overview

|                              |                      |
| ---------------------------- | -------------------- |
|                              | (description)        |
|___Source docs                |                      |
{{#source.preconfigured}}
{{#docs}}
| /docs/src/{{file}}           | {{description}}      |
{{/docs}}
{{/source.preconfigured}}
|___Research papers            |                      |
{{#papers}}
| /docs/papers/{{file}}        | {{keywords}}         |
{{/papers}}
|___Demo command guides        |                      |
| /docs/guides/help.txt        | 'demo --help'        |
| /docs/guides/run.txt         | 'demo run --help'    |
| /docs/guides/build.txt       | 'demo build --help'  |
| /docs/guides/share-sync.txt  | 'demo share --help'  |
|                              | 'demo sync --help'   |
|___File guides                |                      |
| /docs/guides/docs.txt        | 'demo docs'          |
| /docs/guides/data.txt        | 'demo data'          |
| /docs/guides/source.txt      | 'demo source'        |

## Help

View this guide

```
$ demo docs
```

Same as above

```
$ demo docs --help
```
