# (configure papers) -

Configure the 'papers' section of this demo

## Quick reference

View the configuration

```
$ cat /demo/demo.yml 
```

Check this section

```
$ demo configure papers --check
```

## Summary

The papers section contains information about research papers that describe functionality of the demo and that are packaged in the demo for easy access.

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

+ List up to 10 authors (first 10)
+ Avoid packaging papers that are not published in an open access journal
+ If a paper isn't freely available, contact the author for help
