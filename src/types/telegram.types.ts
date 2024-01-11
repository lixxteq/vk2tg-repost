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
export interface LinkPreviewOptions {
    is_disabled?: boolean
}

interface ITelegramPost {
    chat_id?: number,
    parse_mode?: 'MarkdownV2',
}

export interface TelegramMessagePost extends ITelegramPost {
    text: string,
    link_preview_options?: LinkPreviewOptions
}

export interface TelegramPhotoPost extends ITelegramPost {
    photo: string,
    caption?: string,
    show_caption_above_media?: boolean
}

export interface TelegramAudioPost extends ITelegramPost {
    audio: string,
    caption?: string,
    thumbnail?: string
}

export interface TelegramVideoPost extends ITelegramPost {
    video: string,
    caption?: string,
    thumbnail?: string,
    show_caption_above_media?: boolean,
    supports_streaming?: boolean
}

export interface TelegramDocumentPost extends ITelegramPost {
    document: string,
    caption?: string,
    thumbnail?: string
}

export interface TelegramMediaGroupPost extends ITelegramPost {
    media: InputMediaGroup[]
}

export type TelegramPost = TelegramMessagePost | TelegramPhotoPost | TelegramAudioPost | TelegramVideoPost | TelegramDocumentPost | TelegramMediaGroupPost

export interface TelegramPostRequest {
    method: string,
    data: TelegramPost
}

export interface UserPref {
    group_id: number,
    consumer_ids: number[]
}

export type InputMediaType = 'photo' | 'audio' | 'video' | 'document' | 'animation'

interface InputMedia{
    type: InputMediaType,
    media: string,
    parse_mode?: 'MarkdownV2',
    caption?: string
}

interface InputMediaPhoto extends InputMedia {
    type: 'photo',
    show_caption_above_media?: boolean
}

interface InputMediaAudio extends InputMedia {
    type: 'audio',
    thumbnail?: string
}
interface InputMediaVideo extends InputMedia {
    type: 'video',
    thumbnail?: string,
    show_caption_above_media?: boolean,
    supports_streaming?: boolean
}

interface InputMediaDocument extends InputMedia {
    type: 'document',
    thumbnail?: string
}

// GIF or H.264/MPEG-4 AVC
interface InputMediaAnimation extends InputMedia {
    type: 'animation',
    show_caption_above_media?: boolean
}

type InputMediaGroup = InputMediaPhoto | InputMediaAudio | InputMediaVideo | InputMediaDocument

export type {
    InputMedia,
    InputMediaPhoto,
    InputMediaAudio,
    InputMediaVideo,
    InputMediaDocument,
    InputMediaAnimation,
    InputMediaGroup
}