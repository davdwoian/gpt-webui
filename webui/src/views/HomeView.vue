<script setup lang="ts">
import Sidebar from '../components/SessionSidebar.vue'

const a = ["1", "2", "3"]
</script>

<template>
  <main>
    <Sidebar class="sidebar" :sessions="a" :width=300></Sidebar>
  </main>
</template>

<style>
</style>
