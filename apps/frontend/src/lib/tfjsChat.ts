import * as tf from "@tensorflow/tfjs";
import { loadEncryptedJSON } from "./loadEncryptedJSON";

export interface SendChatResponse {
  predictedTag: string;
  probability: number;
  randomResponse: string;
}

/* =========================
   STATE
========================= */
let modelAi: tf.GraphModel | null = null;
let modelLoading = false;

let wordIndexAi: Record<string, number> = {};
let responsesAi: Record<string, string[]> = {};
let classLabelsAi: string[] = [];
let maxLenAi = 0;

/* =========================
   INIT MODEL
========================= */
export const initModelAi = async (): Promise<void> => {
  if (modelAi || modelLoading) return;

  modelLoading = true;

  try {
    // console.log("🚀 Loading TFJS model...");

    // LOAD MODEL (VITE PUBLIC FOLDER)
    modelAi = await tf.loadGraphModel(
      "/tfjs_saved_model/model.json"
    );

    const inputShape = modelAi.inputs?.[0]?.shape;
    if (!inputShape || !inputShape[1]) {
      throw new Error("Invalid model input shape");
    }

    // console.log("📦 Model loaded");
    // console.log("📊 Model inputs:", modelAi.inputs);
    // console.log("📊 Model outputs:", modelAi.outputs);

    maxLenAi = inputShape[1] as number;
    // console.log("📏 maxLen:", maxLenAi);

    // LOAD ENCRYPTED DATA
    // console.log("🔐 Loading encrypted word_index...");
    wordIndexAi = await loadEncryptedJSON(
      "/tfjs_saved_model/word_index.json.enc"
    );

    // console.log("🔐 Loading encrypted content...");
    responsesAi = await loadEncryptedJSON(
      "/tfjs_saved_model/content.json.enc"
    );

    classLabelsAi = Object.keys(responsesAi);

    // console.log("📚 classLabels:", classLabelsAi);
    // console.log("💬 responses loaded:", responsesAi);

    // console.log("✅ TFJS INIT COMPLETE");
  } catch (err) {
    console.error("❌ MODEL INIT ERROR:", err);
    throw err;
  } finally {
    modelLoading = false;
  }
};

/* =========================
   PREPROCESS (FIXED)
========================= */
const cleanText = (text: string): string => {
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();

  // console.log("🧹 Cleaned text:", cleaned);
  return cleaned;
};

const tokenize = (text: string): number[] => {
  const words = text.trim().split(/\s+/);

  const tokens = words.map((word) => {
    const index = wordIndexAi[word];

    return typeof index === "number" && !isNaN(index)
      ? index
      : 0;
  });

  // console.log("🔤 Words:", words);
  // console.log("🔢 Tokens:", tokens);

  return tokens;
};

/* =========================
   PAD SEQUENCES (MATCH TRAINING)
========================= */
const padSequences = (
  sequences: number[][],
  maxlen: number,
  padding: "pre" | "post" = "pre",
  truncating: "pre" | "post" = "pre"
): number[][] => {
  return sequences.map((seq) => {
    let processed = seq;

    // truncate
    if (seq.length > maxlen) {
      processed =
        truncating === "pre"
          ? seq.slice(seq.length - maxlen)
          : seq.slice(0, maxlen);
    }

    const padded = new Array(maxlen).fill(0);

    const offset =
      padding === "pre" ? maxlen - processed.length : 0;

    for (let i = 0; i < processed.length; i++) {
      padded[offset + i] =
        typeof processed[i] === "number"
          ? processed[i]
          : 0;
    }

    return padded;
  });
};

/* =========================
   PREDICT
========================= */
const predict = async (text: string): Promise<number[]> => {
  if (!modelAi) throw new Error("Model not loaded");

  const cleaned = cleanText(text);
  const tokens = tokenize(cleaned);
  const padded = padSequences([tokens], maxLenAi, "pre");

  // console.log("🧩 PADDED INPUT:", padded[0]);

  const inputTensor = tf.tensor2d(
    padded,
    [1, maxLenAi]
  );

  inputTensor.print();

  try {
    const output = modelAi.predict(inputTensor) as tf.Tensor;

    const result = (await output.array()) as number[][];

    // console.log("📈 RAW OUTPUT:", result[0]);

    output.dispose();

    return result[0];
  } finally {
    inputTensor.dispose();
  }
};

/* =========================
   MAIN FUNCTION
========================= */
export const sendChatTfjs = async (
  text: string
): Promise<SendChatResponse> => {
  // console.log("💬 INPUT TEXT:", text);

  await initModelAi();

  if (!modelAi) throw new Error("Model not ready");

  const output = await predict(text);

  const maxValue = Math.max(...output);
  const index = output.indexOf(maxValue);

  // console.log("🎯 PROBABILITIES:", output);
  // console.log("🏆 MAX VALUE:", maxValue);
  // console.log("📌 INDEX:", index);

  if (index === -1 || !classLabelsAi[index]) {
    console.warn("⚠️ Invalid prediction index");

    return {
      predictedTag: "unknown",
      probability: 0,
      randomResponse: "Maaf, saya tidak mengerti.",
    };
  }

  const tag = classLabelsAi[index];
  const probability = output[index] ?? 0;

  const possibleResponses = responsesAi[tag] ?? [];

  const randomResponse =
    possibleResponses.length > 0
      ? possibleResponses[
      Math.floor(
        Math.random() * possibleResponses.length
      )
      ]
      : "Maaf, saya tidak mengerti.";

  // console.log("🏷 TAG:", tag);
  // console.log("📊 PROBABILITY:", Math.round(probability * 100));
  // console.log("💬 RESPONSE:", randomResponse);

  return {
    predictedTag: tag,
    probability: Math.round(probability * 100),
    randomResponse,
  };
};