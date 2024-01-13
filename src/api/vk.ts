import fetch from "node-fetch";
import type { GetNewPostsResponse, Group, ResolveGroupsResponse, WallHistory } from "types/vk.types";
import logger from "utils/logger";

class APIReference {
    request_uri: string = 'https://api.vk.com/method/';
    api_version: string = process.env.VK_API_VERSION || '5.131';
    api_token: string = process.env.VK_TOKEN;

    async request(method: string) {
        return await fetch(method, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.api_token}`
            }
        })
    }

    groups: {
        getById: (group_id: number | string[]) => Promise<ResolveGroupsResponse>
    } = {
        getById: async (group_id: number | string[]) => (await this.request(`${this.request_uri}groups.getById?v=${this.api_version}&${group_id.constructor === Array ? 'group_ids' : 'group_id'}=${group_id.toString()}`)).json()
    }
    wall: {
        get: (owner_id: number, count: number) => Promise<GetNewPostsResponse>
    } = {
        get: async (owner_id: number, count: number) => (await this.request(`${this.request_uri}wall.get?v=${this.api_version}&owner_id=${owner_id}&count=${count}`)).json()
    }
}

export default class VkAPI {
    wall_history: WallHistory;
    ref: APIReference;

    constructor() {
        this.ref = new APIReference();
        this.wall_history = {init_time: (Date.now() / 1000) - 1000, history: {}};
    }

    async getDomainById(id: number | string[]) {
        // const res = (await (await this.request('groups.getById', {group_id: id})).json()) as ResolveGroupsResponse;
        const res = await this.ref.groups.getById(id);
        return res.response[0].screen_name;
    }

    async resolveGroupIds(screen_names: string[]) {
        // const res = (await (await this.request('groups.getById', {group_ids: screen_names})).json()) as ResolveGroupsResponse;
        const res = await this.ref.groups.getById(screen_names);
        logger.debug(`[vk] resolve_group_ids response: ${res}`)
        if (res.error?.error_code === 100) throw new Error('Введенной группы не существует, проверьте правильность ввода и повторите попытку');
        if (res.error) throw new Error(`Ошибка запроса: ${res.error.error_code}`);
        if (res.response.length < screen_names.length) throw new Error(`Не существует групп: ${nonResolved(screen_names, res.response).join(', ')}, проверьте правильность ввода и повторите попытку`);
        return res.response.map(gr => -gr.id);
    }

    async getNewPosts(group_id: number) {
        // const res = (await (await this.request('wall.get', {owner_id: group_id, count: 10})).json()) as GetNewPostsResponse;
        const res = await this.ref.wall.get(group_id, 10);
        logger.debug(`[vk] unfiltered get_new_posts response: count=${res.response.count}`)
        if (res.response.items[0].is_pinned === 1) res.response.items.shift()
        if (res.error && [15, 19].includes(res.error.error_code)) throw new Error(`Сообщество "${await this.getDomainById(group_id)}" закрыло доступ к своим записям. Уберите это сообщество из отслеживаемых`);
        if (res.error) throw new Error(`Ошибка запроса: ${res.error.error_code}`);
        logger.debug(`init time: ${this.wall_history.init_time}, last post time: ${res.response.items[0].date}`)
        var filtered = res.response.items.filter((post) => post.date > (this.wall_history.history[group_id] ?? this.wall_history.init_time))
        // var filtered = res.response.items.slice(0, res.response.items.findIndex((post) => post.date < (this.wall_history.history[group_id] ?? this.wall_history.init_time)))
        if (filtered) logger.debug(`[vk] filtered get_new_posts response: ${filtered}`)
            // TODO(critical): implement wall_history!!!
        return filtered;
    }
}

const nonResolved = (screen_names: string[], resolved: Group[]) => {
    return screen_names.filter((name) => !resolved.find(obj => obj.screen_name === name));
}