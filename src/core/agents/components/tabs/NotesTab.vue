<template>
  <div v-if="selectedAgentIds.length === 0" class="q-pa-sm">No agent selected</div>
  <div v-else-if="selectedAgentIds.length > 1"></div>
  <div v-else>
    <tactical-table
      v-model:pagination="pagination"
      grid
      :style="{ 'max-height': `${tabHeight}px` }"
      :rows="agentNotes"
      :columns="columns"
      row-key="id"
      :rows-per-page-options="[0]"
      :loading="isLoading"
      hide-bottom
      virtual-scroll
      no-data-label="No notes"
    >
      <template #top>
        <q-btn
          class="q-mr-sm"
          dense
          flat
          push
          icon="refresh"
          @click="selectedAgentId && getAgentNotes(selectedAgentId, { force: true })"
        />
        <q-btn icon="add" label="Add Note" no-caps dense flat push @click="addNote" />
        <q-space />
        <tactical-table-export />
      </template>

      <template #loading>
        <q-inner-loading showing color="primary" />
      </template>

      <template #item="props">
        <q-card class="notes-card q-pa-none q-ma-xs" bordered>
          <q-card-section>
            <div class="row">
              <div class="col">
                <div class="text-subtitle2">
                  {{ formatDate(props.row.entry_time) }}
                </div>
                <div class="text-caption">{{ props.row.username }}</div>
              </div>
              <div class="col-auto">
                <q-btn color="grey-7" round flat icon="more_vert">
                  <q-menu cover auto-close>
                    <q-list dense>
                      <q-item v-close-popup clickable @click="editNote(props.row)">
                        <q-item-section side>
                          <q-icon name="edit" />
                        </q-item-section>
                        <q-item-section>Edit</q-item-section>
                      </q-item>

                      <q-item v-close-popup clickable @click="deleteNote(props.row)">
                        <q-item-section side>
                          <q-icon name="delete" />
                        </q-item-section>
                        <q-item-section>Delete</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </div>
            </div>
          </q-card-section>
          <q-card-section style="max-height: 20vh" class="scroll">
            <pre>{{ props.row.note }}</pre>
          </q-card-section>
        </q-card>
      </template>
    </tactical-table>
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { ref, watch, onMounted } from "vue";
import { useQuasar } from "quasar";
import { useAgentNoteStore, useAgentStore, useDashboardStore } from "src/stores/api";

const { agentNotes, getAgentNotes, addAgentNote, updateAgentNote, removeAgentNote } = useAgentNoteStore();
const { selectedAgentId, selectedAgentIds, isLoading } = useAgentStore();
const { tabHeight, formatDate } = useDashboardStore();

// type imports
import type { AgentNote } from "../../types";
import type { TacticalColumn } from "src/core/dashboard/types";

// static data
const columns: TacticalColumn[] = [
  {
    name: "entry_time",
    label: "Date",
    field: "entry_time",
  },
  {
    name: "username",
    label: "User",
    field: "username",
  },
  {
    name: "note",
    label: "Note",
    field: "note",
  },
];

// setup quasar
const $q = useQuasar();

// notes tab logic
const pagination = ref({
  rowsPerPage: 0,
  sortBy: "id",
  descending: false,
});

function addNote() {
  $q.dialog({
    title: "Add Note",
    prompt: {
      model: "",
      type: "textarea",
      isValid: (val) => !!val,
    },
    color: "primary",
    style: "min-width: 50vw",
    ok: { label: "Add" },
    cancel: true,
  }).onOk((data: string) => {
    if (selectedAgentId.value)
      void addAgentNote({
        agent_id: selectedAgentId.value,
        note: data,
      });
  });
}

function editNote(note: AgentNote) {
  $q.dialog({
    title: "Edit Note",
    prompt: {
      model: note.note,
      type: "textarea",
      isValid: (val) => !!val,
    },
    color: "primary",
    style: "min-width: 50vw",
    ok: { label: "Save" },
    cancel: true,
  }).onOk((data) => {
    void updateAgentNote(note.id, { note: data });
  });
}

function deleteNote(note: AgentNote) {
  $q.dialog({
    title: "Delete note?",
    cancel: true,
    ok: { label: "Delete", color: "negative" },
    color: "primary",
  }).onOk(() => {
    void removeAgentNote(note.id);
  });
}

watch(selectedAgentId, (newValue) => {
  if (newValue) {
    getAgentNotes(newValue);
  }
});

onMounted(() => {
  if (selectedAgentId.value) getAgentNotes(selectedAgentId.value);
});
</script>

<style lang="sass" scoped>
.notes-card
  width: 100%
  max-width: 20vw
</style>
