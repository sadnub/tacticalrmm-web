import { uid } from "quasar";
import type { QTreeFileNode } from "./types";

export function useFileBrowser() {
  function createFileNode(
    name: string,
    path: string,
    size = "0",
    asset_id?: string,
  ): QTreeFileNode {
    return {
      id: uid(),
      label: name,
      path: path,
      type: "file",
      icon: "description",
      asset_id: asset_id,
      size: `${size}b`,
    };
  }

  function createFolderNode(
    name: string,
    path: string,
    icon = "folder",
    color = "yellow-9",
  ): QTreeFileNode {
    return {
      id: uid(),
      label: name,
      path: path,
      type: "folder",
      icon: icon,
      iconColor: color,
      selectable: true,
      lazy: true,
    };
  }

  function getFile(path: string, separator: "/" | "\\" = "/"): string {
    const file = path.split(separator).pop();
    return file ? file : "";
  }

  function getPath(path: string, separator: "/" | "\\" = "/"): string {
    const pathArray = path.split(separator);
    pathArray.pop();
    return pathArray.join(separator);
  }

  return {
    createFolderNode,
    createFileNode,
    getFile,
    getPath,
  };
}

// cached action composable
// used to wrap around store actions to cache a result.
// data can be recaptured using force
interface CacheOptions {
  key: string;
  duration?: number;
}

interface Forceable {
  force?: boolean;
}

interface CacheEntry {
  lastFetch: number;
  lastArgsJson?: string;
}
const cacheStore: Record<string, CacheEntry> = {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useCachedAction<T extends (...args: any[]) => any>(
  action: T,
  options: CacheOptions,
) {
  const { key, duration = 5 * 60_000 } = options;

  return (...rawArgs: [...Parameters<T>, Forceable?]) => {
    const now = Date.now();

    let force = false;
    const last = rawArgs[rawArgs.length - 1] as Forceable | undefined;
    if (last && typeof last === "object" && "force" in last) {
      force = last.force === true;
      rawArgs.pop();
    }

    const argsJson = JSON.stringify(rawArgs);

    const entry = cacheStore[key] || { lastFetch: 0, lastArgsJson: "" };
    const isFresh = now - entry.lastFetch < duration;
    const same = entry.lastArgsJson === argsJson;

    if (!force && entry.lastFetch && isFresh && same) {
      console.log(`[Cache] Hit for "${key}" with args ${argsJson}. Skipping action.`);
      return;
    }

    console.log(`[Cache] Miss for "${key}" with args ${argsJson}. Running action.`);
    action(...(rawArgs as unknown as Parameters<T>));

    cacheStore[key] = { lastFetch: now, lastArgsJson: argsJson };
  };
}
