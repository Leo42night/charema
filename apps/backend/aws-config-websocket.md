## Bagian 1: Buat Tabel DynamoDB

1. Buka **AWS Console → DynamoDB → Tables → Create table**
2. Isi:
   - **Table name**: `ws-connections`
   - **Partition key**: `connectionId` — tipe **String**
3. Table settings pilih **Default settings** (on-demand/pay-per-request sudah cukup, murah karena traffic connect/disconnect biasanya kecil)
4. Klik **Create table**, tunggu status jadi **Active**

## Bagian 2: Buat Lambda Function untuk `$connect` dan `$disconnect`

Karena Lambda HTTP kamu yang sekarang (Elysia) itu untuk REST API, kamu butuh **2 Lambda function baru** khusus untuk WebSocket lifecycle (terpisah dari Elysia).

1. **Lambda → Create function**
   - Name: `ws-connect-handler`
   - Runtime: **Node.js 20.x** (atau versi yang kamu pakai)
   - Buat lagi satu: `ws-disconnect-handler`

2. Untuk masing-masing, paste kode ini ke dalam file `index.mjs` nya (build dulu TS ini jadi JS biasa):
```sh
bun build ./src/ws/connect.ts --outdir ./dist-lambda-ws/connect --target=node --format=esm --external @aws-sdk/client-dynamodb
bun build ./src/ws/disconnect.ts --outdir ./dist-lambda-ws/disconnect --target=node --format=esm --external @aws-sdk/client-dynamodb
move /y dist-lambda-ws\connect\connect.js dist-lambda-ws\connect\index.mjs
move /y dist-lambda-ws\disconnect\disconnect.js dist-lambda-ws\disconnect\index.mjs
cd dist-lambda-ws/connect
bun init -y
bun add @aws-sdk/client-dynamodb
cd ../disconnect
bun init -y
bun add @aws-sdk/client-dynamodb
# zip and upload
powershell -NoProfile -Command "Compress-Archive -Path * -DestinationPath ../disconnect.zip -Force"
cd ../connect 
powershell -NoProfile -Command "Compress-Archive -Path * -DestinationPath ../connect.zip -Force" 
cd ..
aws lambda update-function-code --function-name ws-connect-handler --zip-file fileb://connect.zip
aws lambda update-function-code --function-name ws-disconnect-handler --zip-file fileb://disconnect.zip
```

3. Untuk **masing-masing** Lambda ini, tambahkan permission ke DynamoDB:
   - Buka tab **Configuration → Permissions**
   - Klik role di bagian **Execution role** → buka di IAM
   - **Add permissions → Attach policies** → cari `AmazonDynamoDBFullAccess` (untuk testing cepat; nanti bisa dipersempit jadi custom policy yang cuma `PutItem`/`DeleteItem` ke tabel `ws-connections` saja)

## Bagian 3: Buat API Gateway WebSocket API

1. **API Gateway → Create API → WebSocket API** (pilih **Build**)
2. Isi:
   - **API name**: `achievement-ws-api`
   - **Route selection expression**: `$request.body.action` (default, dibiarkan aja — kita gak akan pakai custom action dari client, cuma butuh connect/disconnect)
3. **Add route** — API Gateway otomatis kasih 3 default route: `$connect`, `$disconnect`, `$default`. Cukup pakai 2 yang pertama.
4. Klik **Next** — di halaman **Attach integrations**.
5. **Next → Create stage** -> Create:
   - Stage name: `production` (atau `dev`, bebas — ini akan jadi bagian dari URL)
   - Auto-deploy: **ON** (biar tiap perubahan langsung ke-deploy)
6. Create Route (setelah dibuat):
   - Route `$connect` → **Integration type: Lambda** → Lambda proxy integration (True) -> pilih `ws-connect-handler`
   - Route `$disconnect` → **Integration type: Lambda** → Lambda proxy integration (True) -> pilih `ws-disconnect-handler`
6. **Deploy**

