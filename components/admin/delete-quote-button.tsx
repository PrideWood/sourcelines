"use client";

import { useFormStatus } from "react-dom";

type Props = {
  className?: string;
  label?: string;
  pendingLabel?: string;
  confirmText?: string;
};

export function DeleteQuoteButton({
  className,
  label = "删除",
  pendingLabel = "删除中...",
  confirmText = "确认删除这条正式引文吗？该操作不可恢复。",
}: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      className={className}
      disabled={pending}
      onClick={(event) => {
        if (!confirm(confirmText)) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
