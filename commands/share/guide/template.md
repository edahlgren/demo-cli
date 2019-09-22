# share

Rsync from the demo to localhost

## Quick reference

Access a copy of /root/src from a shared directory outside the demo

```
$ demo share /root/src
```

Sync changes you made in a shared directory so they appear in /root/src in the demo

```
$ demo sync /root/src
```

Access an exact copy of /root/src from a shared directory, deleting files in the shared directory if necessary

```
$ demo share /root/src --completely
```

Sync changes to /root/src completely, deleting files under /root/src in the demo if necessary

```
$ demo sync /root/src --completely
```

## Summary

When you run 'demo shell' to enter a demo, you select a shared directory whose contents will show up in the demo under /shared. When you change the contents of your shared directory, those changes will also appear in /shared, and vice versa.

'demo share' uses rsync to efficiently copy a directory in the demo (e.g. /root/src) to the same directory in /shared (e.g. /shared/root/src). Use this command to access demo files from your shared directory outside the demo, allowing you to view and change the demo files using your favorite editors and tools.

'demo sync' uses rsync to efficiently copy a directory in /shared (e.g. /shared/root/src) back to the same directory in the demo (e.g. /root/src). Use this command to pull changes you made in your shared directory back into the demo.

## Ways to share and sync

Share and sync or your current directory

```
$ demo share
$ demo sync
```

Share and sync a specific directory

```
$ demo share /dir
$ demo sync /dir
```

Share and sync a directory completely, allowing files to be deleted (use cautiously)

```
$ demo share /dir --completely
$ demo sync /dir --completely
```

Manually execute the rsync commands produced by

```
$ demo share /dir --dryrun
$ demo sync /dir --dryrun
```

Show rsync output, like files copied

```
$ demo share /dir --verbose
$ demo sync /dir --verbose
```

## Example

Share a repository of code in /root/src

```
$ demo share /root/src/repo
```

Edit the files in your shared directory outside of the demo. Then pull in the changes

```
$ demo sync /root/src/repo
```

Rebuild and run the default configuration with your changes

```
$ demo build && demo run
```

## Why this workflow

The files inside the demo are likely owned by a different user (e.g. root) than the files outside the demo (e.g. your user ID). When you run 'demo share', files are not only efficiently copied, they are also changed so you own them and therefore can modify them outside of the demo. When you run 'demo sync', file ownership is changed to your user in the demo so you can also easily access them in the demo again.

Some tools do this automatically, like the unison tool and most network filesystems. We use rsync because:

- No setup required
- You choose when to sync, as needed
- It's stable and easy to understand (e.g. copy file diffs)

If you want to keep some directories in the demo automatically in sync with your shared directory, you can write a small script that executes 'demo share' and 'demo sync' in a loop. A script isn't provided because you may have specific needs and preferences for handling syncing errors that happen in the background.

## Help

View this guide

```
$ demo share --help
```

Same as above

```
$ demo sync --help
```

## More

Learn more about the rsync command

```
$ rsync --help
```

Read the rsync manual

```
$ apt-get install man
$ man rsync
```
