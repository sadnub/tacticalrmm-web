<template>
  <q-dialog ref="dialogRef" maximized @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-bar>
        <q-btn class="q-mr-sm" dense flat push icon="refresh" @click="refresh" />Automation Manager
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-splitter
        v-model="splitterModel"
        horizontal
        style="height: calc(100vh - 32px)"
      >
        <template #before>
      <tactical-table
        v-model:pagination="pagination"
        :rows="policiesList"
        :columns="columns"
        :rows-per-page-options="[0]"
        style="height: 100%"
        dense
        row-key="id"
        binary-state-sort
        virtual-scroll
        column-select
        :filter="filter"
        no-data-label="No Policies"
        storage-key="automation-manager"
      >
        <template #top>
          <q-btn
            icon="add"
            label="Add Policy"
            no-caps
            dense
            flat
            push
            class="q-mr-sm"
            @click="showAddPolicyForm"
          />
          <q-btn
            icon="remove_red_eye"
            label="Policy Overview"
            no-caps
            dense
            flat
            push
            @click="showPolicyOverview"
          />
          <q-space />
          <q-input
            ref="searchInputRef"
            v-model="filter"
            filled
            label="Search"
            dense
            clearable
            class="q-pr-sm"
            style="width: 300px"
            @keydown.esc.stop="filter = ''"
          >
            <template #prepend>
              <q-icon name="search" color="primary" />
            </template>
          </q-input>
          <tactical-table-export />
        </template>

        <!-- header slots -->
        <template #header-cell-active="props">
          <q-th :props="props" auto-width>
            <q-icon name="power_settings_new" size="1.5em">
              <q-tooltip>Enable Policy</q-tooltip>
            </q-icon>
          </q-th>
        </template>

        <template #header-cell-enforced="props">
          <q-th :props="props" auto-width>
            <q-icon name="security" size="1.5em">
              <q-tooltip>Enforce Policy (Will override Agent tasks/checks)</q-tooltip>
            </q-icon>
          </q-th>
        </template>

        <!-- body slots -->
        <template #body="props">
          <q-tr
            :props="props"
            class="cursor-pointer"
            :class="rowSelectedClass(props.row.id, selectedPolicy)"
            @click="selectedPolicy = props.row"
            @contextmenu="selectedPolicy = props.row"
            @dblclick="showEditPolicyForm(props.row)"
          >
            <!-- context menu -->
            <q-menu context-menu>
              <q-list dense style="min-width: 200px">
                <q-item v-close-popup clickable @click="showEditPolicyForm(props.row)">
                  <q-item-section side>
                    <q-icon name="edit" />
                  </q-item-section>
                  <q-item-section>Edit</q-item-section>
                </q-item>

                <q-item v-close-popup clickable @click="showCopyPolicyForm(props.row)">
                  <q-item-section side>
                    <q-icon name="content_copy" />
                  </q-item-section>
                  <q-item-section>Copy</q-item-section>
                </q-item>

                <q-item v-close-popup clickable @click="deletePolicy(props.row)">
                  <q-item-section side>
                    <q-icon name="delete" />
                  </q-item-section>
                  <q-item-section>Delete</q-item-section>
                </q-item>

                <q-separator></q-separator>

                <q-item v-close-popup clickable @click="showRelations(props.row)">
                  <q-item-section side>
                    <q-icon name="account_tree" />
                  </q-item-section>
                  <q-item-section>Show Relations</q-item-section>
                </q-item>

                <q-item v-close-popup clickable @click="showPolicyExclusions(props.row)">
                  <q-item-section side>
                    <q-icon name="rule" />
                  </q-item-section>
                  <q-item-section>Policy Exclusions</q-item-section>
                </q-item>

                <q-item v-close-popup clickable @click="showPatchPolicyForm(props.row)">
                  <q-item-section side>
                    <q-icon name="system_update" />
                  </q-item-section>
                  <q-item-section>{{ patchPolicyText(props.row) }}</q-item-section>
                </q-item>

                <q-item v-close-popup clickable @click="showAlertTemplateAdd(props.row)">
                  <q-item-section side>
                    <q-icon name="warning" />
                  </q-item-section>
                  <q-item-section>{{ alertTemplateText(props.row) }}</q-item-section>
                </q-item>

                <q-separator></q-separator>

                <q-item v-close-popup clickable>
                  <q-item-section>Close</q-item-section>
                </q-item>
              </q-list>
            </q-menu>

            <q-td v-for="col in props.cols" :key="col.name" :props="props">
              <!-- active -->
              <template v-if="col.name === 'active'">
                <q-checkbox
                  v-model="props.row.active"
                  dense
                  @update:model-value="(val) => toggleCheckbox(props.row, 'active', val)"
                />
              </template>

              <!-- enforced -->
              <template v-else-if="col.name === 'enforced'">
                <q-checkbox
                  v-model="props.row.enforced"
                  dense
                  @update:model-value="(val) => toggleCheckbox(props.row, 'enforced', val)"
                />
              </template>

              <!-- name -->
              <template v-else-if="col.name === 'name'">
                {{ props.row.name }}
                <q-chip
                  v-if="props.row.default_server_policy"
                  color="primary"
                  text-color="white"
                  size="sm"
                  >Default Server</q-chip
                >
                <q-chip
                  v-if="props.row.default_workstation_policy"
                  color="primary"
                  text-color="white"
                  size="sm"
                  >Default Workstation</q-chip
                >
              </template>

              <!-- desc -->
              <template v-else-if="col.name === 'desc'">
                {{ props.row.desc }}
              </template>

              <!-- relations -->
              <template v-else-if="col.name === 'relations'">
                <span class="text-primary" @click="showRelations(props.row)">{{
                  `Show Relations (${props.row.agents_count})`
                }}</span>
              </template>

              <!-- exclusions -->
              <template v-else-if="col.name === 'exclusions'">
                <span class="text-primary" @click="showPolicyExclusions(props.row)">{{
                  `Show Policy Exclusions (${
                    props.row.excluded_agents.length +
                    props.row.excluded_clients.length +
                    props.row.excluded_sites.length
                  })`
                }}</span>
              </template>

              <!-- winupdatepolicy -->
              <template v-else-if="col.name === 'winupdatepolicy'">
                <span class="text-primary" @click="showPatchPolicyForm(props.row)">{{
                  patchPolicyText(props.row)
                }}</span>
              </template>

              <!-- alert_template -->
              <template v-else-if="col.name === 'alert_template'">
                <span class="text-primary" @click="showAlertTemplateAdd(props.row)">{{
                  alertTemplateText(props.row)
                }}</span>
              </template>

              <!-- default fallback -->
              <template v-else>
                {{ col.value }}
              </template>
            </q-td>
          </q-tr>
        </template>
      </tactical-table>
        </template>

        <template #separator>
          <q-avatar color="primary" text-color="white" size="20px" icon="drag_indicator" />
        </template>

        <template #after>
          <q-tabs
            v-model="subtab"
            dense
            inline-label
            class="text-grey"
            active-color="primary"
            indicator-color="primary"
            align="left"
            narrow-indicator
            no-caps
          >
            <q-tab name="checks" icon="fas fa-check-double" label="Checks" />
            <q-tab name="tasks" icon="fas fa-tasks" label="Tasks" />
          </q-tabs>
          <q-separator />
          <q-tab-panels v-model="subtab" :animated="false" class="q-pa-none">
            <q-tab-panel name="checks" class="q-pa-none">
              <PolicyChecksTab
                v-if="!!selectedPolicy"
                :selected-policy="selectedPolicy.id"
                style="height: 100%"
              />
              <div v-else class="row justify-center items-center text-grey-6">
                Select a policy above to view checks
              </div>
            </q-tab-panel>
            <q-tab-panel name="tasks" class="q-pa-none">
              <PolicyAutomatedTasksTab
                v-if="!!selectedPolicy"
                :selected-policy="selectedPolicy.id"
                style="height: 100%"
              />
              <div v-else class="row justify-center items-center text-grey-6">
                Select a policy above to view tasks
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </template>
      </q-splitter>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useQuasar, useDialogPluginComponent, QInput } from "quasar";
