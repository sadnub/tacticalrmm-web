<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <div class="q-dialog-plugin" style="width: 90vw; max-width: 90vw">
      <q-card>
        <q-bar>
          <q-btn
            ref="refresh"
            class="q-mr-sm"
            dense
            flat
            push
            icon="refresh"
            @click="refresh"
          />Automation Manager
          <q-space />
          <q-btn v-close-popup dense flat icon="close" />
        </q-bar>
        <q-card-section>
          <div class="q-gutter-sm">
            <q-btn
              label="New"
              dense
              flat
              push
              unelevated
              no-caps
              icon="add"
              @click="showAddPolicyForm"
            />
            <q-btn
              label="Policy Overview"
              dense
              flat
              push
              unelevated
              no-caps
              icon="remove_red_eye"
              @click="showPolicyOverview"
            />
          </div>
          <div class="scroll" style="min-height: 35vh; max-height: 35vh">
            <tactical-table
              v-model:pagination="pagination"
              :rows="policies"
              :columns="columns"
              :rows-per-page-options="[0]"
              dense
              row-key="id"
              binary-state-sort
              hide-pagination
              virtual-scroll
              no-data-label="No Policies"
              storage-key="automation-manager"
            >
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
                        @update:model-value="toggleCheckbox(props.row, 'active')"
                      />
                    </template>

                    <!-- enforced -->
                    <template v-else-if="col.name === 'enforced'">
                      <q-checkbox
                        v-model="props.row.enforced"
                        dense
                        @update:model-value="toggleCheckbox(props.row, 'enforced')"
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

                    <!-- actions -->
                    <template v-else-if="col.name === 'actions'">
                      <q-icon
                        name="content_copy"
                        size="1.5em"
                        @click="showCopyPolicyForm(props.row)"
                      >
                        <q-tooltip>Create a copy of this policy</q-tooltip>
                      </q-icon>
                    </template>

                    <!-- default fallback -->
                    <template v-else>
                      {{ col.value }}
                    </template>
                  </q-td>
                </q-tr>
              </template>
            </tactical-table>
          </div>
        </q-card-section>

        <q-card-section>
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
          <q-tab-panels v-model="subtab" :animated="false">
            <q-tab-panel name="checks">
              <div class="scroll" style="min-height: 25vh; max-height: 25vh">
                <PolicyChecksTab v-if="!!selectedPolicy" :selected-policy="selectedPolicy.id" />
              </div>
            </q-tab-panel>
            <q-tab-panel name="tasks">
              <div class="scroll" style="min-height: 25vh; max-height: 25vh">
                <PolicyAutomatedTasksTab
                  v-if="!!selectedPolicy"
                  :selected-policy="selectedPolicy.id"
                />
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>
      </q-card>
    </div>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useQuasar, useDialogPluginComponent } from "quasar";
import { useDashboardStore } from "src/stores/dashboard";
import { policyStore } from "src/stores/api";
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
const dashboardStore = useDashboardStore();

// state
const subtab = ref("checks");
const selectedPolicy = ref<Policy | null>(null);
const policies = computed(() => policyStore.policies.value);
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
  {
    name: "actions",
    label: "Actions",
    field: "actions",
    align: "left" as const,
  },
];
const pagination = reactive({
  rowsPerPage: 0,
  sortBy: "name",
  descending: true,
});

function clearRow() {
  selectedPolicy.value = null;
}

function refresh() {
  policyStore.getPolicies({ force: true });
  clearRow();
}

function deletePolicy(policy: Policy) {
  $q.dialog({
    title: "Delete policy?",
    cancel: true,
    ok: { label: "Delete", color: "negative" },
  }).onOk(() => {
    void policyStore.removePolicy(policy.id);
    clearRow();
    dashboardStore.refreshDashboard();
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
      componentProps: {
        policy: policy,
      },
    },
  }).onOk(() => {
    clearRow();
  });
}

function showPolicyExclusions(policy: Policy) {
  $q.dialog({
    component: PolicyExclusions,
    componentProps: {
      policy: policy,
    },
  }).onOk(() => {
    clearRow();
  });
}

async function toggleCheckbox(policy: Policy, type: "active" | "enforced") {
  try {
    await policyStore.updatePolicy(policy.id, { [type]: !policy[type] });
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
  policyStore.getPolicies();
});
</script>
