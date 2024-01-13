"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = void 0;
const axios_1 = __importDefault(require("axios"));
const index_types_1 = require("../types/index.types");
const node_html_parser_1 = require("node-html-parser");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const promises_1 = require("stream/promises");
const BASEHEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.142.86 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-us,en;q=0.5"
};
const SRCHEADERS = {
    "Accept-Charset": "ISO-8859-1,utf-8;q=0.7,*;q=0.7",
    "Accept-Encoding": "gzip, deflate",
};
const DOMAINS = {
    FRONT: ["vk.com", "vk.ru"],
    BACK: ["vk-cdn.net", "vkuservideo.net", /sun[\d*\-]*\.userapi\.com/, /vkvd\d*.mycdn.me/]
};
const URLREGEX = /"url\d{3,4}"\s*:\s*([^;,]+);?/g;
class Extractor {
    url;
    http;
    _cached = undefined;
    constructor(url) {
        this.url = url;
        this.http = axios_1.default.create({
            headers: BASEHEADERS
        });
    }
    download = async (path, filename) => {
        var _info = this._cached ?? await this.get_video_info();
        // TODO: validate input path
        var download_path = path_1.default.join(path ?? process.cwd(), filename ?? _info.filename);
        var res = await this._download(_info.direct_url, download_path);
        return download_path;
    };
    _download = async (url, path) => {
        var _fds = (0, fs_1.createWriteStream)(path);
        var _resp = await this.http.get(url, { responseType: 'stream', headers: SRCHEADERS });
        _resp.data.pipe(_fds);
        return (0, promises_1.finished)(_fds);
    };
    _delete = async () => { };
    get_video_info = async () => {
        var direct_url = await this.get_direct_url(true);
        var _head = await this.http.head(direct_url, { headers: SRCHEADERS });
        if (_head.status !== 200)
            throw new Error('Failed to get video info');
        var _info = {
            direct_url: direct_url,
            mimetype: _head.headers['content-type'],
            filesize: Number(_head.headers['content-length']),
            filename: _head.headers['content-disposition'].split(';')[1].split('=')[1].replace(/"/g, '')
        };
        this._set_cached_info(_info);
        return _info;
    };
    get_direct_url = async (data_pass) => {
        var player_url = this._create_player_url();
        var player_page = await this.http.get(player_url.toString(), { responseType: 'document' });
        if (player_page.status !== 200)
            throw new Error('Failed to get player page');
        var _html = (0, node_html_parser_1.parse)(player_page.data);
        var _val = _html.querySelector('body')?.querySelectorAll('script')[1].innerHTML.matchAll(URLREGEX);
        if (!_val)
            throw new Error('Failed to get direct url');
        var _arr = Array.from(_val);
        var _best_quality_match = typeof _arr[0] === 'object' ? _arr[_arr.length - 1][1] : _arr[1];
        // @ts-ignore
        return _best_quality_match.replace(/["]+/g, '').replaceAll("\\", "");
    };
    _create_player_url = () => {
        var base = new URL("https://vk.com/video_ext.php");
        var { type, ...args } = { hd: "2", ...this._parse_url() };
        base.search = new URLSearchParams(args).toString();
        return base;
    };
    _parse_url = () => {
        var u = new URL(this.url);
        var type = DOMAINS.FRONT.includes(u.hostname) ? index_types_1.Types.FRONT : DOMAINS.BACK.some(v => typeof v === "string" ? v === u.hostname : v.test(u.hostname)) ? index_types_1.Types.BACK : undefined;
        if (!type)
            throw new Error('Unknown domain');
        var raw_id = u.searchParams.has("z") ? u.searchParams.get("z") : u.pathname.slice(1);
        if (!raw_id || !raw_id.startsWith("video"))
            throw new Error('Invalid url');
        var _raw_id_parse = (raw_id) => { return raw_id.slice(5).slice(0, raw_id.indexOf("%") === -1 ? undefined : raw_id.indexOf("%")).split("_"); };
        return {
            type: type,
            oid: _raw_id_parse(raw_id)[0],
            id: _raw_id_parse(raw_id)[1]
        };
    };
    _parse_fallback = () => { };
    _set_cached_info = (info) => { this._cached = info; };
}
exports.default = Extractor;
