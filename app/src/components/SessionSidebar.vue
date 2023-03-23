<script setup lang="ts">
import { defineEmits } from 'vue'
import { RouterLink } from 'vue-router'
import ChatIcon from './icons/IconChat.vue'
import TrashIcon from './icons/IconTrash.vue'
import EditIcon from './icons/IconEdit.vue'

export interface Props {
    sessions?: { id: string; title: string }[]
    active?: string
}
withDefaults(defineProps<Props>(), {
    sessions: () => [],
    active: '',
})

// (
//     ['hide', 'create', 'clear', 'delete']
// )
const emit = defineEmits<{
    (e: 'hide'): void
    (e: 'create'): void
    (e: 'clear'): void
    (e: 'delete', sessionId: string): void
}>()
</script>

<template>
    <div id="main-wrapper">
        <div id="create-button" @click="emit('create')">
            <span>Create</span>
        </div>

        <div id="session-wrapper">
            <RouterLink
                v-for="(item, index) in sessions"
                :key="index"
                :to="{ params: { sessionId: `${item.id}` } }"
            >
                <div
                    :class="{
                        option: item.id != active,
                        'option-active': item.id == active,
                    }"
                >
                    <ChatIcon class="option-left" />
                    <span class="option-title">{{ item.title }}</span>
                    <div class="option-right hover-show float">
                        <EditIcon class="option-right-child hover-highlight" />
                        <TrashIcon
                            class="option-right-child hover-highlight"
                            @click="emit('delete', item.id)"
                        />
                    </div>
                </div>
            </RouterLink>
        </div>

        <div id="bottom-wrapper">
            <div class="option" @click="emit('clear')">
                <span>Clear conversations</span>
            </div>
            <div class="option">
                <span>Upgrade to Plus</span>
            </div>
            <div class="option">
                <span>Dark mode</span>
            </div>
            <div class="option" @click="emit('hide')">
                <span>Hide sidebar</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
a {
    text-decoration: none;
}
#main-wrapper {
    display: inline-block;
    background-color: #181818;
    /* min-width: 200px; */
    width: inherit;
    height: 100vh;
    overflow: hidden;
}
#bottom-wrapper {
    position: absolute;
    bottom: 0px;
    border-top: 1px solid #4d4d4f;
    width: 100%;
}

#create-button {
    height: 45px;
    margin: 10px 10px;
    border-radius: 5px;
    border: 1px solid #525355;

    line-height: 45px;
    text-align: center;
    color: #d1e0d5;

    user-select: none;
    cursor: pointer;

    overflow: hidden;
}
#create-button:hover {
    transition: background-color 0.1s linear;
    background-color: #202123;
}

.option-left {
    float: left;

    width: 20px;
    height: 100%;
}
.option-right {
    float: right;

    width: 65px;
    height: 100%;
}
.option,
.option-active {
    height: 40px;
    margin: 5px 10px;
    padding-left: 10px;
    padding-right: 10px;
    border-radius: 8px;

    font-weight: 300;
    line-height: 40px;
    text-align: left;
    color: #d1e0d5;

    user-select: none;
    cursor: pointer;

    overflow: hidden;
}
.option span,
.option-active span {
    padding-left: 10px;
}
.option-active {
    transition: background-color 0.1s linear;
    background-color: #343540;
}
.option:hover {
    transition: background-color 0.1s linear;
    background-color: #2a2b31;
}
.float {
    position: relative;
    z-index: 2;
}
.option-right-child {
    float: left;

    width: 20px;
    height: 20px;
    margin-top: 10px;
    margin-left: 10px;
}
.hover-show {
    opacity: 0;
}
.hover-show:hover {
    opacity: 1;
    transition: opacity 0.1s ease-in;
}
.hover-highlight:hover {
    border: 1px solid white;
    border-radius: 5px;
}
</style>
