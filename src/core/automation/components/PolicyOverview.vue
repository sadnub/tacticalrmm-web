<template>
  <q-dialog ref="dialog" @hide="onHide">
    <q-card class="q-dialog-plugin" style="width: 90vw; max-width: 90vw">
      <q-bar>
        <q-btn class="q-mr-sm" dense flat push icon="refresh" @click="getPolicyTree" />Policy
        Overview
        <q-space />
        <q-btn v-close-popup dense flat icon="close">
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
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
                v-if="!!selectedPolicyId"
                :selected-policy="$refs.tree.getNodeByKey(selectedPolicyId).id"
              />
            </q-tab-panel>
            <q-tab-panel name="tasks">
              <PolicyAutomatedTasksTab
                v-if="!!selectedPolicyId"
                :selected-policy="$refs.tree.getNodeByKey(selectedPolicyId).id"
              />
            </q-tab-panel>
          </q-tab-panels>
        </template>
      </q-splitter>
    </q-card>
  </q-dialog>
</template>

<script>
import PolicyChecksTab from "src/components/automation/PolicyChecksTab.vue";
import PolicyAutomatedTasksTab from "src/components/automation/PolicyAutomatedTasksTab.vue";

export default {
  name: "PolicyOverview",
  components: {
    PolicyAutomatedTasksTab,
    PolicyChecksTab,
  },
  emits: ["hide", "ok", "cancel"],
  data() {
    return {
      splitterModel: 25,
      selectedPolicyId: null,
      selectedTab: "checks",
      clientSiteTree: [],
    };
  },
  mounted() {
    this.getPolicyTree();
  },
  methods: {
    getPolicyTree() {
      this.$q.loading.show();
      this.$axios
        .get("/automation/policies/overview/")
        .then((r) => {
          this.processTreeDataFromApi(r.data);
          this.$q.loading.hide();
        })
        .catch(() => {
          this.$q.loading.hide();
        });
    },
    processTreeDataFromApi(data) {
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

      const result = [];

      // Used by tree for unique identification
      let unique_id = 0;

      for (const client of data) {
        const client_temp = {};

        client_temp["label"] = client.name;
        client_temp["id"] = unique_id;
        client_temp["icon"] = "business";
        client_temp["selectable"] = false;
        client_temp["children"] = [];
        client_temp["key"] = `${unique_id}${client.name}`;

        unique_id--;

        // Add any server policies assigned to client
        if (client.server_policy) {
          let disabled = "";

          // Indicate if the policy is active or not
          if (!client.server_policy.active) {
            disabled = " (disabled)";
          }

          const label = client.server_policy.name + " (Servers)" + disabled;
          client_temp["children"].push({
            label: label,
            icon: "policy",
            id: client.server_policy.id,
            key: `${client.server_policy.id}${label}`,
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
          client_temp["children"].push({
            label: label,
            icon: "policy",
            id: client.workstation_policy.id,
            key: `${client.workstation_policy.id}${label}`,
          });
        }

        // Iterate through Sites
        for (const site of client.sites) {
          const site_temp = {};
          site_temp["label"] = site.name;
          site_temp["id"] = unique_id;
          site_temp["icon"] = "apartment";
          site_temp["selectable"] = false;
          site_temp["key"] = `${unique_id}${site.name}`;

          unique_id--;

          // Add any server policies assigned to site
          if (site.server_policy) {
            site_temp["children"] = [];

            // Indicate if the policy is active or not
            let disabled = "";
            if (!site.server_policy.active) {
              disabled = " (disabled)";
            }

            const label = site.server_policy.name + " (Servers)" + disabled;
            site_temp["children"].push({
              label: label,
              icon: "policy",
              id: site.server_policy.id,
              key: `${site.server_policy.id}${label}`,
            });
          }

          // Add any server policies assigned to site
          if (site.workstation_policy) {
            site_temp["children"] = [];

            // Indicate if the policy is active or not
            let disabled = "";
            if (!site.workstation_policy.active) {
              disabled = " (disabled)";
            }

            const label = site.workstation_policy.name + " (Workstations)" + disabled;
            site_temp["children"].push({
              label: label,
              icon: "policy",
              id: site.workstation_policy.id,
              key: `${site.workstation_policy.id}${label}`,
            });
          }

          // Add Site to Client children array
          client_temp.children.push(site_temp);
        }

        // Add Client and it's Sites to result array
        result.push(client_temp);
      }

      this.clientSiteTree = result;
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
