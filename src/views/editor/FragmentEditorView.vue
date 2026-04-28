<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import EditorWorkspace from '@/components/editor/EditorWorkspace.vue'

const route = useRoute()
const id = computed(() => Number(route.params.id))
</script>

<template>
  <EditorWorkspace source-type="reusable_fragment" :source-id="id" />
</template>
