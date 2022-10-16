import vkbeautify from 'vkbeautify'
import js_beautify from 'js-beautify'
import dayjs from 'dayjs'
import CryptoJS from 'crypto-js'
import Nzh from 'nzh'
import Formatter from './Formatter.js'
import LocalFileReader from './LocalFileReader.js'
import NameGenerate from './NameGenerate.js'


/**
 * usage: 
 * ```js
 * import MonacoLoader from '../utils/MonacoLoader.js'
 * import MonacoUtil from '../utils/MonacoUtil.js'
 *
 * let monaco = await MonacoLoader.load()
 * let monacoUtil = new MonacoUtil(monaco)
 * monacoUtil.addLogTheme()
 * monacoUtil.enableTimeFormatProvider()
 *
 * monacoUtil.enableDragDrop(editorRoot, editor)
 * monacoUtil.addActions(editor)
 * monacoUtil.addAppActions(editor)
 * monacoUtil.initStore(editor, () => {
 *
 * }, (cfgs) => {
 *
 * })
 *
 *```
 */
class MonacoUtil {

    /**
     * @param {import('monaco-editor')} monaco 
     */
    constructor(monaco) {
        /** @type{import('monaco-editor')} */
        this.monaco = monaco
        this.rawMobileConfig = {
            glyphMargin: false,
            lineNumbersMinChars: 5,
            lineDecorationsWidth: 10,
        }
    }

    updateRawMobileConfig(editor) {
        this.rawMobileConfig.glyphMargin = editor.getOption(this.monaco.editor.EditorOption.glyphMargin)
        this.rawMobileConfig.lineNumbersMinChars = editor.getOption(this.monaco.editor.EditorOption.lineNumbersMinChars)
        this.rawMobileConfig.lineDecorationsWidth = editor.getOption(this.monaco.editor.EditorOption.lineDecorationsWidth)
        editor.updateOptions({ domReadOnly: true, })
    }

    addActions(editor) {
        this.updateRawMobileConfig(editor)
        setUpActions(this.monaco, editor, this.rawMobileConfig)
    }

    addAppActions(editor) {
        setUpAppActions(this.monaco, editor)
    }

    addLogTheme() {
        setUpLogTheme(this.monaco)
    }

    enableTimeFormatProvider() {
        addTimeFormatProvider(this.monaco)
    }

    enableDragDrop(root, editor) {
        setUpDragDrop(root, editor)
    }

    /**
     * @param {import('monaco-editor').editor.IStandaloneCodeEditor} editor 
     * @param {()=>Promise<{}>} loader 
     * @param {(options)=>} onSave 
     */
    async initStore(editor, loader, onSave) {
        let cfg = await loader() || {}
        if (cfg.language !== undefined) {
            this.monaco.editor.setModelLanguage(editor.getModel(), cfg.language)
        }
        editor.updateOptions(cfg)

        editor.onDidChangeModelLanguage(e => {
            cfg.language = e.newLanguage
            onSave(cfg)
        })

        editor.onDidChangeConfiguration(e => {
            console.log('onDidChangeConfiguration', e)
            cfg.readOnly = editor.getOption(this.monaco.editor.EditorOption.readOnly)
            cfg.fontSize = editor.getOption(this.monaco.editor.EditorOption.fontSize)
            cfg.wordWrap = editor.getOption(this.monaco.editor.EditorOption.wordWrap)
            onSave(cfg)
        })

    }

    /**
     * @param {import('monaco-editor').editor.IStandaloneCodeEditor} editor 
     * @param {EditOptions} option 
     * @param {Promise<EditCallback>} cb 
     */
    static editText(editor, option, cb) {
        editText(editor, option, cb)
    }
}


/**
 * @typedef {(text:String)=>Promise<String>} EditCallback
 */
/**
 * @typedef {Object} EditOptions
 * @property {boolean} append
 * @property {boolean} insert
 * @property {boolean} noChange
 * @property {boolean} replace
 * @property {boolean} handleEmptySelection
 */

