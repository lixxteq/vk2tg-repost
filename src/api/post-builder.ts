import type { AudioAttachment, LinkAttachment, PhotoAttachment, VideoAttachment, WallPost, WallPostAttachment } from "types/vk.types";
import type { TelegramAttachment, TelegramPost } from "types/telegram.types";
import { SupportedAttachmentType, TelegramTypeMapper } from "units/types";

export default class PostBuilder {
    raw_post: WallPost;
    method: string = 'sendMessage';

    constructor(raw_data: WallPost) {
        this.raw_post = raw_data;
    }

    build(): TelegramPost {
        // const post = new FormData();
        var post: TelegramPost
        post.

        return 
    }

    formAttachments(): TelegramAttachment[] {
        const attachments: TelegramAttachment[] = [];
        const raw_attachments = this.raw_post.attachments.filter(el => SupportedAttachmentType.includes(el.type));
        switch (raw_attachments.length) {
            case 0:
                return attachments;
            case 1:
                this.method = TelegramTypeMapper[raw_attachments[0].type].method;
                attachments.push({type: TelegramTypeMapper[raw_attachments[0].type].type, media: AttachmentURLExtractor[raw_attachments[0].type](raw_attachments[0])})
                break;
            default:
                this.method = TelegramTypeMapper.mediaGroup;
                break;
        }
        return attachments;
    }
}

// TODO: extend function to return complete attachment types instead of url
const AttachmentURLExtractor = {
    // TODO: photo sizes testing
    // https://dev.vk.com/ru/reference/objects/photo-sizes
    // TODO: compare photo size in bytes and api limitations, fallback to sending through form-data
    // https://core.telegram.org/bots/api#sending-files
    'photo': (attachment: PhotoAttachment) => {
        return attachment.sizes.filter(el => el.type === 'z')[0].url;
    },
    'link': (attachment: LinkAttachment) => {
        return attachment.url;
    },
    // TODO: compare video size in bytes and api limitations, fallback to sending through form-data
    // https://core.telegram.org/bots/api#sending-files
    'video': (attachment: VideoAttachment) => {
        return attachment.player;
    },
    'audio': (attachment: AudioAttachment) => {
        return attachment.url;
    }
}