```sh
# Buat IAM Role untuk CloudWatch logging API Gateway (full watch)
## IAM -> Roles (add) -> Service or use case: API Gateway, name: IaAPIGatewayCloudWatchLogsRole
## Salin ARN nya, cth: "arn:aws:iam::677276111234:role/APIGatewayCloudWatchLogsRole". paste di API Gateway -> Setting (di sidebar kiri) -> CloudWatch log role ARN (paste ARN)
# Set logging di stage
aws apigatewayv2 update-stage  --api-id tkiidjhcn9  --stage-name production  --default-route-settings "DetailedMetricsEnabled=true,LoggingLevel=INFO,DataTraceEnabled=true"  --region us-east-1
## Ini akan bikin log group baru bernama semacam API-Gateway-Execution-Logs_tkiidjhcn9/production. Cek di CloudWatch → Log groups 
```

Setelah selesai, kamu akan dapat 2 URL penting di halaman **Stages**:

- **WebSocket URL** (dipakai frontend, format `wss://`):
  ```
  wss://{api-id}.execute-api.{region}.amazonaws.com/production
  ```
- **Connection URL / Invoke URL untuk management** (dipakai backend broadcast, format `https://`):
  ```
  https://{api-id}.execute-api.{region}.amazonaws.com/production
  ```

Kedua-duanya punya `{api-id}` yang sama, cuma beda protokol dan penggunaan.

## Bagian 4: Kasih izin Lambda Elysia kamu untuk broadcast

Lambda **Elysia (HTTP)** kamu yang manggil `broadcastLeaderboard()` butuh izin `execute-api:ManageConnections`:

1. Buka Lambda Elysia kamu → **Configuration → Permissions → Execution role** → klik masuk ke IAM
2. **Add permissions → Create inline policy** → tab **JSON**, paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "execute-api:ManageConnections",
      "Resource": "arn:aws:execute-api:*:*:*/*/@connections/*"
    }
  ]
}
```

3. Simpan dengan nama misal `AllowWsBroadcast`

4. BE Lambda Function Anda yang memiliki role `remaku-be-role-436m8eol` perlu diberikan izin (IAM Policy) untuk membaca dan menghapus data dari tabel DynamoDB ws-connections.
    - IAM -> role `remaku-be-role-436m8eol` -> tab `Permissions` -> klik tombol Add permissions -> Create inline policy (beri nama `DynamoDBWebSocketAccess`)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:Scan",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:677276114550:table/ws-connections"
    }
  ]
}

```


## Bagian 5: Set environment variable di Lambda Elysia

Di Lambda Elysia kamu (**Configuration → Environment variables**), tambahkan:

```
WS_MANAGEMENT_ENDPOINT = https://{api-id}.execute-api.{region}.amazonaws.com/production
```

Ini dipakai di kode `broadcast.ts` yang sudah aku kasih sebelumnya.

## Bagian 6: Test koneksi manual (sebelum sambung ke React)

Pakai `wscat` buat tes cepat dari terminal Termux kamu:

```bash
npm install -g wscat
wscat -c wss://{api-id}.execute-api.{region}.amazonaws.com/production
wscat -c wss://tkiidjhcn9.execute-api.us-east-1.amazonaws.com/production
# Jika error:
# error: WebSocket connection to 'wss://{api-id}.execute-api.{region}.amazonaws.com/production' failed: Expected 101 status code
# Buka masing-masing Lambda Connect & Disconnect:
## Configuration → Permissions -> Scroll ke bawah ke "Resource-based policy statements"
## Harus ada minimal 1 statement Service: API Gateway Principal: apigateway.amazonaws.com
## Jika tidak ada, buka route $connect & $disconnect di API Gateway → klik integration-nya → hapus lalu attach ulang ke Lambda. Cek Apakah policy Statement di lambda di auto-generated.
# cek config api gateway
aws apigatewayv2 get-integrations --api-id tkiidjhcn9 --region us-east-1
```

Kalau berhasil connect, cek di **DynamoDB → Tables → ws-connections → Explore table items** — harus muncul 1 row `connectionId`. Tutup koneksi (`Ctrl+C`), cek lagi row-nya harus hilang (disconnect handler jalan).

---

Setelah ini semua jalan, tinggal integrasikan kode `broadcastLeaderboard()` dan hook React yang sudah aku kasih di jawaban sebelumnya — endpoint-nya tinggal disesuaikan sama URL yang kamu dapat dari Bagian 3.

Mau lanjut ke bagian **testing dari route `/achievement`** langsung (kirim POST, cek broadcast masuk ke wscat), atau langsung ke integrasi React-nya?