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

    static medicalRecordList({device_id}) {
        return Network.request({url: 'medical/record/list', data: {device_id: device_id}});
    }


}
