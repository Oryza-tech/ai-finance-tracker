import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { supabase } from "../../supabase";
import { validateTransaction, safeParseJSON } from "../../../lib/validation";
import { APP_CONFIG, formatRupiah } from "../../../lib/config";
import { getTodayISO, getYesterdayISO } from "../../../lib/dateUtils";
import { logError, logInfo, createLogger } from "../../../lib/logger";

const logger = createLogger("TelegramAPI");
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// Validate required environment variables
if (!TELEGRAM_TOKEN) {
  logger.error(new Error("Missing TELEGRAM_BOT_TOKEN environment variable"), { action: "initialization" });
}
if (!process.env.GEMINI_API_KEY) {
  logger.error(new Error("Missing GEMINI_API_KEY environment variable"), { action: "initialization" });
}

async function sendMessage(chatId, text) {
  if (!text || typeof text !== 'string') {
    logger.warn("Invalid message text", { chatId, text });
    return;
  }
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: "HTML" }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      logger.error(new Error(`Telegram API error: ${errorData.description}`), { chatId, action: "sendTelegramMessage" });
    }
  } catch (err) {
    logger.error(err, { action: "sendTelegramMessage", chatId });
  }
}

async function getFileBase64(fileId) {
  if (!fileId) throw new Error("File ID is required");
  
  try {
    const fileRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`, {
      timeout: 10000, // 10 second timeout
    });
    
    if (!fileRes.ok) {
      throw new Error(`Failed to get file info: ${fileRes.status} ${fileRes.statusText}`);
    }
    
    const fileData = await fileRes.json();
    if (!fileData.ok || !fileData.result?.file_path) {
      throw new Error("Invalid file path in Telegram response");
    }
    
    const filePath = fileData.result.file_path;
    const dlRes = await fetch(
      `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`,
      { timeout: 15000 } // 15 second timeout for file download
    );
    
    if (!dlRes.ok) {
      throw new Error(`Failed to download file: ${dlRes.status}`);
    }
    
    const arrayBuffer = await dlRes.arrayBuffer();
    return Buffer.from(arrayBuffer).toString("base64");
  } catch (error) {
    logger.error(error, { action: "getFileBase64", fileId });
    throw new Error(`Failed to process file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function POST(req) {
  // Verify request is from Telegram using secret token
  const secretToken = req.headers.get('x-telegram-bot-api-secret-token');
  if (process.env.TELEGRAM_WEBHOOK_SECRET) {
    if (!secretToken) {
      logger.warn("Missing Telegram webhook secret token", { action: "webhookValidation" });
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      logger.warn("Invalid Telegram webhook secret token", { action: "webhookValidation" });
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
  }

  let chatId = null;

  try {
    // Validate request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      logger.warn("Invalid JSON in request body", { action: "parseRequest" });
      return NextResponse.json({ status: "ok" });
    }

    if (!body.message) {
      // Not a message event, ignore
      return NextResponse.json({ status: "ok" });
    }

    chatId = body.message?.chat?.id;
    if (!chatId) {
      logger.warn("Missing chat ID in message", { action: "getChatId" });
      return NextResponse.json({ status: "ok" });
    }

    const msg = body.message;

    // Get dates using proper timezone utilities
    const todayString = getTodayISO();
    const yesterdayString = getYesterdayISO();

    let aiInput = [];
    let inputType = "unknown";

    // Handle different message types
    if (msg.photo) {
      await sendMessage(chatId, "📸 Processing image...");
      try {
        const fileId = msg.photo[msg.photo.length - 1]?.file_id;
        if (!fileId) throw new Error("No file ID in photo");
        
        const base64Data = await getFileBase64(fileId);
        aiInput.push({
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg",
          },
        });
        inputType = "photo";
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to process image";
        await sendMessage(chatId, `❌ Image processing failed: ${errorMsg}\n\nPlease try again.`);
        return NextResponse.json({ status: "ok" });
      }
    } else if (msg.voice) {
      await sendMessage(chatId, "🎙️ Processing voice note...");
      try {
        const fileId = msg.voice?.file_id;
        if (!fileId) throw new Error("No file ID in voice message");
        
        const base64Data = await getFileBase64(fileId);
        aiInput.push({
          inlineData: {
            data: base64Data,
            mimeType: "audio/ogg",
          },
        });
        inputType = "voice";
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to process voice";
        await sendMessage(chatId, `❌ Voice processing failed: ${errorMsg}\n\nPlease try again.`);
        return NextResponse.json({ status: "ok" });
      }
    } else if (msg.text) {
      const text = msg.text.trim();
      
      if (text === "/start") {
        await sendMessage(
          chatId,
          `Hello ${APP_CONFIG.userName}! 👋\n\nI'm your financial assistant. Send me:\n📸 Receipt photos\n🎙️ Voice notes\n💬 Transaction details\n\nI'll help you track your expenses!`
        );
        logger.info("Telegram /start command", { chatId });
        return NextResponse.json({ status: "ok" });
      }

      if (!text) {
        await sendMessage(chatId, "❌ Empty message. Please send a transaction detail.");
        return NextResponse.json({ status: "ok" });
      }

      await sendMessage(chatId, "💬 Analyzing text...");
      aiInput.push(text);
      inputType = "text";
    } else {
      // Unsupported message type
      logger.info("Unsupported message type", { msgType: Object.keys(msg).join(","), chatId });
      await sendMessage(chatId, "❌ Unsupported message type. Please send photos, voice notes, or text.");
      return NextResponse.json({ status: "ok" });
    }

    // Validate AI inputs
    if (aiInput.length === 0) {
      await sendMessage(chatId, "❌ No valid input found. Please try again.");
      return NextResponse.json({ status: "ok" });
    }

    // Initialize Gemini API
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: APP_CONFIG.aiModel || "gemini-1.5-flash" });

    const prompt = `
You are a financial assistant for ${APP_CONFIG.userName}. Today is ${todayString}.
Analyze this input and convert it to a JSON array of transactions.
If the user mentions "yesterday", use ${yesterdayString}.
If multiple transactions are mentioned, return multiple objects.

REQUIRED FORMAT (return ONLY valid JSON array, no markdown, no extra text):
[{"tanggal": "YYYY-MM-DD", "deskripsi": "...", "nominal": 0, "kategori": "...", "metode_pembayaran": "...", "tipe": "pemasukan"}]

Rules:
- "tipe": use "pemasukan" for money received, "pengeluaran" for money spent
- "nominal": must be a positive number
- Categories: ${APP_CONFIG.categories?.join(", ") || "Food, Transport, Entertainment, Utilities, Healthcare, Shopping, Other"}
- Payment methods: Cash, Transfer Bank, E-Wallet, Kartu
- If date is unclear, use today's date (${todayString})
- Always return a valid JSON array, even if empty

Return ONLY valid JSON array. No explanations, no markdown!
    `;

    logger.info("Processing Telegram message", { inputType, chatId });

    let result;
    try {
      result = await model.generateContent([prompt, ...aiInput]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "AI service error";
      logger.error(err, { action: "geminiAPI", inputType, chatId });
      
      if (errorMsg.includes("quota") || errorMsg.includes("rate")) {
        await sendMessage(chatId, "⏳ Too many requests. Please wait a moment and try again.");
      } else if (errorMsg.includes("API key")) {
        await sendMessage(chatId, "🔧 Configuration error. Please contact administrator.");
      } else {
        await sendMessage(chatId, `❌ AI processing failed: ${errorMsg}\n\nPlease try again.`);
      }
      return NextResponse.json({ status: "ok" });
    }

    const responseText = result.response?.text?.();
    if (!responseText) {
      throw new Error("Empty response from AI model");
    }

    // Parse JSON with error handling
    const parsedData = safeParseJSON(responseText);

    if (!Array.isArray(parsedData)) {
      logger.warn("AI did not return array format", { response: responseText.substring(0, 200), chatId });
      await sendMessage(chatId, "❌ Could not understand the transaction details. Please provide clear information.\n\nExample: 'Lunch 50000' or 'Salary 5000000 income'");
      return NextResponse.json({ status: "ok" });
    }

    if (parsedData.length === 0) {
      await sendMessage(chatId, "❌ No valid transactions found in your message. Please provide transaction details.\n\nExample: 'Spent 25000 for food today'");
      return NextResponse.json({ status: "ok" });
    }

    // Validate each transaction
    const validatedTransactions = [];
    for (const item of parsedData) {
      try {
        const validated = validateTransaction(item);
        validatedTransactions.push(validated);
      } catch (validationError) {
        logger.warn(`Skipping invalid transaction`, { 
          item, 
          error: validationError instanceof Error ? validationError.message : String(validationError),
          chatId 
        });
      }
    }

    if (validatedTransactions.length === 0) {
      await sendMessage(
        chatId,
        "❌ No valid transactions could be extracted. Please check the format and try again."
      );
      return NextResponse.json({ status: "ok" });
    }

    // Insert into database
    const { error: dbError } = await supabase
      .from("transactions")
      .insert(validatedTransactions);

    if (dbError) {
      logger.error(dbError, { action: "insertTransactions", chatId });
      await sendMessage(
        chatId,
        `❌ Failed to save to database: ${dbError.message}\n\nPlease try again later.`
      );
      return NextResponse.json({ status: "ok" });
    }

    // Send success message with formatted amounts
    const list = validatedTransactions
      .map((t) => `• ${t.deskripsi}: <b>${formatRupiah(t.nominal)}</b>`)
      .join("\n");
    await sendMessage(chatId, `✅ <b>Saved successfully!</b>\n\n${list}`);

    logger.info("Transactions saved from Telegram", {
      count: validatedTransactions.length,
      chatId,
    });

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    logger.error(error, { action: "telegramWebhook", chatId });

    if (chatId) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
      const userFriendlyMsg = errorMsg.length > 100 ? "An error occurred. Please try again." : errorMsg;
      
      await sendMessage(
        chatId,
        `🔧 <b>Error:</b> ${userFriendlyMsg}\n\nPlease try again with a clearer format.`
      );
    }

    // Always return 200 OK to stop Telegram from retrying
    return NextResponse.json({ status: "ok" });
  }
}