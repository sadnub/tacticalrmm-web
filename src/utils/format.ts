import { date } from "quasar";
import { validateTimePeriod } from "src/utils/validation";
import type { CustomField, CustomFieldValue, CustomFieldValueField } from "src/core/settings/types";
import type { Option } from "src/core/dashboard/types";
import { isHeaderOption } from "src/core/dashboard/types";

export function removeEmptyCategories(options: Option[]): Option[] {
  return options.filter((item, index, arr) => {
    if (!isHeaderOption(item)) {
      return true;
    }

    const nextItem = arr[index + 1];
    return nextItem && !isHeaderOption(nextItem);
  });
}

// format data for ui custom field inputs
export function formatCustomFields(
  fields: CustomField[],
  values: Record<string, CustomFieldValueField>,
) {
  const tempArray = [] as CustomFieldValue[];

  for (const field of fields) {
    if (field.type === "multiple") {
      // supposed to be string[]
      tempArray.push({ multiple_value: values[field.name] as string[], field: field.id });
    } else if (field.type === "checkbox") {
      tempArray.push({ bool_value: !!values[field.name], field: field.id });
    } else {
      // supposed to be string
      tempArray.push({ string_value: values[field.name] as string, field: field.id });
    }
  }
  return tempArray;
}

export function formatScriptSyntax(syntax: string) {
  let temp = syntax;
  temp = temp.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  temp = temp
    .replaceAll("&lt;", '<span style="color:#d4d4d4">&lt;</span>')
    .replaceAll("&gt;", '<span style="color:#d4d4d4">&gt;</span>');
  temp = temp
    .replaceAll("[", '<span style="color:#ffd70a">[</span>')
    .replaceAll("]", '<span style="color:#ffd70a">]</span>');
  temp = temp
    .replaceAll("(", '<span style="color:#87cefa">(</span>')
    .replaceAll(")", '<span style="color:#87cefa">)</span>');
  temp = temp
    .replaceAll("{", '<span style="color:#c586b6">{</span>')
    .replaceAll("}", '<span style="color:#c586b6">}</span>');
  temp = temp.replaceAll("\n", "<br />");
  return temp;
}

// date formatting
export function getTimeLapse(unixtime: number) {
  if (date.inferDateFormat(unixtime) === "string") {
    unixtime = parseInt(date.formatDate(unixtime, "X"));
  }
  const previous = unixtime * 1000;
  const current = Date.now();
  const msPerMinute = 60 * 1000;
  const msPerHour = msPerMinute * 60;
  const msPerDay = msPerHour * 24;
  const msPerMonth = msPerDay * 30;
  const msPerYear = msPerDay * 365;
  const elapsed = current - previous;
  if (elapsed < msPerMinute) {
    return Math.round(elapsed / 1000) + " seconds ago";
  } else if (elapsed < msPerHour) {
    return Math.round(elapsed / msPerMinute) + " minutes ago";
  } else if (elapsed < msPerDay) {
    return Math.round(elapsed / msPerHour) + " hours ago";
  } else if (elapsed < msPerMonth) {
    return Math.round(elapsed / msPerDay) + " days ago";
  } else if (elapsed < msPerYear) {
    return Math.round(elapsed / msPerMonth) + " months ago";
  } else {
    return Math.round(elapsed / msPerYear) + " years ago";
  }
}

export function formatDate(dateString: string | number | Date, format = "MMM-DD-YYYY HH:mm") {
  if (!dateString) return "";
  return date.formatDate(dateString, format);
}

export function getNextAgentUpdateTime() {
  const d = new Date();
  let ret;
  if (d.getMinutes() <= 35) {
    ret = d.setMinutes(35);
  } else {
    ret = date.addToDate(d, { hours: 1 });
    ret.setMinutes(35);
  }
  const a = date.formatDate(ret, "MMM D, YYYY");
  const b = date.formatDate(ret, "h:mm A");
  return `${a} at ${b}`;
}