import { useStorage } from "@vueuse/core";
import { usePolicyStore, useDashboardStore } from "src/stores/api";
import DialogWrapper from "src/core/dashboard/ui/DialogWrapper.vue";
import PolicyForm from "./PolicyForm.vue";
import PolicyOverview from "./PolicyOverview.vue";
import RelationsView from "./RelationsView.vue";
import PatchPolicyForm from "./PatchPolicyForm.vue";
import AlertTemplateAdd from "src/core/alerts/components/AlertTemplateAdd.vue";
import PolicyExclusions from "./PolicyExclusions.vue";
import PolicyChecksTab from "./PolicyChecksTab.vue";
import PolicyAutomatedTasksTab from "./PolicyAutomatedTasksTab.vue";
import type { Policy } from "src/core/automation/types";

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();
const $q = useQuasar();

const { policies, getPolicies, removePolicy, updatePolicy } = usePolicyStore();
const { refreshDashboard } = useDashboardStore();

// state
const splitterModel = useStorage("automation-manager-splitter", 50);
const subtab = ref("checks");
const selectedPolicy = ref<Policy | null>(null);
const searchInputRef = ref<InstanceType<typeof QInput> | null>(null);

function onGlobalKeydown(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === "f") {
    const el = dialogRef.value?.$el as HTMLElement | undefined;
    if (el && !el.contains(document.activeElement)) return;
    e.preventDefault();
    searchInputRef.value?.focus();
  }
}

