<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 80vw; min-height: 65vh; overflow-x: hidden">
      <q-bar>
        <q-btn class="q-mr-sm" dense flat push icon="refresh" @click="loadCheckHistory" />
        {{ check.readable_desc + " history" }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <div class="row">
        <span v-if="!showChart" class="q-pa-md">No Data</span>
        <q-space />
        <q-select
          v-model="timeFilter"
          emit-value
          map-options
          style="width: 200px"
          :options="timeFilterOptions"
          filled
          dense
          class="q-pr-md q-pt-md"
          @update:model-value="loadCheckHistory"
        />
      </div>
      <apex-chart
        v-if="showChart"
        class="q-pt-md"
        type="line"
        height="70%"
        :options="chartOptions"
        :series="[{ name: seriesName, data: history }]"
      />
    </q-card>
  </q-dialog>
</template>
<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { useDialogPluginComponent, useQuasar } from "quasar";
import { useCheckStore } from "src/stores/api";

const { isLoading, getCheckHistory } = useCheckStore();

// ui imports
import ApexChart from "vue3-apexcharts";

// import types
import type { ApexOptions } from "apexcharts";
import type { Check, CheckHistory } from "../types";

const props = defineProps<{
  check: Check;
}>();

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();
const $q = useQuasar();

let history = [] as CheckHistory[];
const timeFilter = ref(1);

async function loadCheckHistory() {
  if (props.check.check_result)
    history = await getCheckHistory(props.check.check_result?.id, timeFilter.value);
}

const timeFilterOptions = [
  { value: 1, label: "Last 24 Hours" },
  { value: 7, label: "Last 7 Days" },
  { value: 30, label: "Last 30 Days" },
  { value: 0, label: "Everything" },
];

const showChart = computed(() => {
  return !isLoading.value && history.length > 0;
});

const seriesName = computed(() => {
  if (props.check.check_type === "cpuload") return "CPU Load";
  else if (props.check.check_type === "memory") return "Memory Usage";
  else if (props.check.check_type === "diskspace") return "Disk Space Remaining";
  else if (props.check.check_type === "script") return "Script Results";
  else if (props.check.check_type === "eventlog") return "Status";
  else if (props.check.check_type === "winsvc") return "Status";
  else if (props.check.check_type === "ping") return "Status";
  else return "";
});

const chartOptions = computed(() => {
  const baseOptions: ApexOptions = {
    chart: {
      id: "chart2",
      type: "line",
      toolbar: { show: true },
      animations: { enabled: false },
    },
    colors: ["#027BE3"],
    stroke: { width: 3 },
    dataLabels: { enabled: false },
    fill: { opacity: 1 },
    markers: { size: 1 },
    xaxis: {
      type: "datetime",
      labels: { datetimeUTC: false },
    },
    noData: { text: "No Data" },
    theme: {
      mode: $q.dark.isActive ? "dark" : "light",
    },
    tooltip: {
      x: { format: "dd MMM h:mm:ss tt" },
    },
  };

  if (
    props.check.check_type === "cpuload" ||
    props.check.check_type === "memory" ||
    props.check.check_type === "diskspace"
  ) {
    const yaxisAnnotations: YAxisAnnotations[] = [];

    if (props.check.error_threshold) {
      yaxisAnnotations.push({
        y: props.check.error_threshold,
        strokeDashArray: 0,
        borderColor: "#C10015",
        label: { text: "Error Threshold" },
      });
    }
    if (props.check.warning_threshold) {
      yaxisAnnotations.push({
        y: props.check.warning_threshold,
        strokeDashArray: 0,
        borderColor: "#ff9800",
        label: { text: "Warning Threshold" },
      });
    }

    return {
      ...baseOptions,
      annotations: { position: "front", yaxis: yaxisAnnotations },
      yaxis: {
        min: 0,
        max: 100,
        reversed: props.check.check_type === "diskspace",
        labels: { formatter: (val: number) => val + "%" },
      },
    };
  } else {
    return {
      ...baseOptions,
      yaxis: {
        min: -1,
        max: 2,
        tickAmount: 0,
        reversed: true,
        forceNiceScale: true,
        labels: {
          minWidth: 50,
          formatter: (val: number) => {
            if (val === 0) return "Passing";
            if (val === 1) return "Failing";
            return "";
          },
        },
      },
      tooltip: {
        ...baseOptions.tooltip,
        y: {
          title: { formatter: () => "" },
          formatter: (_: never, { dataPointIndex }: { dataPointIndex: number }) => {
            if (!history[dataPointIndex]) return "";
            if (props.check.check_type === "script") {
              const results = history[dataPointIndex].results;
              return `Return Code: ${results.retcode}<br/>Std Out: ${results.stdout}<br/>Err Out: ${results.errout}<br/>Execution Time: ${results.execution_time}`;
            }
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            return String(history[dataPointIndex].results);
          },
        },
      },
    };
  }
});

onMounted(() => {
  void loadCheckHistory();
});
</script>
