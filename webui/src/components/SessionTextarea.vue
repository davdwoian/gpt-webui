<script setup lang="ts">
import { onMounted, ref } from 'vue'
import SendIcon from './icons/IconSend.vue'

// import { computed } from 'vue'

const textInput = ref<HTMLTextAreaElement>();
const content = ref('');
const status = ref('idle');

onMounted(() => {
	textInput.value?.addEventListener('input', function () {
		this.style.height = "auto";
		this.style.height = `${this.scrollHeight}px`;
	})
})

function textKeydown(e: KeyboardEvent) {
	if (e.key == 'Tab') {
		e.preventDefault();
		const el = e.target as HTMLTextAreaElement
		const s = el.selectionStart;
		el.value = el.value.substring(0, el.selectionStart) + "\t" + el.value.substring(el.selectionEnd);
		el.selectionEnd = s + 1;
	}
}

defineEmits<{
    (e: 'send', content: string): void
}>();


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
        rows="1"
        @keydown="textKeydown"
      />
      <SendIcon
        id="send"
        :loading="status == 'loading'"
        @click="$emit('send', content)"
      />
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

#send {
    position: absolute;
    bottom: 5px;
    right: 5px;

    width: 20px;
    height: 20px;

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