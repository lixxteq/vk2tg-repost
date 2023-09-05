import type { LinkAttachment, WallPost, WallPostAttachment } from "types/vk.types";
import type { TelegramAttachment, TelegramPost } from "types/telegram.types";
import { SupportedAttachmentType, TelegramTypeMapper } from "units/types";

export default class PostBuilder {
    raw_post: WallPost;
    method: string = 'sendMessage';

    constructor(raw_data: WallPost) {
        this.raw_post = raw_data;
    }

    build(): TelegramPost {
        const post = new FormData();

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
                attachments.push()
                break;
            default:
                this.method = TelegramTypeMapper.mediaGroup;
                break;
        }
        return attachments;
    }
}

const getAttachmentURL = (attachment: WallPostAttachment) => {
    switch (attachment.type) {
        case 'link':
            return attachment.link.url;
        // TODO: photo sizes test
        // https://dev.vk.com/ru/reference/objects/photo-sizes
            
        case 'audio':
            return ''
    }
}

const AttachmentURLExtractor = {
    'photo': (attachment: WallPostAttachment) => {
        return attachment.photo.sizes.filter(el => el.type === 'z')[0].url;
    },
    'link': (attachment: LinkAttachment) => {
        return attachment.link.url;
    }
}