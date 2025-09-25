<template>
  <q-dialog ref="dialog" @hide="onHide">
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
          <q-btn v-close-popup dense flat icon="close">
            <q-tooltip class="bg-white text-primary">Close</q-tooltip>
          </q-btn>
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
            <q-table
              v-model:pagination="pagination"
              :table-class="{
                'table-bgcolor': !$q.dark.isActive,
                'table-bgcolor-dark': $q.dark.isActive,
              }"
              class="tabs-tbl-sticky"
              :rows="policies"
              :columns="columns"
              :rows-per-page-options="[0]"
              dense
              row-key="id"
              binary-state-sort
              hide-pagination
              virtual-scroll
              no-data-label="No Policies"
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
                  <!-- enabled checkbox -->
                  <q-td>
                    <q-checkbox
                      v-model="props.row.active"
                      dense
                      @update:model-value="toggleCheckbox(props.row, 'Active')"
                    />
                  </q-td>
                  <!-- enforced checkbox -->
                  <q-td>
                    <q-checkbox
                      v-model="props.row.enforced"
                      dense
                      @update:model-value="toggleCheckbox(props.row, 'Enforced')"
                    />
                  </q-td>
                  <q-td>
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
                  </q-td>
                  <q-td>{{ props.row.desc }}</q-td>
                  <q-td>
                    <span
                      style="cursor: pointer; text-decoration: underline"
                      class="text-primary"
                      @click="showRelations(props.row)"
                      >{{ `Show Relations (${props.row.agents_count})` }}</span
                    >
                  </q-td>
                  <q-td>
                    <span
                      style="cursor: pointer; text-decoration: underline"
                      class="text-primary"
                      @click="showPolicyExclusions(props.row)"
                      >{{
                        `Show Policy Exclusions (${
                          props.row.excluded_agents.length +
                          props.row.excluded_clients.length +
                          props.row.excluded_sites.length
                        })`
                      }}</span
                    >
                  </q-td>
                  <q-td>
                    <span
                      style="cursor: pointer; text-decoration: underline"
                      class="text-primary"
                      @click="showPatchPolicyForm(props.row)"
                      >{{ patchPolicyText(props.row) }}</span
                    >
                  </q-td>
                  <q-td>
                    <span
                      style="cursor: pointer; text-decoration: underline"
                      class="text-primary"
                      @click="showAlertTemplateAdd(props.row)"
                      >{{ alertTemplateText(props.row) }}</span
                    >
                  </q-td>
                  <q-td>
                    <q-icon name="content_copy" size="1.5em" @click="showCopyPolicyForm(props.row)">
                      <q-tooltip>Create a copy of this policy</q-tooltip>
                    </q-icon>
                  </q-td>
                </q-tr>
              </template>
            </q-table>
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

<script>
import DialogWrapper from "src/core/dashboard/ui/DialogWrapper.vue";
import PolicyForm from "./PolicyForm.vue";
import PolicyOverview from "./PolicyOverview.vue";
import RelationsView from "./RelationsView.vue";
import PatchPolicyForm from "./PatchPolicyForm.vue";
import AlertTemplateAdd from "src/core/alerts/components/AlertTemplateAdd.vue";
import PolicyExclusions from "./PolicyExclusions.vue";
import PolicyChecksTab from "./PolicyChecksTab.vue";
import PolicyAutomatedTasksTab from "./PolicyAutomatedTasksTab.vue";

