import { middleware } from "@line/bot-sdk";
import { Buffer } from "node:buffer";

// LINE Bot 配置
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const rawBody = await getRawBody(req);

      await new Promise((resolve, reject) => {
        middleware(lineConfig)(
          { ...req, body: JSON.parse(rawBody) },
          res,
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      const events = JSON.parse(rawBody).events || [];

      for (const event of events) {
        if (event.type === "message" && event.message.type === "text") {
          console.log("收到訊息:", event.message.text, "來自:", event.source.userId);

          // 使用 fetch 回覆訊息
          await fetch("https://api.line.me/v2/bot/message/reply", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({
              replyToken: event.replyToken,
              messages: [
                {
                  type: "text",
                  text: "Hello from Next.js on Vercel 🚀",
                },
              ],
            }),
          });
        }
      }

      res.status(200).end();
    } catch (err) {
      console.error("Webhook Error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => chunks.push(chunk));
    req.on("error", (err) => reject(err));
    req.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
  });
}