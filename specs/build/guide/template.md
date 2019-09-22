# build

Build scripts

## Quick reference

View the configuration

```
$ cat /demo/demo.yml 
```

Check this section

```
$ demo configure build --check
```

## Summary

The build section contains information on building the demo, so someone can build it automatically using preconfigured scripts or manually using command-line arguments.

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

+ Use preconfigured scripts to execute optimized and debug builds
+ Build scripts should show progress if they take longer than several seconds
+ The clean script should remove _all_ build artifacts
