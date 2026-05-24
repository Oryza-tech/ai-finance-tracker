import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { validateReceipt, safeParseJSON } from "../../../lib/validation";
import { APP_CONFIG } from "../../../lib/config";
import { logError, logInfo, createLogger } from "../../../lib/logger";

const logger = createLogger("ProcessReceiptAPI");

export async function POST(req) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: APP_CONFIG.aiModel });

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
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
      You are a precise financial assistant. Analyze this receipt, invoice, salary slip, or transfer proof and extract the information.
      
      IMPORTANT: Return ONLY valid JSON format. No intro text. Remove any markdown.
      
      Required JSON structure:
      {
        "tanggal": "YYYY-MM-DD",
        "deskripsi": "Merchant name or transaction description",
        "nominal": number_without_symbols (example: 17500),
        "kategori": "Makanan / Transportasi / Gaji / Belanja / Transfer / Lainnya",
        "metode_pembayaran": "Cash / Transfer Bank / E-Wallet / Kartu",
        "tipe": "pemasukan or pengeluaran"
      }

      Rules for "tipe":
      - If document shows incoming money (salary slip, transfer received, invoice paid to user): use "pemasukan"
      - If document shows outgoing money (purchase receipt, parking ticket, money transfer sent): use "pengeluaran"
    `;

    logger.info("Processing receipt", { fileName: file.name, fileSize: file.size });

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    // Parse JSON with error handling
    const parsedData = safeParseJSON(text);

    // Validate against schema
    const validatedData = validateReceipt(parsedData);

    logger.info("Receipt processed successfully");
    return NextResponse.json({ data: validatedData });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(error, { endpoint: "/api/process-receipt" });

    // Provide user-friendly error message
    let userMessage = "Failed to process receipt";
    if (errorMsg.includes("JSON")) {
      userMessage = "Invalid data format received from AI";
    } else if (errorMsg.includes("validation")) {
      userMessage = "Receipt data validation failed";
    } else if (errorMsg.includes("API")) {
      userMessage = "AI service error - please try again";
    }

    return NextResponse.json(
      { error: userMessage, details: errorMsg },
      { status: 500 }
    );
  }
}