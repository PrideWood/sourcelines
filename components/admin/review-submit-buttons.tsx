"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function ReviewSubmitButtons() {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-wrap gap-2">
      <Button disabled={pending} name="decision" type="submit" value="approved">
        {pending ? "处理中..." : "通过并入库"}
      </Button>
      <Button disabled={pending} name="decision" type="submit" value="rejected" variant="outline">
        {pending ? "处理中..." : "拒绝"}
      </Button>
    </div>
  );
}
