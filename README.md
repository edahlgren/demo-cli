## On the Host

#### Launch a demo container

```
$ demo up
```

#### Bring it down

```
$ demo down
```

#### Get shell access to a demo that's up

```
$ demo shell
```

#### Get shell access to a demo that's not yet up

```
$ demo shell --up
```

#### Get shell access to a demo that needs to be restarted

```
$ demo shell --reup
```

## In the Demo

#### Run the demo

```
$ demo run
```

#### Find the source code and test data

```
$ demo inspect
```

#### Force rebuild the demo

```
$ demo build --clean
```

#### Access files in the demo via the shared directory on the host

```
$ cd DEMODIR
$ demo share
```

#### Sync changes made in the shared directory back into the demo

```
$ cd DEMODIR
$ demo sync
```
