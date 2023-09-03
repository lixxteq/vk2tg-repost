import type { WallPost } from "types/types";

export default class PostBuilder {
    raw_posts: WallPost[];

    constructor(raw_data: WallPost[]) {
        this.raw_posts = raw_data;
    }

    build() {
        
    }
}