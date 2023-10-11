import express from "express";
import { Telegraf } from "telegraf";
import { DownloaderHelper } from "node-downloader-helper";
import { message } from "telegraf/filters";
import crypto from "crypto";
import fs, { promises as fsPromises} from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;

const app = express();
const bot = new Telegraf(BOT_TOKEN)

app.use(express.static("./downloads"))
app.use(await bot.createWebhook({ domain: process.env.webhookDomain}))

app.get("/", (req, res) => {
    res.send("Bot Started");
})

bot.start(async (ctx) => {
    if(ctx.from.id != 1782278519) return;
    
    await ctx.reply("Yo bro\n\nSend me your 1fichier link or any direct link 😎");
})

bot.on(message("text"), async (ctx) => {
    const URL = ctx.message.text;

    if(URL.includes("https") || URL.includes("http")) {
        const dlMsg = await ctx.reply("Downloading video");

        let fileNameGlobal = `@AnimesGratuit_.mkv`;
        let interval = null;

        if(!fs.existsSync("./downloads")) {
            await fsPromises.mkdir("./downloads");
        }
       
        const dl = new DownloaderHelper(URL, "./downloads", {
            fileName(fileName) {
                const extension = path.extname(fileName);
                fileNameGlobal = `@AnimesGratuit_${crypto.randomBytes(10).toString("hex")}${extension}`

                return fileNameGlobal;
            }
        })

        dl.on("end", async () => {
            clearInterval(interval);
            await ctx.reply(`Your is available at ${process.env.BASE_URL}/${fileNameGlobal}`);
        });

        dl.on("error", async (err) => await ctx.reply("Download failed" + err.message))

        dl.start().catch(err => console.log(err))
        
        let dlMsgTxt = "";

        interval = setInterval(async () => {
            const stats = dl.getStats()

            const progress = Math.floor(stats.progress);
            const fileName = stats.name;

            const newDlMsgTxt = `Downloading ${fileName}\n\nProgress: ${progress}`;

            if(dlMsgTxt === newDlMsgTxt) return;

            await ctx.telegram.editMessageText(ctx.chat.id, dlMsg.message_id, undefined, newDlMsgTxt)
            
            dlMsgTxt = newDlMsgTxt;
        }, 3000)
    }
})

app.listen(3000, () => {
    console.log("Process running on port 3000");
}) 
