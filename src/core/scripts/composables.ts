import { computed, onMounted } from "vue";
import trmmLogo from "src/assets/trmm_256.png";

import { useScriptStore } from "./api";
import type { Script } from "./types";
import type { AgentPlat } from "src/core/agents/types";
import { type SelectableOption, type HeaderOption, isHeaderOption } from "../dashboard/types";

export interface ScriptSelectableOption extends SelectableOption, Script {}
export type ScriptOption = HeaderOption | ScriptSelectableOption;

const baseUrl = "https://github.com/amidaware/community-scripts/blob/main/scripts/";

export function useScriptDropdown(plat?: AgentPlat) {
  const scriptStore = useScriptStore();

  onMounted(scriptStore.getScripts);

  const scriptOptions = computed(() => formatScriptOptions(scriptStore.scripts));

  const filterByPlatformOptions = computed(() => {
    console.log(scriptOptions.value);
    if (!plat) {
      return scriptOptions.value;
    }

    const filtered = scriptOptions.value.filter((item) => {
      if (isHeaderOption(item)) return true;

      return (
        !item.supported_platforms ||
        item.supported_platforms.length === 0 ||
        item.supported_platforms.includes(plat)
      );
    });

    return removeEmptyCategories(filtered);
  });

  const serverScriptOptions = computed(() => {
    const filtered = scriptOptions.value.filter((item) => {
      if (isHeaderOption(item)) return true;

      return (
        !item.supported_platforms ||
        item.supported_platforms.length === 0 ||
        item.supported_platforms.includes("linux")
      );
    });
    return removeEmptyCategories(filtered);
  });

  const favoriteScriptOptions = computed(() => {
    const filtered = scriptStore.scripts.filter((item) => item.favorite);
    return filtered.map(
      (script) =>
        ({
          label: script.name,
          value: script.id,
          ...script,
        }) as ScriptSelectableOption,
    );
  });

  function getScriptById(id: number) {
    return scriptOptions.value.find(
      (script) => !isHeaderOption(script) && script.id === id,
    ) as ScriptSelectableOption;
  }

  return {
    scriptOptions,
    filterByPlatformOptions,
    serverScriptOptions,
    favoriteScriptOptions,
    isLoading: computed(() => scriptStore.isLoading),
    getScriptById,
  };
}

function removeEmptyCategories(options: ScriptOption[]): ScriptOption[] {
  return options.filter((item, index, arr) => {
    if (!isHeaderOption(item)) {
      return true;
    }

    const nextItem = arr[index + 1];
    return nextItem && !isHeaderOption(nextItem);
  });
}

export function formatScriptOptions(data: Script[]): ScriptOption[] {
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
    const header: HeaderOption = { category: cat, type: "header" };

    const scripts = categoryMap
      .get(cat)!
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(
        (script): ScriptOption => ({
          ...script,
          type: "option",
          label: script.name,
          value: script.id || 0,
          img_right: script.script_type === "builtin" ? trmmLogo : "",
          link: script.script_type === "builtin" ? `${baseUrl}${script.filename}` : undefined,
        }),
      );

    return [header, ...scripts];
  });
}

export const shellOptions = [
  { label: "Powershell", value: "powershell" },
  { label: "Batch", value: "cmd" },
  { label: "Python", value: "python" },
  { label: "Shell", value: "shell" },
  { label: "Nushell", value: "nushell" },
  { label: "Deno", value: "deno" },
];
