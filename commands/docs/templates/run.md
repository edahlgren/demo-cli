# (run help) - {{title}}

Execute the main binaries and scripts of this demo

## Quick reference

Run the demo using the default configuration

```
$ demo run
```

Run the demo using command-line options (see below)

```
$ demo run -- --opt1 arg1 --opt2 --opt3
```

View stdout and stderr logs

```
$ cat run.log
$ cat run.error
```

## Summary

{{run.description}}

|              |                 |
| -----------  | --------------- |
| ___Input     |                 |
{{#input}}
| {{format}}   | {{description}} |
{{/input}}
| ___Output    |                 | 
{{#output}}
| {{format}}   | {{description}} |
{{/output}}

## Ways to run

Use a configured run

```
$ demo run <configuration>
```

Manually execute the commands produced by

```
$ demo run <configuration> --dryrun
```

Use your own command-line options

```
$ demo run -- [options...]
```

## Configured runs
{{#run.preconfigured}}

{{description}}

```
$ demo run {{name}}
```
{{/run.preconfigured}}

## Command-line options

|                 |             |                   |
| --------------- | ----------- | ----------------- |
|                 | (default)   | (description)     |
|___Input         |             |                   |
{{#input}}
| {{options}}     | {{default}} | {{description}}   |
{{/input}}
|___Output        |             |                   |
{{#output}}
| {{options}}     | {{default}} | {{description}}   |
{{/output}}
|___Algorithms    |             |                   |
{{#algorithms}}
| {{options}}     | {{default}} | {{description}}   |
{{/algorithms}}
|___Parameters    |             |                   |
{{#params}}
| {{options}}     | {{default}} | {{description}}   |
{{/params}}


## Examples
{{#run.examples}}

{{description}}

```
$ demo run -- {{&commandline}}
```
{{/run.examples}}

## Help

View this guide

```
$ demo run --help
```

## More

Learn about the data used in these runs

```
$ less /docs/data/README
```

Learn about the source code used in these runs

```
$ less /docs/src/README
```

### Read the scripts

|           |              |
| --------- | ------------ |
{{#run.preconfigured}}
| {{name}}  | {{script}}   |
{{/run.preconfigured}}
