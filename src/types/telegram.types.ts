import Commands from 'units/commands';
export interface Context {
    mode: keyof typeof Commands | null,
    last_message: IncomingMessage
}

export interface UpdatesResponse {
    ok: boolean,
    result: Update[],
    [key: string]: any
}

export interface SendMessageResponse {
    ok: boolean,
    result: IncomingMessage,
    [key: string]: any
}

export interface Update {
    update_id: number,
    message: IncomingMessage,
    [key: string]: any
}

export interface IncomingMessage {
    message_id: number,
    from: User,
    chat: Chat,
    date: number,
    text: string,
    [key: string]: any
}

export interface OutgoingMessage extends MessageOptions {
    chat_id: number,
    text: string
}

export interface MessageOptions {
    reply_markup?: ReplyKeyboardMarkup | ReplyKeyboardRemove,
    parse_mode?: 'MarkdownV2' | 'HTML',
    disable_web_page_preview?: boolean,
    [key: string]: any
}

export interface ReplyKeyboardMarkup {
    keyboard: KeyboardButton[][],
    is_persistent?: boolean,
    one_time_keyboard?: boolean,
    input_field_placeholder?: string,
    resize_keyboard?: boolean
}

export interface KeyboardButton {
    text: string
}

export interface ReplyKeyboardRemove {
    remove_keyboard: true
}

export interface User {
    id: number,
    is_bot: boolean,
    first_name: string,
    username: string,
    language_code: string,
    [key: string]: any
}

export interface Chat {
    id: number,
    first_name: string,
    username: string,
    type: string,
    [key: string]: any
}

export interface TelegramPostBase {
    chat_id: number,
    parse_mode?: 'MarkdownV2' | 'HTML',
}

export interface TelegramMessagePost extends TelegramPostBase {

}

export interface TelegramPhotoPost extends TelegramPostBase {

}

export interface TelegramAudioPost extends TelegramPostBase {

}

export interface TelegramVideoPost extends TelegramPostBase {

}

export interface TelegramMediaGroupPost extends TelegramPostBase {

}

export type TelegramPost = TelegramMessagePost | TelegramPhotoPost | TelegramAudioPost | TelegramVideoPost | TelegramMediaGroupPost

export interface UserPref {
    group_id: number,
    consumer_ids: number[]
}

export interface TelegramAttachment {
    type: string,
    media: string
}