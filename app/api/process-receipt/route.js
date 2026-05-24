import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // KABEL DAYA dipasang di DALAM fungsi agar selalu terbaca saat ada request masuk
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "File gambar tidak ditemukan, Bro!" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const imageParts = [
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: file.type,
        },
      },
    ];

    const prompt = `
      Kamu adalah asisten keuangan otomatis yang sangat presisi. Analisis gambar struk, nota, slip gaji, atau bukti transfer ini, lalu ekstrak informasinya.
      
      PENTING: Kamu HANYA BOLEH mengembalikan data dalam format JSON murni. Jangan ada teks pengantar, dan hilangkan markdown (seperti \`\`\`json).
      
      Struktur JSON wajib seperti ini:
      {
        "tanggal": "YYYY-MM-DD",
        "deskripsi": "Nama merchant, entitas, atau rincian singkat",
        "nominal": angka_murni_tanpa_simbol (contoh: 17500),
        "kategori": "Makanan / Transportasi / Gaji / Belanja / Transfer / Lainnya",
        "metode_pembayaran": "Cash / Transfer Bank / E-Wallet / Kartu",
        "tipe": "pemasukan atau pengeluaran"
      }

      ATURAN PENTING UNTUK MENENTUKAN "tipe":
      - Jika dokumen adalah slip gaji, bukti transfer terima uang, atau invoice dibayar ke pengguna, wajib isi "tipe" dengan "pemasukan".
      - Jika dokumen adalah nota belanja (Indomaret, warung, dll), struk parkir, tiket, atau bukti transfer keluar (mengirim uang), wajib isi "tipe" dengan "pengeluaran".
    `;

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    const cleanJsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(cleanJsonString);

    return NextResponse.json({ data });

  } catch (error) {
    console.error("Kesalahan sistem AI:", error);
    return NextResponse.json({ error: "Sistem gagal mengekstrak data gambar." }, { status: 500 });
  }
}