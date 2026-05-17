import CryptoJS from "crypto-js";

const KEY: string = import.meta.env.VITE_MODEL_CHATBOT_KEY;

export const loadEncryptedJSON = async (url: string) => {
  // console.log("📡 Fetch:", url);

  const res = await fetch(url);

  const text = await res.text();

  // console.log("📦 RAW ENCRYPTED DATA:", text.slice(0, 100));

  const bytes = CryptoJS.AES.decrypt(text, KEY);

  const decrypted = bytes.toString(CryptoJS.enc.Utf8);

  // console.log("🔓 DECRYPT RESULT:", decrypted);

  if (!decrypted) {
    throw new Error(
      "Decrypt failed → hasil kosong (cek KEY atau file corrupt)"
    );
  }

  try {
    return JSON.parse(decrypted);
  } catch (err) {
    console.error("❌ JSON PARSE ERROR");
    // console.log("DECRYPTED CONTENT:", decrypted);
    throw err;
  }
};