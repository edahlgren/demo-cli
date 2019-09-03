# (configure source) -

Configure the 'source' section of this demo

## Quick reference

View the configuration

```
$ cat /demo/demo.yml 
```

Check this section

```
$ demo configure source --check
```

## Summary

The source section contains information about the source code of the demo so someone can read the implementation of the demo and modify it.

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

+ "Use a commit hash as the version, if available"
+ "Include a file containing the license instead of a license name"
+ "Include at least 2-3 notable source files"
+ "Include at least 1 file or script used to build the source code"
