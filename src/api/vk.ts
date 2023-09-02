import fetch from "node-fetch";

class VkAPI {
    api_token: any;
    constructor(api_token) {
        this.api_token = api_token;
    }
}

export default VkAPI;