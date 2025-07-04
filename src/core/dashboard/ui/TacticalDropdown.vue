<template>
  <q-select
    dense
    options-dense
    :options="filtered ? filteredOptions : options"
    :model-value="value"
    :map-options="mapOptions"
    :emit-value="mapOptions"
    :multiple="multiple"
    :use-chips="multiple"
    :use-input="filterable"
    :hide-selected="!multiple && (focused || filtered)"
    v-bind="$attrs"
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
      <!-- option category -->
      <q-item-label
        v-if="isHeaderOption(scope.opt)"
        :key="`header-${scope.opt.category}`"
        header
        class="q-pa-sm"
      >
        {{ scope.opt.category }}
      </q-item-label>

      <!-- normal object option -->
      <q-item
        v-else-if="isSelectableOption(scope.opt)"
        :key="`option-${scope.opt.value}`"
        v-bind="scope.itemProps"
        class="q-pl-lg"
      >
        <q-item-section>
          <q-item-label>{{ scope.opt.label }}</q-item-label>
        </q-item-section>
        <q-item-section v-if="filtered || scope.opt.img_right" side>
          {{ filtered ? scope.opt.category : "" }}
          <img
            v-if="scope.opt.img_right"
            :src="scope.opt.img_right"
            style="height: 20px; max-width: 20px"
          />
        </q-item-section>
      </q-item>

      <!-- string option-->
      <q-item v-else :key="scope.opt" v-bind="scope.itemProps" class="q-pl-lg">
        <q-item-section>
          <q-item-label>{{ scope.opt }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>
<script lang="ts" setup>
// composition imports
import { ref, computed } from "vue";

// type imports
import { type Option, isHeaderOption, isSelectableOption } from "src/core/dashboard/types";

const props = defineProps<{
  options: (Option | string)[];
  mapOptions?: boolean;
  multiple?: boolean;
  filterable?: boolean;
}>();

const value = defineModel<number | string | null>({ required: true });
const filtered = ref(false);
const filteredOptions = ref<(Option | string)[]>(props.options);

function filterFn(val: string, update: (callback: () => void) => void) {
  update(() => {
    if (val === "") {
      filteredOptions.value = props.options;
      return;
    }

    const needle = val.toLowerCase();
    filteredOptions.value = props.options.filter((option) => {
      if (typeof option === "string") {
        return props.mapOptions ? false : option.toLowerCase().indexOf(needle) > -1;
      }

      if (isHeaderOption(option)) {
        return true;
      }

      if (isSelectableOption(option)) {
        return option.label.toLowerCase().indexOf(needle) > -1;
      }
      return false;
    });
  });
}

const filterEvent = computed(() => {
  return props.filterable ? "filter" : null;
});

const focused = ref(false);
</script>
