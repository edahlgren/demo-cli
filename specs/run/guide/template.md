# run

Run scripts

## Quick reference

View the configuration

```
$ cat /demo/demo.yml 
```

Check this section

```
$ demo configure run --check
```

## Summary

The run section contains information on executing the demo, so someone can execute it automatically using preconfigured scripts or manually using command-line arguments.

## Requirements

|                     |         |
| ------------------- | ------- |
|                     | <hr>    |
{{#layout}}
| <pre>{{line}}</pre> | {{doc}} |
|                     | <ul>{{#constraints}}<li>{{.}}</li>{{/constraints}}</ul> |
|                     | <hr>    |
{{/layout}}

## Example

```
{{&example}}
```

## Best practices

+ Use the preconfigured scripts to show off the demo's range of functionality
+ Keep the execution time of scripts and examples short (max 2-3 minutes)
+ Use only 2-3 arguments at a time in command-line examples
