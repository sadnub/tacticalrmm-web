<template>
  <q-dialog ref="dialog" @hide="onHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-bar>
        {{ title }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close">
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <q-form @submit="submit">
        <!-- name -->
        <q-card-section>
          <q-input
            v-model="localKey.name"
            label="Name"
            filled
            dense
            :rules="[(val) => !!val || '*Required']"
          />
        </q-card-section>

        <!-- value -->
        <q-card-section>
          <q-input
            v-model="localKey.value"
            label="Value"
            filled
            dense
            :type="isPwd ? 'password' : 'text'"
            :rules="[(val) => !!val || '*Required']"
            ><template #append>
              <q-icon
                :name="isPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isPwd = !isPwd"
              />
            </template>
          </q-input>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancel" />
          <q-btn flat label="Submit" color="primary" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script>
import mixins from "src/mixins/mixins";

export default {
  name: "KeyStoreForm",
  mixins: [mixins],
  props: { globalKey: Object },
  emits: ["hide", "ok", "cancel"],
  data() {
    return {
      isPwd: true,
      localKey: {
        name: "",
        value: "",
      },
    };
  },
  computed: {
    title() {
      return this.editing ? "Edit Global Key" : "Add Global Key";
    },
    editing() {
      return !!this.globalKey;
    },
  },
  mounted() {
    // If pk prop is set that means we are editing
    if (this.globalKey) Object.assign(this.localKey, this.globalKey);
  },
  methods: {
    submit() {
      this.$q.loading.show();

      const data = {
        ...this.localKey,
      };

      if (this.editing) {
        this.$axios
          .put(`/core/keystore/${data.id}/`, data)
          .then(() => {
            this.$q.loading.hide();
            this.onOk();
            this.notifySuccess("Key was edited!");
          })
          .catch(() => {
            this.$q.loading.hide();
          });
      } else {
        this.$axios
          .post("/core/keystore/", data)
          .then(() => {
            this.$q.loading.hide();
            this.onOk();
            this.notifySuccess("Key was added!");
          })
          .catch(() => {
            this.$q.loading.hide();
          });
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
    onOk() {
      this.$emit("ok");
      this.hide();
    },
  },
};
</script>
