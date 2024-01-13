import { Axios } from 'axios';
import { VideoData } from '../types/index.types';
declare class Extractor {
    url: string;
    http: Axios;
    private _cached;
    constructor(url: string);
    download: (path?: string, filename?: string) => Promise<string>;
    private _download;
    private _delete;
    get_video_info: () => Promise<VideoData>;
    get_direct_url: (data_pass?: boolean) => Promise<string>;
    private _create_player_url;
    private _parse_url;
    private _parse_fallback;
    private _set_cached_info;
}
export { Extractor as default };
