<script setup lang="ts">
import { ref } from 'vue'

// import { computed } from 'vue'

export interface Props {
    showIcon?: boolean
    bgColor?: string
    content?: string
}
const props = withDefaults(defineProps<Props>(), {
    showIcon: true,
    bgColor: '#313136',
    content: '',
})

const colors = () => {
    return {
        '--bg-color': props.bgColor,
    }
}
</script>

<template>
    <div id="wrapper" :style="colors()">
        <img v-if="showIcon" src="./icons/assistant-svgrepo-com.svg" />
        <v-md-preview id="main" :text="content" />
    </div>
</template>

<style scoped>
#wrapper {
    width: 100%;
    height: fit-content;
    min-height: 200px;
    padding-top: 25px;

    background-color: var(--bg-color);
}
img {
    float: left;
    width: 50px;
    height: 50px;
    padding-top: 10px;
    margin-left: calc(15% - 50px);
}
#main {
    width: 70%;
    margin-left: 15%;
}
</style>
