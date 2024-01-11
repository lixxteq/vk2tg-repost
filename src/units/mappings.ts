export const SupportedAttachmentType = ["photo", "audio", "video", "doc"];
export const TelegramTypeMapper = {
    'photo': {type: 'photo', method: 'sendPhoto'},
    'audio': {type: 'audio', method: 'sendAudio'},
    'video': {type: 'video', method: 'sendVideo'},
    'doc': {type: 'document', method: 'sendDocument'},
    'link': {type: 'link', method: 'sendMessage'},
    // animation?
    mediaGroup: 'sendMediaGroup'
}
export const TypeAPIMap = {
    'photo': 'photo'
}