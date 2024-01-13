import type { AudioAttachment, DocAttachment, LinkAttachment, PhotoAttachment, VideoAttachment, WallPost, WallPostAttachment } from "types/vk.types";
import type { InputMedia, InputMediaPhoto, TelegramPost, InputMediaType, InputMediaVideo, InputMediaGroup, InputMediaAudio, InputMediaDocument, TelegramPostRequest, TelegramPhotoPost, TelegramVideoPost, TelegramDocumentPost, TelegramAudioPost, TelegramMessagePost, TelegramMediaGroupPost } from "types/telegram.types";
import { SupportedAttachmentType, TelegramTypeMapper } from "units/mappings";
import logger from "utils/logger";

export default class PostBuilder {
    raw_post: WallPost;
    method: string = 'sendMessage';
    media_group: InputMediaGroup[]
    attachment: TelegramPost

    constructor(raw_data: WallPost) {
        this.raw_post = raw_data;
    }

    public build(): TelegramPostRequest {
        var val = this.form_attachments();

        var post_request: TelegramPostRequest = {
            method: this.method,
            data: this.attachment ? this.attachment : this.media_group ? {media: this.media_group} : {text: this.raw_post.text}
        }

        return post_request
    }

    private form_attachments(): number {
        const raw_attachments = this.raw_post.attachments.filter(el => SupportedAttachmentType.includes(el.type));
        switch (raw_attachments.length) {
            case 0:
                return 0;
            case 1:
                this.method = TelegramTypeMapper[raw_attachments[0].type].method;
                this.attachment = this.attachment_from_attachment(raw_attachments[0]);
                return raw_attachments.length;
            default:
                // Documents and audio files can be only grouped in an album with messages of the same type
                var singles = raw_attachments.filter(el => el.type === 'doc' || el.type === 'audio').length
                if (singles != 0 && singles != raw_attachments.length) {
                    // handle non-grouping attachments
                    return;
                }
                this.method = TelegramTypeMapper.mediaGroup;
                this.media_group = this.form_media_group(raw_attachments);
                this.media_group[0].caption = this.raw_post.text;
                return raw_attachments.length;
        }
    }

    private form_media_group(attachments: WallPostAttachment[]): InputMediaGroup[] {
        return [...attachments.map(attachment => this.media_from_attachment(attachment))];
    }

    private media_from_attachment(attachment: WallPostAttachment): InputMediaGroup {
        var _media: InputMedia = {
            type: TelegramTypeMapper[attachment.type].type,
            media: AttachmentMediaURLExtractor[attachment.type](attachment)
        }
        return MediaConstructor[_media.type](_media)
    }

    private attachment_from_attachment(attachment: WallPostAttachment): TelegramPost {
        var _media: InputMedia = {
            type: TelegramTypeMapper[attachment.type].type,
            media: AttachmentMediaURLExtractor[attachment.type](attachment[attachment.type])
        }
        return {...AttachmentConstructor[_media.type](_media), caption: this.raw_post.text}
    }
}

// TODO: extend function to return complete attachment types instead of url
const AttachmentMediaURLExtractor = {
    // TODO: photo sizes testing
    // https://dev.vk.com/ru/reference/objects/photo-sizes
    // TODO: compare photo size in bytes and api limitations, fallback to sending through form-data
    // https://core.telegram.org/bots/api#sending-files
    'photo': (attachment: PhotoAttachment) => {
        logger.debug(`attachment: %O`, [attachment, attachment.sizes])
        return attachment.sizes.filter(el => el.type === 'z' || el.type === 'y')[0].url;
    },
    'link': (attachment: LinkAttachment) => {
        return attachment.url || undefined;
    },
    // TODO: compare video size in bytes and api limitations, fallback to sending through form-data
    // https://core.telegram.org/bots/api#sending-files
    'video': (attachment: VideoAttachment) => {
        return attachment.player || undefined;
    },
    'audio': (attachment: AudioAttachment) => {
        return attachment.url || undefined;
    },
    'doc': (attachment: DocAttachment) => {
        return attachment.url || undefined;
    }
}

const MediaConstructor = {
    'photo': (_media: InputMedia): InputMediaPhoto => ({..._media, type: 'photo', show_caption_above_media: true}),
    'video': (_media: InputMedia): InputMediaVideo => ({..._media, type: 'video', show_caption_above_media: true}),
    'audio': (_media: InputMedia): InputMediaAudio => ({..._media, type: 'audio'}),
    'document': (_media: InputMedia): InputMediaDocument => ({..._media, type: 'document'})
}

const AttachmentConstructor = {
    'photo': (media: InputMedia): TelegramPhotoPost => ({photo: media.media, show_caption_above_media: true}),
    'video': (media: InputMedia): TelegramVideoPost => ({video: media.media, show_caption_above_media: true, supports_streaming: true}),
    'audio': (media: InputMedia): TelegramAudioPost => ({audio: media.media}),
    'document': (media: InputMedia): TelegramDocumentPost => ({document: media.media})
}