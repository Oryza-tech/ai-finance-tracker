import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { supabase } from "../../supabase"; // Sesuaikan path ini dengan letak file supabase.js milikmu

// Konfigurasi Token
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// Fungsi internal untuk bot membalas chat
async function sendMessage(chatId, text) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text }),
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    
    // Validasi: Pastikan ada pesan masuk
    if (!body.message) return NextResponse.json({ status: "ok" });
    
    const chatId = body.message.chat.id;

    // Jika user cuma mengirim teks biasa (bukan gambar)
    if (!body.message.photo) {
      await sendMessage(chatId, "Kirimkan foto struk atau bukti transfer untuk dicatat ke sistem, Bro!");
      return NextResponse.json({ status: "ok" });
    }

    await sendMessage(chatId, "⏳ Mesin AI sedang membaca strukmu...");

    // Mengambil resolusi gambar paling besar dari server Telegram
    const photoArray = body.message.photo;
    const fileId = photoArray[photoArray.length - 1].file_id;

    // Menarik file path dari server Telegram
    const fileRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();
    const filePath = fileData.result.file_path;

    // Mengunduh gambar dan mengubahnya jadi Base64 untuk Gemini
    const imageRes = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`);
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");

    // Menghidupkan Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
      Analisis gambar struk, nota, slip gaji, atau bukti transfer ini.
      Kembalikan HANYA JSON murni tanpa markdown:
      {
        "tanggal": "YYYY-MM-DD",
        "deskripsi": "Nama merchant atau rincian",
        "nominal": angka_murni_tanpa_simbol,
        "kategori": "Makanan / Transportasi / Gaji / Belanja / Transfer / Lainnya",
        "metode_pembayaran": "Cash / Transfer / E-Wallet",
        "tipe": "pemasukan atau pengeluaran"
      }
      - Jika slip gaji/uang masuk = "pemasukan"
      - Jika struk belanja/uang keluar = "pengeluaran"
    `;

    const imageParts = [{ inlineData: { data: base64Image, mimeType: "image/jpeg" } }];
    const result = await model.generateContent([prompt, ...imageParts]);
    const cleanJsonString = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const extractedData = JSON.parse(cleanJsonString);

    // Menyimpan hasil ekstrak langsung ke Supabase
    const { error } = await supabase.from("transactions").insert([extractedData]);
    
    if (error) throw error;

    // Memberikan report ke Telegram
    const pesanSukses = `✅ *Data Berhasil Disimpan!*\n\n` +
                        `Tipe: ${extractedData.tipe.toUpperCase()}\n` +
                        `Deskripsi: ${extractedData.deskripsi}\n` +
                        `Nominal: Rp ${extractedData.nominal.toLocaleString('id-ID')}\n` +
                        `Kategori: ${extractedData.kategori}`;
                        
    await sendMessage(chatId, pesanSukses);

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Error Webhook:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}