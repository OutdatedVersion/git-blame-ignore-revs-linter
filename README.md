# `.git-blame-ignore-revs` linter

Look for semantic issues in Git [skip-list formatted files](https://git-scm.com/docs/git-fsck#Documentation/git-fsck.txt-fsckskipList) used by [`--ignore-revs-file`](https://git-scm.com/docs/git-blame#Documentation/git-blame.txt---ignore-revs-fileltfilegt).

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
71d5077ff1b80cb377dcec30d64c31c78c3accfc
```

We'd get:

```console
$ npx git-blame-ignore-revs
line 2: not found in repository (e25f0d75fabe5d00ce73f8df96179b8d6c8ed082)
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
line 6: duplicate entry (2f52ead931375cabfe50fd682f0075342f710e45)
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
line 6: duplicate entry (2f52ead931375cabfe50fd682f0075342f710e45)
```
