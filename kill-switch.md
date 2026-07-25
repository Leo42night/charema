# GCP Kill Switch
Buat 1 project untuk satu tugas khusus. Jadi kill-switch tinggal hapus proyek.

Untuk membuat **kill-switch (otomatisasi pemutus layanan)** saat biaya mendekati atau mencapai batas kuota gratis/anggaran di Google Cloud, kita tidak bisa hanya mengandalkan fitur *Budgets & Alerts* biasa (karena alert default hanya mengirim email).

Kita perlu menghubungkan **Billing Budget** dengan **Pub/Sub** dan **Cloud Functions** untuk secara otomatis menghapus atau menonaktifkan layanan Cloud Run saat budget terlampaui.

Berikut panduan langkah demi langkah untuk mengkonfigurasinya:

---

## Arsitektur Singkat Kill-Switch

```
[Google Billing Budget] ──(Batas Terlampaui)──> [Pub/Sub Topic] ──> [Cloud Function] ──> [Mematikan Cloud Run]

```

---

## Langkah 1: Buat Pub/Sub Topic

Pub/Sub berfungsi sebagai jembatan pesan dari Billing ke Cloud Function.

1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Cari dan masuk ke menu **Pub/Sub** $\rightarrow$ **Topics**.
3. Klik **Create Topic**.
4. Beri nama Topic ID: `billing-kill-switch` (jangan centang `add a default sub..` dll, sisanya pilih default).
5. Klik **Create**.

---

## Langkah 2: Hubungkan Billing Budget ke Pub/Sub

1. Buka menu **Billing** $\rightarrow$ **Budgets & alerts**.
2. Klik **Create Budget** (atau edit budget yang sudah ada).
3. Atur Target Amount ke nominal kecil, misal **$1.00** (atau Rp 15.000).
4. Di bagian **Actions / Notifications**:
* Centang opsi **Connect a Pub/Sub topic to this budget**.
* Pilih Project Anda dan pilih topic `billing-kill-switch-topic` yang baru dibuat.

5. Klik **Save**.

---

## Langkah 3: Buat Cloud Function untuk Mematikan Cloud Run

1. **Buat Cloud Function Baru:** Pilih Trigger Pub/Sub.
     1. Buka menu **Cloud Functions** $\rightarrow$ **Create Function**.
     2. Beri nama function, misal `disable-cloud-run-on-budget`. Node v22
     3. Pilih Trigger: **Cloud Pub/Sub** -> Select Topic: `billing-kill-switch-topic`.
     4. Scale auto (0,1) -> Ingress Internal
     5. Klik **Save** lalu **Next**.

2. **Persiapkan Service Account:** Pemberian Izin Akses.
Buka menu **IAM & Admin** $\rightarrow$ **Service Accounts**. Cari Service Account Cloud Functions Anda, lalu tambahkan *Role*:
     * **Cloud Run Admin** (agar fungsi bisa menghapus/mengubah instansi Cloud Run).

3. **Masukkan Kode Pemutus (Node.js / Python):** Logika Kill-Switch.
Pilih runtime **Node.js** V22. Kode ini akan membaca data dari Billing Pub/Sub. Jika pemakaian melebihi 100% budget, fungsi akan mengubah **max-instances** Cloud Run Anda menjadi `0` (sehingga aplikasi mati total dan tidak memakan biaya).

---

### Contoh Skrip Kode (Node.js 20)

**`index.js`**

```javascript
import { cloudEvent } from '@google-cloud/functions-framework';
import { ServicesClient } from '@google-cloud/run';

const runClient = new ServicesClient();

// Nama function ini harus disesuaikan dengan Entry Point
cloudEvent('stopCloudRunOnBudget', async (cloudEvent) => {
  // Mengambil data payload dari event Pub/Sub (Eventarc)
  const base64Data = cloudEvent.data?.message?.data;
  
  if (!base64Data) {
    console.warn("Payload Pub/Sub kosong atau tidak ditemukan.");
    return;
  }

  // Decode data dari Base64 ke JSON
  const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8');
  const data = JSON.parse(decodedData);

  console.log("Data Budget diterima:", data);

  // Periksa apakah biaya sudah melebihi atau sama dengan batas budget
  if (data.cost >= data.budgetAmount) {
    console.log(`Batas Anggaran Terlampaui! Biaya saat ini: ${data.cost}`);

    // UBAH DUA VARIABEL DI BAWAH INI SESUAI DENGAN PROJECT ANDA
    const projectId = 'PROJECT_ID_ANDA'; // contoh: 'main-478815'
    const serviceName = 'NAMA_SERVICE_CLOUD_RUN'; // contoh: 'my-web-app'
    const region = 'us-central1';

    const resourceName = `projects/${projectId}/locations/${region}/services/${serviceName}`;

    const request = {
      service: {
        name: resourceName,
        template: {
          scaling: {
            maxInstanceCount: 0 // Mematikan instance
          }
        }
      }
    };

    try {
      await runClient.updateService(request);
      console.log(`Layanan Cloud Run ${serviceName} berhasil dinonaktifkan (maxInstanceCount = 0).`);
    } catch (error) {
      console.error("Gagal memperbarui Cloud Run service:", error);
      throw error;
    }
  } else {
    console.log(`Penggunaan biaya (${data.cost}) masih di bawah budget (${data.budgetAmount}). Tidak ada tindakan.`);
  }
});
```
Sesuaikan nama Entry Point `stopCloudRunOnBudget`.

**`package.json`**

```json
{
  "dependencies": {
    "@google-cloud/functions-framework": "^3.0.0",
    "@google-cloud/run": "^1.0.0"
  },
  "type": "module"
}
```


---

> **Catatan Penting:**
> Pengiriman data biaya dari Google Billing ke Pub/Sub biasanya memiliki penundaan (*delay*) beberapa jam. Karena itu, pastikan memasang batas budget sangat kecil (misal $1) agar saat kill-switch terpicu, tagihan yang masuk masih dalam wajar dan tidak membengkak jauh.