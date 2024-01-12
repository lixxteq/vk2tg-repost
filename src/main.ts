import 'dotenv/config'
import TelegramBotFactory from "api/telegram";
import VkAPI from "api/vk";
import Storage from "storage/db";
import logger from "utils/logger";

async function main() {
    const storage = new Storage(process.env.LOKI_FILENAME);
    await storage.init();
    const api = new VkAPI();
    const bot = new TelegramBotFactory(process.env.TELEGRAM_TOKEN, api, storage.db);
    logger.info(`Started process ${process.pid}`)
    bot.init()
}

main()