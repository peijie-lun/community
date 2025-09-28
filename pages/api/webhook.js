import { Client, middleware } from "@line/bot-sdk";
import { Buffer } from 'node:buffer';

// LINE Bot 配置
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(lineConfig);

// Next.js API 路由配置 - 禁用默认的 bodyParser 以手动处理请求体
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * LINE Webhook 处理函数
 * @param {import('next').NextApiRequest} req - Next.js API 请求对象
 * @param {import('next').NextApiResponse} res - Next.js API 响应对象
 */
export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      // 手动解析请求体并验证 LINE 签名
      const rawBody = await getRawBody(req);
      
      // 使用 LINE middleware 验证签名
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

      // 处理接收到的事件
      for (const event of events) {
        if (event.type === "message" && event.message.type === "text") {
          console.log("收到訊息:", event.message.text, "來自:", event.source.userId);

          // 回复消息
          await client.replyMessage(event.replyToken, {
            type: "text",
            text: "Hello from Next.js on Vercel 🚀",
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

/**
 * 获取请求的原始 body 内容
 * @param {import('next').NextApiRequest} req - Next.js API 请求对象
 * @returns {Promise<string>} - 请求的原始 body 内容
 */
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('error', (err) => reject(err));
    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
  });
}
