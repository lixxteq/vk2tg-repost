import type { TelegramPost, WallPost } from "types/types";

export default class PostBuilder {
    raw_post: WallPost;

    constructor(raw_data: WallPost) {
        this.raw_post = raw_data;
    }

    build(): TelegramPost {
        const telegramPost = new FormData();
        // telegramPost.append('')
        return 
    }
}