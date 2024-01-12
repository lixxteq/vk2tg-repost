import 'dotenv/config'
import TelegramBotFactory from "api/telegram";
import VkAPI from "api/vk";
import Storage from "storage/db";

process.on('SIGINT', async () => {
    // await storage.save();
    process.exit(0);
});

async function main() {
    const storage = new Storage(process.env.LOKI_FILENAME);
    await storage.init();
    // console.log('from main 1', storage.get().count())
    const api = new VkAPI();
    const bot = new TelegramBotFactory(process.env.TELEGRAM_TOKEN, api, storage.db);
    bot.init()
}

main()
// function main() {
    // console.log('loki load callback')
    // console.log('from main 2', storage.get().count())
    // bot.init(storage)
// }
// (function main() {bot.init()})();