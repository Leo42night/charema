import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
});

const BUCKET = "chatbot-rekomendasi";
const BASE_PATH = "tfjs-model";

// url generated
const generateSignedUrl = async (key: string) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return await getSignedUrl(s3, command, {
    expiresIn: 60 * 5, // 5 menit
  });
};

export const getTfjsModelUrls = async () => {
  const [modelUrl, wordIndexUrl, contentUrl] =
    await Promise.all([
      generateSignedUrl(`${BASE_PATH}/model.json`),
      generateSignedUrl(`${BASE_PATH}/word_index.json`),
      generateSignedUrl(`${BASE_PATH}/content.json`),
    ]);

  return {
    modelUrl,
    wordIndexUrl,
    contentUrl,
  };
};