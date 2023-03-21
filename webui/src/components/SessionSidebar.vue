<script setup lang="ts">
import { defineEmits } from 'vue'
import { RouterLink } from 'vue-router'
import ChatIcon from './icons/IconChat.vue'

export interface Props {
    sessions?: { title: string, id: string }[],
    active?: string
}
const props = withDefaults(defineProps<Props>(), {
    sessions: () => [],
    active: ''
})
const emit = defineEmits(['hide'])
</script>

<template>
    <div id="main-wrapper">
        <div id="create-button">
            <span>New chat</span>
        </div>

        <div id="session-wrapper">
            <RouterLink
                v-for="(item, index) in sessions"
                :key="index"
                :to="{ params: { sessionId: `${item.id}`} }"
            > 
                <div
                    :class="{
                        'option': item.id != active,
                        'option-active': item.id == active}"
                >
                    <ChatIcon class="option-image" />
                    <span class="option-title">{{ item.title }}</span>
                </div>
            </RouterLink>
        </div>

        <div id="bottom-wrapper">
            <div class="option">
                <span>Clear conversations</span>
            </div>
            <div class="option">
                <span>Upgrade to Plus</span>
            </div>
            <div class="option">
                <span>Dark mode</span>
            </div>
            <div
                class="option"
                @click="emit('hide')"
            > 
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
    border-top: 1px solid #4D4D4F;
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

.option-image {
    height: 100%;
    width: 20px;
    float: left;
}
.option, .option-active {
    height: 40px;
    margin: 5px 10px;
    padding-left: 10px;
    border-radius: 8px;

    font-weight: 300;
    line-height: 40px;
    text-align: left;
    color: #d1e0d5;

    user-select: none;
    cursor: pointer;

    overflow: hidden;
}
.option span, .option-active span {
    padding-left: 10px;
}
.option-active {
    transition: background-color 0.1s linear;
    background-color: #343540;
}
.option:hover {
    transition: background-color 0.1s linear;
    background-color: #2A2B31;
}

</style>