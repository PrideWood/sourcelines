"use client";

import { useActionState, useMemo, useRef, useState, type ChangeEvent } from "react";
import { tag_type } from "@prisma/client";

import { submitQuoteAction } from "@/app/submit/actions";
import { initialSubmitFormState } from "@/app/submit/form-state";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
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

type TagOption = {
  id: string;
  name: string;
  tag_type: tag_type;
};

type SubmitInitialValues = {
  quote_id?: string;
  original_text: string;
  language: string;
  raw_work_title: string;
  raw_author_name: string;
  raw_source_location: string;
  raw_translated_text: string;
  tag_ids: string[];
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

export function SubmitForm({
  languages,
  tags,
  initialValues,
  turnstileSiteKey,
}: {
  languages: LanguageOption[];
  tags: TagOption[];
  initialValues?: SubmitInitialValues | null;
  turnstileSiteKey?: string;
}) {
  const [state, formAction, isPending] = useActionState(submitQuoteAction, initialSubmitFormState);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedEvidences, setUploadedEvidences] = useState<
    Array<{
      id: string;
      object_key: string;
      filename: string;
      mime_type: string;
      size: number;
    }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const groupedTags = useMemo(() => {
    const groups: Record<tag_type, TagOption[]> = {
      SOURCE: [],
      THEME: [],
      LEARNING: [],
      MOOD: [],
    };

    for (const tag of tags) {
      groups[tag.tag_type].push(tag);
    }

    const learningOrder = new Map([
      ["A1", 1],
      ["A2", 2],
      ["B1", 3],
      ["B2", 4],
      ["C1", 5],
      ["C2", 6],
    ]);

    groups.LEARNING.sort((a, b) => {
      const aOrder = learningOrder.get(a.name.toUpperCase()) ?? 999;
      const bOrder = learningOrder.get(b.name.toUpperCase()) ?? 999;
      return aOrder - bOrder;
    });

    return groups;
  }, [tags]);

  const tagGroupLabel: Record<tag_type, string> = {
    SOURCE: "来源类型",
    THEME: "主题",
    LEARNING: "学习难度",
    MOOD: "情绪",
  };

  const hasFormStateOverride = state.formError != null || Object.keys(state.fieldErrors).length > 0;
  const selectedTagIds = hasFormStateOverride
    ? state.values.tag_ids
    : state.values.tag_ids.length > 0
      ? state.values.tag_ids
      : initialValues?.tag_ids ?? [];

  async function requestPresign(file: File) {
    const response = await fetch("/api/evidence/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "PRESIGN_FAILED");
    }
    return data as {
      upload: {
        id: string;
        object_key: string;
        filename: string;
        mime_type: string;
        size: number;
      };
      uploadUrl: string;
    };
  }

  async function completeUpload(uploadId: string) {
    const response = await fetch("/api/evidence/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "UPLOAD_COMPLETE_FAILED");
    }
    return data.upload as {
      id: string;
      object_key: string;
      filename: string;
      mime_type: string;
      size: number;
    };
  }

  async function discardUpload(uploadId: string) {
    await fetch("/api/evidence/discard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId }),
    });
  }

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setUploadStatus("");
    const remainSlots = Math.max(0, 3 - uploadedEvidences.length);
    if (remainSlots <= 0) {
      setUploadStatus("最多上传 3 张证据图片。");
      event.target.value = "";
      return;
    }

    const selectedFiles = files.slice(0, remainSlots);
    setIsUploading(true);

    try {
      for (const file of selectedFiles) {
        const presign = await requestPresign(file);

        const putResponse = await fetch(presign.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!putResponse.ok) {
          throw new Error("UPLOAD_TO_R2_FAILED");
        }

        const completed = await completeUpload(presign.upload.id);
        setUploadedEvidences((prev) => [...prev, completed]);
      }

      setUploadStatus("证据图片上传成功。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "UPLOAD_FAILED";
      setUploadStatus(`上传失败：${message}`);
    } finally {
      setIsUploading(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  }

  async function handleRemoveEvidence(uploadId: string) {
    setUploadedEvidences((prev) => prev.filter((item) => item.id !== uploadId));
    await discardUpload(uploadId);
    setUploadStatus("已移除该证据图片。");
  }

  function formatFileSize(size: number) {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {initialValues?.quote_id ? "你正在补充当前条目信息，提交后会进入审核队列，审核通过后生效。" : "投稿会进入审核队列，不会直接公开。"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {state.formError ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.formError}</p> : null}

        <form action={formAction} className="space-y-5">
          {initialValues?.quote_id ? <input name="quote_id" type="hidden" value={initialValues.quote_id} /> : null}
          <div className="space-y-2">
            <Label htmlFor="original_text">原文 *</Label>
            <Textarea
              defaultValue={state.values.original_text || initialValues?.original_text || ""}
              id="original_text"
              name="original_text"
              placeholder="请输入原文"
              rows={5}
            />
            <FieldError message={state.fieldErrors.original_text} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="language">语言 *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue={state.values.language || initialValues?.language || ""}
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
              <Input
                defaultValue={state.values.raw_work_title || initialValues?.raw_work_title || ""}
                id="raw_work_title"
                name="raw_work_title"
                placeholder="请输入作品名"
              />
              <FieldError message={state.fieldErrors.raw_work_title} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="raw_author_name">作者名 *</Label>
              <Input
                defaultValue={state.values.raw_author_name || initialValues?.raw_author_name || ""}
                id="raw_author_name"
                name="raw_author_name"
                placeholder="请输入作者名"
              />
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
                defaultValue={state.values.raw_source_location || initialValues?.raw_source_location || ""}
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
              defaultValue={state.values.raw_translated_text || initialValues?.raw_translated_text || ""}
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

          <div className="space-y-3 rounded-md border p-4">
            <p className="text-sm font-medium">标签（可多选）*</p>
            <div className="space-y-3">
              {(Object.keys(groupedTags) as tag_type[]).map((group) =>
                groupedTags[group].length > 0 ? (
                  <div className="space-y-2" key={group}>
                    <p className="text-xs text-muted-foreground">{tagGroupLabel[group]}</p>
                    <div className="flex flex-wrap gap-2">
                      {groupedTags[group].map((tag) => (
                        <label className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm" key={tag.id}>
                          <input
                            defaultChecked={selectedTagIds.includes(tag.id)}
                            name="tag_ids"
                            type={group === "LEARNING" ? "radio" : "checkbox"}
                            value={tag.id}
                          />
                          <span>{tag.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null,
              )}
            </div>
            <FieldError message={state.fieldErrors.tag_ids} />
          </div>

          <div className="space-y-4 rounded-md border p-4">
            <p className="text-sm font-medium">{initialValues?.quote_id ? "证据（可选）" : "证据（至少一种）*"}</p>

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
              <Label htmlFor="evidence_file">证据图片上传（最多 3 张，每张 ≤ 5MB）</Label>
              <Input
                accept="image/jpeg,image/png,image/webp"
                id="evidence_file"
                multiple
                onChange={handleFileSelection}
                ref={fileInputRef}
                type="file"
              />
              <p className="text-xs text-muted-foreground">支持 JPG / PNG / WEBP。上传后将用于管理员审核。</p>
              {isUploading ? <p className="text-xs text-muted-foreground">图片上传中，请稍候...</p> : null}
              {uploadStatus ? <p className="text-xs text-muted-foreground">{uploadStatus}</p> : null}
              {uploadedEvidences.length > 0 ? (
                <div className="space-y-2">
                  {uploadedEvidences.map((item) => (
                    <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm" key={item.id}>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.mime_type} · {formatFileSize(item.size)}
                        </p>
                      </div>
                      <button
                        className="ml-3 text-xs text-muted-foreground underline-offset-4 hover:underline"
                        onClick={() => {
                          void handleRemoveEvidence(item.id);
                        }}
                        type="button"
                      >
                        移除
                      </button>
                      <input name="uploaded_evidence_ids" type="hidden" value={item.id} />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <FieldError message={state.fieldErrors.evidence} />
          </div>

          <TurnstileWidget action={initialValues?.quote_id ? "submit-revision" : "submit-quote"} siteKey={turnstileSiteKey ?? ""} />

          <Button disabled={isPending} type="submit">
            {isPending ? "提交中..." : "提交审核"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