/**
* @param {import('monaco-editor').editor.IStandaloneCodeEditor} editor 
* @param {EditOptions} option 
* @param {Promise<EditCallback>} cb 
*/
async function editText(editor, option, cb) {
    try {
        let operations = []
        let model = editor.getModel()
        let selection = editor.getSelection()
        let selections = editor.getSelections()
        if (!option.handleEmptySelection && selection.isEmpty() || option.replace) {
            let lineCount = model.getLineCount()
            let maxColumn = model.getLineMaxColumn(lineCount)
            selections = [{
                startLineNumber: 0,
                startColumn: 0,
                endLineNumber: lineCount,
                endColumn: maxColumn,
            }]
            if (option.insert) {
                selections = [selection]
            }
        }
        for (let i = 0; i < selections.length; i++) {
            const selection = selections[i]
            let text = model.getValueInRange(selection)
            let result = await cb(text)
            console.log('result:', result)
            let range = selection
            if (option.append) {
                range = {
                    startLineNumber: selection.endLineNumber,
                    startColumn: selection.endColumn,
                    endLineNumber: selection.endLineNumber,
                    endColumn: selection.endColumn,
                }
            }
            operations.push({
                range: range,
                text: result
            })
        }
        if (!option.noChange) {
            editor.executeEdits('action', operations)
        }
    } catch (error) {
        window.dispatchEvent(new ErrorEvent('error', error))
        console.error(error)
    }
}

function convertLineToNumber(value) {
    let match = value.match(/(\d+\.?\d*e-\d+)|(\d+\.?\d*e\d+)|(\d*\.\d+)|(\d+)/g) || []
    let nums = match.map((o) => parseFloat(o))
    return nums[0] || Infinity
}

/**
 * @param {import('monaco-editor')} monaco 
 * @param {import('monaco-editor').editor.IStandaloneCodeEditor} editor 
 */
