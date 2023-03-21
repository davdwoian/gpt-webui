<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onBeforeRouteUpdate, useRoute } from 'vue-router'
import Sidebar from '../components/SessionSidebar.vue'
import Menubar from '../components/SessionMenubar.vue'
import Prompt from '../components/SessionPrompt.vue'
import Textarea from '../components/SessionTextarea.vue'
import axios from 'axios'

const route = useRoute();

const sessions = ref<{ title: string, id: string }[]>([]);
const messages = ref<{ role: string, content: string }[]>([]);
const sidebarActive = ref(true);

const clientColor = "#313136"
const userColor = '#4A4C58'

const sessionTitle = (id: string) => {
    if (!sessions.value || sessions.value.length == 0) return ''
    return sessions.value.filter(x => x.id == id)[0]?.title || '';
}

// const onChat = (content: string) => {
//   const response = await axios.get(`${import.meta.env.API_SERVER_ADDRESS}/api/gpt/sessions`)

// }

console.log(import.meta.env.VITE_API_SERVER_ADDRESS);



const fetchSessions = async () => {
    const response = await axios.get(`${import.meta.env.VITE_API_SERVER_ADDRESS}/api/gpt/sessions`, { responseType: 'json' })
    const parsed = response.data as { sessionIds: string[] }
    const meta = await Promise.all(parsed.sessionIds.map(async (x) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_SERVER_ADDRESS}/api/gpt/metadata/${x}`, { responseType: 'json' });
            return response.data as { title: string, sessionId: string }
        } catch {
            return undefined;
        }
    }))
    sessions.value = meta.filter(x => x != undefined).map(x => {
        return { title: x!.title, id: x!.sessionId }
    }) || [];
}
const fetchMessages = async (sessionId: string) => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_API_SERVER_ADDRESS}/api/gpt/messages/${sessionId}`, { responseType: 'json' });
        messages.value = (response.data as { messages: { role: string, content: string }[] }).messages;
    } catch {
        messages.value = []
    }
}

onMounted(async () => {
    await fetchSessions();
    await fetchMessages(route.params.sessionId as string);
});

onBeforeRouteUpdate(async (to, from) => {
    if (to.params.sessionId !== from.params.sessionId) {
        await fetchSessions();
        await fetchMessages(to.params.sessionId as string);
    }
})
</script>

<template>
    <main>
        <div :class="{
            'sidebar': sidebarActive,
            'sidebar-hidden': !sidebarActive
        }">
            <Sidebar :sessions="sessions" :active="route.params.sessionId + ''" @hide="sidebarActive = false" />
        </div>

        <div :class="{
            'content': sidebarActive,
            'content-full': !sidebarActive
        }">
            <Menubar :menu-title="sessionTitle(route.params.sessionId + '')" @toggle="sidebarActive = !sidebarActive" />

            <Prompt v-for="(item, index) in messages" :key="index" :bg-color="item.role == 'user' ? userColor : clientColor"
                :content="item.content" />
            <Prompt :show-icon="false" />

            <Textarea class="bottom-float" />
        </div>
    </main>
</template>

<style scoped>
.sidebar {
    position: fixed;
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
    width: calc(100vw - 250px);
    height: 100vh;
}

.content-full {
    float: right;
    width: calc(100vw);
    transition: all 0.15s ease-in;
}

.bottom-float {
    position: fixed;
    z-index: 4;
    width: 100%;
    height: auto;
    bottom: 0px;
}
</style>


