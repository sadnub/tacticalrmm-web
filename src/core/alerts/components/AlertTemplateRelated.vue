<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="width: 60vw">
      <q-bar>
        Assigned to {{ template.name }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-card-section>
        <q-tabs
          v-model="tab"
          dense
          inline-label
          class="text-grey"
          active-color="primary"
          indicator-color="primary"
          align="left"
          narrow-indicator
          no-caps
        >
          <q-tab name="policies" label="Policies" />
          <q-tab name="clients" label="Clients" />
          <q-tab name="sites" label="Sites" />
        </q-tabs>

        <q-separator />
        <q-scroll-area :thumb-style="thumbStyle" style="height: 50vh">
          <q-tab-panels v-model="tab" :animated="false">
            <q-tab-panel name="policies">
              <q-list separator padding>
                <q-item v-for="policy in related.policies" :key="policy.id">
                  <q-item-section>
                    <q-item-label>{{ policy.name }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-tab-panel>

            <q-tab-panel name="clients">
              <q-list separator padding>
                <q-item v-for="client in related.clients" :key="client.id">
                  <q-item-section>
                    <q-item-label>{{ client.name }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-tab-panel>

            <q-tab-panel name="sites">
              <q-list separator padding>
                <q-item v-for="site in related.sites" :key="site.id">
                  <q-item-section>
                    <q-item-label>{{ site.name }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-tab-panel>
          </q-tab-panels>
        </q-scroll-area>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useAlertTemplateStore } from "src/stores/api";

const { getAlertTemplateRelated } = useAlertTemplateStore();

// types
import type { AlertTemplate, AlertTemplateRelated } from "src/core/alerts/types";

const props = defineProps<{ template: AlertTemplate }>();
defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();

const tab = ref("policies");
const related = ref<AlertTemplateRelated>({
  policies: [],
  clients: [],
  sites: [],
});
const thumbStyle = {
  right: "2px",
  borderRadius: "5px",
  backgroundColor: "#027be3",
  width: "5px",
  opacity: "0.75",
};

async function loadRelated() {
  try {
    related.value = await getAlertTemplateRelated(props.template.id);
  } catch {
    //
  }
}

onMounted(loadRelated);
</script>
