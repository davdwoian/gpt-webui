<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onBeforeRouteUpdate, useRoute } from 'vue-router'
import Sidebar from '../components/SessionSidebar.vue'
import Menubar from '../components/SessionMenubar.vue'
import Prompt from '../components/SessionPrompt.vue'
import Textarea from '../components/SessionTextarea.vue'
import axios from 'axios'

const API_SERVER = import.meta.env.VITE_API_SERVER_ADDRESS
const assistantPreset = {
    color: '#313136',
    icon: '/assistant.jpeg',
}
const userPreset = {
    color: '#4A4C58',
    icon: '/user.jpeg',
}

const encode = async (text: string): Promise<number> => {
    return new Promise((resolve) => {
        axios
            .post(`${API_SERVER}/api/gpt/tokenizer`, text, {
                headers: {
                    'Content-Type': 'text/plain',
                },
            })
            .then((response) => {
                resolve(parseInt(response.data))
            })
    })
}

const route = useRoute()

// status
const loading = ref(false)
const freeze = ref(false)
const useSidebar = ref(true)

// element
const anchor = ref<HTMLDivElement>()

const sessions = ref<{ [sessionId: string]: { title: string } }>({})
const title = ref('')
const messages = ref<{ role: string; content: string; token: number }[]>([])
const maxToken = ref(0)

const promptCount = ref(0)

// computed
const usedToken = () => {
    let usedToken = 0
    messages.value.forEach((v) => {
        usedToken += v.token
    })
    return usedToken
}
const sessionsArray = () => {
    return (
        Object.keys(sessions.value).map((sessionId) => {
            return { id: sessionId, title: sessions.value[sessionId].title }
        }) || []
    )
}

const scrollToBottom = () => {
    anchor.value?.scrollIntoView({
        behavior: 'smooth',
    })
}

// Fetch From Backend
const connect = async (ms: number) => {
    while ((await axios.get(API_SERVER)).status != 200) {
        await new Promise((resolve) => setTimeout(resolve, ms))
    }
}
const fetchTitle = async (sessionId: string) => {
    try {
        const response = await axios.get(
            `${API_SERVER}/api/gpt/title/${sessionId}`
        )
        const data = response.data

        sessions.value[sessionId] = { title: data }
    } catch {
        //
    }
}

const fetchData = async (sessionId: string) => {
    try {
        const response = await axios.get(
            `${API_SERVER}/api/gpt/metadata/${sessionId}`,
            { responseType: 'json' }
        )
        const data = response.data as {
            title: string
            sessionId: string
            messages: { role: string; content: string; token: number }[]
            usedToken: number
            maxToken: number
            onReply: boolean
        }

        title.value = data.title
        messages.value = data.messages.slice(1)
        maxToken.value = data.maxToken
    } catch {
        messages.value = []
    }
}

const fetchSessions = async () => {
    const response = await axios.get(`${API_SERVER}/api/gpt/sessions`)
    const data = response.data as string[]

    data.forEach(async (sessionId: string) => await fetchTitle(sessionId))
    await fetchData(route.params.sessionId as string)
}

// eventHandler
let onInputTimeout: number
const onInput = (content: string) => {
    clearTimeout(onInputTimeout)
    onInputTimeout = setTimeout(async () => {
        promptCount.value = await encode(content)
    }, 300)
}

