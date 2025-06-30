<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card style="min-width: 35vw">
      <q-bar>
        Add an Agent
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-form @submit.prevent="submit">
        <q-card-section>
          <Tactical-dropdown
            v-model="agentInstallRequest.site"
            dense
            options-dense
            filled
            map-options
            emit-value
            filterable
            label="Site"
            :options="siteOptions"
          />
        </q-card-section>
        <q-card-section>
          <q-option-group
            v-model="agentInstallRequest.agentOS"
            :options="agentOSOptions"
            inline
            dense
          />
        </q-card-section>
        <q-card-section>
          <q-option-group v-model="agentInstallRequest.agenttype" :options="agentTypeOptions" />
        </q-card-section>
        <q-card-section>
          <q-input
            v-model.number="agentInstallRequest.expires"
            dense
            type="number"
            filled
            label="Token expiration (hours)"
            style="max-width: 200px"
            stack-label
          />
        </q-card-section>
        <q-card-section v-show="agentInstallRequest.agentOS === 'windows'">
          <div class="q-gutter-sm">
            <q-checkbox v-model="agentInstallRequest.rdp" dense label="Enable RDP" />
            <q-checkbox v-model="agentInstallRequest.ping" dense label="Enable Ping">
              <q-tooltip> Enable ICMP echo requests in the local firewall </q-tooltip>
            </q-checkbox>
            <q-checkbox
              v-show="agentInstallRequest.agenttype === 'workstation'"
              v-model="agentInstallRequest.power"
              dense
              label="Disable sleep/hibernate"
            />
          </div>
        </q-card-section>
        <q-card-section>
          Arch
          <div class="q-gutter-sm">
            <q-radio
              v-show="
                agentInstallRequest.agentOS === 'windows' || agentInstallRequest.agentOS === 'linux'
              "
              v-model="agentInstallRequest.goarch"
              :val="GOARCH_AMD64"
              label="64 bit"
            />
            <q-radio
              v-show="agentInstallRequest.agentOS === 'darwin'"
              v-model="agentInstallRequest.goarch"
              :val="GOARCH_AMD64"
              label="Intel 64 bit"
            />
            <q-radio
              v-show="agentInstallRequest.agentOS !== 'darwin'"
              v-model="agentInstallRequest.goarch"
              :val="GOARCH_i386"
              label="32 bit"
            />
            <q-radio
              v-show="agentInstallRequest.agentOS === 'linux'"
              v-model="agentInstallRequest.goarch"
              :val="GOARCH_ARM64"
              label="ARM 64 bit"
            />
            <q-radio
              v-show="agentInstallRequest.agentOS === 'darwin'"
              v-model="agentInstallRequest.goarch"
              :val="GOARCH_ARM64"
              label="Apple Silicon (M-Series)"
            />
            <q-radio
              v-show="agentInstallRequest.agentOS === 'linux'"
              v-model="agentInstallRequest.goarch"
              :val="GOARCH_ARM32"
              label="ARM 32 bit"
            />
          </div>
        </q-card-section>
        <q-card-section v-show="agentInstallRequest.agentOS === 'windows'">
          Installation Method
          <q-option-group
            v-model="agentInstallRequest.installMethod"
            :options="installMethodOptions"
            inline
            dense
          />
        </q-card-section>
        <q-card-actions align="left">
          <q-btn :label="installButtonText" color="primary" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, watch } from "vue";
import { useQuasar, useDialogPluginComponent } from "quasar";
import axios from "axios";
import { isSiteOption, useSiteDropdown } from "src/core/clients/composables";
import { getBaseUrl } from "src/boot/axios";
import { GOARCH_AMD64, GOARCH_i386, GOARCH_ARM64, GOARCH_ARM32 } from "src/constants/constants";

// ui import
import AgentDownload from "./AgentDownload.vue";
import TacticalDropdown from "src/components/ui/TacticalDropdown.vue";

const agentOSOptions = [
  { label: "Windows", value: "windows" },
  { label: "Linux", value: "linux" },
  { label: "MacOS", value: "darwin" },
];

const agentTypeOptions = [
  { label: "Server", value: "server" },
  { label: "Workstation", value: "workstation" },
];

const installMethodOptions = [
  { label: "Dynamically generated exe", value: "exe" },
  { label: "Powershell", value: "powershell" },
  { label: "Manual", value: "manual" },
];

const props = defineProps<{ site?: number }>();

// setup quasar
const $q = useQuasar();
const { dialogRef, onDialogHide } = useDialogPluginComponent();
defineEmits(useDialogPluginComponent.emits);

// setup dropdowns
const { siteOptions } = useSiteDropdown();

const agentInstallRequest = reactive({
  GOARCH_AMD64: GOARCH_AMD64,
  GOARCH_i386: GOARCH_i386,
  GOARCH_ARM64: GOARCH_ARM64,
  GOARCH_ARM32: GOARCH_ARM32,
  client: null,
  site: props.site || null,
  agenttype: "server",
  expires: 24,
  power: false,
  rdp: false,
  ping: false,
  showAgentDownload: false,
  info: {},
  installMethod: "exe",
  goarch: GOARCH_AMD64,
  agentOS: "windows",
  api: getBaseUrl(),
});

