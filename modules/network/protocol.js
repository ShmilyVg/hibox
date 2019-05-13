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
        return Network.request({url: 'medical/remind/remove', data: {compartment: compartment}});
    }

    static getMedicalRemindInfo() {
        return Network.request({url: "medical/remind/info"});
    }

    static MedicalRecordList({page, page_size = 15}) {
        return Network.request({url: "medical/record/list", data: {page, page_size}});
    }

    static MedicalRecordUpdate({ids, state}) {
        return Network.request({url: "medical/record/update", data: {ids: ids, state: state}});
    }

    static getMedicalRemindImage({id, image_url}) {
        return Network.request({url: 'medical/remind/image', data: {id: id, image_url: image_url}});
    }

    static postDeviceBind({deviceId: device_id, mac}) {
        console.log('上传绑定信息', device_id, mac);
        return Network.request({url: 'device/bind', data: {device_id, mac}});
    }

    static postMedicalRecordSave({records}) {
        return Network.request({url: 'medical/record/save', data: {records}});
    }

    static postMedicalRemindConfig({deviceId, compartment, drugName, drugClassify, items, code, useType}) {
        return Network.request({
            url: 'medical/remind/config',
            data: {
                device_id: deviceId,
                compartment,
                drug_name: drugName,
                drug_classify: drugClassify,
                items,
                drug_code: code,
                use_type: useType
            }
        });
    }

    static postMedicalRecordImage({id, image_url}) {
        return Network.request({
            url: 'medical/record/image',
            data: {id, image_url}
        })
    }

    static postDeviceUnbind() {
        return Network.request({url: 'device/unbind'})
    }

    static getDeviceBindInfo() {
        return Network.request({url: 'device/bind/info'})
    }

    static getDrugCode({code}) {
        return Network.request({
            url: 'drug/code',
            data: {code}
        })
    }

    static getDrugCreateDrugInstruction({code, imageArr}) {
        let data = {};
        if (imageArr) {
            // 手动上传信息
            let str = imageArr.join(',');
            data = {code, imageUrl: str}
        } else {
            data = {code}
        }
        return Network.request({
            url: 'drug/createDrugIntia',
            data: data
        })
    }

    static getDrugSearch({
                             name,
                             page = 1,
                             page_size = 30
                         }) {
        return Network.request({
            url: 'drug/search',
            data: {name, page, page_size}
        })
    }

    static postDeviceElectricity({electricity}) {
        return Network.request({url: 'device/electricity', data: {electricity}});
    }

    static getMedicalRecordWeekly({memberId}) {
        if (memberId) {
            return Network.request({url: 'medical/record/weekly', data: {memberId}})
        } else {
            return Network.request({url: 'medical/record/weekly'})
        }
    }

    static postMedicalRecordUpdataWeekly() {
        return Network.request({url: 'medical/record/updataWeekly'});
    }

    static postSystemInfo({systemInfo}) {
        return Network.request({url: 'medical/system/info', data: {systemInfo}});
    }
}
