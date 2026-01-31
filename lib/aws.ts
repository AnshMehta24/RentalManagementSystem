import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";

const isLocal = !!process.env.S3_ENDPOINT;

const s3 = new S3Client({
  region: process.env.S3_REGION as string,
  ...(isLocal && {
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
  }),
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.S3_ACCESS_KEY_SECRET as string,
  },
});

async function streamToBuffer(stream: Readable) {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

async function save(file: File, path: string) {
  const params: PutObjectCommandInput = {
    Body: Buffer.from(await file.arrayBuffer()),
    Bucket: process.env.S3_BUCKET as string,
    Key: path,
    ContentType: file.type,
  };
  const uploadCommand = new PutObjectCommand(params);
  await s3.send(uploadCommand);
  return path;
}

async function getObject(filePath: string) {
  const readCommand = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET as string,
    Key: filePath,
  });
  const object = await s3.send(readCommand);

  if (object.Body === undefined) {
    throw new Error("File not found", { cause: 404 });
  }

  return object;
}

async function deleteObject(filePath: string): Promise<void> {
  const deleteCommand = new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET as string,
    Key: filePath,
  });

  await s3.send(deleteCommand);
}

async function getPreviewUrl(filePath: string): Promise<string | null> {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET as string,
    Key: filePath,
  });

  return await getSignedUrl(s3, command, { expiresIn: 3600 });
}

async function saveAndGetPreviewUrl(file: File, path: string) {
  await save(file, path);
  return await getPreviewUrl(path);
}

async function copyObject(sourceKey: string, destinationKey: string) {
  const bucket = process.env.S3_BUCKET as string;

  const copyCommand = new CopyObjectCommand({
    Bucket: bucket,
    CopySource: `${bucket}/${sourceKey}`,
    Key: destinationKey,
  });

  await s3.send(copyCommand);
}

const s3Service = {
  save,
  getObject,
  deleteObject,
  getPreviewUrl,
  saveAndGetPreviewUrl,
  streamToBuffer,
  copyObject,
};

export default s3Service;
