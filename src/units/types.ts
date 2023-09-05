export const SupportedAttachmentType = ["photo", "audio", "video", "doc", "link"];
export const TelegramTypeMapper = {
    'photo': {type: 'photo', method: 'sendPhoto'},
    'audio': {type: 'audio', method: 'sendAudio'},
    'video': {type: 'video', method: 'sendVideo'},
    'doc': {type: 'document', method: 'sendDocument'},
    'link': {type: 'link', method: 'sendMessage'},
    mediaGroup: 'sendMediaGroup'
}
export const TypeAPIMap = {
    'photo': 'photo'
}