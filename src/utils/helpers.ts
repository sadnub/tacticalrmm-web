import { copyToClipboard } from "quasar";
import { notifySuccess } from "src/utils/notify";

export function copyOutput(val: string) {
  copyToClipboard(val).then(() => {
    notifySuccess("Copied to clipboard");
  });
}
