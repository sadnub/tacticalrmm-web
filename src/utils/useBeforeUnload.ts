import { watch, onBeforeUnmount, type Ref } from "vue";

export function useBeforeUnload(edited: Ref<boolean>) {
  function handleBeforeUnload(e: BeforeUnloadEvent) {
    e.preventDefault();
  }

  const stopWatch = watch(edited, (hasUnsavedChanges) => {
    if (hasUnsavedChanges) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    } else {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  });

  onBeforeUnmount(() => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
    stopWatch();
  });
}