watch(
  () => agentInstallRequest.agentOS,
  (newValue) => {
    if (newValue === "windows") {
      agentInstallRequest.goarch = GOARCH_AMD64;
      agentInstallRequest.installMethod = "exe";
    } else if (newValue === "linux") {
      agentInstallRequest.goarch = GOARCH_AMD64;
      agentInstallRequest.installMethod = "bash";
    } else if (newValue === "darwin") {
      agentInstallRequest.goarch = GOARCH_AMD64;
      agentInstallRequest.installMethod = "mac";
    }
  },
);

watch(
  () => agentInstallRequest.agenttype,
  (newValue) => {
    if (newValue === "server") agentInstallRequest.power = false;
  },
);

const client = computed(() => {
  if (siteOptions.value && agentInstallRequest.site) {
    const foundSite = siteOptions.value
      .filter(isSiteOption)
      .find((s) => s.value === agentInstallRequest.site);
    if (foundSite) return { id: foundSite.clientId, name: foundSite.cat };
  }
  return null;
});

const selectedSite = computed(() => {
  if (siteOptions.value && agentInstallRequest.site) {
    const foundSite = siteOptions.value
      .filter(isSiteOption)
      .find((s) => s.value === agentInstallRequest.site);
    if (foundSite) return { id: foundSite.value, name: foundSite.label };
  }
  return null;
});

function submit() {
  if (client.value && selectedSite.value) {
    const clientStripped = client.value.name
      .replace(/\s/g, "")
      .toLowerCase()
      .replace(/([^a-zA-Z0-9]+)/g, "");
    const siteStripped = selectedSite.value.name
      .replace(/\s/g, "")
      .toLowerCase()
      .replace(/([^a-zA-Z0-9]+)/g, "");

    const fileName = `trmm-${clientStripped}-${siteStripped}-${agentInstallRequest.agenttype}-${agentInstallRequest.goarch}.exe`;

    if (
      agentInstallRequest.installMethod === "manual" ||
      agentInstallRequest.installMethod === "mac"
    ) {
      void axios
        .post<{ url: string; cmd: string }>("/agents/installer/", agentInstallRequest)
        .then((r) => {
          $q.dialog({
            component: AgentDownload,
            componentProps: {
              info: {
                expires: agentInstallRequest.expires,
                data: r.data,
                goarch: agentInstallRequest.goarch,
                plat: agentInstallRequest.agentOS,
              },
            },
          });
        });
    } else if (agentInstallRequest.installMethod === "exe") {
      $q.loading.show({ message: "Generating executable..." });

      axios
        .post("/agents/installer/", agentInstallRequest, { responseType: "blob" })
        .then((r) => {
          $q.loading.hide();
          const blob = new Blob([r.data], {
            type: "application/vnd.microsoft.portable-executable",
          });
          const link = document.createElement("a");
          link.href = window.URL.createObjectURL(blob);
          link.download = fileName;
          link.click();
          showDLMessage();
        })
        .catch(() => {
          $q.loading.hide();
        });
    } else if (
      agentInstallRequest.installMethod === "powershell" ||
      agentInstallRequest.installMethod === "bash"
    ) {
      $q.loading.show();
      const ext = agentInstallRequest.installMethod === "powershell" ? "ps1" : "sh";
      const scriptName = `rmm-${clientStripped}-${siteStripped}-${agentInstallRequest.agenttype}.${ext}`;
      axios
        .post("/agents/installer/", agentInstallRequest, { responseType: "blob" })
        .then(({ data }) => {
          $q.loading.hide();
          const blob = new Blob([data], { type: "text/plain" });
          const link = document.createElement("a");
          link.href = window.URL.createObjectURL(blob);
          link.download = scriptName;
          link.click();
          if (agentInstallRequest.installMethod === "powershell") showDLMessage();
        })
        .catch(() => {
          $q.loading.hide();
        });
    }
  }
}
function showDLMessage() {
  if (client.value && selectedSite.value)
    $q.dialog({
      message: `Installer for ${client.value.name}, ${selectedSite.value.name} (${agentInstallRequest.agenttype}) will now be downloaded.
              You may reuse this installer for ${agentInstallRequest.expires} hours before it expires. No command line arguments are needed.`,
    });
}

const installButtonText = computed(() => {
  let text;
  switch (agentInstallRequest.installMethod) {
    case "exe":
      text = "Generate and download exe";
      break;
    case "powershell":
      text = "Download powershell script";
      break;
    case "manual":
      text = "Show manual installation instructions";
      break;
    case "bash":
      text = "Download linux install script";
      break;
    case "mac":
      text = "Show installation instructions";
      break;
  }

  return text;
});
</script>
