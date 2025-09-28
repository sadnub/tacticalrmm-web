import type { MaybeRef } from "vue";
import { computed, onMounted, unref } from "vue";
import { removeEmptyCategories } from "src/utils/format";
import trmmLogo from "src/assets/trmm_256.png";

import { scriptStore } from "src/stores/api";
import type { Script } from "./types";
import type { AgentPlat } from "src/core/agents/types";
import { type SelectableOption, type HeaderOption, isHeaderOption } from "../dashboard/types";

export interface ScriptSelectableOption extends SelectableOption, Script {}
export type ScriptOption = HeaderOption | ScriptSelectableOption;

const baseUrl = "https://github.com/amidaware/community-scripts/blob/main/scripts/";

export function useScriptDropdown(plat?: MaybeRef<AgentPlat | "all">) {
  const { scripts, isLoading } = scriptStore;
  const scriptOptions = computed(() => formatScriptOptions(scripts.value));

  const filterByPlatformOptions = computed(() => {
    const currentPlat = unref(plat);
    if (!currentPlat || currentPlat === "all") {
      return scriptOptions.value;
    }

    const filtered = scriptOptions.value.filter((item) => {
      if (isHeaderOption(item)) return true;

      return (
        !item.supported_platforms ||
        item.supported_platforms.length === 0 ||
        item.supported_platforms.includes(currentPlat)
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
    const filtered = scripts.value.filter((item) => item.favorite);
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

  onMounted(scriptStore.getScripts);

  return {
    scriptOptions,
    filterByPlatformOptions,
    serverScriptOptions,
    favoriteScriptOptions,
    isLoading,
    getScriptById,
  };
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
    const header: HeaderOption = { label: cat, type: "header", value: `header_${cat}` };

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
