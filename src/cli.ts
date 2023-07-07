// check-revs /path/to/file

// check-revs
// line 12: 78c5426be6fd74925932b428883e51bf391c569a was not found
//    This is a comment with
//    multiple lines
// line 12: 6673c981b1cc1a6ddd3bafbed2a4cb08e07883ff was not found
//    This is a comment above that line

// check-revs --silent
// [exit 0 or 1]

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { lint } from './linter.js';

// funky parsing compared to other packages
// the goal in this project was to have zero non-stdlib dependencies
const options = {
  path: '.git-blame-ignore-revs',
  silent: false,
  comments: true,
  help: false,
};
if (process.argv.length > 2 && !process.argv[2].startsWith('-')) {
  options.path = process.argv[2];
}
options.path = resolve(options.path);

for (const arg of process.argv.slice(2)) {
  if (!arg.startsWith('-')) {
    continue;
  }

  switch (arg.toLowerCase()) {
    case '--silent':
    case '-s':
      options.silent = true;
      break;
    case '--no-comments':
      options.comments = false;
      break;
    case '--help':
      options.help = true;
      break;
  }
}

if (options.help) {
  console.log(
    `check-ignore-revs [path to .git-blame-ignore-revs] [--silent,-s] [--no-comments] [--help]

  No issues:
    Prints nothing and exits with code 0

  One or more issues:
    Prints all issues to stderr, unless '--silent' is set, and exits with code 1.
  
    Comments are printed to stderr unless '--no-comments' is set. Lines are treated
    as comments if they begin with a '#'. Comments are grouped if two or more comment
    lines appear directly next to each other and reset on empty lines.`
  );
  process.exit(0);
}

// I think I'm ok with the default not-found error message here
const lines = (await readFile(options.path, 'utf8')).split('\n');
const { failed, output } = await lint(dirname(options.path), lines, {
  includeComments: options.comments,
});

if (!options.silent) {
  output.forEach((line) => console.error(line));
}

if (failed) {
  process.exit(1);
}
