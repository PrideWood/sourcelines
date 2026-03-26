import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type LegacyQuotesParams = {
  language?: string;
  verification?: string;
  difficulty?: string;
  tag?: string;
  translated?: string;
  q?: string;
};

function toBrowseHref(params: LegacyQuotesParams) {
  const next = new URLSearchParams();
  (Object.entries(params) as Array<[keyof LegacyQuotesParams, string | undefined]>).forEach(([key, value]) => {
    const normalized = (value ?? "").trim();
    if (normalized.length > 0) {
      next.set(key, normalized);
    }
  });

  const query = next.toString();
  return query.length > 0 ? `/browse?${query}` : "/browse";
}

export default async function LegacyQuotesPage({
  searchParams,
}: {
  searchParams: Promise<LegacyQuotesParams>;
}) {
  const params = await searchParams;
  redirect(toBrowseHref(params));
}
