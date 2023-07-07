import { test } from 'node:test';
import { execFile as execFileOriginal } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtemp } from 'node:fs/promises';
import { promisify } from 'node:util';
import assert from 'node:assert';
import { LinterOptions, lint } from './linter.js';

const execFile = promisify(execFileOriginal);

const getTestDir = () => {
  return mkdtemp(join(tmpdir(), 'git-blame-ignore-revs-tests'));
};

test('happy path', async () => {
  const dir = await getTestDir();

  await execFile('git', ['-C', dir, 'init']);
  await execFile('git', [
    '-C',
    dir,
    'commit',
    '--allow-empty',
    '--message',
    'hi',
  ]);
  const head = (
    await execFile('git', ['-C', dir, 'rev-parse', 'HEAD'])
  ).stdout.trim();

  const { failed, output } = await lint(dir, [head]);

  assert.deepStrictEqual(output, []);
  assert.ok(!failed);
});

test('detects a missing commit', async (t) => {
  const dir = await getTestDir();

  await execFile('git', ['-C', dir, 'init']);
  await execFile('git', [
    '-C',
    dir,
    'commit',
    '--allow-empty',
    '--message',
    'hi',
  ]);
  const head = (
    await execFile('git', ['-C', dir, 'rev-parse', 'HEAD'])
  ).stdout.trim();

  const { failed, output } = await lint(dir, [
    head, // an ok one too
    'e25f0d75fabe5d00ce73f8df96179b8d6c8ed082',
  ]);

  assert.deepStrictEqual(output, [
    'line 2: not found in repository (e25f0d75fabe5d00ce73f8df96179b8d6c8ed082)',
  ]);
  assert.ok(failed);
});

test('includes comments', async () => {
  const dir = await getTestDir();

  await execFile('git', ['-C', dir, 'init']);
  await execFile('git', [
    '-C',
    dir,
    'commit',
    '--allow-empty',
    '--message',
    'comments',
  ]);

  const { failed, output } = await lint(
    dir,
    [
      '# intro comment',
      '',
      '# this is a comment',
      '# with another line',
      '3104756b21c0effac7bb2b1671e52d6cf3569cd2',
    ],
    {
      includeComments: true,
    }
  );

  assert.ok(!/intro comment/gi.test(output[1]));
  assert.ok(/this is a comment/gi.test(output[1]));
  assert.ok(failed);
});

test('detects a non commit', async () => {
  const dir = await getTestDir();

  await execFile('git', ['-C', dir, 'init']);

  const { failed, output } = await lint(dir, ['main']);

  assert.deepStrictEqual(output, ['line 1: not a valid commit (main)']);
  assert.ok(failed);
});

test('detects duplicates', async () => {
  const dir = await getTestDir();

  await execFile('git', ['-C', dir, 'init']);

  const { failed, output } = await lint(dir, [
    '# one',
    '2f52ead931375cabfe50fd682f0075342f710e45',
    '# did a different thing',
    '2f52ead931375cabfe50fd682f0075342f710e45',
  ]);

  assert.deepStrictEqual(output, [
    'line 2: not found in repository (2f52ead931375cabfe50fd682f0075342f710e45)',
    'line 4: duplicate entry (2f52ead931375cabfe50fd682f0075342f710e45)',
  ]);
  assert.ok(failed);
});

test("isn't horribly slow", async (t) => {
  const dir = await getTestDir();

  await execFile('git', ['-C', dir, 'init']);
  await execFile('git', [
    '-C',
    dir,
    'commit',
    '--allow-empty',
    '--message',
    'hi',
  ]);
  const head = (
    await execFile('git', ['-C', dir, 'rev-parse', 'HEAD'])
  ).stdout.trim();

  const variations: LinterOptions[] = [{}, { includeComments: true }];
  for (const opts of variations) {
    const start = performance.now();
    const { failed } = await lint(
      dir,
      [
        '# one',
        '6e230ce2b67b014e7f30e93c5eb61f1650ccb52c',
        '# did a different thing',
        '510319edacfe7ce2873389dbd3ab662ba7a710b4',
        'b0e0b3bda06c27e02a6afda7913516c7e5be441d',
        '6816f227d04a1775c65c32ec0ead3984ce9cefa1',
        '# this is something ',
        '215b2c7e53008cf53723f5f30e7bb0afde8b2bc0',
        '0de772a2b83ef8abf1b0dc7485b019be643d4021',
        'd892d1d34a75fdea7cd096bf645abf08097c8e03',
        '# very important',
        '# and definitely not a repeat',
        '6816f227d04a1775c65c32ec0ead3984ce9cefa1',
        '3d748336ceeac0c0ef04efae18c774365377acce',
        'a467cfa9edf9fa3a486caf65951f4aa5896a5acf',
        'ea7a533e846670c35aed6f290525c4e609c355cc',
        '8866f1a546ada01059324900d035f0d887d693a8',
        'd6ba2aaccc0ff7f70e8292e2835ae7adcd2a74d7',
        head,
      ],
      opts
    );
    const end = performance.now() - start;
    assert.ok(failed);
    t.diagnostic(`lint took ${end.toFixed(2)}ms with ${JSON.stringify(opts)}`);
  }
});
