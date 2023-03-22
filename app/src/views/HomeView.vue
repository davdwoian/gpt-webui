<script setup lang="ts">
import { ref, onMounted, resolveComponent, Static } from 'vue'
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

const route = useRoute()

// status
const loading = ref(false)
const freeze = ref(false)
const useSidebar = ref(true)

const sessions = ref<{ title: string; id: string }[]>([])
const title = ref('')
const messages = ref<{ role: string; content: string; token: number }[]>([])
const maxToken = ref(0)

const promptCount = ref(0)

const encode = async (text: string): Promise<number> => {
    return new Promise((resolve, reject) => {
        axios
            .post(`${API_SERVER}/api/gpt/tokenizer`, text, {
                headers: {
                    'Content-Type': 'text/plain',
                },
            })
            .then((response) => {
                console.log(response.data)
                resolve(parseInt(response.data))
            })
    })
    // const response = await axios.post(
    //     `${API_SERVER}/api/gpt/tokenizer/${text}`,
    //     {
    //         responseType: '',
    //     }
    // )
}

// computed
const usedToken = () => {
    let usedToken = 0
    messages.value.forEach((v) => {
        usedToken += v.token
    })
    return usedToken
}

// eventHandler
let onInputTimeout: number
const onInput = (content: string) => {
    clearTimeout(onInputTimeout)
    loading.value = true
    onInputTimeout = setTimeout(async () => {
        promptCount.value = await encode(content)
        loading.value = false
    }, 500)
}

const onChat = async (content: string) => {
    if (loading.value || freeze.value) return
    loading.value = true
    freeze.value = true

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
    }

    loading.value = false
    freeze.value = false
}

const fetchSessions = async () => {
    const response = await axios.get(`${API_SERVER}/api/gpt/sessions`, {
        responseType: 'json',
    })
    const parsed = response.data as { sessions: string[] }
    const meta = await Promise.all(
        parsed.sessions.map(async (sessionId) => {
            try {
                const response = await axios.get(
                    `${API_SERVER}/api/gpt/title/${sessionId}`,
                    { responseType: 'json' }
                )
                const data = response.data as { title: string }
                return { title: data.title, sessionId: sessionId }
            } catch {
                return undefined
            }
        })
    )
    sessions.value =
        meta
            .filter((x) => x != undefined)
            .map((x) => {
                return { title: x!.title, id: x!.sessionId }
            }) || []
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

// hook
onMounted(async () => {
    await fetchSessions()
    await fetchData(route.params.sessionId as string)
})

onBeforeRouteUpdate(async (to, from) => {
    if (to.params.sessionId !== from.params.sessionId) {
        await fetchSessions()
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
                :sessions="sessions"
                :active="route.params.sessionId + ''"
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
            :class="{
                content: useSidebar,
                'content-full': !useSidebar,
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
}
.content-full {
    float: right;
    width: 100%;
    transition: width 0.15s ease-in;
}

.bottom-float {
    position: fixed;
    z-index: 4;
    width: 100%;
    height: auto;
    bottom: 0px;
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
