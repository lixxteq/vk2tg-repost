export interface UserPref {
    group_id: number,
    consumer_ids: number[]
}

export interface Context {
    mode: '/add' | '/remove' | '/list' | null,
    last_message: Message
}

export interface UpdatesResponse {
    ok: boolean,
    result: Update[]
}

export interface ResolveGroupsResponse {
    response?: Group[],
    error?: {
        error_code: number;
    }
}

export interface GetNewPostsResponse {
    response?: {
        count: number,
        items: WallPost[]
    },
    error?: {
        error_code: number
    }
}

export interface Update {
    update_id: number,
    message: Message,
    [key: string]: any
}

export interface Message {
    message_id: number,
    from: User,
    chat: Chat,
    date: number,
    text: string,
    [key: string]: any
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

export interface WallPost {
    id: number,
    date: number,
    text?: string,
    copyright?: {
        id: number,
        link?: string
    },
    post_type: string,
    attachments: WallPostAttachment[],
    [key: string]: any
}

export interface WallPostAttachment {
    type: AttachmentType,
    [key: string]: any
}

export interface Group {
    id: number,
    screen_name: string,
    type: string,
    is_closed: number,
    [key: string]: any
}

export interface WallHistory {
    init_time: number,
    history: Record<number, number>
}

type AttachmentType = "photo" | "photos_list" | "audio" | "audio_playlist" | "video" | "doc" | "link" | "note" | "app" | "poll" | "page" | "album" | "event" | "article" | "group";

export interface TelegramPost extends FormData {
    [key: string]: any
}