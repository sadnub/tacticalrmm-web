// @ts-nocheck /* eslint-disable */
<template>
  <q-menu anchor="top end" self="top start">
    <q-list>
      <q-item
        v-for="integration in $integrations[type + 'MenuIntegrations']"
        :key="integration.name"
        v-close-popup
        dense
        clickable
        :to="integration.type === 'route' ? integration.uri : undefined"
        @click="
          integration.type === 'dialog'
            ? $q.dialog({
                component: integration.component,
                componentProps: integration.props ? integration.props(id, type) : undefined,
              })
            : undefined
        "
      >
        <q-item-section>{{ integration.name }}</q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<script setup lang="ts">
defineProps<{
  type: "client" | "agent" | "site";
  id: string | number;
}>();
</script>
