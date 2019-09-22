# args

Command line arguments

## Quick reference

View the configuration

```
$ cat /demo/demo.yml 
```

Check this section

```
$ demo configure args --check
```

## Summary

The args section contains information on the command-line arguments that can be used to configure the execution of the demo.
    
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

+ Include examples for arguments that expect string values
+ Use the choose_one section only for mutually exclusive options
