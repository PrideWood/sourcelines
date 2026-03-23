import { verification_status } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

export async function getQuotesList() {
  return getQuotesListForUser(null);
}

export async function getQuotesListForUser(userId: string | null) {
  try {
    return await prisma.quote.findMany({
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
    return await prisma.favorite.findMany({
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
    });
  } catch (error) {
    console.error("[queries] getFavoritesByUserId failed", error);
    return [];
  }
}

export async function getSubmissionsByUserId(userId: string) {
  try {
    return await prisma.submission.findMany({
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
    });
  } catch (error) {
    console.error("[queries] getSubmissionsByUserId failed", error);
    return [];
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
    return await prisma.submission.findUnique({
      where: { id },
      include: {
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
          orderBy: { created_at: "asc" },
        },
        published_quote: {
          select: {
            id: true,
          },
        },
      },
    });
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
