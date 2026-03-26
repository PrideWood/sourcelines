import { prisma } from "@/lib/prisma";

type RateLimitBucketDelegate = {
  findUnique(args: {
    where: { key: string };
  }): Promise<{ key: string; count: number; window_start: Date } | null>;
  upsert(args: {
    where: { key: string };
    update: {
      count: number;
      window_start: Date;
    };
    create: {
      key: string;
      count: number;
      window_start: Date;
    };
  }): Promise<unknown>;
  update(args: {
    where: { key: string };
    data: {
      count: {
        increment: number;
      };
    };
  }): Promise<unknown>;
};

export class RateLimitError extends Error {
  retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function isDatabaseRateLimitEnabled() {
  return process.env.ENABLE_DB_RATE_LIMIT === "true";
}

export async function enforceRateLimit({
  key,
  limit,
  windowSeconds,
  message = "请求过于频繁，请稍后再试。",
}: {
  key: string;
  limit: number;
  windowSeconds: number;
  message?: string;
}) {
  // Database-backed rate limiting is temporarily opt-in.
  // This keeps auth and submission flows available if the runtime database
  // has not applied the required migration yet.
  if (!isDatabaseRateLimitEnabled()) {
    return;
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  const hasRateLimitDelegate =
    typeof prisma === "object" &&
    prisma != null &&
    "rateLimitBucket" in prisma &&
    typeof (prisma as { rateLimitBucket?: unknown }).rateLimitBucket === "object" &&
    (prisma as { rateLimitBucket?: unknown }).rateLimitBucket != null;

  // Fail open if the generated Prisma client or migrated database is not ready yet.
  // Abuse protection should not take the main submission/auth flow down.
  if (!hasRateLimitDelegate) {
    return;
  }

  let result: {
    allowed: boolean;
    retryAfterSeconds: number;
  };

  try {
    result = await prisma.$transaction(async (tx) => {
      const rateLimitBucket = (tx as typeof tx & {
        rateLimitBucket?: RateLimitBucketDelegate;
      }).rateLimitBucket;

      if (!rateLimitBucket) {
        return {
          allowed: true,
          retryAfterSeconds: 0,
        };
      }

      const current = await rateLimitBucket.findUnique({
        where: { key },
      });

      if (!current || current.window_start < windowStart) {
        await rateLimitBucket.upsert({
          where: { key },
          update: {
            count: 1,
            window_start: now,
          },
          create: {
            key,
            count: 1,
            window_start: now,
          },
        });

        return {
          allowed: true,
          retryAfterSeconds: 0,
        };
      }

      if (current.count >= limit) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((current.window_start.getTime() + windowSeconds * 1000 - now.getTime()) / 1000),
        );

        return {
          allowed: false,
          retryAfterSeconds,
        };
      }

      await rateLimitBucket.update({
        where: { key },
        data: {
          count: {
            increment: 1,
          },
        },
      });

      return {
        allowed: true,
        retryAfterSeconds: 0,
      };
    });
  } catch {
    // Fail open if the database schema or runtime client still doesn't match.
    return;
  }

  if (!result.allowed) {
    throw new RateLimitError(message, result.retryAfterSeconds);
  }
}
