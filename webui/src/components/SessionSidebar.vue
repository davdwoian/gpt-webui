<script setup lang="ts">
import { ref } from 'vue'
import ChatIcon from './icons/IconChat.vue'

export interface Props {
    width?: number,
    sessions?: string[]
}
const props = withDefaults(defineProps<Props>(), {
    width: 1024,
    sessions: () => [],
})

const activeIndex = ref(-1);

</script>

<template>
    <div id="main-wrapper">
        <div id="create-session">New chat</div>

        <div id="session-wrapper">
            <div 
                :class="{
                    'option': index != activeIndex,
                    'option-active': index == activeIndex
                }"
                v-for="(item, index) in sessions" :key="index" @click="activeIndex = index">
                <ChatIcon class="option-image"></ChatIcon>
                <span class="option-title">{{ item }}</span>
            </div>
        </div>

        <div id="bottom-wrapper">
            <div class="option"> Clear conversations </div>
            <div class="option"> Upgrade to Plus </div>
            <div class="option"> Dark mode </div>
            <div class="option"> Log out </div>
        </div>
    </div>
</template>

<style scoped>
#main-wrapper {
    position: fixed;
    background-color: #181818;
    min-width: 200px;
    width: v-bind(width + 'px');
    height: 100vh;
}
#bottom-wrapper {
    position: absolute;
    bottom: 0px;
    border-top: 1px solid #4D4D4F;
    width: 100%;
}

#create-session {
    height: 45px;
    margin: 10px 10px;
    border-radius: 5px;
    border: 1px solid #525355;

    line-height: 45px;
    text-align: center;
    color: #d1e0d5;
    user-select: none;
    cursor: pointer;
}
#create-session:hover {
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