import Network from "./network";

export default class Protocol {

    static getAccountInfo() {
        return Network.request({url: 'account/info'});
    }

    static getDrugClassify() {
        return Network.request({url: 'drug/classify'});
    }

    static getDrugItems({type}) {
        return Network.request({url: 'drug/items', data: {classify: type}});
    }

    static getMedicalRemindList() {
        return Network.request({url: 'medical/remind/list'});
    }

    static getMedicalRemindInfo() {
        return Network.request({url: "medical/remind/info"});
    }

}
