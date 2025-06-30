<template>
  <q-select
    dense
    options-dense
    :options="filtered ? filteredOptions : options"
    :model-value="modelValue"
    :map-options="mapOptions"
    :emit-value="mapOptions"
    :multiple="multiple"
    :use-chips="multiple"
    :use-input="filterable"
    :hide-selected="!multiple && (focused || filtered)"
    v-bind="$attrs"
    @update:model-value="(value) => $emit('update:modelValue', value)"
    @[filterEvent]="filterFn"
    @popup-show="focused = true"
    @popup-hide="focused = false"
    @input-value="(value) => (value === '' ? (filtered = false) : (filtered = true))"
    @blur="
      filtered = false;
      focused = false;
    "
  >
    <template v-for="(_, slot) in $slots" #[slot]="scope">
      <slot :name="slot" v-bind="scope || {}" />
    </template>

    <template #option="scope">
      <q-item
        v-if="!scope.opt.category"
        v-bind="scope.itemProps"
        :key="mapOptions ? scope.opt.value : scope.opt"
        class="q-pl-lg"
      >
        <q-item-section>
          <q-item-label>{{ mapOptions ? scope.opt.label : scope.opt }}</q-item-label>
        </q-item-section>
        <q-item-section
          v-if="(filtered && mapOptions && scope.opt.cat) || scope.opt.img_right"
          side
        >
          {{ scope.opt.cat || "" }}
          <img
            v-if="scope.opt.img_right"
            :src="scope.opt.img_right"
            style="height: 20px; max-width: 20px"
          />
        </q-item-section>
      </q-item>
      <q-item-label v-if="scope.opt.category" :key="scope.opt.category" header class="q-pa-sm">{{
        scope.opt.category
      }}</q-item-label>
    </template>
  </q-select>
</template>
<script>
// composition imports
import { ref, computed } from "vue";

export default {
  name: "TacticalDropdown",
  inheritAttrs: false,
  props: {
    modelValue: !String,
    mapOptions: {
      type: Boolean,
      default: false,
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    filterable: {
      type: Boolean,
      default: false,
    },
    options: !Array,
  },
  emits: ["update:modelValue"],
  setup(props) {
    const filtered = ref(false);
    const filteredOptions = ref(props.options);

    function filterFn(val, update) {
      update(() => {
        if (val !== "") {
          const needle = val.toLowerCase();

          if (!props.mapOptions)
            filteredOptions.value = props.options.filter(
              (v) => v.toLowerCase().indexOf(needle) > -1,
            );
          else
            filteredOptions.value = props.options.filter((v) => {
              return !v.category ? v.label.toLowerCase().indexOf(needle) > -1 : false;
            });
        }
      });
    }

    const filterEvent = computed(() => {
      return props.filterable ? "filter" : null;
    });

    const focused = ref(false);

    return {
      filtered,
      filteredOptions,
      filterFn,
      filterEvent,
      focused,
    };
  },
};
</script>
