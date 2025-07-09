<template>
  <q-select
    v-model="value"
    dense
    options-dense
    :options="displayedOptions"
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
      <q-item
        :key="scope.opt.value"
        v-bind="scope.itemProps"
        dense
        :clickable="scope.opt.type === 'option'"
        :class="{ 'q-pl-lg': scope.opt.type === 'option' }"
      >
        <q-item-section v-if="isHeaderOption(scope.opt)">
          <q-item-label class="text-subtitle1 text-grey-8">
            {{ scope.opt.label }}
          </q-item-label>
        </q-item-section>

        <!-- normal object option -->
        <template v-else-if="isSelectableOption(scope.opt) || typeof scope.opt === 'object'">
          <q-item-section>
            <q-item-label>{{ scope.opt.label }}</q-item-label>
          </q-item-section>
          <q-item-section v-if="scope.opt.img_right" side>
            <img
              v-if="scope.opt.img_right"
              :src="scope.opt.img_right"
              style="height: 20px; max-width: 20px"
            />
          </q-item-section>
        </template>

        <!-- string option-->
        <q-item-section v-else>
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
import { type QSelect } from "quasar";

const props = defineProps<{
  options?: (Option | string)[];
  mapOptions?: boolean;
  multiple?: boolean;
  filterable?: boolean;
}>();

const value = defineModel<number | string | string[] | null>({ required: true });
const filtered = ref(false);
const focused = ref(false);
const displayedOptions = ref<(Option | string)[] | undefined>(props.options);

function filterFn(val: string, update: (callback: () => void) => void) {
  update(() => {
    if (val === "") {
      displayedOptions.value = props.options;
      return;
    }

    const needle = val.toLowerCase();
    const tempOptions = props.options?.filter((option) => {
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

    displayedOptions.value = tempOptions?.filter((option, index, arr) => {
      if (typeof option === "string" || isSelectableOption(option)) {
        return true;
      }

      // check the next item in the array.
      const nextItem = arr[index + 1];

      const isOrphan = !nextItem || (typeof nextItem !== "string" && !isSelectableOption(nextItem));

      return !isOrphan;
    });
  });
}

const filterEvent = computed(() => {
  return props.filterable ? "filter" : null;
});
</script>
