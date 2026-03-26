import Link from "next/link";
import { Share2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

type SharePosterButtonProps = {
  quoteId: string;
};

export function SharePosterButton({ quoteId }: SharePosterButtonProps) {
  return (
    <Link className={buttonVariants({ variant: "outline" })} href={`/quotes/${quoteId}/share`}>
      <Share2 className="h-4 w-4" />
      分享
    </Link>
  );
}
