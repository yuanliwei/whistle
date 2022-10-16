import dayjs from 'dayjs'

/*
把毫秒或秒格式的时间转换为可读的字符串形式
*/

const dateStr = (time_) => {
    var time = parseInt(time_)
    if (!time) return '';
    if (time > 15104725270) {
        return dayjs(time).format('YYYY-MM-DD HH:mm:ss.SSS')
    } else {
        return dayjs(time * 1000).format('YYYY-MM-DD HH:mm:ss.SSS')
    }
};

function formatTimeInString(text) {
    return text.replace(/(\d{11,13})|(\d{10})/g, function (val) {
        var date = parseInt(val)
        // java中的Integer.MAX_VALUE
        if (date == 2147483647) { return val }
        if (val.length == 10) {
            if (val.startsWith('19')) { return val }
            if (val.startsWith('20')) { return val }
            date *= 1000
        }
        return dayjs(date).format('YYYY-MM-DD HH:mm:ss.SSS')
    })
}

/*
格式化json字符串或js对象为格式化好的json字符串
*/
const jsonFormat = (arg) => {
    if (typeof arg == "string") {
        arg = JSON.parse(arg)
    }
    return JSON.stringify(arg, null, 4)
}

const jsonDeepParse = (obj) => {
    let o = obj
    if (typeof (obj) == 'string') {
        try { o = JSON.parse(obj) } catch (e) { return o }
    }
    if (o instanceof Array) {
        for (var i = 0; i < o.length; i++) {
            o[i] = jsonDeepParse(o[i])
        }
    } else {
        for (var k in o) {
            if (o.hasOwnProperty(k)) {
                o[k] = jsonDeepParse(o[k])
            }
        }
    }
    return o
}

const jsonStr = (obj) => {
    let cache = []
    let str = JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
                return
            }
            cache.push(value);
        }
        return value;
    })
    return str
}

const formatSize = (size) => {
    if (!size) return ''
    if (size < 0) { return '0B'.padStart(8, ' ') }
    let companys = 'B KB MB GB TB'.split(' ')
    let cur = size
    while (cur >= 1024) {
        companys.shift()
        cur /= 1024
    }
    return (cur.toFixed(2) + companys[0]).replace('.00', '').padStart(8, ' ')
}

const parseSecondTime = (seconds) => {
    if (typeof seconds == 'undefined') { return '' }
    if (seconds == '-') { return '-' }
    return `${parseInt(seconds / 60)}分${seconds % 60}秒`
}

const parseMillisecondTime = (milliseconds) => {
    if (typeof milliseconds == 'undefined') { return '' }
    if (milliseconds == '-') { return '-' }
    return `${parseInt(milliseconds / 1000 / 60)}:${parseInt(milliseconds / 1000 % 60)}.${milliseconds % 1000}ms`
}

const parseDBColumnResults = (results) => {
    let columns = results[0].columns
    let values = results[0].values
    return values.map((item) => columns.reduce((a, b, i) => (a[b] = item[i], a), {}))
}

export default {
    dateStr,
    jsonFormat,
    jsonDeepParse,
    jsonStr,
    formatSize,
    parseSecondTime,
    parseMillisecondTime,
    formatTimeInString,
    parseDBColumnResults,
}