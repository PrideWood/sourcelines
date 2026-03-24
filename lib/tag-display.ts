export function formatTagLabel(name: string) {
  return name
    .replace(/^来源[:：]\s*/i, "")
    .replace(/^学习难度[:：]\s*/i, "")
    .replace(/^学习难度\s+/i, "")
    .trim();
}
