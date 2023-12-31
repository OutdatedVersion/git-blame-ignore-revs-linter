# `.git-blame-ignore-revs` linter

Check for semantic and opinionated issues in Git [skip-list formatted files](https://git-scm.com/docs/git-fsck#Documentation/git-fsck.txt-fsckskipList) used by [`git blame --ignore-revs-file`](https://git-scm.com/docs/git-blame#Documentation/git-blame.txt---ignore-revs-fileltfilegt).

## Usage

- Through `npx`

  ```console
  npx git-blame-ignore-revs-linter
  ```

- Through npm `scripts`

  ```console
  npm install -D git-blame-ignore-revs-linter
  ```

  ```json
  {
    "scripts": {
      "check": "git-blame-ignore-revs"
    }
  }
  ```

- Through code

  ```console
  npm install git-blame-ignore-revs-linter
  ```

  ```js
  import fs from 'fs/promises';
  import { lint } from 'git-blame-ignore-revs-linter';
  await lint(
    dir,
    (await fs.readFile('.git-blame-ignore-revs', 'utf8')).split('\n')
  );
  ```

  See [src/cli.ts](src/cli.ts) for another code example

## Checks

- [Commit not in repository](#commit-not-in-repository)
- [Commit duplicated](#commit-duplicated)
- [Malformed commit](#malformed-commit)

### Commit not in repository

A non-existent commit doesn't alter behavior, adds noise to the file,
and is likely a mistake. Rebasing previous commits could invalidate
commits already in the `.git-blame-ignore-revs`, for example.

Given a Git history of:

```console
$ git log
commit 6c29e5b0d2f83e03ce2320cd7ea445465e4bfc9f (HEAD -> main)
Author: Dale Cooper <damnfine@coffee.reviews>
Date:   Thu Jul 6 21:38:54 2023 -0500

    do something
```

And a `.git-blame-ignore-revs` of:

```shell
# run formatter
e4ded84c354e6be25aa073bdd3b43e8dc962b1cc
```

We'd get:

```console
$ npx git-blame-ignore-revs
line 2: not found in repository (e4ded84c354e6be25aa073bdd3b43e8dc962b1cc)
    run formatter
```

### Commit duplicated

A duplicate doesn't alter behavior and adds noise to the file.

Given a Git history of:

```console
$ git log
commit 6c29e5b0d2f83e03ce2320cd7ea445465e4bfc9f (HEAD -> main)
Author: Dale Cooper <damnfine@coffee.reviews>
Date:   Thu Jul 6 21:38:54 2023 -0500

    do something
```

And a `.git-blame-ignore-revs` of:

```shell
# run formatter
71d5077ff1b80cb377dcec30d64c31c78c3accfc
# run formatter again
9b183f9ce24a93cfe1d6b16a3ef0902d9672c121
# something else!
71d5077ff1b80cb377dcec30d64c31c78c3accfc
```

We'd get:

```console
$ npx git-blame-ignore-revs
line 6: duplicate entry (71d5077ff1b80cb377dcec30d64c31c78c3accfc)
```

### Malformed commit

Given a Git history of:

```console
$ git log
commit 6c29e5b0d2f83e03ce2320cd7ea445465e4bfc9f (HEAD -> main)
Author: Dale Cooper <damnfine@coffee.reviews>
Date:   Thu Jul 6 21:38:54 2023 -0500

    do something
```

And a `.git-blame-ignore-revs` of:

```shell
6c29e5b0d2f83e03ce2320cd7ea445465e4bfc9f
# no go
main
# also a no go
v1.0
```

We'd get:

```console
$ npx git-blame-ignore-revs
line 3: not a valid commit (main)
line 5: not a valid commit (v1.0)
```
