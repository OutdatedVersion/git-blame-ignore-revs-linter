import { execFile as execFileOriginal } from 'node:child_process';
import { promisify } from 'node:util';

const execFile = promisify(execFileOriginal);

export interface LinterOptions {
  includeComments?: boolean;
}

export const lint = async (
  path: string,
  lines: string[],
  opts?: LinterOptions
) => {
  let failed = false;
  let lineNum = 0;
  let comments: string[] = [];

  const output: string[] = [];
  const seen = new Map();

  for (const line of lines) {
    lineNum++;
    const trimmed = line.trim();

    if (trimmed.startsWith('#')) {
      comments.push(trimmed);
      continue;
    } else if (trimmed === '') {
      // Blank lines are ignored per `skipList` spec
      //
      // Reset the comment tracker since I think someone would put new lines
      // in for logical separation. e.g.
      // ```
      // # This file contains commits that are ignored
      //
      // # format stuff
      // 78c5426be6fd74925932b428883e51bf391c569a
      // ```
      comments = [];
      continue;
    } else if (!/^[0-9a-z]{40}$/i.test(trimmed)) {
      // Likely not a valid commit reference.
      // I was surprised to see abbreviated references aren't supported either. But this
      // probably reduces false matches as the repository history grows.
      // https://git-scm.com/docs/git-fsck#Documentation/git-fsck.txt-fsckskipList
      failed = true;
      output.push(`line ${lineNum}: not a valid commit (${trimmed})`);
      continue;
    } else if (seen.has(trimmed)) {
      failed = true;
      output.push(`line ${lineNum}: duplicate entry (${trimmed})`);
      continue;
    }

    let issue;
    try {
      await execFile('git', ['-C', path, 'cat-file', '-t', trimmed], {
        encoding: 'utf8',
      });
    } catch (error) {
      issue = `not found in repository (${trimmed})`;
    }

    if (issue) {
      output.push(`line ${lineNum}: ${issue}`);
      if (opts?.includeComments && comments.length > 0) {
        output.push(
          comments
            .map((line) => ' '.repeat(5) + line.replace(/^[# ]+/, ''))
            .join('\n')
        );
      }
      failed = true;
    }

    seen.set(trimmed, issue);
    comments = [];
  }

  return {
    failed,
    output,
  };
};
