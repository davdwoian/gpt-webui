<script setup lang="ts">
import { defineEmits } from 'vue'
import MenuIcon from './icons/IconMenu.vue'
import AddIcon from './icons/IconAdd.vue'

export interface Props {
    menuTitle?: string
}
const props = withDefaults(defineProps<Props>(), {
	menuTitle: 'New Chat'
})
const emit = defineEmits(['toggle', 'add'])

</script>

<template>
  <div id="main-wrapper">
    <div class="left-wrapper">
      <MenuIcon
        class="inline-image"
        @click="emit('toggle')"
      />
    </div>

    <div class="right-wrapper">
      <AddIcon
        class="inline-image"
        @click="emit('add')"
      />
    </div>
        
    <div class="mid-wrapper">
      <span>{{ $props['menuTitle'] }}</span>
    </div>
  </div>
</template>

<style scoped>
    #main-wrapper {
        width: 100%;
        height: 45px;
        border-top: 1px;
        border-right: 0px;
        border-bottom: 1px;
        border-left: 0px;
        border-color: #5D5D66;
        border-style: solid;

        text-align: center;

        background-color: #343540;
    }

    .left-wrapper {
        float: left;

        width: 40px;
        height: 100%;

        justify-content: center;
    }
    .right-wrapper {
        float: right;
        right: 0px;

        width: 40px;
        height: 100%;

        justify-content: center;
    }
    
    span {
        color: white;
        
        line-height: 45px;
        font-weight: 350;

        user-select: none;
    }

    .inline-image {
        height: 100%;
        width: 25px;
    }
    .left-wrapper .inline-image {
        z-index: 1;
        margin-left: 10px;
    }
    .right-wrapper .inline-image {
        z-index: 1;
        margin-right: 10px;
    }

    svg {
        cursor: pointer;
    }

</style>