"use client";

import { useActionState, useMemo } from "react";

import { submitQuoteAction } from "@/app/submit/actions";
import { initialSubmitFormState } from "@/app/submit/form-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type LanguageOption = {
  code: string;
  name_en: string;
  name_native: string;
};

const genreOptions = [
  { value: "unknown", label: "未知 / Unknown" },
  { value: "novel", label: "小说" },
  { value: "poetry", label: "诗歌" },
  { value: "drama", label: "戏剧" },
  { value: "film", label: "电影" },
  { value: "essay", label: "散文 / 随笔" },
  { value: "speech", label: "演讲" },
  { value: "other", label: "其他" },
] as const;

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-red-600">{message}</p>;
}

export function SubmitForm({ languages }: { languages: LanguageOption[] }) {
  const [state, formAction, isPending] = useActionState(submitQuoteAction, initialSubmitFormState);

  const languageOptions = useMemo(() => {
    if (languages.length > 0) {
      return languages;
    }

    return [
      { code: "en", name_en: "English", name_native: "English" },
      { code: "ja", name_en: "Japanese", name_native: "日本語" },
      { code: "fr", name_en: "French", name_native: "Français" },
      { code: "zh", name_en: "Chinese", name_native: "中文" },
    ];
  }, [languages]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">投稿会进入审核队列，不会直接公开。</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {state.formError ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.formError}</p> : null}

        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="original_text">原文 *</Label>
            <Textarea defaultValue={state.values.original_text} id="original_text" name="original_text" placeholder="请输入原文" rows={5} />
            <FieldError message={state.fieldErrors.original_text} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="language">语言 *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue={state.values.language}
                id="language"
                name="language"
              >
                <option value="">请选择语言</option>
                {languageOptions.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name_en} ({item.name_native})
                  </option>
                ))}
              </select>
              <FieldError message={state.fieldErrors.language} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre_type">体裁 *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue={state.values.genre_type || "unknown"}
                id="genre_type"
                name="genre_type"
              >
                {genreOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="raw_work_title">作品名 *</Label>
              <Input defaultValue={state.values.raw_work_title} id="raw_work_title" name="raw_work_title" placeholder="请输入作品名" />
              <FieldError message={state.fieldErrors.raw_work_title} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="raw_author_name">作者名 *</Label>
              <Input defaultValue={state.values.raw_author_name} id="raw_author_name" name="raw_author_name" placeholder="请输入作者名" />
              <FieldError message={state.fieldErrors.raw_author_name} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="speaker_name">说话者 / 角色名</Label>
              <Input defaultValue={state.values.speaker_name} id="speaker_name" name="speaker_name" placeholder="可选" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="raw_source_location">出处位置 *</Label>
              <Input
                defaultValue={state.values.raw_source_location}
                id="raw_source_location"
                name="raw_source_location"
                placeholder="如 章节、页码、场次、时间点"
              />
              <FieldError message={state.fieldErrors.raw_source_location} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="raw_translated_text">译文</Label>
            <Textarea
              defaultValue={state.values.raw_translated_text}
              id="raw_translated_text"
              name="raw_translated_text"
              placeholder="可选"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="raw_note">投稿备注</Label>
            <Textarea defaultValue={state.values.raw_note} id="raw_note" name="raw_note" placeholder="可选，补充说明版本、上下文、编辑说明等" rows={3} />
          </div>

          <div className="space-y-4 rounded-md border p-4">
            <p className="text-sm font-medium">证据（至少一种）*</p>

            <div className="space-y-2">
              <Label htmlFor="evidence_url">证据链接 URL</Label>
              <Input
                defaultValue={state.values.evidence_url}
                id="evidence_url"
                name="evidence_url"
                placeholder="https://example.com/source"
                type="url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evidence_file">证据文件上传（首版占位）</Label>
              <Input id="evidence_file" name="evidence_file" type="file" />
              <p className="text-xs text-muted-foreground">首版仅记录文件元信息，后续接入对象存储。</p>
            </div>

            <FieldError message={state.fieldErrors.evidence} />
          </div>

          <Button disabled={isPending} type="submit">
            {isPending ? "提交中..." : "提交审核"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
