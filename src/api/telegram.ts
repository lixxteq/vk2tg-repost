import fetch from "node-fetch";
import type { Context, IncomingMessage, Update, UpdatesResponse, UserPref, TelegramPost, MessageOptions, SendMessageResponse, ReplyKeyboardMarkup, ReplyKeyboardRemove, OutgoingMessage } from "types/telegram.types";
import VkAPI from "./vk";
import PostBuilder from "./post-builder";
import Symbols from "units/symbols";
import Texts from "units/texts";
import Commands from "units/commands";
import { serializeToQuery } from "utils/utils";

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
     * Initialize bot, start Telegram API long-polling and launch reposting loop
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
                console.log('Context:', this.context_map[parsed[0]?.message.chat.id]);
                
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
                    case 'ADD':
                        try {
                            this.subscribe(upd.message);
                            this.context_map[upd.message.chat.id] = { mode: null, last_message: upd.message };
                            this.sendMessage({chat_id: upd.message.chat.id, text: Texts.ADD_SUCCESS});
                        } catch (error) {
                            this.sendMessage({chat_id: upd.message.chat.id, text: `Ошибка: ${error}`});
                        }
                        break;
                    case 'REMOVE':
                        try {
                            this.unsubscribe(upd.message);
                            this.context_map[upd.message.chat.id] = { mode: null, last_message: upd.message };
                            this.sendMessage({chat_id: upd.message.chat.id, text: Texts.REMOVE_SUCCESS});
                        } catch (error) {
                            this.sendMessage({chat_id: upd.message.chat.id, text: `Ошибка: ${error}`});
                        }
                        break;
                }
            } else {
                this.handleMessageCommand(upd);
            }
        }
    }
    // TODO: /help
    async handleMessageCommand(upd: Update) {
        console.debug(upd.message.text);

        switch (upd.message.text) {
            case Commands.START:
                this.sendMessage({chat_id: upd.message.chat.id, text: Texts.START});
                break;
            case Commands.ADD:
                this.context_map[upd.message.chat.id] = { mode: 'ADD', last_message: upd.message };
                this.sendMessage({chat_id: upd.message.chat.id, text: Texts.ADD, reply_markup: attachCancelButton});
                break;
            case Commands.REMOVE:
                this.context_map[upd.message.chat.id] = { mode: 'REMOVE', last_message: upd.message };
                this.sendSubscriptionsList(upd.message.chat.id);
                this.sendMessage({chat_id: upd.message.chat.id, text: Texts.REMOVE, reply_markup: attachCancelButton});
                break;
            case Commands.LIST:
                this.sendSubscriptionsList(upd.message.chat.id);
                break;
            // ?: convert to InlineKeyboard
            case Symbols.CANCEL:
                this.context_map[upd.message.chat.id] = { mode: null, last_message: upd.message };
                const cb = await this.sendMessage({chat_id: upd.message.chat.id, text: 'Cancelled', reply_markup: removeKeyboard})
                // TODO: remove user message with Symbols.CANCEL + exception handler
                if (cb) this.deleteMessage(upd.message.chat.id, (await cb.json() as SendMessageResponse).result.message_id);
                break;
            default:
                this.sendMessage({chat_id: upd.message.chat.id, text: Texts.UNKNOWN});
                break;
        }
    }

    async subscribe(message: IncomingMessage) {
        console.debug('invoked')
        // TODO: validation + error throwing
        const group_screen_names = message.text.split(',').map(link => new URL(link).pathname.split('/').pop());
        // screen name resolver
    }

    async unsubscribe(message: IncomingMessage) {

    }

    async sendSubscriptionsList(chat_id: number) {

    }

    async sendMessage(message: OutgoingMessage) {
        // TODO: inspect serialize util behaviour
        let request = `${this.request_uri}sendMessage?${serializeToQuery(message)}`;
        return fetch(request).catch(err => console.error(err));
    }

    async deleteMessage(chat_id: number, message_id: number) {
        return fetch(`${this.request_uri}deleteMessage?chat_id=${chat_id}&message_id=${message_id}`);
    }

    async post(method: string, data: TelegramPost) {
        return fetch(this.request_uri, {
            method: 'POST',
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            // body: data
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
                for (const raw_post of raw_posts) {
                    const post = new PostBuilder(raw_post).build();
                }
            }
        } catch (error) {
            for (const consumer of consumer_ids) {
                this.sendMessage({chat_id: consumer, text: error});
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
    // message is considered as command only if it is in Commands list or if it's Unicode emoji
    return Object.values(Commands).includes(message) || /^\p{Extended_Pictographic}$/u.test(message);
}

const attachCancelButton: ReplyKeyboardMarkup = {
    keyboard: [[{ text: Symbols.CANCEL }]],
    is_persistent: true,
    one_time_keyboard: true,
    resize_keyboard: true
}

const removeKeyboard: ReplyKeyboardRemove = {
    remove_keyboard: true
}