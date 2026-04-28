<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import EditorWorkspace from '@/components/editor/EditorWorkspace.vue'

const route = useRoute()
const versionId = computed(() => Number(route.params.versionId))
</script>

<template>
  <EditorWorkspace source-type="page_version" :source-id="versionId" />
</template>
