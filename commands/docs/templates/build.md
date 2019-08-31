# (build help) - 

Build the main source code of this demo

## Quick reference

Build sources using the default build configuration

```
$ demo build
```

Build sources cleanly, removing object files and old binaries first

```
$ demo build --clean
```

View stdout and stderr build logs

```
$ cat build.log
$ cat build.error
```

## Files

|                |                 |
| -------------- | --------------- |
{{#build_files}}
| ({{file}})     | {{description}} |
{{/build_files}}

## Ways to build

Use a preconfigured build

```
$ demo build <configuration>
```

Manually execute the commands produced by

```
$ demo build <configuration> --dryrun
```

## Configured builds

{{#configs}}
{{description}}

```
$ demo build {{name}}
```
{{/configs}}

## Help

View this guide

```
$ demo build --help
```

## More

Learn about the source code used in these builds

```
$ less /docs/src/README
```

### Read the build scripts

|           |              |
| --------- | ------------ |
{{#configs}}
| {{name}}  | {{script}}   |
{{/configs}}
