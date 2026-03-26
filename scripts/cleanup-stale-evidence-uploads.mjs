import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient, evidence_upload_status } from "@prisma/client";

const prisma = new PrismaClient();

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

function getR2Client() {
  const accountId = getRequiredEnv("R2_ACCOUNT_ID");
  const accessKeyId = getRequiredEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = getRequiredEnv("R2_SECRET_ACCESS_KEY");

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
}

async function run() {
  const bucket = getRequiredEnv("R2_BUCKET_NAME");
  const client = getR2Client();
  const ttlHours = Number(process.env.EVIDENCE_UPLOAD_TTL_HOURS || 48);
  const cutoff = new Date(Date.now() - ttlHours * 60 * 60 * 1000);

  const staleUploads = await prisma.pendingEvidenceUpload.findMany({
    where: {
      status: {
        in: [evidence_upload_status.PENDING, evidence_upload_status.UPLOADED],
      },
      created_at: {
        lt: cutoff,
      },
    },
    select: {
      id: true,
      object_key: true,
      created_at: true,
    },
    take: 500,
    orderBy: {
      created_at: "asc",
    },
  });

  if (staleUploads.length === 0) {
    console.log(`[cleanup-evidence] no stale uploads found before ${cutoff.toISOString()}`);
    return;
  }

  let deletedObjects = 0;
  for (const upload of staleUploads) {
    try {
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: upload.object_key,
        }),
      );
      deletedObjects += 1;
    } catch (error) {
      console.warn(`[cleanup-evidence] delete object failed: ${upload.object_key}`, error);
    }
  }

  const result = await prisma.pendingEvidenceUpload.deleteMany({
    where: {
      id: { in: staleUploads.map((item) => item.id) },
      status: {
        in: [evidence_upload_status.PENDING, evidence_upload_status.UPLOADED],
      },
    },
  });

  console.log(
    `[cleanup-evidence] stale=${staleUploads.length} objectDeleteAttempted=${staleUploads.length} objectDeleteDone=${deletedObjects} dbDeleted=${result.count}`,
  );
}

run()
  .catch((error) => {
    console.error("[cleanup-evidence] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
