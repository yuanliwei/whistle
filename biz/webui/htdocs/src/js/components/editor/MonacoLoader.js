async function getRacePromise(path, name) {
    try {
        let code = await (await fetch(path + name)).text()
        if (code.length > 100) {
            return [path, name]
        }
    } catch (error) {
        console.warn(error)
    }
    console.log('wait forever :', path)
    return new Promise(() => { })
}

function getLoaderPromise(path, name) {
    return new Promise((resolve, reject) => {
        let node = document.createElement('script')
        node.type = 'text/javascript'
        node.async = true
        node.src = path + name
        node.onload = () => resolve(path)
        node.onerror = () => reject()
        document.head.appendChild(node)
    })
}

// https://microsoft.github.io/monaco-editor/index.html
async function getLoader() {
    let [path, name] = await Promise.race([
        getRacePromise('https://cdn.staticfile.org/monaco-editor/0.33.0/min/vs', '/loader.js'),
        getRacePromise('https://lib.baomitu.com/monaco-editor/0.33.0/min/vs', '/loader.min.js'),
        getRacePromise('https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs', '/loader.js'),
        getRacePromise('https://microsoft.github.io/monaco-editor/node_modules/monaco-editor/min/vs', '/loader.js'),
        getRacePromise('https://unpkg.com/monaco-editor@0.33.0/min/vs', '/loader.js'),
        getRacePromise('https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.33.0/min/vs', '/loader.min.js'),
    ])
    return getLoaderPromise(path, name)
}

let monacoPromise

/**
 * @returns {Promise<import('monaco-editor')>}
 */
async function load() {
    if (monacoPromise) return monacoPromise
    monacoPromise = new Promise((resolve) => {
        (async () => {
            let path = await getLoader()
            console.log('path', path)
            let requireLoader = window['require']
            requireLoader.config({ paths: { 'vs': path } })
            requireLoader(['vs/editor/editor.main'], () => {
                const monaco = window['monaco']
                resolve(monaco)
            })
        })()
    })
    return monacoPromise
}

export default {
    load
}