onUnmounted(() => {
  window.removeEventListener("keydown", onGlobalKeydown);
});
const policiesList = computed(() => policies.value);
const columns = [
  { name: "active", label: "Active", field: "active", align: "left" as const },
  {
    name: "enforced",
    label: "Enforced",
    field: "enforced",
    align: "left" as const,
  },
  {
    name: "name",
    label: "Name",
    field: "name",
    align: "left" as const,
    sortable: true,
  },
  {
    name: "desc",
    label: "Description",
    field: "desc",
    align: "left" as const,
  },
  {
    name: "relations",
    label: "Relations",
    field: "relations",
    align: "left" as const,
  },
  {
    name: "exclusions",
    label: "Exclusions",
    field: "exclusions",
    align: "left" as const,
  },
  {
    name: "winupdatepolicy",
    label: "Patch Policy",
    field: "winupdatepolicy",
    align: "left" as const,
  },
  {
    name: "alert_template",
    label: "Alert Template",
    field: "alert_template",
    align: "left" as const,
  },
];
const pagination = useStorage("automation-manager-pagination", {
  rowsPerPage: 0,
  sortBy: "name",
  descending: true,
});
const filter = ref("");

function clearRow() {
  selectedPolicy.value = null;
}

function refresh() {
  getPolicies({ force: true });
  clearRow();
}

function deletePolicy(policy: Policy) {
  $q.dialog({
    title: "Delete policy?",
    cancel: true,
    ok: { label: "Delete", color: "negative" },
  }).onOk(() => {
    void removePolicy(policy.id);
    clearRow();
    refreshDashboard();
  });
}

function showRelations(policy: Policy) {
  $q.dialog({
    component: RelationsView,
    componentProps: {
      policy: policy,
    },
  });
}

function showPolicyOverview() {
  $q.dialog({
    component: PolicyOverview,
  });
}

function showAddPolicyForm() {
  $q.dialog({
    component: PolicyForm,
  }).onOk(() => {
    clearRow();
  });
}

function showCopyPolicyForm(policy: Policy) {
  $q.dialog({
    component: PolicyForm,
    componentProps: {
      copyPolicy: policy,
    },
  }).onOk(() => {
    clearRow();
  });
}

function showEditPolicyForm(policy: Policy) {
  $q.dialog({
    component: PolicyForm,
    componentProps: {
      policy: policy,
    },
  }).onOk(() => {
    clearRow();
  });
}

function showAlertTemplateAdd(policy: Policy) {
  $q.dialog({
    component: AlertTemplateAdd,
    componentProps: {
      type: "policy",
      object: policy,
    },
  }).onOk(() => {
    clearRow();
  });
}

function showPatchPolicyForm(policy: Policy) {
  $q.dialog({
    component: DialogWrapper,
    componentProps: {
      title:
        policy.winupdatepolicy && policy.winupdatepolicy.length > 0
          ? "Edit Patch Policy"
          : "Add Patch Policy",
      vuecomponent: PatchPolicyForm,
      width: "50vw",
      componentProps: {
        policy: policy,
      },
    },
  });
}

function showPolicyExclusions(policy: Policy) {
  $q.dialog({
    component: PolicyExclusions,
    componentProps: {
      policy: policy,
    },
  });
}

async function toggleCheckbox(policy: Policy, type: "active" | "enforced", newValue: boolean) {
  try {
    await updatePolicy(policy.id, { [type]: newValue });
  } catch {
    // Error handling is done in the store
  }
}

function patchPolicyText(policy: Policy) {
  return policy.winupdatepolicy && policy.winupdatepolicy.length > 0
    ? "Modify Patch Policy"
    : "Create Patch Policy";
}

function alertTemplateText(policy: Policy) {
  return policy.alert_template ? "Modify Alert Template" : "Assign Alert Template";
}

function rowSelectedClass(id: number, selectedPolicy: Policy | null) {
  if (selectedPolicy && selectedPolicy.id === id)
    return $q.dark.isActive ? "highlight-dark" : "highlight";
}

onMounted(() => {
  getPolicies();
  window.addEventListener("keydown", onGlobalKeydown);
});
</script>
