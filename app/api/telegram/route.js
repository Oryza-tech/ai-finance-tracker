import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { supabase } from "../../supabase";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

async function sendMessage(chatId, text) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text }),
  });
}

// Fungsi internal untuk mengunduh file dari server Telegram (Foto / Audio)
async function getFileBase64(fileId) {
  const fileRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
  const fileData = await fileRes.json();
  const filePath = fileData.result.file_path;

  const dlRes = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`);
  const arrayBuffer = await dlRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString("base64");
}

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body.message) return NextResponse.json({ status: "ok" });
    
    const chatId = body.message.chat.id;
    const msg = body.message;

    // Abaikan command /start
    if (msg.text === "/start") {
      await sendMessage(chatId, "Halo Bro! Sistem siap. Kirimkan teks laporan, foto struk, atau voice note untuk mencatat keuanganmu.");
      return NextResponse.json({ status: "ok" });
    }

    let aiInput = [];
    
    // 1. SENSOR DETEKSI: FOTO
    if (msg.photo) {
      await sendMessage(chatId, "📸 Memproses gambar struk...");
      const fileId = msg.photo[msg.photo.length - 1].file_id;
      const base64Image = await getFileBase64(fileId);
      aiInput.push({ inlineData: { data: base64Image, mimeType: "image/jpeg" } });
    } 
    // 2. SENSOR DETEKSI: VOICE NOTE
    else if (msg.voice) {
      await sendMessage(chatId, "🎙️ Mendengarkan voice note...");
      const fileId = msg.voice.file_id;
      const base64Audio = await getFileBase64(fileId);
      // Telegram voice note menggunakan format audio/ogg
      aiInput.push({ inlineData: { data: base64Audio, mimeType: "audio/ogg" } });
    } 
    // 3. SENSOR DETEKSI: TEKS
    else if (msg.text) {
      await sendMessage(chatId, "💬 Menganalisis teks...");
      aiInput.push(msg.text);
    } 
    // JIKA FORMAT TIDAK DIKENAL
    else {
      await sendMessage(chatId, "Kirimkan foto, teks, atau rekaman suara ya, Bro!");
      return NextResponse.json({ status: "ok" });
    }

    // MENGHIDUPKAN MESIN AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // --- MODUL RTC (REAL TIME CLOCK) ZONA WIB ---
    // Vercel menggunakan waktu UTC, jadi kita kalibrasi ke WIB (UTC+7)
    const now = new Date();
    const wibOffset = 7 * 60 * 60 * 1000; 
    const wibDate = new Date(now.getTime() + wibOffset);
    const todayString = wibDate.toISOString().split('T')[0]; // Hasil: YYYY-MM-DD
    // --------------------------------------------
    
    const prompt = `
      Kamu adalah asisten keuangan presisi. Analisis data input ini (bisa berupa gambar struk, transkrip suara/audio, atau teks chat langsung).
      PENTING: Sistem keuangan ini adalah milik "ORYZA" (Oryza Ilyas Aryaduta).
      
      REFERENSI WAKTU SAAT INI: ${todayString}
      Jika teks mengandung kata "hari ini", "barusan", "tadi", "sekarang", atau tidak menyebutkan tanggal spesifik, WAJIB gunakan tanggal ${todayString}.

      ATURAN PENENTUAN "tipe" ARUS KAS:
      1. Jika input adalah bukti transfer masuk (penerima adalah ORYZA), slip gaji, atau teks yang menyatakan mendapat/menerima uang, maka tipe wajib "pemasukan".
      2. Jika input adalah bukti transfer keluar, struk belanja, nota, atau teks yang menyatakan membeli/membayar sesuatu, maka tipe wajib "pengeluaran".

      Kembalikan HANYA JSON murni tanpa markdown:
      {
        "tanggal": "YYYY-MM-DD",
        "deskripsi": "Nama merchant atau rincian transaksi",
        "nominal": angka_murni_tanpa_simbol,
        "kategori": "Makanan / Transportasi / Gaji / Belanja / Transfer / Lainnya",
        "metode_pembayaran": "Cash / Transfer Bank / E-Wallet / Qris",
        "tipe": "pemasukan atau pengeluaran"
      }
    `;

    const result = await model.generateContent([prompt, ...aiInput]);
    const cleanJsonString = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const extractedData = JSON.parse(cleanJsonString);

    // MENYIMPAN KE DATABASE
    const { error } = await supabase.from("transactions").insert([extractedData]);
    if (error) throw error;

    // REPORT BALASAN
    const pesanSukses = `✅ *Terekam!*\n\n` +
                        `Tipe: ${extractedData.tipe.toUpperCase()}\n` +
                        `Detail: ${extractedData.deskripsi}\n` +
                        `Nominal: Rp ${extractedData.nominal.toLocaleString('id-ID')}\n` +
                        `Kategori: ${extractedData.kategori}`;
                        
    await sendMessage(chatId, pesanSukses);

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Error Webhook:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}