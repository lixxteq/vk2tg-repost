import fetch from "node-fetch";
import type { Context, Message, Post, Update, UpdatesResponse, UserPref } from "../types/types";
import VkAPI from "./vk";

export default class TelegramBotFactory {
    request_uri: string;
    api_token: string;
    update_offset: number;
    storage: Collection<UserPref>;
    context_map: Record<number, Context>;
    post_timeout: number;
    vk: VkAPI;

    constructor(tg_api_token: string, vk_api_token: string, storage: Collection<UserPref>) {
        this.api_token = tg_api_token;
        this.request_uri = `https://api.telegram.org/bot${tg_api_token}/`;
        this.update_offset = 0;
        this.context_map = {};
        this.storage = storage;
        this.post_timeout = this.calculatePostTimeout();
        this.vk = new VkAPI(vk_api_token);
    }

    async init() {
        this.poll();
        this.initPostLoop();
    }

    post(method: string, data: Post) {
        fetch(this.request_uri, {
            method: 'POST',
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            body: data
        })
    }

    async poll() {
        const res = await fetch(`${this.request_uri}getUpdates?offset=${this.update_offset}&timeout=30&allowed_updates=message`);
        
        switch (res.status) {
            case 200:
                const parsed = ((await res.json()) as UpdatesResponse).result;
                this.handleMessage(parsed);
                this.update_offset = parsed.length ? parsed.pop()['update_id']+1 : this.update_offset;
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
                            this.context_map[upd.message.chat.id] = {mode: null, last_message: upd.message};
                            this.sendMessage(upd.message.chat.id, 'Группы добавлены в отслеживаемые');
                        } catch (error) {
                            this.sendMessage(upd.message.chat.id, `Ошибка: ${error}`);
                        }
                        break;
                    case '/remove':
                        try {
                            this.unsubscribe(upd.message);
                            this.context_map[upd.message.chat.id] = {mode: null, last_message: upd.message};
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
                this.context_map[upd.message.chat.id] = {mode: '/add', last_message: upd.message};
                this.sendMessage(upd.message.chat.id, 'Введите ссылку на группу или группы (через запятую), посты которых надо отслеживать (например: https://vk.com/group_name):');
                break;
            case '/remove':
                this.context_map[upd.message.chat.id] = {mode: '/remove', last_message: upd.message};
                this.sendSubscriptionsList(upd.message.chat.id);
                this.sendMessage(upd.message.chat.id, 'Введите номер группы или групп (через запятую), которые нужно перестать отслеживать');
                break;
            case '/list':
                this.sendSubscriptionsList(upd.message.chat.id);
            case '/cancel':
                this.context_map[upd.message.chat.id] = {mode: null, last_message: upd.message};
                this.sendMessage(upd.message.chat.id, 'Действие отменено');
            default:
                this.sendMessage(upd.message.chat.id, 'Неизвестная команда (список команд доступен в меню бота)');
                break;
        }
    }

    async sendSubscriptionsList(chat_id: number) {

    }

    async subscribe(message: Message) {
        // TODO: validation + error throwing
        const group_screen_names = message.text.split(',').map(link => new URL(link).pathname.split('/').pop());
        // screen name resolver
    }

    async unsubscribe(message: Message) {

    }

    /**
     * Calculates timeout between vk-api request bursts based on api limitations and amount of subscribed groups
     * @returns timeout in seconds
     */
    calculatePostTimeout() {
        return 86400 / (5000 / this.storage.count());
    }

    async sendMessage(chat_id: number, message: string) {
        return fetch(`${this.request_uri}sendMessage?chat_id=${chat_id}&text=${message}`).catch(err => console.error(err));
    }

    async initPostLoop() {
        for (let i = 0; i < this.storage.count(); i++) {
            const {group_id, consumer_ids} = this.storage.get(i);
            // vk api request
        }
        setTimeout(() => {this.initPostLoop()}, this.post_timeout);
    }
}

const isCommand = (message: string) => {
    return message[0] === '/';
}