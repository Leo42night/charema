// Chat Request & ETL Model API
import axios, { type AxiosResponse } from "axios";
import * as tf from "@tensorflow/tfjs";

type ResponsesMap = Record<string, string[]>;

interface SendChatResponse {
  predictedTag: string;
  probability: number;
  randomResponse: string;
}

interface TagData {
  tag: string;
  input: string[];
  responses: string[];
}

let modelAi: tf.GraphModel | null = null;
let maxLenAi: number = 0;
let wordIndexAi: Record<string, number> = {};
let responsesAi: ResponsesMap = {};
let classLabelsAi: string[] = [];

const etlKey = import.meta.env.VITE_ETL_KEY || "ok";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

const initModelAi = async (): Promise<void> => {
  if (modelAi) return;

  const { modelUrl, wordIndexUrl, contentUrl } =
    await fetch("/api/model-chatbot").then((r) => r.json());

  modelAi = await tf.loadGraphModel(modelUrl);
  maxLenAi = modelAi.inputs[0].shape?.[1] as number; // asumsikan input shape [null, maxLen]

  wordIndexAi = await fetch(wordIndexUrl).then((r) =>
    r.json()
  );

  const content = await fetch(contentUrl).then((r) =>
    r.json()
  );

  classLabelsAi = Object.keys(content);
};

const padSequences = (
  sequences: number[][],
  maxlen: number,
  padding: "pre" | "post" = "post",
  truncating: "pre" | "post" = "post"
): number[][] => {
  return sequences.map((seq) => {
    if (seq.length > maxlen) {
      return truncating === "pre"
        ? seq.slice(seq.length - maxlen)
        : seq.slice(0, maxlen);
    }

    const padded = new Array(maxlen).fill(0);

    const offset =
      padding === "pre"
        ? maxlen - seq.length
        : 0;

    for (let i = 0; i < seq.length; i++) {
      padded[offset + i] = seq[i];
    }

    return padded;
  });
};

const predict = async (
  model: tf.GraphModel,
  maxLen: number,
  wordIndex: Record<string, number>,
  inputText: string
): Promise<number[]> => {
  const cleanedText = inputText
    .toLowerCase()
    .replace(/[^\w\s]/gi, "");

  const tokens: number[][] = [
    cleanedText
      .split(" ")
      .map((word) => wordIndex[word] || 0),
  ];

  const paddedSequences = padSequences(
    tokens,
    maxLen
  );

  const inputTensor = tf.tensor2d(
    paddedSequences,
    [1, maxLen]
  );

  const result = model.predict(inputTensor) as tf.Tensor;

  const arrayResult = await result.array() as number[][];

  inputTensor.dispose();
  result.dispose();

  return arrayResult[0] as number[];
};

export const sendChatTfjs = async (
  inputText: string
): Promise<SendChatResponse> => {
  try {
    await initModelAi();

    if (!modelAi) {
      throw new Error("Model belum dimuat");
    }

    const outputArray = await predict(
      modelAi,
      maxLenAi,
      wordIndexAi,
      inputText
    );

    const predictionIndex = outputArray.indexOf(
      Math.max(...outputArray)
    );

    const predictionValue =
      outputArray[predictionIndex];

    const predictedTag =
      classLabelsAi[predictionIndex];

    const possibleResponses =
      responsesAi[predictedTag] || [];

    const randomResponse =
      possibleResponses[
      Math.floor(
        Math.random() *
        possibleResponses.length
      )
      ] || "Maaf, saya tidak mengerti.";

    return {
      predictedTag,
      probability: Math.round(
        predictionValue * 100
      ),
      randomResponse,
    };
  } catch (error) {
    console.error(
      "Chat model error:",
      error
    );

    throw error;
  }
};

export const createOrUpdateTag = async (
  tagData: TagData
): Promise<any> => {
  try {
    const response = await apiClient.post(
      "/chatbot/tags",
      {
        tag: tagData.tag,
        input: tagData.input,
        responses: tagData.responses,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Create/Update Tag Chatbot API Error:",
      error
    );

    throw error;
  }
};

export const updateTag = async (
  tagId: string,
  tagData: Partial<TagData>
): Promise<AxiosResponse> => {
  try {
    return await apiClient.put(
      `/chatbot/update/${tagId}`,
      tagData
    );
  } catch (error) {
    console.error(
      "Update Tag Chatbot API Error:",
      error
    );

    throw error;
  }
};

export const getAllTags = async (): Promise<AxiosResponse> => {
  try {
    return await apiClient.get(
      "/chatbot/tags"
    );
  } catch (error) {
    console.error(
      "Get All Tags API Error:",
      error
    );

    throw error;
  }
};

export const getAiTags = async (): Promise<AxiosResponse> => {
  try {
    return await apiClient.get(
      "/chatbot/tags"
    );
  } catch (error) {
    console.error(
      "Get AI Tags API Error:",
      error
    );

    throw error;
  }
};

export const getSpecificTag = async (
  tagName: string
): Promise<AxiosResponse> => {
  try {
    return await apiClient.get(
      `/chatbot/tags/${tagName}`
    );
  } catch (error) {
    console.error(
      "Get Specific Tag API Error:",
      error
    );

    throw error;
  }
};

export const deleteTag = async (
  tagId: string
): Promise<AxiosResponse> => {
  try {
    return await apiClient.delete(
      `/chatbot/tags/${tagId}`
    );
  } catch (error) {
    console.error(
      "Delete Tag API Error:",
      error
    );

    throw error;
  }
};

export const etlAi = async (): Promise<void> => {
  try {
    const ETL_TRIGGER_URL = import.meta.env.ETL_TRIGGER_URL || "api";
    await axios.post(
      `${ETL_TRIGGER_URL}/trigger-etl`,
      {
        etl_key: etlKey,
      }
    );
  } catch (error) {
    console.error(
      "Proses ETL Chatbot terdapat kendala:",
      error
    );

    throw error;
  }
};