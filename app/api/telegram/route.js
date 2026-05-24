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

async function sendMessage(chatId, text) {
  try {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text }),
    });
  } catch (err) {
    logger.error(err, { action: "sendTelegramMessage" });
  }
}

async function getFileBase64(fileId) {
  try {
    const fileRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();
    const filePath = fileData.result.file_path;
    const dlRes = await fetch(
      `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`
    );
    const arrayBuffer = await dlRes.arrayBuffer();
    return Buffer.from(arrayBuffer).toString("base64");
  } catch (error) {
    logger.error(error, { action: "getFileBase64", fileId });
    throw error;
  }
}

export async function POST(req) {
  // Verify request is from Telegram using secret token
  const secretToken = req.headers.get('x-telegram-bot-api-secret-token');
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let chatId = null;

  try {
    const body = await req.json();
    if (!body.message) return NextResponse.json({ status: "ok" });

    chatId = body.message.chat.id;
    const msg = body.message;

    // Get dates using proper timezone utilities
    const todayString = getTodayISO();
    const yesterdayString = getYesterdayISO();

    let aiInput = [];
    let inputType = "unknown";

    if (msg.photo) {
      await sendMessage(chatId, "📸 Processing image...");
      const fileId = msg.photo[msg.photo.length - 1].file_id;
      aiInput.push({
        inlineData: {
          data: await getFileBase64(fileId),
          mimeType: "image/jpeg",
        },
      });
      inputType = "photo";
    } else if (msg.voice) {
      await sendMessage(chatId, "🎙️ Processing voice note...");
      aiInput.push({
        inlineData: {
          data: await getFileBase64(msg.voice.file_id),
          mimeType: "audio/ogg",
        },
      });
      inputType = "voice";
    } else if (msg.text) {
      if (msg.text === "/start") {
        await sendMessage(
          chatId,
          `Hello ${APP_CONFIG.userName}! Send me receipts, voice notes, or financial reports.`
        );
        logger.info("Telegram /start command", { chatId });
        return NextResponse.json({ status: "ok" });
      }
      await sendMessage(chatId, "💬 Analyzing text...");
      aiInput.push(msg.text);
      inputType = "text";
    } else {
      return NextResponse.json({ status: "ok" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: APP_CONFIG.aiModel });

    const prompt = `
You are a financial assistant for ${APP_CONFIG.userName}. Today is ${todayString}.
Analyze this input and convert it to a JSON array of transactions.
If the user mentions "yesterday", use ${yesterdayString}.
If multiple transactions are mentioned, return multiple objects.

REQUIRED FORMAT (return ONLY valid JSON array, no markdown):
[{"tanggal": "YYYY-MM-DD", "deskripsi": "...", "nominal": 0, "kategori": "...", "metode_pembayaran": "...", "tipe": "pemasukan"}]

Rules:
- "tipe": use "pemasukan" for money received, "pengeluaran" for money spent
- "nominal": must be a positive number
- Categories: ${APP_CONFIG.categories.join(", ")}
- Payment methods: ${["Cash", "Transfer Bank", "E-Wallet", "Kartu"].join(", ")}

Return ONLY the JSON array, no extra text!
    `;

    logger.info("Processing Telegram message", { inputType, chatId });

    const result = await model.generateContent([prompt, ...aiInput]);
    const responseText = result.response.text();

    // Parse JSON with error handling
    const parsedData = safeParseJSON(responseText);

    if (!Array.isArray(parsedData)) {
      throw new Error("AI did not return an array format");
    }

    // Validate each transaction
    const validatedTransactions = [];
    for (const item of parsedData) {
      try {
        const validated = validateTransaction(item);
        validatedTransactions.push(validated);
      } catch (validationError) {
        logger.warn(`Skipping invalid transaction`, { item, error: validationError });
      }
    }

    if (validatedTransactions.length === 0) {
      await sendMessage(
        chatId,
        "❌ No valid transactions found. Please provide clear transaction details."
      );
      return NextResponse.json({ status: "ok" });
    }

    // Insert into database
    const { error: dbError } = await supabase
      .from("transactions")
      .insert(validatedTransactions);

    if (dbError) {
      logger.error(dbError, { action: "insertTransactions" });
      await sendMessage(
        chatId,
        `❌ Failed to save: ${dbError.message}`
      );
      return NextResponse.json({ status: "ok" });
    }

    // Send success message with formatted amounts
    const list = validatedTransactions
      .map((t) => `- ${t.deskripsi}: ${formatRupiah(t.nominal)}`)
      .join("\n");
    await sendMessage(chatId, `✅ Saved successfully:\n${list}`);

    logger.info("Transactions saved from Telegram", {
      count: validatedTransactions.length,
      chatId,
    });

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    logger.error(error, { action: "telegramWebhook", chatId });

    if (chatId) {
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error occurred";
      await sendMessage(
        chatId,
        `🔧 Error: ${errorMsg}\n\nPlease try again with a clearer format.`
      );
    }

    // Always return 200 OK to stop Telegram from retrying
    return NextResponse.json({ status: "ok" });
  }
}