// Enkripsi model TFJS di Frontend agar tidak dapat dibaca langsung
import fs from "fs";
import path from "path";
import CryptoJS from "crypto-js";

const KEY: string = process.env.MODEL_ENCRYPT_KEY!; // pseudo security
// console.log(KEY);

function encrypt(data: string) {
  return CryptoJS.AES.encrypt(data, KEY).toString();
}

function processFile(fileName: string) {
  const filePath = path.join(process.cwd(), "../../dev/tfjs_saved_model", fileName);
  const outputPath = path.join(process.cwd(), "../frontend/public/tfjs_saved_model", fileName + ".enc");

  const raw = fs.readFileSync(filePath, "utf-8");
  const encrypted = encrypt(raw);

  // pastikan folder output ada sebelum menulis file
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, encrypted);

  // console.log(`Encrypted: ${fileName}`);
}

processFile("word_index.json");
processFile("content.json");