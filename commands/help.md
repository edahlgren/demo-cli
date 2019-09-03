# (help) -

|                |                                                            |
| -------------- | ---------------------------------------------------------- |
| /root/src      | source code and build artifacts                            |
| /root/data     | sample test data                                           |
| /root/docs     | articles and papers describing the demo                    |
| /shared        | synchronized with a shared directory outside of this shell |
|                |                                                            |
| /setup         | scripts used to install this demo in this shell            |
| /demo/Demofile | this demo's metadata                                       |
| /demo/build    | pre-configured build scripts                               |
| /demo/run      | pre-configured run scripts                                 |
| /demo/docs     | templates for help guides and generated docs               |

## Quickstart

Run the demo using the default configuration

```
$ demo run
```

Access a copy of this directory in the shared directory

```
$ demo share
```

Sync changes you made in the shared directory back to this directory

```
$ demo sync
```

Rebuild the source code

```
$ demo build
```

## Commands

|       |                                              |
| ----- | -------------------------------------------- |
| run   | run the demo main binaries and scripts       |
| build | rebuild the main source repositories         |
| share | access a directory from the shared directory |
| sync  | rsync changes made in the shared directory   |
| docs  | generate and find documentation              |

## Learn more about this demo

For a high-level map of documentation

```
$ demo docs --help
```

Read help docs and research docs in your browser, from outside of the demo where you ran 'demo shell'

```
$ demo browse
```

Or read /root/src/README.md for an overview of the source code

## Experiment

Learn how to experiment with different inputs, parameters, and algorithms

```
$ demo run --help
```

Learn how to experiment with debug symbols, optimized code, and other build options

```
$ demo build --help
```

Learn how to experiment with different test data sets

```
$ demo data --help
```

## Get more help

Get help with a command: Add '--help'

```
$ demo share --help
```

Run a command manually: Add '--dryrun'

```
$ demo run --dryrun
```

Read help docs like this in your browser, from where you ran 'demo shell'

```
$ demo browse
```
