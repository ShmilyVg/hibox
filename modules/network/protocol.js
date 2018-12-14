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

    static medicalRemindRemove({compartment}) {
        return Network.request({url: '/medical/remind/remove', data: {device_id: device_id,compartment: compartment}});
    }

    static getMedicalRemindInfo() {
        return Network.request({url: "medical/remind/info"});
    }

    static MedicalRecordList({page, page_size = 15}) {
        return Network.request({url: "/medical/record/list",data: {page, page_size}});
    }

    static MedicalRecordUpdate({state}) {
        return Network.request({url: "/medical/record/update",data: {state}});
    }

    static getMedicalRemindImage({id, image_url}) {
        return Network.request({url: 'medical/remind/image', data: {id: id, image_url: image_url}});
    }

}
