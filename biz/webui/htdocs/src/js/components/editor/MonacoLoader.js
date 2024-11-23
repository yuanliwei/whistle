

/** @type{HTMLScriptElement[]} */
let scriptNodes = []

let KEY_LAST_CDN_NODE = '399bcb0da1a821b8cf06e187022c1778'

/**
 * @param {(o:object)=>void} resolve
 * @param {string} path
 * @param {string} name
 */
function loadScript(resolve, path, name) {
    if (!scriptNodes) { return }
    let node = document.createElement('script')
    scriptNodes.push(node)
    node.type = 'text/javascript'
    node.async = true
    node.src = path + name
    node.onload = () => {
        /** @type{any} */
        let require = window['require']
        if (require?.config && scriptNodes) {
            console.log('path', path)
            require.config({ paths: { 'vs': path } })
            scriptNodes.filter(o => o != node).forEach(o => {
                o.src = ''
                o.remove()
            })
            scriptNodes = null
            resolve(require)
            localStorage.setItem(KEY_LAST_CDN_NODE, [path, name].join('{#}'))
        }
    }
    document.head.appendChild(node)
}

// https://microsoft.github.io/monaco-editor/index.html
async function getRequireLoader() {
    let requireLoader = await new Promise(async (resolve) => {
        let [path, name] = (localStorage.getItem(KEY_LAST_CDN_NODE) || '').split('{#}')
        if (path && name) {
            loadScript(resolve, path, name)
            await new Promise((resolve) => setTimeout(resolve, 100))
        }
        loadScript(resolve, 'https://cdn.staticfile.net/monaco-editor/0.50.0/min/vs', '/loader.js')
        loadScript(resolve, 'https://lib.baomitu.com/monaco-editor/0.50.0/min/vs', '/loader.js')
        loadScript(resolve, 'https://cdn.bootcdn.net/ajax/libs/monaco-editor/0.50.0/min/vs', '/loader.js')
        loadScript(resolve, 'https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs', '/loader.js')
        loadScript(resolve, 'https://microsoft.github.io/monaco-editor/node_modules/monaco-editor/min/vs', '/loader.js')
        loadScript(resolve, 'https://unpkg.com/monaco-editor@0.50.0/min/vs', '/loader.js')
        loadScript(resolve, 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.50.0/min/vs', '/loader.js')
    })
    return requireLoader
}

let monacoPromise

/**
 * @returns {Promise<import('monaco-editor')>}
 */
export async function loadMonaco() {
    if (monacoPromise) return monacoPromise
    monacoPromise = new Promise((resolve) => {
        (async () => {
            let require = await getRequireLoader()
            require(['vs/editor/editor.main'], () => {
                const monaco = window['monaco']
                resolve(monaco)
            })
        })()
    })
    return monacoPromise
}

export default {
    load: loadMonaco
}