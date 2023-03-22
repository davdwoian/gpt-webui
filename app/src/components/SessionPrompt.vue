<script setup lang="ts">
export interface Props {
    showInfo?: boolean
    bgColor?: string
    iconUrl?: string
    content?: string
    decoration?: string
}
const props = withDefaults(defineProps<Props>(), {
    showInfo: true,
    bgColor: '#313136',
    iconUrl: '',
    content: '',
    decoration: '',
})

const colors = () => {
    return {
        '--bg-color': props.bgColor,
    }
}
</script>

<template>
    <div id="main-wrapper" :style="colors()">
        <div id="info-wrapper">
            <img v-if="showInfo" :src="iconUrl" />
            <span v-if="showInfo"> {{ decoration }}</span>
        </div>
        <v-md-preview id="main" :text="content" />
    </div>
</template>

<style scoped>
#main-wrapper {
    width: 100%;
    height: fit-content;
    min-height: 200px;
    padding-top: 25px;

    background-color: var(--bg-color);
}
#info-wrapper {
    float: left;

    width: 45px;
    height: 80px;
    margin-top: 10px;
    margin-left: calc(15% - 50px);
}
img {
    width: inherit;
    height: auto;
}
span {
    display: flex;
}

#main {
    width: 70%;
    margin-left: 15%;
}
</style>
