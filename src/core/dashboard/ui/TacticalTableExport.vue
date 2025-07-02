<template>
  <q-btn dense color="primary" icon-right="archive" @click="exportTable">
    <q-tooltip>Export table as CSV</q-tooltip>
  </q-btn>
</template>

<script lang="ts" setup>
import { inject } from "vue";
import { tableExportKey } from "../types";

const exportTable = inject(tableExportKey, () => {
  console.error("ExportButton must be a descendant of TacticalTable.");
});
</script>
