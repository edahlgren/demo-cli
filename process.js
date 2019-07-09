const proc = require('child_process');

// If can't find the binary to exec:
//
//   * exit code: null
//   * not signaled
//   * spawn error: {"code":"ENOENT","errno":"ENOENT","syscall":"spawnSync /path/to/cmd","path":"/path/to/cmd","spawnargs":[/path/to/arg1, ...]}
//   * stdout empty
//   * stderr empty

// If the command itself fails:
//
//   * exit code: 1
//   * not signaled
//   * no spawn error
//   * stdout empty
//   * stderr:
//     (Whatever the error is from the program)

// If the command succeeds:
//
//   * exit code: 0
//   * not signaled
//   * no spawn error
//   * stdout:
//     (Whatever stdout is)
//   * stderr empty

var res = proc.spawnSync("cat", ["bad_file"]);

console.log('exit code: ' + res.status);

if (res.signal) {
    console.log('got signal: ' + res.signal);
} else {
    console.log('not signaled');
}

if (res.error) {
    console.log('spawn error: ' + JSON.stringify(res.error));
} else {
    console.log('no spawn error');
}

if (res.stdout && res.stdout.length > 0) {
    console.log('stdout:');
    console.log(res.stdout.toString());
} else {
    console.log('stdout empty');
}

if (res.stderr && res.stderr.length > 0) {
    console.log('stderr:');
    console.log(res.stderr.toString());
} else {
    console.log('stderr empty');
}
