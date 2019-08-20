# (help) - Name of the demo

## Layout of this demo

|            |                                                          |
| ---------- | -------------------------------------------------------- |
| /setup     | scripts used to install the demo                         |
| /demo      | config files used by this CLI                            |
| /root/src  | source code repositories                                 |
| /root/data | sample test data                                         |
| /root/docs | articles and papers describing the demo                  |
| /shared    | synchronized with a shared directory outside of the demo |

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
| data  | preprocess new test data                     |
| docs  | find documentation                           |

## Learn more about this demo

For a high-level map of documentation

```
$ demo docs
```

## Experiment

Experiment with different inputs, parameters, and algorithms

```
$ demo run --help
```

Experiment with debug symbols, optimized code, and other build options

```
$ demo build --help
```

Experiment with different test data sets

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
