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

    // --- MODUL RTC (REAL TIME CLOCK) & DATE CALCULATION ---
    const now = new Date();
    const wibOffset = 7 * 60 * 60 * 1000; 
    const today = new Date(now.getTime() + wibOffset);
    
    // Fungsi bantu untuk format YYYY-MM-DD
    const formatDate = (date) => date.toISOString().split('T')[0];
    const todayString = formatDate(today);

    // Hitung tanggal kemarin dan 2 hari lalu untuk referensi AI
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date(today); twoDaysAgo.setDate(today.getDate() - 2);
    // ------------------------------------------------------
    
    const prompt = `
      Analisis input berikut. Jika ada lebih dari satu transaksi, pecah menjadi beberapa objek dalam array.
      REFERENSI WAKTU: Hari ini adalah ${todayString}.
      
      PENTING: Kembalikan dalam format ARRAY JSON (bungkus dengan []), jangan ada teks lain!
      Contoh format:
      [
        {
          "tanggal": "2026-05-24",
          "deskripsi": "Transfer ke mamah",
          "nominal": 500000,
          "kategori": "Transfer",
          "metode_pembayaran": "Transfer Bank",
          "tipe": "pengeluaran"
        },
        {
          "tanggal": "2026-05-23",
          "deskripsi": "Beli bensin",
          "nominal": 100000,
          "kategori": "Transportasi",
          "metode_pembayaran": "Cash",
          "tipe": "pengeluaran"
        }
      ]
    `;

    const result = await model.generateContent([prompt, ...aiInput]);
    const cleanJsonString = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const transactionsArray = JSON.parse(cleanJsonString); // Sekarang hasilnya pasti Array

    // Menyimpan banyak data sekaligus ke Supabase
    const { error } = await supabase.from("transactions").insert(transactionsArray);
    if (error) throw error;

    // Report balasan untuk banyak data
    const listReport = transactionsArray.map(t => `- ${t.deskripsi}: Rp ${t.nominal.toLocaleString('id-ID')}`).join('\n');
    await sendMessage(chatId, `✅ Berhasil mencatat ${transactionsArray.length} transaksi:\n\n${listReport}`);

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