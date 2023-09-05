import fetch from "node-fetch";
import type { GetNewPostsResponse, Group, ResolveGroupsResponse, WallHistory } from "types/vk.types";

export default class VkAPI {
    request_uri: string = 'https://api.vk.com/method/';
    api_token: string;
    api_version: string;
    wall_history: WallHistory;

    constructor(api_token: string) {
        this.api_token = api_token;
        this.api_version = process.env.VK_API_VERSION || '5.131';
        this.wall_history = {init_time: Date.now() / 1000, history: {}};
    }

    async request(method: string, payload: Record<string, any>) {
        return await fetch(`${this.request_uri}${method}?v=${this.api_version}&${new URLSearchParams(payload).toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.api_token}`
            }
        })
    }

    async getDomainById(id: number) {
        const res = (await (await this.request('groups.getById', {group_id: id})).json()) as ResolveGroupsResponse;
        return res.response[0].screen_name;
    }

    async resolveGroupIds(screen_names: string[]) {
        const res = (await (await this.request('groups.getById', {group_ids: screen_names})).json()) as ResolveGroupsResponse;
        if (res.error?.error_code === 100) throw new Error('Введенной группы не существует, проверьте правильность ввода и повторите попытку');
        if (res.error) throw new Error(`Ошибка запроса: ${res.error.error_code}`);
        if (res.response.length < screen_names.length) throw new Error(`Не существует групп: ${nonResolved(screen_names, res.response).join(', ')}, проверьте правильность ввода и повторите попытку`);
        return res.response.map(gr => -gr.id);
    }

    async getNewPosts(group_id: number) {
        const res = (await (await this.request('wall.get', {owner_id: group_id, count: 10})).json()) as GetNewPostsResponse;
        if (res.error && [15, 19].includes(res.error.error_code)) throw new Error(`Сообщество "${await this.getDomainById(group_id)}" закрыло доступ к своим записям. Уберите это сообщество из отслеживаемых`);
        if (res.error) throw new Error(`Ошибка запроса: ${res.error.error_code}`);
        return res.response.items.slice(0, res.response.items.findIndex((post) => post.date < (this.wall_history.history[group_id] || this.wall_history.init_time)));
    }
}

const nonResolved = (screen_names: string[], resolved: Group[]) => {
    return screen_names.filter((name) => !resolved.find(obj => obj.screen_name === name));
}