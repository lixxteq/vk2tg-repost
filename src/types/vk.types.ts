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
    [key: string]: any
}

export interface WallPostAttachment {
    type: AttachmentType,
    link?: LinkAttachment,
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

export interface LinkAttachment {
    url: string,
    description: string,
    [key: string]: any
}

export interface PhotoAttachment {
    
}
type AttachmentType = "photo" | "photos_list" | "audio" | "audio_playlist" | "video" | "doc" | "link" | "note" | "app" | "poll" | "page" | "album" | "event" | "article" | "group";