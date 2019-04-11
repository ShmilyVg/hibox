const divideNum = 17;
export default class UpdateTool {
    constructor({arrayBuffer}) {
        this.arrayBuffer = arrayBuffer;
        this.count = Math.ceil(this.arrayBuffer.byteLength / divideNum);
        const high = this.count & 0xFF00;
        const low = this.count & 0x00FF;
        this.countArray = [high, low];
    }

    getDataByIndex({index}) {
        return [...new Uint8Array(this.arrayBuffer, divideNum * index, divideNum)];
    }
}
