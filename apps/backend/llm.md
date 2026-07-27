# LLM
LLM Free or Limited (billing not needed). Menjawab pertanyaan secara natural, mengambil kontext di Backend apabila diperlukan.

## Gemini

```sh
bun add @google/genai

# konfigurasi API_KEY (di https://aistudio.google.com/api-keys) No billing needed
GEMINI_API_KEY=isi_dengan_api_key_gemini_anda

# set route
/chat/gemini

# test di CMD
curl -X POST http://localhost:3000/chat/gemini -H "Content-Type: application/json" -d "{\"prompt\": \"Berikan saya rekomendasi matkul\",\"userName\": \"Leo Prangs Tobing\"}"
curl -X POST http://localhost:3000/chat/gemini -H "Content-Type: application/json" -d "{\"prompt\": \"Sejarah kota tua\",\"userName\": \"Leo Prangs Tobing\"}"
```

## Groq

```sh
bun add openai

# env (di https://console.groq.com/keys)
GROQ_API_KEY=isi_dengan_api_key_groq_anda

# set route & test
curl -X POST http://localhost:3000/chat/groq -H "Content-Type: application/json" -d "{\"prompt\": \"Berikan saya rekomendasi matkul\",\"userName\": \"Leo Prangs Tobing\"}"
```

## OpenRouter
```sh
# key (https://openrouter.ai)
OPENROUTER_API_KEY=isi_dengan_api_key_openrouter_anda

# set route & test
curl -X POST http://localhost:3000/chat/openrouter -H "Content-Type: application/json" -d "{\"prompt\": \"Berikan saya rekomendasi matkul\",\"userName\": \"Leo Prangs Tobing\"}"
```

## Mistral
```sh
bun add @mistralai/mistralai
# key (https://admin.mistral.ai/organization/api-keys)
MISTRAL_API_KEY=isi_dengan_api_key_mistral_anda

# set route & test
curl -X POST http://localhost:3000/chat/mistral -H "Content-Type: application/json" -d "{\"prompt\": \"Berikan saya rekomendasi matkul\",\"userName\": \"Leo Prangs Tobing\"}"
```

## z.ai
```sh
# pakai `openapi` library
# key (https://z.ai/manage-apikey/apikey-list)
Z_AI_API_KEY

# set route & test
curl -X POST http://localhost:3000/chat/mistral -H "Content-Type: application/json" -d "{\"prompt\": \"Berikan saya rekomendasi matkul\",\"userName\": \"Leo Prangs Tobing\"}"
```

## Github Model
```sh
# pakai `openapi` library
# key (https://github.com/marketplace/models/azure-openai/gpt-5/playground -> Use This Model)
GITHUB_TOKEN

# set route & test
curl -X POST http://localhost:3000/chat/github -H "Content-Type: application/json" -d "{\"prompt\": \"Berikan saya rekomendasi matkul\",\"userName\": \"Leo Prangs Tobing\"}"
```

## Failed or Stall
- Nvidia nuggu konfirmasi nomor
- xai grok tidak ada free tier
- cerebras perlu pasang credit card
- Replicate ada credit q pakai pribadi
- together.ai perlu saldo awal $5