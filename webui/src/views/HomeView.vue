<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { onBeforeRouteUpdate, useRoute } from 'vue-router'
import Sidebar from '../components/SessionSidebar.vue'
import Menubar from '../components/SessionMenubar.vue'
import Prompt from '../components/SessionPrompt.vue'
import Textarea from '../components/SessionTextarea.vue'
import axios from 'axios'

const route = useRoute()
const status = ref('idle')

const sessions = ref<{ title: string; id: string }[]>([])
const messages = ref<{ role: string; content: string }[]>([])
const sidebarActive = ref(true)

const assistantPreset = {
    color: '#313136',
    icon: '../assets/assistant.png',
}
const userPreset = {
    color: '#4A4C58',
    icon: '../assets/user.png',
}

const sessionTitle = (id: string) => {
    if (!sessions.value || sessions.value.length == 0) return ''
    return sessions.value.filter((x) => x.id == id)[0]?.title || ''
}

const onChat = async (content: string) => {
    if (status.value == 'loading') return

    status.value = 'loading'

    messages.value.push({ role: 'user', content: content })
    messages.value.push({ role: 'assistant', content: '' })
    const message = messages.value[messages.value.length - 1]

    const response = await fetch(
        `${import.meta.env.VITE_API_SERVER_ADDRESS}/api/gpt/chat/${
            route.params.sessionId
        }`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: content,
        }
    )

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        message.content += decoder.decode(value)
    }

    status.value = 'idle'
}

const fetchSessions = async () => {
    const response = await axios.get(
        `${import.meta.env.VITE_API_SERVER_ADDRESS}/api/gpt/sessions`,
        { responseType: 'json' }
    )
    const parsed = response.data as { sessionIds: string[] }
    const meta = await Promise.all(
        parsed.sessionIds.map(async (x) => {
            try {
                const response = await axios.get(
                    `${
                        import.meta.env.VITE_API_SERVER_ADDRESS
                    }/api/gpt/metadata/${x}`,
                    { responseType: 'json' }
                )
                return response.data as { title: string; sessionId: string }
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
const fetchMessages = async (sessionId: string) => {
    try {
        const response = await axios.get(
            `${
                import.meta.env.VITE_API_SERVER_ADDRESS
            }/api/gpt/messages/${sessionId}`,
            { responseType: 'json' }
        )
        messages.value = (
            response.data as { messages: { role: string; content: string }[] }
        ).messages
    } catch {
        messages.value = []
    }
}

onMounted(async () => {
    await fetchSessions()
    await fetchMessages(route.params.sessionId as string)
})

onBeforeRouteUpdate(async (to, from) => {
    if (to.params.sessionId !== from.params.sessionId) {
        await fetchSessions()
        await fetchMessages(to.params.sessionId as string)
    }
})
</script>

<template>
    <main>
        <div
            :class="{
                sidebar: sidebarActive,
                'sidebar-hidden': !sidebarActive,
            }"
        >
            <Sidebar
                :sessions="sessions"
                :active="route.params.sessionId + ''"
                @hide="sidebarActive = false"
            />
        </div>

        <div
            :class="{
                content: sidebarActive,
                'content-full': !sidebarActive,
            }"
        >
            <Menubar
                :menu-title="sessionTitle(route.params.sessionId + '')"
                @toggle="sidebarActive = !sidebarActive"
            />

            <Prompt
                v-for="(item, index) in messages"
                :key="index"
                :bg-color="
                    item.role == 'user'
                        ? userPreset.color
                        : assistantPreset.color
                "
                :content="item.content"
            />
            <Prompt :show-icon="false" />

            <Textarea class="bottom-float" :status="status" @send="onChat" />
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

    .content {
        width: 100%;
        transition: width 0.15s ease-in;
    }
}
</style>
