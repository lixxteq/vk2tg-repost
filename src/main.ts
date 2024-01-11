import 'dotenv/config'
import TelegramBotFactory from "api/telegram";
import VkAPI from "api/vk";
import Storage from "storage/db";

const storage = new Storage(process.env.LOKI_FILENAME);
const api = new VkAPI();
const bot = new TelegramBotFactory(process.env.TELEGRAM_TOKEN, api, storage.get());

process.on('SIGINT', async () => {
    await storage.save();
    process.exit(0);
});

(function main() {bot.init()})();