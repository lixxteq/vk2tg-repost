import fetch from "node-fetch";
import type { Context, IncomingMessage, Update, UpdatesResponse, TelegramPost, MessageOptions, SendMessageResponse, ReplyKeyboardMarkup, ReplyKeyboardRemove, OutgoingMessage, TelegramPostRequest } from "types/telegram.types";
import VkAPI from "./vk";
import PostBuilder from "./post-builder";
import Symbols from "units/symbols";
import Texts from "units/texts";
import Commands from "units/commands";
import { PostFormData, serializeToQuery } from "utils/utils";
import type { Subscription } from "rxjs";
import logger from "utils/logger";
import type { UserCollection, UserDatabase, UserDocument } from "storage/db";

export default class TelegramBotFactory {
    request_uri: string;
    api_token: string;
    update_offset: number = 0;
    storage: UserCollection
    context_map: Record<number, Context> = {};
    post_timeout: number;
    vk_api: VkAPI;
    request_mode: 'burst' | 'flow'
    $sub: Subscription
    $: UserDocument[]

    constructor(tg_api_token: string, vk_api: VkAPI, storage: UserDatabase, request_mode?: 'burst' | 'flow') {
        this.api_token = tg_api_token;
        this.request_uri = `https://api.telegram.org/bot${tg_api_token}/`;
        this.vk_api = vk_api;
        this.storage = storage.users
        this.request_mode = request_mode || 'flow';
        // TODO: test method
        this.calculatePostTimeout().then((timeout) => this.post_timeout = timeout);
        this.$sub = this.storage.find({}).$.subscribe((data) => this.$ = data)
    }

    /**
     * Initialize bot, start Telegram API long-polling and launch reposting loop
     * @async
     */
    async init() {
        this.$ = await this.storage.find({}).exec()
        logger.info(`[telegram] started bot, RxDB entries: ${this.$?.length}, request timeout: ${this.post_timeout}`)
        this.poll();
        this.initPostLoop();
    }

    async poll() {
        const res = await fetch(`${this.request_uri}getUpdates?offset=${this.update_offset}&timeout=60&allowed_updates=message`);

        switch (res.status) {
            case 200:
                const parsed = ((await res.json()) as UpdatesResponse).result;
                if (parsed) {
                    this.handleMessage(parsed);
                    this.update_offset = parsed.length ? parsed.pop()['update_id'] + 1 : this.update_offset;
                }
                logger.info(`[telegram] long poll offset: ${this.update_offset}, context: ${this.context_map[parsed[0]?.message.chat.id]}`);
                break;
            case 502:
                break;
            default:
                logger.info('[telegram] long poll error: ', res.status);
                break;
        }
        setTimeout(() => this.poll(), 0);
    }

    async handleMessage(updates: Update[]) {
        logger.info(`[telegram] received ${updates.length} updates: ${updates.map((upd) => [upd.message.chat.id, upd.message.text])}`)
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
                this.send_subscriptions_list(upd.message.chat.id);
                this.sendMessage({chat_id: upd.message.chat.id, text: Texts.REMOVE, reply_markup: attachCancelButton});
                break;
            case Commands.LIST:
                this.send_subscriptions_list(upd.message.chat.id);
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
        // TODO: validation + error throwing
        const group_screen_names = message.text.split(',').map(link => new URL(link).pathname.split('/').pop());
        var ids = await this.vk_api.resolveGroupIds(group_screen_names)
        // screen name resolver
        for (let id of ids) {
            var _doc = await this.storage.findOne({selector: {group_id: id}}).exec()
            if (_doc) _doc.consumer_ids.push(message.chat.id)
            if (!_doc) _doc = await this.storage.insert({group_id: id, consumer_ids: [message.chat.id]})
        }
        logger.debug(`[telegram]: subscribe ${message.chat.id} to ${ids.join(', ')}`)
    }

    async unsubscribe(message: IncomingMessage) {
        // TODO: validation + error throwing
        
    }

    async send_subscriptions_list(chat_id: number, text: string = Texts.LIST) {
        this.sendMessage({chat_id: chat_id, text: `${Texts.LIST} ${await this.storage.find({selector: {consumer_ids: {$in: [chat_id]}}}).exec()}`})
    }

    async sendMessage(message: OutgoingMessage) {
        // TODO: inspect serialize util behaviour
        let request = `${this.request_uri}sendMessage?${serializeToQuery(message)}`;
        return fetch(request).catch((err) => {logger.error(`[telegram] send_message error: ${err}`)});
    }

    async deleteMessage(chat_id: number, message_id: number) {
        return fetch(`${this.request_uri}deleteMessage?chat_id=${chat_id}&message_id=${message_id}`);
    }

    async post(req: TelegramPostRequest, consumers: number[]) {
        var req_stack = []
        for (let consumer of consumers) {
            req.data.chat_id = consumer
            req_stack.push(
                fetch(`${this.request_uri}${req.method}`, {
                    method: 'POST',
                    body: new PostFormData(req.data)
                }).then(async (res) => {
                    logger.debug(`[telegram] submit data: ${JSON.stringify(req.data)}, post response: ${res.status}, ${res.body.read()}`)
                })
            )
        }
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
        logger.info(`[telegram] loop call ${idx}, RxDB entries: ${this.$.length}`)
        if (await this.storage.count({}).exec() === 0) return setTimeout(() => { this.flowPostLoop(0) }, 60 * 1000);
        if (idx >= this.$.length) idx = 0;
        const { group_id, consumer_ids } = this.$[idx]
        // const data = this.$[idx]
        logger.debug(`${group_id}, ${consumer_ids}`)
        // logger.debug(data.consumer_ids)
        try {
            const raw_posts = await this.vk_api.getNewPosts(group_id);
            if (raw_posts.length) {
                for (const raw_post of raw_posts) {
                    logger.debug(`raw_post: %O`, [raw_post])
                    const post_request = await new PostBuilder(raw_post).build();
                    logger.debug(`post: %O`, [post_request, post_request.data])
                    this.post(post_request, consumer_ids)
                }
            }
        } catch (error) {
            logger.error(`[telegram] loop post error ${[group_id, consumer_ids]}: ${error}`)
            for (const consumer of consumer_ids) {
                this.sendMessage({chat_id: consumer, text: error});
            }
        }
        setTimeout(() => { this.flowPostLoop(++idx) }, this.post_timeout);
    }

    async burstPostLoop() {
        // no impl
    }

    /**
     * Calculates timeout between vk-api request based on request mode, api limitations and amount of subscribed groups
     * @returns timeout in milliseconds
     */
    async calculatePostTimeout() {
        return Number(process.env.DEBUG_REQUEST_COOLDOWN) || (this.request_mode === 'burst' ? 86400 / (5000 / await this.storage.count({}).exec()) * 1000 : 86400 / 5000 * 1000);
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