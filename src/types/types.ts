export interface UserPref {
    group_id: string,
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

export interface Update {
    update_id: number,
    message: Message
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

interface User {
    id: number,
    is_bot: boolean,
    first_name: string,
    username: string,
    language_code: string,
    [key: string]: any
}

interface Chat {
    id: number,
    first_name: string,
    username: string,
    type: string,
    [key: string]: any
}

export interface Post extends FormData {
    [key: string]: any
}