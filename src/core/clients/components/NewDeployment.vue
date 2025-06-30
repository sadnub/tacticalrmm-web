<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card style="width: 40vw">
      <q-bar>
        Add Deployment
        <q-space />
        <q-btn v-close-popup dense flat icon="close">
          <q-tooltip class="bg-white text-primary" />
        </q-btn>
      </q-bar>
      <q-card-section>
        <tactical-dropdown
          v-model="state.site"
          :rules="[(val) => !!val || '*Required']"
          filled
          label="Site"
          :options="siteOptions"
          map-options
          filterable
        />
      </q-card-section>
      <q-card-section>
        <div class="q-pl-sm">Agent Type</div>
        <q-radio
          v-model="state.agenttype"
          val="server"
          label="Server"
          @update:model-value="power = false"
        />
        <q-radio v-model="state.agenttype" val="workstation" label="Workstation" />
      </q-card-section>
      <q-card-section>
        <q-input
          v-model="state.expires"
          type="datetime-local"
          dense
          label="Expiry"
          stack-label
          filled
        />
      </q-card-section>
      <q-card-section class="q-gutter-sm">
        <q-checkbox v-model="state.rdp" dense label="Enable RDP" />
        <q-checkbox v-model="state.ping" dense label="Enable Ping" />
        <q-checkbox
          v-show="state.agenttype === 'workstation'"
          v-model="state.power"
          dense
          label="Disable sleep/hibernate"
        />
      </q-card-section>
      <q-card-section>
        <div class="q-pl-sm">Arch</div>
        <q-radio v-model="state.goarch" :val="GOARCH_AMD64" label="64 bit" />
        <q-radio v-model="state.goarch" :val="GOARCH_i386" label="32 bit" />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn v-close-popup dense flat label="Cancel" />
        <q-btn :loading="loading" dense flat label="Create" color="primary" @click="submit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
// composition imports
import { ref } from "vue";
import { useDialogPluginComponent, date } from "quasar";
import { useSiteDropdown } from "src/composables/clients";
import { saveDeployment } from "src/api/clients";
import { notifySuccess } from "src/utils/notify";
import { formatDateInputField, formatDateStringwithTimezone } from "src/utils/format";
import { GOARCH_AMD64, GOARCH_i386 } from "src/constants/constants";

// ui imports
import TacticalDropdown from "src/components/ui/TacticalDropdown.vue";
export default {
  name: "NewDeployment",
  components: {
    TacticalDropdown,
  },
  emits: [...useDialogPluginComponent.emits],
  setup() {
    // setup quasar dialog
    const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

    // setup site dropdown
    const { siteOptions } = useSiteDropdown(true);

    // add deployment logic
    const state = ref({
      site: null,
      expires: formatDateInputField(date.addToDate(Date.now(), { days: 30 })),
      agenttype: "server",
      power: false,
      rdp: false,
      ping: false,
      goarch: GOARCH_AMD64,
    });

    const loading = ref(false);

    async function submit() {
      loading.value = true;

      const data = {
        ...state.value,
      };

      if (data.expires) data.expires = formatDateStringwithTimezone(data.expires);

      try {
        const result = await saveDeployment(data);
        notifySuccess(result);
        onDialogOK();
      } catch (e) {
        console.error(e);
      }
      loading.value = false;
    }

    return {
      // reactive data
      state,
      loading,
      siteOptions,

      // methods
      submit,

      // quasar dialog
      dialogRef,
      onDialogHide,

      // constants
      GOARCH_AMD64,
      GOARCH_i386,
    };
  },
};
</script>
