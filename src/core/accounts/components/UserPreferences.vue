<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 60vw">
      <q-splitter v-model="splitterModel">
        <template #before>
          <q-tabs v-model="tab" dense vertical class="text-primary">
            <q-tab name="ui" label="User Interface" />
          </q-tabs>
        </template>
        <template #after>
          <q-form @submit.prevent="editUserPrefs">
            <q-card-section class="row items-center">
              <div class="text-h6">Preferences</div>
              <q-space />
              <q-btn v-close-popup icon="close" flat round dense />
            </q-card-section>
            <q-tab-panels
              v-model="tab"
              animated
              transition-prev="jump-up"
              transition-next="jump-up"
            >
              <q-tab-panel name="ui">
                <div class="text-subtitle2">User Interface</div>
                <q-separator />
                <q-card-section class="row">
                  <div class="col-6">Agent double-click action:</div>
                  <div class="col-2"></div>
                  <q-select
                    v-model="state.dblclick_action"
                    map-options
                    emit-value
                    filled
                    dense
                    options-dense
                    :options="agentDblClickOptions"
                    class="col-4"
                    @update:model-value="state.url_action = null"
                  />
                </q-card-section>
                <q-card-section v-if="state.dblclick_action === 'urlaction'" class="row">
                  <div class="col-6">URL Action:</div>
                  <div class="col-2"></div>
                  <q-select
                    v-model="state.url_action"
                    map-options
                    emit-value
                    filled
                    dense
                    options-dense
                    :options="webActionOptions"
                    class="col-4"
                    :rules="[(val) => !!val || '*Required']"
                  />
                </q-card-section>
                <q-card-section class="row">
                  <div class="col-6">Agent table default tab:</div>
                  <div class="col-2"></div>
                  <q-select
                    v-model="state.default_agent_tbl_tab"
                    map-options
                    emit-value
                    filled
                    dense
                    options-dense
                    :options="defaultAgentTblTabOptions"
                    class="col-4"
                  />
                </q-card-section>
                <q-card-section class="row">
                  <div class="col-4">Loading Bar Color:</div>
                  <div class="col-4"></div>
                  <q-select
                    v-model="state.loading_bar_color"
                    filled
                    dense
                    options-dense
                    :options="loadingBarColors"
                    class="col-4"
                  />
                </q-card-section>
                <q-card-section class="row">
                  <div class="col-2">Dashboard Info Color:</div>
                  <div class="col-2"></div>
                  <q-input v-model="state.dash_info_color" filled dense class="col-8">
                    <template #after>
                      <q-btn
                        round
                        dense
                        flat
                        size="sm"
                        icon="info"
                        @click="openURL(quasar_color_url)"
                      >
                        <q-tooltip>Click to see color options</q-tooltip>
                      </q-btn>
                    </template>
                  </q-input>
                </q-card-section>
                <q-card-section class="row">
                  <div class="col-2">Dashboard Positive Color:</div>
                  <div class="col-2"></div>
                  <q-input v-model="state.dash_positive_color" filled dense class="col-8">
                    <template #after>
                      <q-btn
                        round
                        dense
                        flat
                        size="sm"
                        icon="info"
                        @click="openURL(quasar_color_url)"
                      >
                        <q-tooltip>Click to see color options</q-tooltip>
                      </q-btn>
                    </template>
                  </q-input>
                </q-card-section>
                <q-card-section class="row">
                  <div class="col-2">Dashboard Negative Color:</div>
                  <div class="col-2"></div>
                  <q-input v-model="state.dash_negative_color" filled dense class="col-8">
                    <template #after>
                      <q-btn
                        round
                        dense
                        flat
                        size="sm"
                        icon="info"
                        @click="openURL(quasar_color_url)"
                      >
                        <q-tooltip>Click to see color options</q-tooltip>
                      </q-btn>
                    </template>
                  </q-input>
                </q-card-section>
                <q-card-section class="row">
                  <div class="col-2">Dashboard Warning Color:</div>
                  <div class="col-2"></div>
                  <q-input v-model="state.dash_warning_color" filled dense class="col-8">
                    <template #after>
                      <q-btn
                        round
                        dense
                        flat
                        size="sm"
                        icon="info"
                        @click="openURL(quasar_color_url)"
                      >
                        <q-tooltip>Click to see color options</q-tooltip>
                      </q-btn>
                    </template>
                  </q-input>
                </q-card-section>
                <q-card-section class="row">
                  <div class="col-2">Client Sort:</div>
                  <div class="col-2"></div>
                  <q-select
                    v-model="state.client_tree_sort"
                    map-options
                    emit-value
                    filled
                    dense
                    options-dense
                    :options="clientTreeSortOptions"
                    class="col-8"
                  />
                </q-card-section>
                <q-card-section class="row">
                  <div class="col-2">Date Format:</div>
                  <div class="col-2"></div>
                  <q-input v-model="state.date_format" filled dense class="col-8">
                    <template #after>
                      <q-btn
                        round
                        dense
                        flat
                        size="sm"
                        icon="info"
                        @click="
                          openURL('https://quasar.dev/quasar-utils/date-utils#format-for-display')
                        "
                      >
                        <q-tooltip>Click to see formatting options</q-tooltip>
                      </q-btn>
                    </template>
                  </q-input>
                </q-card-section>
                <q-card-section class="row">
                  <q-checkbox
                    v-model="state.clear_search_when_switching"
                    label="Clear search field when switching client/site"
                  />
                </q-card-section>
              </q-tab-panel>
            </q-tab-panels>

            <q-card-section class="row items-center">
              <q-btn label="Save" color="primary" type="submit" />
            </q-card-section>
          </q-form>
        </template>
      </q-splitter>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { openURL, useDialogPluginComponent } from "quasar";
