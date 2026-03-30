---
name: contribute-voicevox-github
description: VOICEVOX Organization のリポジトリで Issue や PR を作成する。テンプレートの取得方法とフォーマットがある。VOICEVOX への貢献時に使う。
---

# VOICEVOX GitHub 貢献

VOICEVOX Organization のリポジトリに Issue や PR を作成する際のガイド。

## テンプレートの取得

### Issue テンプレート

一覧表示:

```bash
hiho_get_github_template issue -o VOICEVOX -r {repo}
```

取得:

```bash
hiho_get_github_template issue -o VOICEVOX -r {repo} -t {template}
```

### PR テンプレート

```bash
hiho_get_github_template pr -o VOICEVOX -r {repo}
```

## 文章の書き方

### 体言止め禁止

本文は体言止めを使わず、文章として完結させる。箇条書き（Pros/Cons 等）だけは体言止めでも問題ない。

Good:

```markdown
ブランチ制限がなく、フォークリポジトリで全ブランチに対してワークフローが実行されてしまいます。
```

Bad (本文が体言止め):

```markdown
ブランチ制限がなく、フォークリポジトリで全ブランチに対してワークフローが実行される状態。
```

### 文体の把握

Issue や PR を作成する前に、依頼者の過去の Issue や PR を確認して文体を把握する。

```bash
# 依頼者の username を取得
gh api user --jq '.login'

# 依頼者の Issue を確認
gh issue list --repo VOICEVOX/{repo} --author {username} --state all --limit 5

# 依頼者の PR を確認
gh pr list --repo VOICEVOX/{repo} --author {username} --state all --limit 5
```

## Issue 作成

テンプレートに従い、依頼者の文体に合わせて作成する。

## PR 作成

### ブランチ

VOICEVOX Organization のデフォルトブランチから新規作成する。現在のブランチから続ける方が適切な場合はそのまま進める。

### 説明文

テンプレートに従い、依頼者の文体に合わせて作成する。

**端的に書く**: 1-2 行で済むなら短く。文脈が複雑な場合のみ詳細に説明する。

**リンク必須**:

- 関連 Issue
- 起点となったコメント
- 関連 PR スレッド

**方針が不明な場合は Ask**: 文章内容・分量・含めるべき項目が判断できない場合のみ確認する。「念のため」の確認はしない。
