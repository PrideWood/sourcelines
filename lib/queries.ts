import { unstable_cache } from "next/cache";
import { difficulty_level, verification_status } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasSubmissionTagsTable } from "@/lib/submission-tags";

export type BrowseQuoteFilters = {
  q?: string;
  language?: string;
  verificationStatus?: string;
  difficultyLevel?: string;
  translated?: "yes" | "no";
  tagSlug?: string;
};

function buildBrowseQuoteWhere(filters?: BrowseQuoteFilters) {
  const verification = filters?.verificationStatus;
  const difficulty = filters?.difficultyLevel;
  const q = filters?.q?.trim() ?? "";

  return {
    ...(filters?.language ? { original_language: filters.language } : {}),
    ...(verification && Object.values(verification_status).includes(verification as verification_status)
      ? { verification_status: verification as verification_status }
      : {}),
    ...(difficulty && Object.values(difficulty_level).includes(difficulty as difficulty_level)
      ? { difficulty_level: difficulty as difficulty_level }
      : {}),
    ...(filters?.translated === "yes" ? { translation_text: { not: null } } : {}),
    ...(filters?.translated === "no" ? { translation_text: null } : {}),
    ...(filters?.tagSlug
      ? {
          quote_tags: {
            some: {
              tag: {
                slug: filters.tagSlug,
              },
            },
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { original_text: { contains: q, mode: "insensitive" as const } },
            { translation_text: { contains: q, mode: "insensitive" as const } },
            { source_locator: { contains: q, mode: "insensitive" as const } },
            { source_title: { contains: q, mode: "insensitive" as const } },
            { author: { is: { name: { contains: q, mode: "insensitive" as const } } } },
            { work: { is: { title: { contains: q, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
  };
}

export async function getHomeQuotes(limit = 6) {
  return getHomeQuotesForUser(limit, null);
}

export async function getHomeQuotesForUser(limit = 6, userId: string | null) {
  try {
    return await prisma.quote.findMany({
      orderBy: { created_at: "desc" },
      take: limit,
      include: {
        author: true,
        work: true,
        ...(userId
          ? {
              favorites: {
                where: { user_id: userId },
                select: { user_id: true },
              },
            }
          : {}),
        quote_tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("[queries] getHomeQuotesForUser failed", error);
    return [];
  }
}

function getDayKey(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function stableHash(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getDailyQuoteIdCache(dayKey: string, timeZone: string) {
  return unstable_cache(
    async () => {
      const total = await prisma.quote.count();
      if (total === 0) {
        return null;
      }

      const index = stableHash(dayKey) % total;
      const quote = await prisma.quote.findFirst({
        orderBy: [{ created_at: "asc" }, { id: "asc" }],
        skip: index,
        select: { id: true },
      });

      return quote?.id ?? null;
    },
    [`daily-quote-id:${timeZone}:${dayKey}`],
    {
      revalidate: 300,
      tags: [`daily-quote:${timeZone}:${dayKey}`],
    },
  );
}

export async function getDailyQuoteForUser(userId: string | null, timeZone = "Asia/Shanghai") {
  try {
    const dayKey = getDayKey(timeZone);
    const quoteId = await getDailyQuoteIdCache(dayKey, timeZone)();

    if (quoteId == null) {
      return null;
    }

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        author: true,
        work: true,
        ...(userId
          ? {
              favorites: {
                where: { user_id: userId },
                select: { user_id: true },
              },
            }
          : {}),
        quote_tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return quote;
  } catch (error) {
    console.error("[queries] getDailyQuoteForUser failed", error);
    return null;
  }
}

export async function getQuotesList() {
  return getQuotesListForUser(null);
}

export async function getQuotesListForUser(
  userId: string | null,
  filters?: BrowseQuoteFilters,
) {
  try {
    return await prisma.quote.findMany({
      where: buildBrowseQuoteWhere(filters),
      orderBy: { created_at: "desc" },
      include: {
        author: true,
        work: true,
        ...(userId
          ? {
              favorites: {
                where: { user_id: userId },
                select: { user_id: true },
              },
            }
          : {}),
        quote_tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("[queries] getQuotesListForUser failed", error);
    return [];
  }
}

export async function getBrowseQuotesPageForUser(
  userId: string | null,
  filters: BrowseQuoteFilters,
  pagination?: {
    offset?: number;
    limit?: number;
  },
) {
  const offset = Math.max(0, pagination?.offset ?? 0);
  const limit = Math.min(Math.max(1, pagination?.limit ?? 12), 20);

  try {
    const quotes = await prisma.quote.findMany({
      where: buildBrowseQuoteWhere(filters),
      orderBy: { created_at: "desc" },
      skip: offset,
      take: limit + 1,
      include: {
        author: true,
        work: true,
        ...(userId
          ? {
              favorites: {
                where: { user_id: userId },
                select: { user_id: true },
              },
            }
          : {}),
        quote_tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return {
      items: quotes.slice(0, limit),
      hasMore: quotes.length > limit,
      nextOffset: offset + Math.min(quotes.length, limit),
    };
  } catch (error) {
    console.error("[queries] getBrowseQuotesPageForUser failed", error);
    return {
      items: [],
      hasMore: false,
      nextOffset: offset,
    };
  }
}

export async function getQuoteById(id: string) {
  return getQuoteByIdForUser(id, null);
}

export async function getQuoteByIdForUser(id: string, userId: string | null) {
  try {
    return await prisma.quote.findUnique({
      where: { id },
      include: {
        author: true,
        work: true,
        ...(userId
          ? {
              favorites: {
                where: { user_id: userId },
                select: { user_id: true },
              },
            }
          : {}),
        quote_tags: {
          include: {
            tag: true,
          },
        },
        quote_evidences: true,
      },
    });
  } catch (error) {
    console.error("[queries] getQuoteByIdForUser failed", error);
    return null;
  }
}

export async function getFavoritesByUserId(userId: string) {
  try {
    const getCachedFavorites = unstable_cache(
      async () =>
        prisma.favorite.findMany({
          where: { user_id: userId },
          orderBy: { created_at: "desc" },
          include: {
            quote: {
              include: {
                author: true,
                work: true,
                quote_tags: {
                  include: {
                    tag: true,
                  },
                },
                favorites: {
                  where: { user_id: userId },
                  select: { user_id: true },
                },
              },
            },
          },
        }),
      [`favorites-by-user:${userId}`],
      {
        revalidate: 20,
        tags: [`favorites:${userId}`],
      },
    );

    return await getCachedFavorites();
  } catch (error) {
    console.error("[queries] getFavoritesByUserId failed", error);
    return [];
  }
}

export async function getSubmissionsByUserId(userId: string) {
  try {
    const getCachedSubmissions = unstable_cache(
      async () =>
        prisma.submission.findMany({
          where: { submitter_id: userId },
          orderBy: { created_at: "desc" },
          include: {
            original_language_ref: true,
            _count: {
              select: {
                submission_evidences: true,
              },
            },
          },
        }),
      [`submissions-by-user:${userId}`],
      {
        revalidate: 20,
        tags: [`submissions:${userId}`],
      },
    );

    return await getCachedSubmissions();
  } catch (error) {
    console.error("[queries] getSubmissionsByUserId failed", error);
    return [];
  }
}

export async function getAccountUserById(userId: string) {
  try {
    const getCachedAccountUser = unstable_cache(
      async () =>
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            email: true,
            display_name: true,
            role: true,
          },
        }),
      [`account-user:${userId}`],
      {
        revalidate: 30,
        tags: [`account:${userId}`],
      },
    );

    return await getCachedAccountUser();
  } catch (error) {
    console.error("[queries] getAccountUserById failed", error);
    return null;
  }
}

export async function getAdminSubmissionQueue() {
  try {
    return await prisma.submission.findMany({
      orderBy: { created_at: "desc" },
      include: {
        submitter: {
          select: {
            id: true,
            display_name: true,
            email: true,
          },
        },
        original_language_ref: {
          select: {
            code: true,
            name_en: true,
            name_native: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("[queries] getAdminSubmissionQueue failed", error);
    return [];
  }
}

export async function getAdminSubmissionById(id: string) {
  try {
    const includeBase = {
      submitter: {
        select: {
          id: true,
          display_name: true,
          email: true,
        },
      },
      reviewer: {
        select: {
          id: true,
          display_name: true,
          email: true,
        },
      },
      original_language_ref: {
        select: {
          code: true,
          name_en: true,
          name_native: true,
        },
      },
      submission_evidences: {
        orderBy: { created_at: "asc" as const },
      },
      published_quote: {
        select: {
          id: true,
        },
      },
    };

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: includeBase,
    });
    if (!submission) {
      return null;
    }

    if (!(await hasSubmissionTagsTable())) {
      return {
        ...submission,
        submission_tags: [],
      };
    }

    const tags = await prisma.$queryRaw<Array<{ id: string; name: string; tag_type: string }>>`
      SELECT t.id, t.name, t.tag_type::text AS tag_type
      FROM submission_tags st
      INNER JOIN tags t ON t.id = st.tag_id
      WHERE st.submission_id = ${id}
      ORDER BY t.name ASC
    `;

    return {
      ...submission,
      submission_tags: tags.map((tag) => ({
        tag: {
          id: tag.id,
          name: tag.name,
          tag_type: tag.tag_type,
        },
      })),
    };
  } catch (error) {
    console.error("[queries] getAdminSubmissionById failed", error);
    return null;
  }
}

export async function getAdminQuotes(filters?: { verificationStatus?: string; language?: string }) {
  const verification = filters?.verificationStatus;

  try {
    return await prisma.quote.findMany({
      where: {
        ...(verification && Object.values(verification_status).includes(verification as verification_status)
          ? { verification_status: verification as verification_status }
          : {}),
        ...(filters?.language ? { original_language: filters.language } : {}),
      },
      orderBy: { created_at: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        work: {
          select: {
            id: true,
            title: true,
          },
        },
        original_language_ref: {
          select: {
            code: true,
            name_en: true,
            name_native: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("[queries] getAdminQuotes failed", error);
    return [];
  }
}

export async function getAdminQuoteById(id: string) {
  try {
    return await prisma.quote.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        work: {
          select: {
            id: true,
            title: true,
          },
        },
        original_language_ref: {
          select: {
            code: true,
            name_en: true,
            name_native: true,
          },
        },
        quote_tags: {
          include: {
            tag: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("[queries] getAdminQuoteById failed", error);
    return null;
  }
}

export async function searchLibrary(query: string, userId: string | null) {
  const q = query.trim();

  if (!q) {
    return {
      quotes: [],
      authors: [],
      works: [],
    };
  }

  try {
    const [quotes, authors, works] = await Promise.all([
      prisma.quote.findMany({
        where: {
          OR: [
            { original_text: { contains: q, mode: "insensitive" } },
            { translation_text: { contains: q, mode: "insensitive" } },
            { source_locator: { contains: q, mode: "insensitive" } },
            { source_title: { contains: q, mode: "insensitive" } },
            { author: { is: { name: { contains: q, mode: "insensitive" } } } },
            { work: { is: { title: { contains: q, mode: "insensitive" } } } },
          ],
        },
        take: 16,
        orderBy: { created_at: "desc" },
        include: {
          author: true,
          work: true,
          ...(userId
            ? {
                favorites: {
                  where: { user_id: userId },
                  select: { user_id: true },
                },
              }
            : {}),
          quote_tags: {
            include: {
              tag: true,
            },
          },
        },
      }),
      prisma.author.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        take: 8,
        orderBy: { name: "asc" },
        select: { id: true, slug: true, name: true },
      }),
      prisma.work.findMany({
        where: { title: { contains: q, mode: "insensitive" } },
        take: 8,
        orderBy: { title: "asc" },
        select: {
          id: true,
          slug: true,
          title: true,
          author: {
            select: { name: true },
          },
        },
      }),
    ]);

    return { quotes, authors, works };
  } catch (error) {
    console.error("[queries] searchLibrary failed", error);
    return {
      quotes: [],
      authors: [],
      works: [],
    };
  }
}
