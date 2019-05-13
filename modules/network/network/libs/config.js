let PostUrl = '';

class NetworkConfig {
    static setConfig({postUrl}) {
        PostUrl = postUrl;
    }

    static getPostUrl() {
        return PostUrl;
    }
}

export {
    NetworkConfig
}
