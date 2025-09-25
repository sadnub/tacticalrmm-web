<template>
  <div class="row">
    <div class="col-12">
      <q-btn
        v-if="!!selectedPolicy"
        class="q-mr-sm"
        dense
        flat
        push
        icon="refresh"
        @click="getChecks"
      />
      <q-btn-dropdown v-if="!!selectedPolicy" icon="add" label="New" no-caps dense flat>
        <q-list dense style="min-width: 200px">
          <q-item v-close-popup clickable @click="showCheckModal('diskspace')">
            <q-item-section side>
              <q-icon size="xs" name="far fa-hdd" />
            </q-item-section>
            <q-item-section>Disk Space Check</q-item-section>
          </q-item>
          <q-item v-close-popup clickable @click="showCheckModal('ping')">
            <q-item-section side>
              <q-icon size="xs" name="fas fa-network-wired" />
            </q-item-section>
            <q-item-section>Ping Check</q-item-section>
          </q-item>
          <q-item v-close-popup clickable @click="showCheckModal('cpuload')">
            <q-item-section side>
              <q-icon size="xs" name="fas fa-microchip" />
            </q-item-section>
            <q-item-section>CPU Load Check</q-item-section>
          </q-item>
          <q-item v-close-popup clickable @click="showCheckModal('memory')">
            <q-item-section side>
              <q-icon size="xs" name="fas fa-memory" />
            </q-item-section>
            <q-item-section>Memory Check</q-item-section>
          </q-item>
          <q-item v-close-popup clickable @click="showCheckModal('winsvc')">
            <q-item-section side>
              <q-icon size="xs" name="fas fa-cogs" />
            </q-item-section>
            <q-item-section>Windows Service Check</q-item-section>
          </q-item>
          <q-item v-close-popup clickable @click="showCheckModal('script')">
            <q-item-section side>
              <q-icon size="xs" name="fas fa-terminal" />
            </q-item-section>
            <q-item-section>Script Check</q-item-section>
          </q-item>
          <q-item v-close-popup clickable @click="showCheckModal('eventlog')">
            <q-item-section side>
              <q-icon size="xs" name="fas fa-clipboard-list" />
            </q-item-section>
            <q-item-section>Event Log Check</q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>

      <q-table
        v-model:pagination="pagination"
        :table-class="{
          'table-bgcolor': !$q.dark.isActive,
          'table-bgcolor-dark': $q.dark.isActive,
        }"
        class="tabs-tbl-sticky"
        :rows="checks"
        :columns="columns"
        :rows-per-page-options="[0]"
        row-key="id"
        binary-state-sort
        dense
        hide-pagination
        virtual-scroll
      >
        <!-- No data Slot -->
        <template #no-data>
          <div class="full-width row flex-center q-gutter-sm">
            <span v-if="!selectedPolicy">Click on a policy to see the checks</span>
            <span v-else>There are no checks added to this policy</span>
          </div>
        </template>
        <!-- header slots -->
        <template #header-cell-smsalert="props">
          <q-th auto-width :props="props">
            <q-icon name="phone_android" size="1.5em">
              <q-tooltip>SMS Alert</q-tooltip>
            </q-icon>
          </q-th>
        </template>
        <template #header-cell-emailalert="props">
          <q-th auto-width :props="props">
            <q-icon name="email" size="1.5em">
              <q-tooltip>Email Alert</q-tooltip>
            </q-icon>
          </q-th>
        </template>
        <template #header-cell-dashboardalert="props">
          <q-th auto-width :props="props">
            <q-icon name="notifications" size="1.5em">
              <q-tooltip>Dashboard Alert</q-tooltip>
            </q-icon>
          </q-th>
        </template>
        <template #header-cell-statusicon="props">
          <q-th auto-width :props="props"></q-th>
        </template>
        <!-- body slots -->
        <template #body="props">
          <q-tr
            :props="props"
            class="cursor-pointer"
            @dblclick="showCheckModal(props.row.check_type, props.row)"
          >
            <!-- context menu -->
            <q-menu context-menu>
              <q-list dense style="min-width: 200px">
                <q-item
                  v-close-popup
                  clickable
                  @click="showCheckModal(props.row.check_type, props.row)"
                >
                  <q-item-section side>
                    <q-icon name="edit" />
                  </q-item-section>
                  <q-item-section>Edit</q-item-section>
                </q-item>
                <q-item v-close-popup clickable @click="deleteCheck(props.row)">
                  <q-item-section side>
                    <q-icon name="delete" />
                  </q-item-section>
                  <q-item-section>Delete</q-item-section>
                </q-item>

                <q-separator></q-separator>

                <q-item v-close-popup clickable @click="showPolicyStatus(props.row)">
                  <q-item-section side>
                    <q-icon name="sync" />
                  </q-item-section>
                  <q-item-section>Policy Status</q-item-section>
                </q-item>

                <q-separator></q-separator>

                <q-item v-close-popup clickable>
                  <q-item-section>Close</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
            <!-- tds -->
            <q-td>
              <q-checkbox
                v-model="props.row.text_alert"
                dense
                @update:model-value="checkAlert(props.row.id, 'Text', props.row.text_alert)"
              />
            </q-td>
            <q-td>
              <q-checkbox
                v-model="props.row.email_alert"
                dense
                @update:model-value="checkAlert(props.row.id, 'Email', props.row.email_alert)"
              />
            </q-td>
            <q-td>
              <q-checkbox
                v-model="props.row.dashboard_alert"
                dense
                @update:model-value="
                  checkAlert(props.row.id, 'Dashboard', props.row.dashboard_alert)
                "
              />
            </q-td>
            <q-td>{{ props.row.readable_desc }}</q-td>
            <q-td>
              <span
                style="cursor: pointer; text-decoration: underline"
                class="status-cell text-primary"
                @click="showPolicyStatus(props.row)"
                >See Status</span
              >
            </q-td>
            <q-td v-if="props.row.assignedtasks.length > 1"
              >{{ props.row.assignedtasks.length }} Tasks</q-td
            >
            <q-td v-else-if="props.row.assignedtasks.length === 1">{{
              props.row.assignedtasks[0].name
            }}</q-td>
            <q-td v-else></q-td>
          </q-tr>
        </template>
      </q-table>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import PolicyStatus from "./PolicyStatus.vue";
