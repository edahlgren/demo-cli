# (configure io) -

Configure the 'io' section of this demo

## Quick reference

View the configuration

```
$ cat /demo/demo.yml 
```

Check this section

```
$ demo configure io --check
```

## Summary

The io section contains information about the input files used to run the demo and the output files that it produces

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

+ Use example input files in preconfigured run scripts
+ Include an exact example of expected output for the example input