export default {
  name: "AutomationManager",
  components: { PolicyChecksTab, PolicyAutomatedTasksTab },
  emits: ["hide", "ok", "cancel"],
  data() {
    return {
      subtab: "checks",
      policies: [],
      selectedPolicy: null,
      columns: [
        { name: "active", label: "Active", field: "active", align: "left" },
        {
          name: "enforced",
          label: "Enforced",
          field: "enforced",
          align: "left",
        },
        {
          name: "name",
          label: "Name",
          field: "name",
          align: "left",
          sortable: true,
        },
        {
          name: "desc",
          label: "Description",
          field: "desc",
          align: "left",
        },
        {
          name: "relations",
          label: "Relations",
          field: "relations",
          align: "left",
        },
        {
          name: "exclusions",
          label: "Exclusions",
          align: "left",
        },
        {
          name: "winupdatepolicy",
          label: "Patch Policy",
          field: "winupdatepolicy",
          align: "left",
        },
        {
          name: "alert_template",
          label: "Alert Template",
          field: "alert_template",
          align: "left",
        },
        {
          name: "actions",
          label: "Actions",
          field: "actions",
          align: "left",
        },
      ],
      pagination: {
        rowsPerPage: 0,
        sortBy: "name",
        descending: true,
      },
    };
  },
  mounted() {
    this.getPolicies();
  },
  methods: {
    getPolicies() {
      this.$q.loading.show();
      this.$axios
        .get("/automation/policies/")
        .then((r) => {
          this.policies = r.data;
          this.$q.loading.hide();
        })
        .catch(() => {
          this.$q.loading.hide();
        });
    },
    clearRow() {
      this.selectedPolicy = null;
    },
    refresh() {
      this.getPolicies();
      this.clearRow();
    },
    deletePolicy(policy) {
      this.$q
        .dialog({
          title: "Delete policy?",
          cancel: true,
          ok: { label: "Delete", color: "negative" },
        })
        .onOk(() => {
          this.$q.loading.show();
          this.$axios
            .delete(`/automation/policies/${policy.id}/`)
            .then(() => {
              this.refresh();
              this.$q.loading.hide();
              this.notifySuccess("Policy was deleted!");
              this.$store.dispatch("loadTree");
            })
            .catch(() => {
              this.$q.loading.hide();
            });
        });
    },
    showRelations(policy) {
      this.$q.dialog({
        component: RelationsView,
        componentProps: {
          policy: policy,
        },
      });
    },
    showPolicyOverview() {
      this.$q.dialog({
        component: PolicyOverview,
      });
    },
    showAddPolicyForm() {
      this.$q
        .dialog({
          component: PolicyForm,
        })
        .onOk(() => {
          this.refresh();
        });
    },
    showCopyPolicyForm(policy) {
      this.$q
        .dialog({
          component: PolicyForm,
          componentProps: {
            copyPolicy: policy,
          },
        })
        .onOk(() => {
          this.refresh();
        });
    },
    showEditPolicyForm(policy) {
      this.$q
        .dialog({
          component: PolicyForm,
          componentProps: {
            policy: policy,
          },
        })
        .onOk(() => {
          this.refresh();
        });
    },
    showAlertTemplateAdd(policy) {
      this.$q
        .dialog({
          component: AlertTemplateAdd,
          componentProps: {
            type: "policy",
            object: policy,
          },
        })
        .onOk(() => {
          this.refresh();
        });
    },
    showPatchPolicyForm(policy) {
      this.$q
        .dialog({
          component: DialogWrapper,
          componentProps: {
            title: policy.winupdatepolicy.length > 0 ? "Edit Patch Policy" : "Add Patch Policy",
            vuecomponent: PatchPolicyForm,
            componentProps: {
              policy: policy,
            },
          },
        })
        .onOk(() => {
          this.refresh();
        });
    },
    showPolicyExclusions(policy) {
      this.$q
        .dialog({
          component: PolicyExclusions,
          componentProps: {
            policy: policy,
          },
        })
        .onOk(() => {
          this.refresh();
        });
    },
    toggleCheckbox(policy, type) {
      this.$q.loading.show();
      let text = "";

      const data = {
        id: policy.id,
        name: policy.name,
        desc: policy.desc,
      };

      if (type === "Active") {
        text = !policy.active ? "Policy enabled successfully" : "Policy disabled successfully";
        data["active"] = !policy.active;
      } else if (type === "Enforced") {
        text = !policy.enforced ? "Policy enforced successfully" : "Policy enforcement disabled";
        data["enforced"] = !policy.enforced;
      }

      this.$axios
        .put(`/automation/policies/${data.id}/`, data)
        .then(() => {
          this.refresh();
          this.$q.loading.hide();
          this.notifySuccess(text);
        })
        .catch(() => {
          this.$q.loading.hide();
        });
    },
    patchPolicyText(policy) {
      return policy.winupdatepolicy.length > 0 ? "Modify Patch Policy" : "Create Patch Policy";
    },
    alertTemplateText(policy) {
      return policy.alert_template ? "Modify Alert Template" : "Assign Alert Template";
    },
    rowSelectedClass(id, selectedPolicy) {
      if (selectedPolicy && selectedPolicy.id === id)
        return this.$q.dark.isActive ? "highlight-dark" : "highlight";
    },
    show() {
      this.$refs.dialog.show();
    },
    hide() {
      this.$refs.dialog.hide();
    },
    onHide() {
      this.$emit("hide");
    },
  },
};
</script>
