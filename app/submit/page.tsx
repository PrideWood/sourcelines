import { SubmitForm } from "@/components/submit/submit-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const languages = await prisma.language.findMany({
    where: { is_active: true },
    orderBy: { name_en: "asc" },
    select: {
      code: true,
      name_en: true,
      name_native: true,
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">投稿引文</h1>
        <p className="text-sm text-muted-foreground">请尽量提供准确来源与证据，便于审核通过后标准化入库。</p>
      </header>

      <SubmitForm languages={languages} />
    </div>
  );
}
