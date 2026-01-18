<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 90vw; max-width: 90vw">
      <q-bar>
        <q-btn class="q-mr-sm" dense flat push icon="refresh" @click="getPolicyTree" />Policy
        Overview
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-splitter v-model="splitterModel" style="height: 600px">
        <template #before>
          <div class="q-pa-md">
            <q-tree
              ref="tree"
              v-model:selected="selectedPolicyId"
              :nodes="clientSiteTree"
              node-key="key"
              selected-color="primary"
            ></q-tree>
          </div>
        </template>

        <template #after>
          <q-tabs
            v-model="selectedTab"
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
          <q-tab-panels
            v-model="selectedTab"
            animated
            transition-prev="jump-up"
            transition-next="jump-up"
          >
            <q-tab-panel name="checks">
              <PolicyChecksTab
                v-if="!!selectedPolicyId && tree"
                :selected-policy="tree.getNodeByKey(selectedPolicyId).id"
              />
            </q-tab-panel>
            <q-tab-panel name="tasks">
              <PolicyAutomatedTasksTab
                v-if="!!selectedPolicyId && tree"
                :selected-policy="tree.getNodeByKey(selectedPolicyId).id"
              />
            </q-tab-panel>
          </q-tab-panels>
        </template>
      </q-splitter>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, onMounted, useTemplateRef } from "vue";
import { useDialogPluginComponent, type QTree } from "quasar";
import PolicyChecksTab from "./PolicyChecksTab.vue";
import PolicyAutomatedTasksTab from "./PolicyAutomatedTasksTab.vue";
import { usePolicyStore } from "src/stores/api";

const policyStore = usePolicyStore();
import type { PolicyTreeClient, PolicyTreeItem } from "src/core/automation/types";

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();

// state
const splitterModel = ref(25);
const selectedPolicyId = ref<string | null>(null);
const selectedTab = ref("checks");
const clientSiteTree = ref<PolicyTreeItem[]>([]);
const tree = useTemplateRef<QTree>("tree");

async function getPolicyTree() {
  try {
    const data = await policyStore.getPolicyOverview();
    processTreeDataFromApi(data);
  } catch {
    // Error handling is done in the store
  }
}

function processTreeDataFromApi(data: PolicyTreeClient[]) {
  /* Structure
   * [{
   *   client: Client Name 1,
   *   policy: {
   *     id: 1,
   *     name: "Policy Name 1"
   *   },
   *   sites: [{
   *     name: "Site Name 1",
   *     policy: {
   *       id: 2,
   *       name: "Policy Name 2"
   *     }
   *   }]
   * }]
   */

  const result: PolicyTreeItem[] = [];

  // Used by tree for unique identification
  let unique_id = 0;

  for (const client of data) {
    const client_temp: PolicyTreeItem = {
      label: client.name,
      id: unique_id,
      icon: "business",
      selectable: false,
      children: [],
      key: `${unique_id}${client.name}`,
    };

    unique_id--;

    // Add any server policies assigned to client
    if (client.server_policy) {
      let disabled = "";

      // Indicate if the policy is active or not
      if (!client.server_policy.active) {
        disabled = " (disabled)";
      }

      const label = client.server_policy.name + " (Servers)" + disabled;
      client_temp.children!.push({
        label: label,
        icon: "policy",
        id: client.server_policy.id,
        key: `${client.server_policy.id}${label}`,
        selectable: true,
      });
    }

    // Add any workstation policies assigned to client
    if (client.workstation_policy) {
      let disabled = "";

      // Indicate if the policy is active or not
      if (!client.workstation_policy.active) {
        disabled = " (disabled)";
      }

      const label = client.workstation_policy.name + " (Workstations)" + disabled;
      client_temp.children!.push({
        label: label,
        icon: "policy",
        id: client.workstation_policy.id,
        key: `${client.workstation_policy.id}${label}`,
        selectable: true,
      });
    }

    // Iterate through Sites
    for (const site of client.sites) {
      const site_temp: PolicyTreeItem = {
        label: site.name,
        id: unique_id,
        icon: "apartment",
        selectable: false,
        key: `${unique_id}${site.name}`,
      };

      unique_id--;

      // Add any server policies assigned to site
      if (site.server_policy) {
        site_temp.children = [];

        // Indicate if the policy is active or not
        let disabled = "";
        if (!site.server_policy.active) {
          disabled = " (disabled)";
        }

        const label = site.server_policy.name + " (Servers)" + disabled;
        site_temp.children.push({
          label: label,
          icon: "policy",
          id: site.server_policy.id,
          key: `${site.server_policy.id}${label}`,
          selectable: true,
        });
      }

      // Add any workstation policies assigned to site
      if (site.workstation_policy) {
        if (!site_temp.children) site_temp.children = [];

        // Indicate if the policy is active or not
        let disabled = "";
        if (!site.workstation_policy.active) {
          disabled = " (disabled)";
        }

        const label = site.workstation_policy.name + " (Workstations)" + disabled;
        site_temp.children.push({
          label: label,
          icon: "policy",
          id: site.workstation_policy.id,
          key: `${site.workstation_policy.id}${label}`,
          selectable: true,
        });
      }

      // Add Site to Client children array
      client_temp.children!.push(site_temp);
    }

    // Add Client and it's Sites to result array
    result.push(client_temp);
  }

  clientSiteTree.value = result;
}

onMounted(() => {
  void getPolicyTree();
});
</script>
