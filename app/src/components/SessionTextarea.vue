<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import SendIcon from './icons/IconSend.vue'

export interface Props {
    loading?: boolean
    freeze?: boolean
    count?: string
    maxCount?: string
}
const props = withDefaults(defineProps<Props>(), {
    loading: false,
    freeze: false,
    count: '0',
    maxCount: '524288',
})
const textInput = ref<HTMLTextAreaElement>()
const sendButton = ref<typeof SendIcon>()
const content = ref('')

const emit = defineEmits<{
    (e: 'send', content: string): void
    (e: 'change', content: string): void
}>()
const emitSend = () => {
    if (!content.value) return
    emit('send', content.value)
    content.value = ''
}

onMounted(() => {
    textInput.value?.addEventListener('input', function () {
        this.style.height = 'auto'
        this.style.height = `${this.scrollHeight}px`
    })
})

function onKeydown(e: KeyboardEvent) {
    if (e.key == 'Tab') {
        e.preventDefault()
        const el = e.target as HTMLTextAreaElement
        const s = el.selectionStart
        el.value =
            el.value.substring(0, el.selectionStart) +
            '\t' +
            el.value.substring(el.selectionEnd)
        el.selectionEnd = s + 1
    }
    if (e.shiftKey && e.key == 'Enter') {
        e.preventDefault()
        if (!props.freeze && !props.loading) {
            emitSend()
        }
    }
}

watch(content, (value) => {
    emit('change', value)
})
</script>

<template>
    <div id="wrapper">
        <div id="box">
            <textarea
                v-model="content"
                ref="textInput"
                autocomplete="false"
                autocorrect="false"
                autocapitalize="false"
                spellcheck="false"
                :readonly="freeze"
                rows="1"
                @keydown="onKeydown"
            />
            <div class="bottom-right-wrapper">
                <span>
                    {{ `${count} / ${maxCount}` }}
                </span>
                <SendIcon
                    id="send"
                    ref="sendButton"
                    :style="{
                        pointerEvents: loading || freeze ? 'none' : 'auto',
                        cursor: loading || freeze ? 'auto' : 'pointer',
                    }"
                    :loading="loading"
                    @click="emitSend()"
                />
            </div>
        </div>
    </div>
</template>

<style scoped>
#wrapper {
    display: flex;

    width: inherit;
    height: 200px;

    justify-content: center;
}

#box {
    position: absolute;
    bottom: 50px;
    display: flex;

    width: 1000px;
    height: auto;
    max-width: 95%;
    padding: 10px;
    border-radius: 7px;

    background-color: #5c5d6b;

    overflow-x: auto;
    overflow-y: auto;
}
.bottom-right-wrapper {
    position: absolute;
    bottom: 25px;
    right: 5px;
    width: fit-content;
    height: 0px;
}
.bottom-right-wrapper span {
    margin-right: 13px;

    font-size: 15px;
}
#send {
    width: 20px;
    height: 20px;

    border: 1px #c0c4d1;
    border-style: dashed;
    border-radius: 5px;
    cursor: pointer;
}

textarea {
    width: 100%;
    height: 28px;
    min-height: 28px;
    max-height: 200px;
    border: 0px;
    border-radius: 5px;

    background-color: rgba(0, 0, 0, 0);

    line-height: 23px;
    font-size: 18px;
    font-weight: 500;
    color: white;

    user-select: none;
    box-shadow: none;
    outline: none;
    resize: none;
    overflow-y: auto;
}

::-webkit-scrollbar {
    width: 8px;
    height: 10px;
}

::-webkit-scrollbar-track {
    border-radius: 9999px;
}

::-webkit-scrollbar-thumb {
    border-radius: 9999px;
    -webkit-box-shadow: inset 0 0 0 6px rgb(56, 55, 70);
}
</style>
