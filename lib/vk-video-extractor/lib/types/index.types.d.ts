export interface URLData {
    type: Types;
    oid: string;
    id: string;
}
export interface VideoData {
    direct_url: string;
    mimetype: string;
    filesize: number;
    filename: string;
}
export declare enum Types {
    FRONT = "FRONT",
    BACK = "BACK"
}
