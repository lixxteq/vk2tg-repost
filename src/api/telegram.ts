import fetch from "node-fetch";
import type { Context, Message, Update, UpdatesResponse, UserPref, TelegramPost } from "../types/types";
import VkAPI from "./vk";
import PostBuilder from "./postBuilder";

export default class TelegramBotFactory {
    request_uri: string;
    api_token: string;
    update_offset: number = 0;
    storage: Collection<UserPref>;
    context_map: Record<number, Context> = {};
    post_timeout: number;
    vk_api: VkAPI;
    request_mode: 'burst' | 'flow'

    constructor(tg_api_token: string, vk_api: VkAPI, storage: Collection<UserPref>, request_mode?: 'burst' | 'flow') {
        this.api_token = tg_api_token;
        this.request_uri = `https://api.telegram.org/bot${tg_api_token}/`;
        this.vk_api = vk_api;
        this.storage = storage;
        this.request_mode = request_mode || 'flow';
        this.post_timeout = this.calculatePostTimeout(request_mode);
    }

    /**
     * Initialize bot, start Telegram API Long-Polling and launch VK to Telegram reposting process
     * @async
     */
    async init() {
        this.poll();
        this.initPostLoop();
    }

    async poll() {
        const res = await fetch(`${this.request_uri}getUpdates?offset=${this.update_offset}&timeout=30&allowed_updates=message`);

        switch (res.status) {
            case 200:
                const parsed = ((await res.json()) as UpdatesResponse).result;
                this.handleMessage(parsed);
                this.update_offset = parsed.length ? parsed.pop()['update_id'] + 1 : this.update_offset;
                console.log('Last update: ', this.update_offset);
                break;
            case 502:
                break;
            default:
                console.log('Polling error: ', res.status);
                break;
        }
        setTimeout(() => this.poll(), 0);
    }

    async handleMessage(updates: Update[]) {
        for (const upd of updates) {
            const upd_ctx = this.context_map[upd.message.chat.id];
            if (upd_ctx && upd_ctx.mode && !isCommand(upd.message.text)) {
                switch (upd_ctx.mode) {
                    case '/add':
                        try {
                            this.subscribe(upd.message);
                            this.context_map[upd.message.chat.id] = { mode: null, last_message: upd.message };
                            this.sendMessage(upd.message.chat.id, 'Группы добавлены в отслеживаемые');
                        } catch (error) {
                            this.sendMessage(upd.message.chat.id, `Ошибка: ${error}`);
                        }
                        break;
                    case '/remove':
                        try {
                            this.unsubscribe(upd.message);
                            this.context_map[upd.message.chat.id] = { mode: null, last_message: upd.message };
                            this.sendMessage(upd.message.chat.id, 'Группы удалены из отслеживаемых');
                        } catch (error) {
                            this.sendMessage(upd.message.chat.id, `Ошибка: ${error}`);
                        }
                        break;
                }
            } else {
                this.handleMessageCommand(upd);
            }
        }
    }

    async handleMessageCommand(upd: Update) {
        switch (upd.message.text) {
            case '/start':
                this.sendMessage(upd.message.chat.id, 'Приветствую! Используйте команды в меню бота, чтобы добавлять группы в список отслеживаемых и получать новые посты из этих групп в этот диалог');
                break;
            case '/add':
                this.context_map[upd.message.chat.id] = { mode: '/add', last_message: upd.message };
                this.sendMessage(upd.message.chat.id, 'Введите ссылку на группу или группы (через запятую), посты которых надо отслеживать (например: https://vk.com/group_name):');
                break;
            case '/remove':
                this.context_map[upd.message.chat.id] = { mode: '/remove', last_message: upd.message };
                this.sendSubscriptionsList(upd.message.chat.id);
                this.sendMessage(upd.message.chat.id, 'Введите номер группы или групп (через запятую), которые нужно перестать отслеживать');
                break;
            case '/list':
                this.sendSubscriptionsList(upd.message.chat.id);
            case '/cancel':
                this.context_map[upd.message.chat.id] = { mode: null, last_message: upd.message };
                this.sendMessage(upd.message.chat.id, 'Действие отменено');
            default:
                this.sendMessage(upd.message.chat.id, 'Неизвестная команда (список команд доступен в меню бота)');
                break;
        }
    }

    async subscribe(message: Message) {
        // TODO: validation + error throwing
        const group_screen_names = message.text.split(',').map(link => new URL(link).pathname.split('/').pop());
        // screen name resolver
    }

    async unsubscribe(message: Message) {

    }

    async sendSubscriptionsList(chat_id: number) {

    }

    async sendMessage(chat_id: number, message: string) {
        return fetch(`${this.request_uri}sendMessage?chat_id=${chat_id}&text=${message}`).catch(err => console.error(err));
    }


    async post(method: string, data: TelegramPost) {
        return fetch(this.request_uri, {
            method: 'POST',
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            body: data
        })
    }

    async initPostLoop() {
        switch (this.request_mode) {
            case 'burst':
                this.burstPostLoop();
                break;
            case 'flow':
                this.flowPostLoop(0);
                break;
        }
    }

    async flowPostLoop(idx: number) {
        if (this.storage.count() === 0) return setTimeout(() => { this.flowPostLoop(0) }, 60 * 1000);
        if (idx >= this.storage.count()) idx = 0;
        const { group_id, consumer_ids } = this.storage.get(idx);
        try {
            const raw_posts = await this.vk_api.getNewPosts(group_id);
            if (raw_posts.length) {
                const posts = new PostBuilder(raw_posts).build();
                // build formdata posts
                // send posts
            }
        } catch (error) {
            for (const consumer of consumer_ids) {
                this.sendMessage(consumer, error);
            }
        }
        setTimeout(() => { this.flowPostLoop(idx++) }, this.post_timeout);
    }

    async burstPostLoop() {
        // no impl
    }

    /**
     * Calculates timeout between vk-api request based on request mode, api limitations and amount of subscribed groups
     * @returns timeout in milliseconds
     */
    calculatePostTimeout(request_mode) {
        return request_mode === 'burst' ? 86400 / (5000 / this.storage.count()) * 1000 : 86400 / 5000 * 1000;
    }
}


const isCommand = (message: string) => {
    return message[0] === '/';
}