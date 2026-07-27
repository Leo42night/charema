import { getPrisma } from "../prisma/db";

// Nilai TARGET_KRITIK sesuai yang kamu gunakan di endpoint (misal: 1 atau 4)
const TARGET_KRITIK = 4;

async function main() {
    const targetUserKey = 5555;

    console.log(`🌱 Starting seed for user_key: ${targetUserKey}...`);

    // 1. Clean up data lama agar bisa di-run berulang kali
    await getPrisma().calonWinner.deleteMany({ where: { user_key: targetUserKey } });
    await getPrisma().score.deleteMany({ where: { user_key: targetUserKey } });
    await getPrisma().feedback.deleteMany({ where: { user_key: targetUserKey } });
    await getPrisma().achievement.deleteMany({ where: { user_key: targetUserKey } });

    // 2. Syarat 1: Achievement dengan tags >= 15 item
    const dummyTags = Array.from({ length: 14 }, (_, i) => `tag_${i + 1}`);
    await getPrisma().achievement.create({
        data: {
            user_key: targetUserKey,
            tags: dummyTags, // 15 tags
        },
    });

    // 3. Syarat 2: Feedback berjumlah >= TARGET_KRITIK
    for (let i = 0; i < TARGET_KRITIK; i++) {
        await getPrisma().feedback.create({
            data: {
                user_key: targetUserKey,
                input: `Input feedback ke-${i + 1}`,
                res_tag: "rekomendasi",
                res_message: "Respon sistem",
                feedback: "Sangat membantu!",
            },
        });
    }

    // 4. Syarat 3: Record Score harus eksis
    await getPrisma().score.create({
        data: {
            user_key: targetUserKey,
            score_cf: 5,
            score_chat: 5,
            message: "Fitur rekomendasi sudah sangat baik.",
        },
    });

    console.log(`✅ Seed berhasil! Gunakan user_key: ${targetUserKey} untuk testing endpoint.`);
}

main()
    .catch((e) => {
        console.error("❌ Seed error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await getPrisma().$disconnect();
    });