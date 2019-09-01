# (configure title) -

Configure the 'title' section of this demo

## Quick reference

View the configuration

```
$ cat /demo/demo.yml 
```

Check this section

```
$ demo configure title --check
```

## Summary

The title section contains a short description of the demo, which will appear at the top of its generated documentation

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

+ Keep your title short (3-6 words)
+ Include words that highlight what's unusual about your demo
