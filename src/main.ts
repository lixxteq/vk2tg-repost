import getStorage from "storage/db";
import TelegramBotFactory from "./api/telegram";
require('dotenv').config();

const bot = new TelegramBotFactory(process.env.TELEGRAM_TOKEN, process.env.VK_TOKEN, getStorage());

const main = () => {
    bot.init();
}

main();