# (configure help) - Configure the demo

## Quick reference

View the configuration file

```
$ cat /demo/demo.yml
```

Check your changes to the configuration file

```
$ demo configure --check
```

## Summary

The 'demo' command-line tool uses a configuration file to execute commands like 'demo run', 'demo build', and 'demo docs'. The 'demo configure' command prints information about this file so you can understand and change how the demo works.

The 'demo configure \<section\>' command prints requirements of a section of the configuration file, along with an example and best practices.

The 'demo configure --check' command checks that all requirements are met, while the 'demo configure \<section\> --check' checks a single section.

When you change the configuration file, you should run 'demo configure --check' to make sure your changes meet the minimum requirements. If you forget to do this, it will happen automatically before another 'demo' command is executed.

## Configuration file

|          |                |
| -------- | -------------- |
| Format   | YAML           |
| Location | /demo/demo.yml |

### Sections

|          |                 |
| -------- | --------------- |
{{#sections}}
| {{name}} | {{description}} |
{{/sections}}

## More details

Learn about a section and its requirements

```
$ demo configure <section>
```

For example

```
$ demo configure run
```

## YAML

YAML ("YAML Ain't Markup Language") is a simple, human-readable data format. Popular alternatives are JSON and TOML. Below is a brief guide that shows how YAML works by example and by comparison.

|                                |                          |                      |
| ------------------------------ | ------------------------ | -------------------- |
| ___[Comments]             |                               |                      |
| YAML                           | JSON                          | TOML                 |
| ----                           | ----                          | ----                 |
| <pre># This is a comment</pre> | N/A                           | <pre># This is a comment</pre> |
|                                |                               | <hr>                 |
| ___[Fields and values]    |                          |                      |
| YAML                           | JSON                     | TOML                 |
| ----                           | ----                     | ----                 |
|                                | <pre>{</pre>
| <pre>pets: 1</pre>             | <pre>  "pets": 1,</pre>     | <pre>pets = 1</pre>  |
| <pre>cat: true</pre>           | <pre>  "cat": true,</pre>   | <pre>cat = true</pre> |
| <pre>name: Fred Astair</pre>   | <pre>  "name": "Fred Astair"</pre> | <pre>name = "Fred Astair"</pre> |
|                                | <pre>}</pre>             |                      |
| ___[Structures]           |                          |                      |
| YAML                       | JSON                     | TOML                 |
| ----                       | ----                     | ----                 |
| <pre>pets:</pre>           | <pre>"pets": {</pre>     | <pre>[pets]</pre>    |
| <pre>  cats: 1</pre>       | <pre>  "cats": 1,</pre>  | <pre>cats = 1</pre>  |
| <pre>  dogs: 2</pre>       | <pre>  "dogs": 2</pre>   | <pre>dogs = 2</pre>  |
|                            | <pre>}</pre>             |                      |
| ___[Arrays]           |                          |                      |
| YAML                       | JSON                     | TOML                 |
| ----                       | ----                     | ----                 |
| <pre>pets:</pre>           | <pre>"pets": [</pre>     | <pre>pets = [        |
| <pre>  - cat</pre>         | <pre>  "cat",</pre>      | <pre>  "cat",</pre>  |
| <pre>  - dog</pre>         | <pre>  "dog"</pre>       | <pre>  "dog",</pre>  |
|                            | <pre>]</pre>             | <pre>]</pre>         |
| ___[Strings]          |                          |                      |
| YAML                       | JSON                     | TOML                 |
| ----                       | ----                     | ----                 |
| <pre>field: string</pre>       | <pre>"field": "string"</pre>  | <pre>field = "string" |
|                                |                               | <hr>                 |
| <pre>field: >-</pre>           | N/A                           | <pre>field = """\\</pre> |
| <pre>  This is a long</pre>    |                               | <pre>        This is a long\\</pre> |
| <pre>  string formatted</pre>  |                               | <pre>        string formatted\\</pre> |
| <pre>  on multiple lines</pre> |                               | <pre>        on multiple lines\\</pre> |
| <pre>  (no line break).</pre>  |                               | <pre>        (no line break).\\</pre> |
|                                |                               | <pre>        """</pre> |

### [Notes]

+ In YAML, string don't always need to be enclosed in quotes ("cats"), but they must be if they contains special characters ("-", ":") that could be confused with YAML syntax (array elements, fields).