import DiskSpaceCheck from "src/core/checks/components/DiskSpaceCheck.vue";
import PingCheck from "src/core/checks/components/PingCheck.vue";
import CpuLoadCheck from "src/core/checks/components/CpuLoadCheck.vue";
import MemCheck from "src/core/checks/components/MemCheck.vue";
import WinSvcCheck from "src/core/checks/components/WinSvcCheck.vue";
import ScriptCheck from "src/core/checks/components/ScriptCheck.vue";
import EventLogCheck from "src/core/checks/components/EventLogCheck.vue";

export default {
  name: "PolicyChecksTab",
  props: {
    selectedPolicy: !Number,
  },
  data() {
    return {
      checks: [],
      columns: [
        { name: "smsalert", field: "text_alert", align: "left" },
        { name: "emailalert", field: "email_alert", align: "left" },
        { name: "dashboardalert", field: "dashboard_alert", align: "left" },
        {
          name: "desc",
          field: "readable_desc",
          label: "Description",
          align: "left",
          sortable: true,
        },
        { name: "status", label: "Status", field: "status", align: "left" },
        {
          name: "assigned_task",
          label: "Assigned Tasks",
          field: "assigned_task",
          align: "left",
          sortable: true,
        },
      ],
      pagination: {
        rowsPerPage: 0,
        sortBy: "status",
        descending: true,
      },
    };
  },
  watch: {
    selectedPolicy: function (newValue, oldValue) {
      if (newValue !== oldValue) this.getChecks();
    },
  },
  computed: {
    ...mapState(["dash_positive_color", "dash_warning_color"]),
  },
  created() {
    this.getChecks();
  },
  methods: {
    getChecks() {
      this.$q.loading.show();
      this.$axios
        .get(`/automation/policies/${this.selectedPolicy}/checks/`)
        .then((r) => {
          this.checks = r.data;
          this.$q.loading.hide();
        })
        .catch(() => {
          this.$q.loading.hide();
        });
    },
    checkAlert(id, alert_type, action) {
      this.$q.loading.show();
      const data = {};

      if (alert_type === "Email") {
        data.email_alert = !action;
      } else if (alert_type === "Text") {
        data.text_alert = !action;
      } else {
        data.dashboard_alert = !action;
      }

      data.check_alert = true;
      const act = !action ? "enabled" : "disabled";
      const color = !action ? this.dash_positive_color : this.dash_warning_color;
      this.$axios
        .put(`/checks/${id}/`, data)
        .then(() => {
          this.$q.loading.hide();
          this.$q.notify({
            color: color,
            icon: "fas fa-check-circle",
            message: `${alert_type} alerts ${act}`,
          });
        })
        .catch(() => {
          this.$q.loading.hide();
        });
    },
    deleteCheck(check) {
      this.$q
        .dialog({
          title: `Delete ${check.check_type} check?`,
          ok: { label: "Delete", color: "negative" },
          cancel: true,
        })
        .onOk(() => {
          this.$q.loading.show();
          this.$axios
            .delete(`/checks/${check.id}/`)
            .then(() => {
              this.getChecks();
              this.$q.loading.hide();
              this.notifySuccess("Check Deleted!");
            })
            .catch(() => {
              this.$q.loading.hide();
            });
        });
    },
    showPolicyStatus(check) {
      this.$q.dialog({
        component: PolicyStatus,
        componentProps: {
          type: "check",
          item: check,
        },
      });
    },
    showCheckModal(type, check) {
      let component;

      if (type === "diskspace") component = DiskSpaceCheck;
      else if (type === "memory") component = MemCheck;
      else if (type === "cpuload") component = CpuLoadCheck;
      else if (type === "ping") component = PingCheck;
      else if (type === "winsvc") component = WinSvcCheck;
      else if (type === "eventlog") component = EventLogCheck;
      else if (type === "script") component = ScriptCheck;
      else return;

      this.$q
        .dialog({
          component: component,
          componentProps: {
            check: check,
            parent: !check ? { policy: this.selectedPolicy } : undefined,
          },
        })
        .onOk(this.getChecks);
    },
  },
};
</script>