function setUpActions(monaco, editor, rawConfig) {

    /** @type{import('monaco-editor').editor.IActionDescriptor[]} */
    let actions = [
        {
            id: 'y-wrap-id',
            label: 'Toggle Soft Wrap',
            keybindings: [
                monaco.KeyMod.Alt | monaco.KeyCode.KeyZ,
            ],
            precondition: null,
            keybindingContext: null,
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1.5,
            run: function (ed) {
                let optionValue = ed.getOption(monaco.editor.EditorOption.wordWrap)
                if (optionValue == 'on') {
                    ed.updateOptions({ wordWrap: "off" })
                } else {
                    ed.updateOptions({ wordWrap: "on" })
                }
            }
        },
        {
            id: 'y-zoom-out',
            label: 'Zoom Out',
            keybindings: [
                monaco.KeyMod.Alt | monaco.KeyCode.BracketLeft,
            ],
            precondition: null,
            keybindingContext: null,
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1.5,
            run: function (ed) {
                let optionValue = ed.getOption(monaco.editor.EditorOption.fontSize)
                optionValue--
                ed.updateOptions({ fontSize: optionValue })
            }
        },
        {
            id: 'y-zoom-in',
            label: 'Zoom In',
            keybindings: [
                monaco.KeyMod.Alt | monaco.KeyCode.BracketRight,
            ],
            precondition: null,
            keybindingContext: null,
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1.5,
            run: function (ed) {
                let optionValue = ed.getOption(monaco.editor.EditorOption.fontSize)
                optionValue++
                ed.updateOptions({ fontSize: optionValue })
            }
        },
        {
            id: 'y-toggle-readonly',
            label: 'Toggle readOnly',
            keybindings: [
                monaco.KeyMod.Alt | monaco.KeyCode.Backslash,
            ],
            precondition: null,
            keybindingContext: null,
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1.5,
            run: function (ed) {
                let optionValue = ed.getOption(monaco.editor.EditorOption.readOnly)
                optionValue = !optionValue
                ed.updateOptions({ readOnly: optionValue })
            }
        },
        {
            id: 'y-toggle-mobile',
            label: 'Toggle Mobile',
            keybindings: [],
            precondition: null,
            keybindingContext: null,
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1.6,
            run: function (ed) {
                let lineDecorationsWidth = ed.getOption(monaco.editor.EditorOption.lineDecorationsWidth)
                if (lineDecorationsWidth) {
                    editor.updateOptions({
                        lineDecorationsWidth: 0,
                        glyphMargin: false,
                        lineNumbersMinChars: 0,
                    })
                } else {
                    editor.updateOptions({
                        glyphMargin: rawConfig.glyphMargin,
                        lineNumbersMinChars: rawConfig.lineNumbersMinChars,
                        lineDecorationsWidth: rawConfig.lineDecorationsWidth,
                    })
                }
            }
        },
        {
            id: 'y-toggle-folding',
            label: 'Toggle Folding',
            keybindings: [],
            precondition: null,
            keybindingContext: null,
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1.6,
            run: function (ed) {
                let folding = ed.getOption(monaco.editor.EditorOption.folding)
                editor.updateOptions({ folding: !folding, })
            }
        },
        {
            id: 'y-toggle-foldingControls',
            label: 'Toggle FoldingControls',
            keybindings: [],
            precondition: null,
            keybindingContext: null,
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1.6,
            run: function (ed) {
                let showFoldingControls = ed.getOption(monaco.editor.EditorOption.showFoldingControls)
                if (showFoldingControls == 'never') {
                    editor.updateOptions({ showFoldingControls: 'mouseover', })
                } else {
                    editor.updateOptions({ showFoldingControls: 'never', })
                }
            }
        },
        {
            id: 'y-toggle-minmap',
            label: 'Toggle Minmap',
            keybindings: [],
            precondition: null,
            keybindingContext: null,
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1.6,
            run: function (ed) {
                let minimap = ed.getOption(monaco.editor.EditorOption.minimap)
                minimap.enabled = !minimap.enabled
                ed.updateOptions({ minimap: minimap, })
            }
        },
        {
            id: 'y-remove-empty',
            label: 'Line Remove Empty',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return text.split('\n').filter(o => o.trim()).join('\n')
                })
            }
        },
        {
            id: 'y-remove-duplicate',
            label: 'Line Remove Duplicate',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    if (!text.endsWith('\n')) text += '\n'
                    return [...new Set(text.split('\n'))].join('\n')
                })
            }
        },
        {
            id: 'y-group-duplicate',
            label: 'Line Group Duplicate',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    let map = {}
                    let lines = text.split('\n')
                    let arr = []
                    for (const line of lines) {
                        if (map[line]) {
                            map[line].count++
                        } else {
                            map[line] = { count: 1, line: line }
                            arr.push(map[line])
                        }
                    }
                    return arr.map(o => `${o.count.toString().padStart(5)}  ${o.line}`).join('\n')
                })
            }
        },
        {
            id: 'y-sort-num',
            label: 'Line Sort Number',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    let lines = text.split('\n')
                    lines.sort((l, h) => convertLineToNumber(l) - convertLineToNumber(h))
                    return lines.join('\n')
                })
                ed.setSelection({ startLineNumber: 0, startColumn: 0, endLineNumber: 0, endColumn: 0, })
            }
        },
        {
            id: 'y-line-reverse',
            label: 'Line Reverse',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    let lines = text.split('\n')
                    return lines.reverse().join('\n')
                })
            }
        },
        {
            id: 'y-trim',
            label: 'Line trim',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return text.split('\n').map(o => o.trim()).join('\n')
                })
            }
        },
        {
            id: 'y-comment-align',
            label: 'Comment Align',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    let maxLength = 0
                    let lines = text.split('\n')
                    lines.forEach(function (item) {
                        item = item.replace('//', '#sp#//')
                        let items = item.split('#sp#')
                        if (items.length == 2) {
                            maxLength = Math.max(maxLength, items[0].length)
                        }
                    })
                    let newLines = []
                    let m = /http.?:\/\//
                    lines.forEach(function (item) {
                        if (!m.test(item)) {
                            item = item.replace('//', '#sp#//')
                        }
                        let items = item.split('#sp#//')
                        let newLine = items[0]
                        if (items.length == 2) {
                            if (items[0].trim().length == 0) {
                                newLine += '// ' + items[1].trim()
                            } else {
                                let space = maxLength - items[0].length
                                newLine += ' '.repeat(space) + '// ' + items[1].trim()
                            }
                        }
                        newLines.push(newLine)
                    })
                    return newLines.join('\n')
                })
            }
        },
        {
            id: 'y-cursor-align',
            label: 'Cursor Align',
            run: async function (ed) {
                /** @type{import('monaco-editor').editor.IStandaloneCodeEditor} */
                let editor = ed
                let selections = editor.getSelections()
                console.log(selections)
                let maxColumn = 0
                let insertSpaces = []
                for (let i = 0; i < selections.length; i++) {
                    const selection = selections[i]
                    maxColumn = Math.max(maxColumn, selection.endColumn)
                    insertSpaces[i] = selection.endColumn
                }
                maxColumn++
                for (let i = 0; i < insertSpaces.length; i++) {
                    const insertSpace = insertSpaces[i]
                    insertSpaces[i] = maxColumn - insertSpace
                }
                let index = 0
                editText(ed, { append: true, handleEmptySelection: true }, () => {
                    return ' '.repeat(insertSpaces[index++])
                })
            }
        },
        {
            id: 'y-format-json',
            label: 'Format JSON',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return vkbeautify.json(text)
                })
            }
        },
        {
            id: 'y-format-xml',
            label: 'Format XML',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return vkbeautify.xml(text)
                })
            }
        },
        {
            id: 'y-format-js',
            label: 'Format JS',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return js_beautify(text)
                })
            }
        },
        {
            id: 'y-format-sql',
            label: 'Format SQL',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return vkbeautify.sql(text)
                })
            }
        },
        {
            id: 'y-format-time',
            label: 'Format Time',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return text.replace(/(\d{11,13})|(\d{10})/g, function (val) {
                        let date = parseInt(val)
                        // java中的Integer.MAX_VALUE
                        if (date == 2147483647) { return val }
                        if (val.length == 10) {
                            if (val.startsWith('19')) { return val }
                            if (val.startsWith('20')) { return val }
                            date *= 1000
                        }
                        return dayjs(date).format('YYYY-MM-DD HH:mm:ss.SSS')
                    })
                })
            }
        },
        {
            id: 'y-parse-time',
            label: 'Parse Time',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    let textTrim = text.trim()
                    let millis = new Date(textTrim).getTime()
                    if (!isNaN(millis)) {
                        return '' + millis
                    }
                    return text
                })
            }
        },
        {
            id: 'y-codec-parseJSON',
            label: 'parse JSON',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return JSON.parse(text)
                })
            }
        },
        {
            id: 'y-codec-deepParseJSON',
            label: 'deep parse JSON',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return Formatter.jsonFormat(Formatter.jsonDeepParse(text))
                })
            }
        },
        {
            id: 'y-codec-stringify',
            label: 'stringify',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return JSON.stringify(text)
                })
            }
        },
        {
            id: 'y-codec-encodeUri',
            label: 'encodeUri',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return encodeURIComponent(text)
                })
            }
        },
        {
            id: 'y-codec-encodeBase64',
            label: 'encodeBase64',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text))
                })
            }
        },
        {
            id: 'y-codec-encodeHex',
            label: 'encodeHex',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(text))
                })
            }
        },
        {
            id: 'y-codec-encodeNative',
            label: 'encodeNative',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return native2ascii(text)
                })
            }
        },
        {
            id: 'y-codec-encodeUnicode',
            label: 'encodeUnicode',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return toUnicode(text)
                })
            }
        },
        {
            id: 'y-codec-encodeEscape',
            label: 'encodeEscape',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return escape(text)
                })
            }
        },
        {
            id: 'y-codec-decodeUri',
            label: 'decodeUri',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return decodeURIComponent(text)
                })
            }
        },
        {
            id: 'y-codec-decodeBase64',
            label: 'decodeBase64',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return CryptoJS.enc.Base64.parse(text).toString(CryptoJS.enc.Utf8)
                })
            }
        },
        {
            id: 'y-codec-decodeHex',
            label: 'decodeHex',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return CryptoJS.enc.Hex.parse(text).toString(CryptoJS.enc.Utf8)
                })
            }
        },
        {
            id: 'y-codec-decodeNative',
            label: 'decodeNative',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return ascii2native(text)
                })
            }
        },
        {
            id: 'y-codec-decodeUnicode',
            label: 'decodeUnicode',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return fromUnicode(text)
                })
            }
        },
        {
            id: 'y-codec-decodeUnescape',
            label: 'decodeUnescape',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return unescape(text)
                })
            }
        },
        {
            id: 'y-codec-decode-html-entry',
            label: 'decode html entry',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    let div = document.createElement('div')
                    div.innerHTML = text
                    return div.textContent
                })
            }
        },
        {
            id: 'y-codec-guid',
            label: 'guid',
            run: async function (ed) {
                editText(ed, { insert: true }, (text) => {
                    let sb = text + Date.now() + Math.random() + Math.random() + Math.random()
                    return CryptoJS.MD5(sb).toString()
                })
            }
        },
        {
            id: 'y-codec-md5',
            label: 'md5',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return CryptoJS.MD5(text).toString()
                })
            }
        },
        {
            id: 'y-codec-sha1',
            label: 'sha1',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return CryptoJS.SHA1(text).toString()
                })
            }
        },
        {
            id: 'y-codec-sha256',
            label: 'sha256',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return CryptoJS.SHA256(text).toString()
                })
            }
        },
        {
            id: 'y-codec-sha512',
            label: 'sha512',
            run: async function (ed) {
                editText(ed, {}, (text) => {
                    return CryptoJS.SHA512(text).toString()
                })
            }
        },
        {
            id: 'y-codec-eval',
            label: 'eval',
            run: async function (ed) {
                editText(ed, { append: true }, (text) => {
                    return `${window['eval'](text)}`
                })
            }
        },
        {
            id: 'y-group-sort_num-reverse',
            label: 'Group SortNum Reverse',
            /**
             * @param {import('monaco-editor').editor.IStandaloneCodeEditor} ed 
             */
            run: async function (ed) {
                await ed.getAction('y-group-duplicate').run()
                await ed.getAction('y-sort-num').run()
                await ed.getAction('y-line-reverse').run()
            }
        },
        {
            id: "y-sequence-number-1",
            label: "sequence number 1",
            run: async function (ed) {
                let seq = 1
                editText(ed, { insert: true }, async () => {
                    return `${seq++}`
                })
            },
        },
        {
            id: "y-sequence-number-一",
            label: "sequence number 一",
            run: async function (ed) {
                let seq = 1
                editText(ed, { insert: true }, async () => {
                    return Nzh.cn.encodeS(seq++)
                })
            },
        },
        {
            id: "y-sequence-number-壹",
            label: "sequence number 壹",
            run: async function (ed) {
                let seq = 1
                editText(ed, { insert: true }, async () => {
                    return Nzh.cn.encodeB(seq++)
                })
            },
        },
        {
            id: "y-xing-ming",
            label: "xing ming",
            run: async function (ed) {
                let g = new NameGenerate()
                editText(ed, { insert: true }, async () => {
                    return g.get()
                })
            },
        },
        buildSequenceNum("a", 0),
        buildSequenceNum("A", 0),
        buildSequenceNum("①", 0),
        buildSequenceNum("Ⅰ", 0),
        buildSequenceNum("ⅰ", 0),
        buildSequenceNum("㍘", 0),
        buildSequenceNum("㎀", 0),
        buildSequenceNum("㏠", 0),
        buildSequenceNum("😀", 0),
        buildSequenceNum("👩", 0),
        buildSequenceNum("💪", 0),
        buildSequenceNum("🎈", 0),
        buildSequenceNum("🍕", 0),
        buildSequenceNum("🚗", 0),
        buildSequenceNum("❤", 0),
        buildSequenceNum("☮", 0),
        buildSequenceNum("0️⃣", 0),
        buildSequenceNum("🔴", 0),
        buildSequenceNum("🟥", 0),
        buildSequenceNum("🔶", 0),
        buildSequenceNum("🕐", 0),
        ...buildChangeLanguageActions(monaco),
        {
            id: "y-full-space",
            label: "full space",
            run: async function (ed) {
                editText(ed, {}, async (text) => {
                    return ' '.repeat(text.length)
                })
            },
        },
        {
            id: "y-cursors-drop",
            label: "cursors drop",
            /** @param {import('monaco-editor').editor.IStandaloneCodeEditor} ed */
            run: async function (ed) {
                let selections = ed.getSelections()
                let tmp = []
                for (let i = 0; i < selections.length; i += 2) {
                    const element = selections[i]
                    tmp.push(element)
                }
                ed.setSelections(tmp)
            },
        },
        {
            id: "y-numbers-summation",
            label: "numbers summation 求和",
            /** @param {import('monaco-editor').editor.IStandaloneCodeEditor} ed */
            run: async function (ed) {
                editText(ed, { append: true }, async (text) => {
                    let match = text.split(/[ ,;\r\n\t"]/) || []
                    let numbers = match.map((o) => parseFloat(o)).filter((o) => !isNaN(o))
                    return `summation: ${numbers.reduce((p, c) => p + c, 0)}`
                })
            },
        },
        {
            id: "y-numbers-average",
            label: "numbers average 求平均值",
            /** @param {import('monaco-editor').editor.IStandaloneCodeEditor} ed */
            run: async function (ed) {
                editText(ed, { append: true }, async (text) => {
                    let match = text.split(/[ ,;\r\n\t"]/) || []
                    let numbers = match.map((o) => parseFloat(o)).filter((o) => !isNaN(o))
                    return `average: ${numbers.reduce((p, c) => p + c, 0) / numbers.length}`
                })
            },
        },
        {
            id: "y-translate-to-en",
            label: "translate to en",
            /** @param {import('monaco-editor').editor.IStandaloneCodeEditor} ed */
            run: async function (ed) {
                editText(ed, {}, async (text) => {
                    let translate = await loadTranslate()
                    let result = await translate('', 'en', [text])
                    return result[0].TranslatedText
                })
            },
        },
        {
            id: "y-translate-to-zh",
            label: "translate to zh",
            /** @param {import('monaco-editor').editor.IStandaloneCodeEditor} ed */
            run: async function (ed) {
                editText(ed, {}, async (text) => {
                    let translate = await loadTranslate()
                    let result = await translate('', 'zh-CHS', [text])
                    return result[0].TranslatedText
                })
            },
        },
    ]

    for (const action of actions) {
        editor.addAction(action)
    }
}

/**
 * @param {import('monaco-editor')} monaco 
 */
function buildChangeLanguageActions(monaco) {
    return monaco.languages.getLanguages().map(lang => {
        return {
            id: `y-language-${lang.id}`,
            label: `language ${lang.id} ${lang.aliases?.join(' ')}`,
            run: async function (ed) {
                monaco.editor.setModelLanguage(ed.getModel(), lang.id)
            }
        }
    })
}

function buildSequenceNum(char, start) {
    return {
        id: `y-sequence-number-${char}`,
        label: `sequence number ${char}`,
        run: async function (ed) {
            let seq = start
            let codes = []
            let endCode = char.charCodeAt(0)
            for (let i = 0; i < char.length; i++) {
                const charCode = char.charCodeAt(i)
                codes.push(charCode)
                endCode = charCode
            }
            codes.pop()
            editText(ed, { insert: true }, async () => {
                return String.fromCharCode(...codes, endCode + seq++)
            })
        },
    }
}

/**
 * @param {import('monaco-editor')} monaco 
 * @param {import('monaco-editor').editor.IStandaloneCodeEditor} editor 
 */
function setUpAppActions(monaco, editor) {
    let actions = [

    ]

    for (const action of actions) {
        editor.addAction(action)
    }
}

let hasAddTimeFormatProvider = false

/**
 * @param {import('monaco-editor')} monaco 
 */
function addTimeFormatProvider(monaco) {
    if (hasAddTimeFormatProvider) return
    hasAddTimeFormatProvider = true

    const timeFormatProvider = {
        provideHover(document, position) {
            let text = document.getValueInRange(new monaco.Range(position.lineNumber, position.column - 12, position.lineNumber, position.column + 12))
            let match = text.match(/(\d{13})|(\d{10})/)
            if (match) {
                let timeStr = match[0]
                let startColumn = position.column - 12 + text.indexOf(timeStr)
                let endColumn = startColumn + timeStr.length
                return {
                    contents: [{ value: Formatter.formatTimeInString(timeStr) }],
                    range: new monaco.Range(position.lineNumber, startColumn, position.lineNumber, endColumn)
                }
            } else {
                return null
            }
        }
    }

    monaco.languages.getLanguages().forEach(lang => {
        monaco.languages.registerHoverProvider(lang.id, timeFormatProvider)
    })
}

let hasSetLogTheme = false

function setUpLogTheme(monaco) {
    if (hasSetLogTheme) return
    hasSetLogTheme = true
    monaco.languages.register({ id: 'log' })
    monaco.languages.setMonarchTokensProvider('log', {
        tokenizer: {
            root: [
                [/\[ERROR\]/, "log-error"],
                [/^\tat .*/, "log-error"],
                [/\[INFO \]/, "log-info"],
                [/\[WARN \]/, "log-warn"],
                // 20-04-22 10:38:05.501
                [/\d\d-\d\d-\d\d \d\d:\d\d:\d\d\.\d+/, "log-date"],
            ]
        }
    })
    monaco.editor.defineTheme('EditorTheme', {
        base: 'vs',
        inherit: true,
        rules: [
            { token: 'log-info', foreground: '008000' },
            { token: 'log-error', foreground: 'ff0000', fontStyle: 'bold' },
            { token: 'log-warn', foreground: '888800' },
            { token: 'log-date', foreground: '993300' },
        ],
        colors: {
            'editor.foreground': '#000000'
        }
    })
}

function setUpDragDrop(root, editor) {
    const ignore = (e) => {
        e.preventDefault()
        e.stopPropagation()
    }
    root.ondragenter = ignore
    root.ondragover = ignore
    root.ondragleave = ignore
    root.ondrop = async (e) => {
        if (e.dataTransfer.types[0] == 'Files') {
            if (e.dataTransfer.files.length == 0) {
                return
            }
            ignore(e)
            let file = e.dataTransfer.files[0]
            let info = await LocalFileReader.readFile(file)
            let d = new TextDecoder()
            let string = d.decode(info.buffer)
            editText(editor, { append: true }, () => {
                return string
            })
        }
        if (e.dataTransfer.types[0] == 'text/plain') {
            ignore(e)
            let data = e.dataTransfer.getData('text/plain')
            editText(editor, { append: true }, () => {
                return data
            })
        }
    }
}

/*
 * ascii2native
 */
function ascii2native(ascii) {
    let code, i, j, len, native, words
    words = ascii.split('\\u')
    native = words[0]
    for (i = j = 0, len = words.length; j < len; i = ++j) {
        code = words[i]
        if (!(i !== 0)) {
            continue
        }
        native += String.fromCharCode(parseInt("0x" + (code.substr(0, 4))))
        if (code.length > 4) {
            native += code.substring(4, code.length)
        }
    }
    return native
}

function native2ascii(native) {
    let ascii, charAscii, chars, code, i, j, len
    chars = native.split('')
    ascii = ''
    for (i = j = 0, len = chars.length; j < len; i = ++j) {
        code = Number(chars[i].charCodeAt(0))
        if (code > 127) {
            charAscii = code.toString(16)
            charAscii = new String('0000').substr(charAscii.length, 4) + charAscii
            ascii += '\\u' + charAscii
        } else {
            ascii += chars[i]
        }
    }
    return ascii
}

function toUnicode(str) {
    let codes = []
    for (let i = 0; i < str.length; i++) {
        codes.push(("000" + str.charCodeAt(i).toString(16)).slice(-4))
    }
    return "\\u" + codes.join("\\u")
}

function fromUnicode(str) {
    return unescape(str.replace(/\\/g, "%"))
}

async function loadTranslate() {
    if (!window['mstranslate']) {
        await new Promise((resolve, reject) => {
            let script = document.createElement('script')
            script.src = 'https://yuanliwei.gitee.io/lib.translate.js'
            script.onerror = reject
            script.onload = resolve
            document.head.append(script)
        })
    }
    return window['mstranslate']
}

export default MonacoUtil