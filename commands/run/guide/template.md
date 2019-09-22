# run

Run the demo

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

{{description}}

|              |                 |
| -----------  | --------------- |
| ___Input     |                 |
{{#input_files}}
| {{format}} file   | {{description}} |
{{/input_files}}
| ___Output    |                 | 
{{#output_files}}
| {{format}} file  | {{description}} |
{{/output_files}}

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
{{#configs}}

{{description}}

```
$ demo run {{name}}
```
{{/configs}}

## Command-line options

|                 |             |                   |
| --------------  | ----------- | ----------------- |
{{#args_choose}}
|___Choose one: {{description}}    |             |                   |
{{#choices}}
| {{options}}     | {{default}} | {{description}}   |
{{/choices}}
{{/args_choose}}
|___Choose any    |             |                   |
{{#args_any}}
| {{options}}     | {{default}} | {{description}}   |
{{/args_any}}


## Examples
{{#examples}}

{{description}}

```
$ demo run -- {{&commandline}}
```
{{/examples}}

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
{{#configs}}
| {{name}}  | {{script}}   |
{{/configs}}