// converts a date with timezone to local for html native datetime fields -> YYYY-MM-DD HH:mm:ss
export function formatDateInputField(isoDateString: string | number, noTimezone = false) {
  if (noTimezone && typeof isoDateString === "string") {
    isoDateString = isoDateString.replace("Z", "");
  }
  return date.formatDate(isoDateString, "YYYY-MM-DDTHH:mm");
}

// converts a local date string "YYYY-MM-DDTHH:mm:ss" to an iso date string with the local timezone
export function formatDateStringwithTimezone(localDateString: string) {
  return date.formatDate(localDateString, "YYYY-MM-DDTHH:mm:ssZ");
}

// string formatting
export function capitalize(string: string) {
  if (string.length > 0) return string[0]!.toUpperCase() + string.substring(1);
  else return string;
}

// turns underscores into spaces and capitalized words
export function formatTableColumnText(text: string) {
  let string = "";
  // split at underscore if exists
  const words = text.split("_");
  words.forEach((word) => (string = string + " " + capitalize(word)));

  return string.trim();
}

export function truncateText(txt: string, chars: number) {
  return txt.length >= chars ? txt.substring(0, chars) + "..." : txt;
}

export function bytes2Human(bytes: number) {
  if (bytes == 0) return "0B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function convertMemoryToPercent(percent: number, memory: number) {
  const mb = memory * 1024;
  return Math.ceil((percent * mb) / 100).toLocaleString();
}

// convert time period(str) to seconds(int) (3h -> 10800) used for comparing time intervals
export function convertPeriodToSeconds(period: string) {
  if (!validateTimePeriod(period)) {
    console.error("Time Period is invalid");
    return 0;
  }

  if (period.toUpperCase().includes("S"))
    // remove last letter from string and return since already in seconds
    return parseInt(period.slice(0, -1));
  else if (period.toUpperCase().includes("M"))
    // remove last letter from string and multiple by 60 to get seconds
    return parseInt(period.slice(0, -1)) * 60;
  else if (period.toUpperCase().includes("H"))
    // remove last letter from string and multiple by 60 twice to get seconds
    return parseInt(period.slice(0, -1)) * 60 * 60;
  else if (period.toUpperCase().includes("D"))
    // remove last letter from string and multiply by 24 and 60 twice to get seconds
    return parseInt(period.slice(0, -1)) * 24 * 60 * 60;

  return 0;
}

// takes an integer and converts it to an array in binary format. i.e: 13 -> [8, 4, 1]
// needed to work with multi-select fields in tasks form
export function convertToBitArray(number: number) {
  const bitArray = [];
  const binary = number.toString(2);
  for (let i = 0; i < binary.length; ++i) {
    if (binary[i] !== "0") {
      // last binary digit
      if (binary.slice(i).length === 1) {
        bitArray.push(1);
      } else {
        bitArray.push(parseInt(binary.slice(i), 2) - parseInt(binary.slice(i + 1), 2));
      }
    }
  }
  return bitArray;
}

// takes an array of integers and adds them together
export function convertFromBitArray(array: number[]) {
  let result = 0;
  for (let i = 0; i < array.length; i++) {
    result += array[i]!;
  }
  return result;
}

export function convertCamelCase(str: string) {
  return str
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
      return index == 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, "");
}

// This will take an object and make a clone of it without including some of the keys
export function copyObjectWithoutKeys<T extends Record<string, unknown>, K extends keyof T>(
  objToCopy: T,
  keysToExclude: Array<K>,
): Omit<T, K> {
  const result: Partial<T> = {};

  Object.keys(objToCopy).forEach((key) => {
    if (!keysToExclude.includes(key as K)) {
      // Use an intermediate variable with a more permissive type
      const safeKey: keyof T = key as keyof T;
      result[safeKey] = objToCopy[safeKey];
    }
  });

  return result as Omit<T, K>;
}
