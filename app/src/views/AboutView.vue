<script setup lang="ts">
import axios from 'axios'
axios.get('/static/vocab.bpe').then((response) => {
    console.log(response.data)
})
</script>

<template>
    <div class="about">
        <h1>This is an about page</h1>
    </div>
</template>

<style scoped>
@media (min-width: 1024px) {
    .about {
        min-height: 100vh;
        display: flex;
        align-items: center;
    }
}
</style>