const onChat = async (content: string) => {
    if (loading.value || freeze.value) return
    loading.value = true
    freeze.value = true
    scrollToBottom()

    messages.value.push({
        role: 'user',
        content: content,
        token: await encode(content),
    })
    messages.value.push({ role: 'assistant', content: '', token: 0 })
    const message = messages.value[messages.value.length - 1]

    const response = await fetch(
        `${API_SERVER}/api/gpt/chat/${route.params.sessionId}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: content,
        }
    )

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        message.content += decoder.decode(value)
        message.token += 1
        scrollToBottom()
    }

    loading.value = false
    freeze.value = false
}

const onCreateChatSession = async () => {
    const data = (await axios.get(`${API_SERVER}/api/gpt/create`)).data as {
        sessionId: string
        available: boolean
    }

    if (!data.available) return
    sessions.value[data.sessionId] = { title: 'New Chat' }
}

const onDeleteChatSession = async (sessionId: string) => {
    axios.get(`${API_SERVER}/api/gpt/delete/${sessionId}`).then(() => {
        delete sessions.value[sessionId]
        if (sessionId == route.params.sessionId) messages.value = []
    })
}

const onClearChatSession = async (sessionId: string) => {
    axios.get(`${API_SERVER}/api/gpt/clear/${sessionId}`).then(async () => {
        if (sessionId == route.params.sessionId) {
            messages.value = []
        }
    })
}

// hook
onMounted(async () => {
    await connect(500)
    await fetchSessions()
})

onBeforeRouteUpdate(async (to, from) => {
    if (to.params.sessionId !== from.params.sessionId) {
        await fetchTitle(to.params.sessionId as string)
        await fetchData(to.params.sessionId as string)
    }
})
</script>

<template>
    <main>
        <div
            :class="{
                sidebar: useSidebar,
                'sidebar-hidden': !useSidebar,
            }"
        >
            <Sidebar
                :sessions="sessionsArray()"
                :active="route.params.sessionId + ''"
                @create="onCreateChatSession"
                @clear="onClearChatSession(route.params.sessionId as string)"
                @delete="onDeleteChatSession"
            />
        </div>

        <div
            :class="{
                menubar: useSidebar,
                'menubar-full': !useSidebar,
            }"
        >
            <Menubar :menu-title="title" @toggle="useSidebar = !useSidebar" />
        </div>

        <div
            ref="content-wrapper"
            :class="{
                content: useSidebar,
                'content-full': !useSidebar,
                noscroll: freeze,
            }"
        >
            <div class="menubar-padding" />
            <Prompt
                v-for="(item, index) in messages"
                :key="index"
                :bg-color="
                    item.role == 'user'
                        ? userPreset.color
                        : assistantPreset.color
                "
                :icon-url="
                    item.role == 'user' ? userPreset.icon : assistantPreset.icon
                "
                :content="item.content"
                :decoration="`${item.token}`"
            />
            <Prompt :show-info="false" />
            <div ref="anchor"></div>

            <Textarea
                class="bottom-float"
                :loading="loading"
                :freeze="freeze"
                :count="`${usedToken() + promptCount}(${promptCount})`"
                :max-count="`${maxToken}`"
                @change="onInput"
                @send="onChat"
            />
        </div>
    </main>
</template>

<style scoped>
.sidebar {
    position: fixed;
    top: 0;
    left: 0;
    float: left;
    width: 250px;
}
.sidebar-hidden {
    float: left;
    width: 0px;
    transition: width 0.15s ease-in;
}

.menubar {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 1;

    width: calc(100% - 250px);
}
.menubar-full {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 1;

    width: 100%;
    transition: width 0.15s ease-in;
}
.menubar-padding {
    position: relative;
    display: block;

    width: inhert;
    height: 45px;
}

.content {
    float: right;
    width: calc(100% - 250px);
    height: 100vh;

    overflow-y: scroll;
}
.content-full {
    float: right;
    width: 100%;
    transition: width 0.15s ease-in;

    overflow-y: scroll;
}

.bottom-float {
    position: fixed;
    z-index: 4;
    width: 100%;
    height: auto;
    bottom: 0px;
}

.noscroll {
    overflow-y: hidden;
}

@media (max-width: 1024px) {
    .sidebar {
        width: 0px;
        transition: width 0.15s ease-in;
    }
    .menubar {
        width: 100%;
        transition: width 0.15s ease-in;
    }
    .content {
        width: 100%;
        transition: width 0.15s ease-in;
    }
}
</style>
