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
        @click="policyChecksStore.getPolicyChecks(selectedPolicy)"
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

      <tactical-table
        v-model:pagination="pagination"
        :rows="checks"
        :columns="columns"
        :rows-per-page-options="[0]"
        row-key="id"
        binary-state-sort
        dense
        hide-pagination
        virtual-scroll
        :loading="isLoading"
        storage-key="policy-checks"
      >
        <!-- No data Slot -->
        <template #no-data>
          <div class="full-width row flex-center q-gutter-sm">
            <span v-if="!selectedPolicy">Click on a policy to see the checks</span>
            <span v-else>There are no checks added to this policy</span>
          </div>
        </template>
        <!-- header slots -->
        <template #header-cell-smsalert="headerProps">
          <q-th auto-width :props="headerProps">
            <q-icon name="phone_android" size="1.5em">
              <q-tooltip>SMS Alert</q-tooltip>
            </q-icon>
          </q-th>
        </template>
        <template #header-cell-emailalert="headerProps">
          <q-th auto-width :props="headerProps">
            <q-icon name="email" size="1.5em">
              <q-tooltip>Email Alert</q-tooltip>
            </q-icon>
          </q-th>
        </template>
        <template #header-cell-dashboardalert="headerProps">
          <q-th auto-width :props="headerProps">
            <q-icon name="notifications" size="1.5em">
              <q-tooltip>Dashboard Alert</q-tooltip>
            </q-icon>
          </q-th>
        </template>
        <template #header-cell-statusicon="headerProps">
          <q-th auto-width :props="headerProps"></q-th>
        </template>
        <!-- body slots -->
        <template #body="bodyProps">
          <q-tr
            :props="bodyProps"
            class="cursor-pointer"
            @dblclick="showCheckModal(bodyProps.row.check_type, bodyProps.row)"
          >
            <!-- context menu -->
            <q-menu context-menu>
              <q-list dense style="min-width: 200px">
                <q-item
                  v-close-popup
                  clickable
                  @click="showCheckModal(bodyProps.row.check_type, bodyProps.row)"
                >
                  <q-item-section side>
                    <q-icon name="edit" />
                  </q-item-section>
                  <q-item-section>Edit</q-item-section>
                </q-item>
                <q-item v-close-popup clickable @click="deleteCheck(bodyProps.row)">
                  <q-item-section side>
                    <q-icon name="delete" />
                  </q-item-section>
                  <q-item-section>Delete</q-item-section>
                </q-item>

                <q-separator></q-separator>

                <q-item v-close-popup clickable @click="showPolicyStatus(bodyProps.row)">
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
            <q-td v-for="col in bodyProps.cols" :key="col.name" :props="bodyProps">
              <!-- sms alert -->
              <template v-if="col.name === 'smsalert'">
                <q-checkbox
                  v-model="bodyProps.row.text_alert"
                  dense
                  @update:model-value="
                    checkAlert(bodyProps.row.id, { text_alert: !bodyProps.row.text_alert })
                  "
                />
              </template>

              <!-- email alert -->
              <template v-else-if="col.name === 'emailalert'">
                <q-checkbox
                  v-model="bodyProps.row.email_alert"
                  dense
                  @update:model-value="
                    checkAlert(bodyProps.row.id, { email_alert: !bodyProps.row.email_alert })
                  "
                />
              </template>

              <!-- dashboard alert -->
              <template v-else-if="col.name === 'dashboardalert'">
                <q-checkbox
                  v-model="bodyProps.row.dashboard_alert"
                  dense
                  @update:model-value="
                    checkAlert(bodyProps.row.id, {
                      dashboard_alert: !bodyProps.row.dashboard_alert,
                    })
                  "
                />
              </template>

              <!-- description -->
              <template v-else-if="col.name === 'desc'">
                {{ bodyProps.row.readable_desc }}
              </template>

              <!-- status -->
              <template v-else-if="col.name === 'status'">
                <span class="status-cell text-primary" @click="showPolicyStatus(bodyProps.row)"
                  >See Status</span
                >
              </template>

              <!-- assigned task -->
              <template v-else-if="col.name === 'assigned_task'">
                <span v-if="bodyProps.row.assignedtasks.length > 1"
                  >{{ bodyProps.row.assignedtasks.length }} Tasks</span
                >
                <span v-else-if="bodyProps.row.assignedtasks.length === 1">{{
                  bodyProps.row.assignedtasks[0].name
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
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, watch, onMounted } from "vue";
import { useQuasar } from "quasar";
import { policyChecksStore } from "src/stores/api";
import PolicyStatus from "./PolicyStatus.vue";
import DiskSpaceCheck from "src/core/checks/components/DiskSpaceCheck.vue";
import PingCheck from "src/core/checks/components/PingCheck.vue";
import CpuLoadCheck from "src/core/checks/components/CpuLoadCheck.vue";
import MemCheck from "src/core/checks/components/MemCheck.vue";
import WinSvcCheck from "src/core/checks/components/WinSvcCheck.vue";
import ScriptCheck from "src/core/checks/components/ScriptCheck.vue";
import EventLogCheck from "src/core/checks/components/EventLogCheck.vue";

// types
import type { Check } from "src/core/checks/types";

const props = defineProps<{
  selectedPolicy: number;
}>();

const $q = useQuasar();

const { policyChecks: checks, isLoading } = policyChecksStore;

const columns = [
  { name: "smsalert", field: "text_alert", align: "left" as const },
  { name: "emailalert", field: "email_alert", align: "left" as const },
  { name: "dashboardalert", field: "dashboard_alert", align: "left" as const },
  {
    name: "desc",
    field: "readable_desc",
    label: "Description",
    align: "left" as const,
    sortable: true,
  },
  { name: "status", label: "Status", field: "status", align: "left" as const },
  {
    name: "assigned_task",
    label: "Assigned Tasks",
    field: "assigned_task",
    align: "left" as const,
    sortable: true,
  },
];
const pagination = reactive({
  rowsPerPage: 0,
  sortBy: "status",
  descending: true,
});

async function checkAlert(id: number, check: Partial<Check>) {
  try {
    await policyChecksStore.updateCheck(id, check);
  } catch {
    // Error handling is done in the store
  }
}

function deleteCheck(check: Check) {
  $q.dialog({
    title: `Delete ${check.check_type} check?`,
    ok: { label: "Delete", color: "negative" },
    cancel: true,
  }).onOk(() => void policyChecksStore.removeCheck(check.id));
}

function showPolicyStatus(check: Check) {
  $q.dialog({
    component: PolicyStatus,
    componentProps: {
      type: "check",
      item: check,
    },
  });
}

function showCheckModal(type: string, check?: Check) {
  let component;

  if (type === "diskspace") component = DiskSpaceCheck;
  else if (type === "memory") component = MemCheck;
  else if (type === "cpuload") component = CpuLoadCheck;
  else if (type === "ping") component = PingCheck;
  else if (type === "winsvc") component = WinSvcCheck;
  else if (type === "eventlog") component = EventLogCheck;
  else if (type === "script") component = ScriptCheck;
  else return;

  $q.dialog({
    component: component,
    componentProps: {
      check: check,
      parent: !check ? { policy: props.selectedPolicy } : undefined,
    },
  });
}

// watchers
watch(
  () => props.selectedPolicy,
  (newValue) => {
    if (newValue) policyChecksStore.getPolicyChecks(newValue);
  },
);

onMounted(() => policyChecksStore.getPolicyChecks(props.selectedPolicy));
</script>
