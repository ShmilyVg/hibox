import Network from "./network";

export default class Protocol {

    static getAccountInfo() {
        return Network.request({url: 'account/info'});
    }

    static getDrugClassify() {
        return Network.request({url: 'drug/classify'});
    }

    static getDrugItems({classify}) {
        return Network.request({url: 'drug/items', data: {classify}});
    }

    static getMedicalRemindList() {
        return Network.request({url: 'medical/remind/list'});
    }

    static getMedicalRemindInfo() {
        return Network.request({url: "medical/remind/info"});
    }

    static getMedicalRemindImage({id, image_url}) {
        return Network.request({url: 'medical/remind/image', data: {id: id, image_url: image_url}});
    }

}
