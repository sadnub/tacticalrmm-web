import { computed, onMounted } from "vue";
import trmmLogo from "src/assets/trmm_256.png";

import { useScriptStore } from "./api";
import type { Script } from "./types";
import type { AgentPlat } from "src/core/agents/types";

export interface ScriptOption extends Script {
  label: string;
  value: number;
  img_right?: string;
}

export type ScriptHeader = { category: string; header: true };
export type FormattedOption = ScriptOption | ScriptHeader;

export function isScriptOption(item: FormattedOption): item is ScriptOption {
  return !("header" in item);
}

export function useScriptDropdown(plat?: AgentPlat) {
  const scriptStore = useScriptStore();

  onMounted(scriptStore.getScripts);

  const allFormattedOptions = computed(() => formatScriptOptions(scriptStore.scripts));

  const filterByPlatformOptions = computed(() => {
    if (!plat) {
      return allFormattedOptions.value;
    }

    const filtered = allFormattedOptions.value.filter((item) => {
      if (!isScriptOption(item)) return true;

      return (
        !item.supported_platforms ||
        item.supported_platforms.length === 0 ||
        item.supported_platforms.includes(plat)
      );
    });

    return removeEmptyCategories(filtered);
  });

  const serverScriptOptions = computed(() => {
    const filtered = allFormattedOptions.value.filter((item) => {
      if (!isScriptOption(item)) return true;

      return (
        !item.supported_platforms ||
        item.supported_platforms.length === 0 ||
        item.supported_platforms.includes("linux")
      );
    });
    return removeEmptyCategories(filtered);
  });

  return {
    scriptOptions: allFormattedOptions,
    filterByPlatformOptions,
    serverScriptOptions,
    isLoading: computed(() => scriptStore.isLoading),
  };
}

function removeEmptyCategories(options: FormattedOption[]): FormattedOption[] {
  return options.filter((item, index, arr) => {
    if (isScriptOption(item)) {
      return true;
    }

    const nextItem = arr[index + 1];
    return nextItem && isScriptOption(nextItem);
  });
}

export function formatScriptOptions(data: Script[]): FormattedOption[] {
  const categoryMap = new Map<string, Script[]>();

  data.forEach((script) => {
    const category = script.category || "Unassigned";
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(script);
  });

  const sortedCategories = Array.from(categoryMap.keys()).sort((a, b) => {
    if (a === "Unassigned") return 1;
    if (b === "Unassigned") return -1;
    return a.localeCompare(b);
  });

  return sortedCategories.flatMap((cat) => {
    const header: ScriptHeader = { category: cat, header: true };

    const scripts = categoryMap
      .get(cat)!
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(
        (script): ScriptOption => ({
          ...script,
          label: script.name,
          value: script.id,
          img_right: script.script_type === "builtin" ? trmmLogo : "",
        }),
      );

    return [header, ...scripts];
  });
}
