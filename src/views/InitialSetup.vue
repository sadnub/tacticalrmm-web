<template>
  <div class="q-pa-md">
    <div class="row">
      <div class="col"></div>
      <div class="col">
        <q-card>
          <q-card-actions align="center">
            <q-btn
              label="Getting Started"
              color="info"
              class="full-width"
              href="https://docs.tacticalrmm.com/guide_gettingstarted/"
              target="_blank"
            />
          </q-card-actions>
          <q-card-section class="row items-center">
            <div class="text-h5 text-weight-bold">Initial Setup</div>
          </q-card-section>
          <q-form @submit.prevent="submit">
            <q-card-section>
              <div>Add Client:</div>
              <q-input
                dense
                filled
                v-model="form.client.name"
                :rules="[(val) => !!val || '*Required']"
              >
                <template #prepend>
                  <q-icon name="business" />
                </template>
              </q-input>
            </q-card-section>
            <q-card-section>
              <div>Add Site:</div>
              <q-input
                dense
                filled
                v-model="form.site.name"
                :rules="[(val) => !!val || '*Required']"
              >
                <template #prepend>
                  <q-icon name="apartment" />
                </template>
              </q-input>
            </q-card-section>
            <q-card-section>
              <div>Default timezone for agents:</div>
              <tactical-dropdown
                filterable
                dense
                options-dense
                filled
                v-model="form.timezone"
                :options="coreStore.coreSettings?.all_timezones || []"
              />
            </q-card-section>

            <q-card-section>
              <div>
                Company name:
                <q-icon
                  name="ion-information-circle-outline"
                  size="sm"
                  class="q-ml-sm cursor-pointer"
                >
                  <q-tooltip class="text-caption">
                    Adding your company name here will append it to the user's full name that
                    appears when doing a remote control session, for example: 'John Doe - Amidaware
                    Inc.'
                  </q-tooltip>
                </q-icon>
              </div>

              <q-input dense filled v-model="form.companyname"> </q-input>
            </q-card-section>

            <q-card-actions align="center">
              <q-btn label="Finish" color="primary" class="full-width" type="submit" />
            </q-card-actions>
          </q-form>
        </q-card>
      </div>
      <div class="col"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import { useCoreStore } from "src/core/settings/api";
import { useClientStore } from "src/core/clients/api";

import TacticalDropdown from "src/components/ui/TacticalDropdown.vue";

// setup stores
const coreStore = useCoreStore();
const clientStore = useClientStore();

const router = useRouter();

const form = reactive({
  client: {
    name: "",
  },
  site: {
    name: "",
  },
  timezone: "",
  companyname: "",
  initialsetup: true,
});

function submit() {
  clientStore.addClient(form);
  void router.push({ name: "Dashboard" });
}

onMounted(coreStore.getCoreSettings);
</script>
