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

export interface WallPost {
    id: number,
    date: number,
    text?: string,
    copyright?: {
        id: number,
        link?: string
    },
    post_type: string,
    from_id?: number,
    attachments?: WallPostAttachment[],
    is_pinned?: number,
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

export type WallPostAttachment = LinkAttachment | PhotoAttachment | VideoAttachment | AudioAttachment | DocAttachment

interface IAttachment {
    type: AttachmentType
}

export interface LinkAttachment extends IAttachment {
    url: string,
    description?: string,
    title?: string,
    caption?: string,
    [key: string]: any
}

export interface PhotoAttachment extends IAttachment {
    id: number,
    text?: string,
    sizes: PhotoAttachmentSize[],
    width?: number,
    height?: number,
    [key: string]: any
}

export interface PhotoAttachmentSize {
    type: PhotoAttachmentType,
    url: string,
    width: number,
    height: number,
    [key: string]: any
}

export interface VideoAttachment extends IAttachment {
    id: number,
    owner_id: number,
    title?: string,
    description?: string,
    duration: number,
    player: string,
    [key: string]: any
}

export interface AudioAttachment extends IAttachment {
    id: number,
    artist: string,
    title: string,
    duration: number,
    url: string,
    [key: string]: any
}

export interface DocAttachment extends IAttachment {
    id: number,
    title?: string,
    size: number,
    ext: string,
    url?: string,
    [key: string]: any
}

type AttachmentType = "photo" | "photos_list" | "audio" | "audio_playlist" | "video" | "doc" | "link" | "note" | "app" | "poll" | "page" | "album" | "event" | "article" | "group";
type PhotoAttachmentType = "s" | "m" | "x" | "o" | "p" | "q" | "r" | "y" | "z" | "w"