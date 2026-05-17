import fs from "fs";
import path from "path";
import CryptoJS from "crypto-js";

const KEY: string = process.env.MODEL_ENCRYPT_KEY!; // pseudo security
console.log(KEY);

function encrypt(data: string) {
  return CryptoJS.AES.encrypt(data, KEY).toString();
}

function processFile(fileName: string) {
  const filePath = path.join(process.cwd(), "../frontend/tfjs_saved_model", fileName);
  const outputPath = path.join(process.cwd(), "../frontend/public/tfjs_saved_model", fileName + ".enc");

  const raw = fs.readFileSync(filePath, "utf-8");
  const encrypted = encrypt(raw);

  fs.writeFileSync(outputPath, encrypted);

  console.log(`Encrypted: ${fileName}`);
}

processFile("word_index.json");
processFile("content.json");