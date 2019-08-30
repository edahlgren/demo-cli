# (build help) - {{title}}

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

## Summary

|           |              |
| --------- | ------------ |
| ___Uses build files  |              |
{{#source.preconfigured}}
{{#build_files}}
| ({{name}})  | {{file}}     |
{{/build_files}}
{{/source.preconfigured}}
| ___Produces build artifacts |              |
{{#source.preconfigured}}
{{#build_artifacts}}
| ({{name}})  | {{file}}     |
{{/build_artifacts}}
{{/source.preconfigured}}

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

{{#build.preconfigured}}
{{description}}

```
$ demo build {{name}}
```
{{/build.preconfigured}}

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
{{#build.preconfigured}}
| {{name}}  | {{script}}   |
{{/build.preconfigured}}
