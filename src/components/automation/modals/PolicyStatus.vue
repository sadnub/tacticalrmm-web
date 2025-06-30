<template>
  <q-dialog ref="dialog" @hide="onHide">
    <q-card class="q-dialog-plugin" style="min-width: 70vw">
      <q-bar>
        <q-btn ref="refresh" class="q-mr-sm" dense flat push icon="refresh" @click="refresh" />
        {{ title.slice(0, 27) }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close">
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <q-card-section>
        <q-table
          v-model:pagination="pagination"
          style="max-height: 35vh"
          :table-class="{
            'table-bgcolor': !$q.dark.isActive,
            'table-bgcolor-dark': $q.dark.isActive,
          }"
          class="tabs-tbl-sticky"
          :rows="data"
          :columns="columns"
          :rows-per-page-options="[0]"
          row-key="id"
          binary-state-sort
          dense
          virtual-scroll
          hide-pagination
          no-data-label="There are no agents in this policy"
        >
          <!-- header slots -->
          <template #header-cell-statusicon="props">
            <q-th auto-width :props="props"></q-th>
          </template>
          <!-- body slots -->
          <template #body="props">
            <q-tr :props="props">
              <!-- tds -->
              <!-- agent hostname -->
              <q-td>{{ props.row.hostname }}</q-td>
              <!-- status icon -->
              <q-td v-if="props.row.status === 'passing'">
                <q-icon style="font-size: 1.3rem" :color="dash_positive_color" name="check_circle">
                  <q-tooltip>Passing</q-tooltip>
                </q-icon>
              </q-td>
              <q-td v-else-if="props.row.status === 'failing'">
                <q-icon
                  v-if="props.row.alert_severity === 'info'"
                  style="font-size: 1.3rem"
                  :color="dash_info_color"
                  name="info"
                >
                  <q-tooltip>Informational</q-tooltip>
                </q-icon>
                <q-icon
                  v-else-if="props.row.alert_severity === 'warning'"
                  style="font-size: 1.3rem"
                  :color="dash_warning_color"
                  name="warning"
                >
                  <q-tooltip>Warning</q-tooltip>
                </q-icon>
                <q-icon v-else style="font-size: 1.3rem" :color="dash_negative_color" name="error">
                  <q-tooltip>Error</q-tooltip>
                </q-icon>
              </q-td>
              <q-td v-else></q-td>
              <!-- status text -->
              <q-td v-if="props.row.status === 'pending'">Awaiting First Synchronization</q-td>
              <q-td v-else-if="props.row.sync_status === 'notsynced'"
                >Will sync on next agent checkin</q-td
              >
              <q-td v-else-if="props.row.sync_status === 'synced'">Synced with agent</q-td>
              <q-td v-else-if="props.row.sync_status === 'pendingdeletion'"
                >Pending deletion on agent</q-td
              >
              <q-td v-else-if="props.row.sync_status === 'initial'"
                >Waiting for task creation on agent</q-td
              >
              <q-td v-else></q-td>
              <!-- more info -->
              <q-td v-if="props.row.check_type === 'ping'">
                <span
                  style="cursor: pointer; text-decoration: underline"
                  class="ping-cell text-primary"
                  @click="pingInfo(props.row)"
                  >output</span
                >
              </q-td>
              <q-td
                v-else-if="
                  props.row.check_type === 'script' ||
                  props.row.retcode ||
                  props.row.stdout ||
                  props.row.stderr
                "
              >
                <span
                  style="cursor: pointer; text-decoration: underline"
                  class="script-cell text-primary"
                  @click="showScriptOutput(props.row)"
                  >output</span
                >
              </q-td>
              <q-td v-else-if="props.row.check_type === 'eventlog'">
                <span
                  style="cursor: pointer; text-decoration: underline"
                  class="eventlog-cell text-primary"
                  @click="showEventInfo(props.row)"
                  >output</span
                >
              </q-td>
              <q-td
                v-else-if="props.row.check_type === 'cpuload' || props.row.check_type === 'memory'"
                >{{ props.row.history_info }}</q-td
              >
              <q-td v-else-if="props.row.more_info">{{ props.row.more_info }}</q-td>
              <q-td v-else>Awaiting Output</q-td>
              <!-- last run -->
              <q-td>{{ props.row.last_run ? formatDate(props.row.last_run) : "Never" }}</q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { computed } from "vue";
import { useStore, mapState } from "vuex";
import ScriptOutput from "src/core/scripts/components/ScriptOutput.vue";
import EventLogCheckOutput from "src/core/checks/components/EventLogCheckOutput.vue";
import PreDialog from "src/components/ui/PreDialog.vue";

export default {
  name: "PolicyStatus",
  props: {
    item: {
      required: true,
      type: Object,
    },
    type: {
      required: true,
      type: String,
      validator: function (value) {
        // The value must match one of these strings
        return ["task", "check"].includes(value);
      },
    },
  },
  emits: ["hide", "ok", "cancel"],
  setup() {
    // setup vuex store
    const store = useStore();
    const formatDate = computed(() => store.getters.formatDate);

    return {
      formatDate,
    };
  },
  data() {
    return {
      data: [],
      columns: [
        {
          name: "agent",
          label: "Hostname",
          field: "agent",
          align: "left",
          sortable: true,
        },
        { name: "statusicon", align: "left" },
        {
          name: "status",
          label: "Status",
          field: "status",
          align: "left",
          sortable: true,
        },
        {
          name: "moreinfo",
          label: "More Info",
          field: "more_info",
          align: "left",
          sortable: true,
        },
        {
          name: "datetime",
          label: "Date / Time",
          field: "last_run",
          align: "left",
          sortable: true,
        },
      ],
      pagination: {
        rowsPerPage: 0,
        sortBy: "status",
        descending: false,
      },
    };
  },
  computed: {
    ...mapState([
      "dash_info_color",
      "dash_positive_color",
      "dash_negative_color",
      "dash_warning_color",
    ]),
    title() {
      return this.item.readable_desc
        ? this.item.readable_desc + " Status"
        : this.item.name + " Status";
    },
  },
  mounted() {
    if (this.type === "task") {
      this.getTaskData();
    } else {
      this.getCheckData();
    }
  },
  methods: {
    getCheckData() {
      this.$q.loading.show();
      this.$axios
        .get(`/automation/checks/${this.item.id}/status/`)
        .then((r) => {
          this.$q.loading.hide();
          this.data = r.data;
        })
        .catch(() => {
          this.$q.loading.hide();
        });
    },
    getTaskData() {
      this.$q.loading.show();
      this.$axios
        .get(`/automation/tasks/${this.item.id}/status/`)
        .then((r) => {
          this.$q.loading.hide();
          this.data = r.data;
        })
        .catch(() => {
          this.$q.loading.hide();
        });
    },
    pingInfo(check) {
      this.$q.dialog({
        component: PreDialog,
        componentProps: {
          title: check.readable_desc,
          dialogStyle: "width: 50vw; max-width: 60vw",
          message: check.more_info,
        },
      });
    },
    showEventInfo(data) {
      this.$q.dialog({
        component: EventLogCheckOutput,
        componentProps: {
          evtLogData: data,
        },
      });
    },
    showScriptOutput(script) {
      this.$q.dialog({
        component: ScriptOutput,
        componentProps: {
          scriptInfo: script,
        },
      });
    },
    refresh() {
      if (this.type === "task") {
        this.getTaskData();
      } else {
        this.getCheckData();
      }
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
