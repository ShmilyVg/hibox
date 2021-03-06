import {NetworkConfig} from "../modules/network/network/index";

const SoftwareVersion = '1.5.9';
const PostUrl = 'https://backend.stage.hipee.cn/hipee-web-hibox/';
const UploadUrl = 'https://backend.hipee.cn/hipee-upload/hibox/mp/upload/image.do';

NetworkConfig.setConfig({postUrl: PostUrl});

export {
    PostUrl,
    UploadUrl,
    SoftwareVersion
};
