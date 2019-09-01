# (configure data) -

Configure the 'data' section of this demo

## Quick reference

View the configuration

```
$ cat /demo/demo.yml 
```

Check this section

```
$ demo configure data --check
```

## Summary

The data section contains information about included datasets that are compatible with the demo, for executing a number of experiments.

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

+ Include 2-3 metadata statistics about each file to show differences
+ Include the file format in the file description
+ Use URLs from the source's website
