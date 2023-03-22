import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// markdown renderer component ----
import vueMarkdownPreview from '@kangc/v-md-editor/lib/preview'
import '@kangc/v-md-editor/lib/style/preview.css'

import theme from '@kangc/v-md-editor/lib/theme/github'
import './assets/github.css'

import createMermaidPlugin from '@kangc/v-md-editor/lib/plugins/mermaid/cdn'
import '@kangc/v-md-editor/lib/plugins/mermaid/mermaid.css'

import createLineNumbertPlugin from '@kangc/v-md-editor/lib/plugins/line-number/index'

import createCopyCodePlugin from '@kangc/v-md-editor/lib/plugins/copy-code/index'
import '@kangc/v-md-editor/lib/plugins/copy-code/copy-code.css'

import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/vs.css'

vueMarkdownPreview.use(theme, { Hljs: hljs })
vueMarkdownPreview.use(createMermaidPlugin())
vueMarkdownPreview.use(createLineNumbertPlugin())
vueMarkdownPreview.use(createCopyCodePlugin())
// -

import './assets/main.css'

const app = createApp(App)

app.use(router)
app.use(vueMarkdownPreview)

app.mount('#app')
