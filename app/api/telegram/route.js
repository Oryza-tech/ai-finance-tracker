import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
// PERBAIKAN JALUR SUPABASE (Sesuai dengan screenshot struktur folder kamu)
import { supabase } from "../../supabase"; 

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

async function sendMessage(chatId, text) {
  try {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text }),
    });
  } catch (err) {
    console.error("Gagal mengirim pesan Telegram", err);
  }
}

// Fungsi internal untuk mengunduh file
async function getFileBase64(fileId) {
  const fileRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
  const fileData = await fileRes.json();
  const filePath = fileData.result.file_path;
  const dlRes = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`);
  const arrayBuffer = await dlRes.arrayBuffer();
  return Buffer.from(arrayBuffer).toString("base64");
}

export async function POST(req) {
  let chatId = null; // Deklarasi di luar try agar bisa diakses oleh catch block
  
  try {
    const body = await req.json();
    if (!body.message) return NextResponse.json({ status: "ok" });
    
    chatId = body.message.chat.id;
    const msg = body.message;

    // --- MODUL RTC WIB ---
    const now = new Date();
    const wibOffset = 7 * 60 * 60 * 1000; 
    const today = new Date(now.getTime() + wibOffset);
    const todayString = today.toISOString().split('T')[0];
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const formatDate = (date) => date.toISOString().split('T')[0];

    let aiInput = [];
    if (msg.photo) {
      await sendMessage(chatId, "📸 Memproses gambar...");
      const fileId = msg.photo[msg.photo.length - 1].file_id;
      aiInput.push({ inlineData: { data: await getFileBase64(fileId), mimeType: "image/jpeg" } });
    } else if (msg.voice) {
      await sendMessage(chatId, "🎙️ Mendengarkan rekaman...");
      aiInput.push({ inlineData: { data: await getFileBase64(msg.voice.file_id), mimeType: "audio/ogg" } });
    } else if (msg.text) {
      if (msg.text === "/start") {
        await sendMessage(chatId, "Halo Bro Oryza! Kirimkan struk, voice note, atau laporan keuanganmu.");
        return NextResponse.json({ status: "ok" });
      }
      // Membalas dulu agar bot tidak terasa mati
      await sendMessage(chatId, "💬 Menganalisis teks...");
      aiInput.push(msg.text);
    } else {
      return NextResponse.json({ status: "ok" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
      Kamu adalah asisten keuangan Oryza. Hari ini: ${todayString}.
      Analisis input ini dan konversi ke ARRAY JSON.
      Jika "kemarin", gunakan tanggal ${formatDate(yesterday)}.
      Jika ada beberapa transaksi, pecah menjadi beberapa objek.
      
      FORMAT WAJIB:
      [{"tanggal": "YYYY-MM-DD", "deskripsi": "...", "nominal": 0, "kategori": "...", "metode_pembayaran": "...", "tipe": "pemasukan"}]
      
      Aturan Tipe: Transfer MASUK ke Oryza / Gaji = "pemasukan". Oryza bayar/transfer KELUAR = "pengeluaran".
      Kembalikan HANYA JSON murni (array), tanpa markdown!
    `;

    const result = await model.generateContent([prompt, ...aiInput]);
    const cleanJson = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(cleanJson);

    if (Array.isArray(data)) {
      const { error } = await supabase.from("transactions").insert(data);
      if (error) {
        await sendMessage(chatId, `❌ Gagal menyimpan ke database: ${error.message}`);
        throw error;
      }
      const list = data.map(t => `- ${t.deskripsi}: Rp ${t.nominal.toLocaleString('id-ID')}`).join('\n');
      await sendMessage(chatId, `✅ Berhasil disimpan:\n${list}`);
    } else {
       await sendMessage(chatId, `❌ AI memberikan format salah. Coba kalimat lain, Bro!`);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook Error:", error);
    if (chatId) {
       // Kirim notifikasi error tapi tetap santai
       await sendMessage(chatId, `🔧 Sirkuit error Bro: ${error.message.substring(0, 50)}...`);
    }
    // PENTING: Kita WAJIB membalas dengan status 200 (ok) agar Telegram berhenti mengirim ulang (stop looping!)
    return NextResponse.json({ status: "ok" }); 
    }
}