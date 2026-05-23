import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file gambar.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // MENGGUNAKAN MODEL TERBARU BERDASARKAN HASIL DIAGNOSTIK
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      Ekstrak data dari foto struk/transfer ini. 
      Kembalikan HANYA format JSON mentah tanpa markdown (tanpa \`\`\`json) dengan struktur:
      {
        "tanggal": "YYYY-MM-DD",
        "deskripsi": "Nama toko / tujuan",
        "nominal": angka_tanpa_titik,
        "kategori": "Makanan/Transportasi/Kebutuhan Pokok/Transfer/Lainnya",
        "metode_pembayaran": "Cash/Debit/QRIS/Transfer"
      }
      Jika tidak terbaca, kosongkan nilainya ("").
    `;

    const imageParts = [{ inlineData: { data: base64Image, mimeType: file.type } }];
    const result = await model.generateContent([prompt, ...imageParts]);
    
    const cleanJson = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Error AI:', error);
    return NextResponse.json({ error: 'Gagal memproses gambar.' }, { status: 500 });
  }
}