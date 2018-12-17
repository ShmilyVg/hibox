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
        return Network.request({url: '/medical/remind/remove', data: {compartment: compartment}});
    }

    static getMedicalRemindInfo() {
        return Network.request({url: "medical/remind/info"});
    }

    static MedicalRecordList({page, page_size = 15}) {
        return Network.request({url: "/medical/record/list", data: {page, page_size}});
    }

    static MedicalRecordUpdate({state}) {
        return Network.request({url: "/medical/record/update", data: {state}});
    }

    static getMedicalRemindImage({id, image_url}) {
        return Network.request({url: 'medical/remind/image', data: {id: id, image_url: image_url}});
    }

    static postDeviceBind({deviceId}) {
        return Network.request({url: 'device/bind', data: {deviceId}});
    }

    static postDeviceUnbind({deviceId}) {
        return Network.request({url: 'device/unbind', data: {deviceId}});
    }

    static postMedicalRecordSave({records}) {
        return Network.request({url: 'medical/record/save', data: {records}});
    }

    static postMedicalRemindConfig({deviceId, compartment, drugName, drugClassify, items}) {
        return Network.request({
            url: 'medical/record/save',
            data: {deviceId, compartment, drug_name: drugName, drug_classify: drugClassify, items}
        });
    }

    static postMedicalRecordImage({id, image_url}) {
        return Network.request({
            url: 'medical/record/image',
            data: {id, image_url}
        })
    }
}
