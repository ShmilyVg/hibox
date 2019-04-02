export class HexTools {
    static hexToNum(str = '') {
        if (str.indexOf('0x') === 0) {
            str = str.slice(2);
        }
        return parseInt(`0x${str}`);
    }

    static numToHex(num = 0) {
        return ('00' + num.toString(16)).slice(-2);
    }

    /**
     *
     * @param num
     * @returns {*} 一个字节代表16位
     */
    static numToHexArray(num) {
        if (num === void 0) {
            return [];
        }
        num = parseInt(num);
        if (num === 0) {
            return [0];
        }
        let str = num.toString(16);
        console.log(str);
        str.length % 2 && (str = '0' + str);
        const array = [];
        for (let i = 0, len = str.length; i < len; i += 2) {
            array.push(parseInt(`0x${str.substr(i, 2)}`));
        }
        return array;
    }

    /**
     * hex数组转为num
     * @param array 按高低八位来排列的数组
     */
    static hexArrayToNum(array) {
        let count = 0, divideNum = array.length - 1;
        array.forEach((item, index) => count += item << (divideNum - index) * 8);
        return count;
    }
}
