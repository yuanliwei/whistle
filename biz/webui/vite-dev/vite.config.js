import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * @returns {import('vite').PluginOption}
 */
function wrapperCJS() {
  let ignore = [
    '\'./files-dialog\''
  ]
  return {
    name: 'wrapperCJS',
    async transform(code, id) {
      if (id.split('?')[0].endsWith('.js')) {
        // wrapper cjs
        let matches = code.match(/require\([^)]+\)/g) || []

        if (matches.length == 0 && !code.includes('exports')) {
          return code
        }

        let arr = []
        for (let i = 0; i < matches.length; i++) {
          const match = matches[i]
          const id = match.replace('require(', '').replace(')', '')
          if (ignore.includes(id)) {
            continue
          }
          arr.push({ name: `__import_key_${i}__`, id })
        }

        return `

${arr.map(o => `import * as ${o.name} from ${addCSSInline(o.id)}`).join('\n')}

function __$styleInject_43268484ff8556ef3adf6e1d73e072de(css) {
  if (!css) return;

  if (typeof window == 'undefined') return;
  var style = document.createElement('style');
  style.setAttribute('media', 'screen');

  style.innerHTML = css;
  document.head.appendChild(style);
  return css;
}

function require(id){
  let mod = {
    ${arr.map(o => `${o.id}: ${o.name}.default || ${o.name},`).join('\n')}
  }[id];

  id.endsWith('.css') && __$styleInject_43268484ff8556ef3adf6e1d73e072de(mod);

  return mod
}

const module={
  exports:{}
}
const __origin_exports__ = module.exports
let exports = __origin_exports__

${code}

if(module.exports != __origin_exports__){
  exports = module.exports
}

if(exports.__esModule && !exports.default){
  exports = {
    __esModule: true,
    default: exports,
  }
}

${code.includes('export ') ? '' : 'export default exports'}
          `
      }
    }
  }
}

function addCSSInline(id) {
  if (id.endsWith(`.css'`)) {
    id = id.replace(/css'$/, `css?inline'`)
  }
  return id
}

/**
 * @returns {import('vite').PluginOption}
 */
function fileloader(ext) {
  return {
    name: 'fileloader:' + ext,
    async transform(code, id) {
      if (id.endsWith('.md')) {
        return 'export default ' + JSON.stringify(code)
      }
    }
  }
}

/**
 * @returns {import('vite').PluginOption}
 */
function fixedModule() {
  return {
    transform(code, id) {
      if (id.includes('bootstrap_dist_js_bootstrap__js')) {
        return code + '\n exports = {}'
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/cgi-bin': {
        target: 'http://127.0.0.1:8899',
        changeOrigin: true
      }
    },
    fs: {
      allow: [
        '../../../..'
      ]
    }
  },
  plugins: [
    fileloader('.md'),
    fixedModule(),
    react({
      babel: {
        presets: [
          '@babel/preset-env',
          '@babel/preset-react',
        ]
      },
    }),
    wrapperCJS()
  ]
});

