import { S3Client, DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_COUNT = 3;

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`MISSING_ENV_${name}`);
  }
  return value;
}

export function getR2BucketName() {
  return getRequiredEnv("R2_BUCKET_NAME");
}

export function getR2Client() {
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

export function validateEvidenceImageInput({
  mimeType,
  size,
}: {
  mimeType: string;
  size: number;
}) {
  if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
    throw new Error("UNSUPPORTED_FILE_TYPE");
  }
  if (!Number.isFinite(size) || size <= 0 || size > MAX_IMAGE_SIZE) {
    throw new Error("INVALID_FILE_SIZE");
  }
}

export function getEvidenceLimits() {
  return {
    maxCount: MAX_IMAGE_COUNT,
    maxSize: MAX_IMAGE_SIZE,
    allowedMimeTypes: Array.from(ALLOWED_IMAGE_TYPES),
  };
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function extensionFromMimeType(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "bin";
}

export function buildEvidenceObjectKey({
  userId,
  uploadId,
  filename,
  mimeType,
}: {
  userId: string;
  uploadId: string;
  filename: string;
  mimeType: string;
}) {
  const ext = extensionFromMimeType(mimeType);
  const safeFilename = sanitizeFilename(filename).slice(0, 80) || "evidence";
  return `evidence/tmp/${userId}/${uploadId}-${safeFilename}.${ext}`;
}

export async function getPresignedPutUrl({
  objectKey,
  mimeType,
  expiresInSeconds = 600,
}: {
  objectKey: string;
  mimeType: string;
  expiresInSeconds?: number;
}) {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: getR2BucketName(),
    Key: objectKey,
    ContentType: mimeType,
  });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function getPresignedGetUrl({
  objectKey,
  expiresInSeconds = 900,
}: {
  objectKey: string;
  expiresInSeconds?: number;
}) {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: getR2BucketName(),
    Key: objectKey,
  });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function deleteObjectByKey(objectKey: string) {
  const client = getR2Client();
  const command = new DeleteObjectCommand({
    Bucket: getR2BucketName(),
    Key: objectKey,
  });
  await client.send(command);
}
