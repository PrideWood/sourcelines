# SourceLines MVP 数据结构说明

## 核心原则
- `quotes` 与 `submissions` 分表：
  - `submissions` 存用户原始投稿与审核过程。
  - `quotes` 只存正式发布内容。
- 审核状态与核验状态分离：`moderation_status` 与 `verification_status`。
- 统一外键与索引，优先服务列表筛选、审核队列、检索与收藏场景。

## 主要表
- `users`：用户账号与角色。
- `languages`：语言维表（`code` 为主键）。
- `authors`：作者实体。
- `works`：作品实体，关联作者与语言。
- `quotes`：正式引文，关联语言/作者/作品，含 `difficulty_level`。
- `quote_evidences`：引文证据（来源链接、摘录、备注）。
- `tags`：标签表，含 `tag_type` 与 `parent_id`（层级标签）。
- `quote_tags`：引文与标签多对多关联。
- `submissions`：投稿与审核数据，含 `reviewed_by_id` 和 `published_quote_id`。
- `submission_evidences`：投稿证据。
- `favorites`：收藏关系（`user_id + quote_id` 复合唯一）。
- `reports`：举报记录，可关联 `quote_id` 或 `submission_id`。

## 关键关系
- `submissions.submitter_id -> users.id`
- `submissions.reviewed_by_id -> users.id`
- `submissions.published_quote_id -> quotes.id`
- `quotes.original_language -> languages.code`
- `submissions.original_language -> languages.code`
- `works.author_id -> authors.id`
- `works.language_code -> languages.code`
- `quotes.author_id -> authors.id`
- `quotes.work_id -> works.id`
- `quote_evidences.quote_id -> quotes.id`
- `submission_evidences.submission_id -> submissions.id`
- `quote_tags.quote_id -> quotes.id`
- `quote_tags.tag_id -> tags.id`
- `favorites.user_id -> users.id`
- `favorites.quote_id -> quotes.id`
- `reports.reporter_user_id -> users.id`
- `reports.quote_id -> quotes.id`
- `reports.submission_id -> submissions.id`