import { useUserStore, useDashboardStore } from "src/stores/api";

const userStore = useUserStore();
const dashboardStore = useDashboardStore();
import { useURLActionDropdown } from "src/core/settings/composables";

// type imports
import type { User } from "../types";

defineEmits(useDialogPluginComponent.emits);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const loadingBarColors = [
  "red",
  "pink",
  "purple",
  "deep-purple",
  "indigo",
  "blue",
  "light-blue",
  "cyan",
  "teal",
  "green",
  "light-green",
  "lime",
  "yellow",
  "amber",
  "orange",
  "deep-orange",
  "brown",
  "grey",
  "blue-grey",
];

// dropdowns
const { webActionOptions } = useURLActionDropdown();

const state = reactive<Partial<User>>({
  dblclick_action: dashboardStore.dashboardSettings.agentDblClickAction,
  url_action: dashboardStore.dashboardSettings.agentUrlAction,
  default_agent_tbl_tab: dashboardStore.dashboardSettings.defaultAgentTblTab,
  client_tree_sort: dashboardStore.dashboardSettings.clientTreeSort,
  loading_bar_color: dashboardStore.dashboardSettings.loadingBarColor,
  dash_info_color: dashboardStore.dashboardSettings.dashInfoColor,
  dash_positive_color: dashboardStore.dashboardSettings.dashPositiveColor,
  dash_negative_color: dashboardStore.dashboardSettings.dashNegativeColor,
  dash_warning_color: dashboardStore.dashboardSettings.dashWarningColor,
  clear_search_when_switching: dashboardStore.dashboardSettings.clearSearchWhenSwitching,
  date_format: dashboardStore.dashboardSettings.dateFormat,
});

const tab = ref("ui");
const splitterModel = ref(20);

const quasar_color_url = "https://quasar.dev/style/color-palette";

const clientTreeSortOptions = [
  { label: "Sort alphabetically, moving failing clients to the top", value: "alphafail" },
  { label: "Sort alphabetically only", value: "alpha" },
];
const agentDblClickOptions = [
  { label: "Edit Agent", value: "editagent" },
  { label: "Take Control", value: "takecontrol" },
  { label: "Remote Background", value: "remotebg" },
  { label: "Run URL Action", value: "urlaction" },
];
const defaultAgentTblTabOptions = [
  { label: "Servers", value: "server" },
  { label: "Workstations", value: "workstation" },
  { label: "Mixed", value: "mixed" },
];

async function editUserPrefs() {
  try {
    await userStore.updateUserPreferences(state);
    onDialogOK();
  } catch {
    // do nothing
  }
}

onMounted(dashboardStore.getDashInfo);
</script>
