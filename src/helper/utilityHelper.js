import { clsx } from "clsx";
import moment from "moment";
import { twMerge } from "tailwind-merge";
import {
  ViewDateTimeFormat,
  DateminFormat,
  ViewDateFormat,
  DateTimeminFormat,
  PaymentStatusEnum,
  ViewTimeOnly,
  TimeFormat,
  DateTime,
  AddHours,
  DateTimeSec,
  ClubPaymentLogTypeEnum,
} from "../const/appConstant";
import Common from "./common";
import toast from "react-hot-toast";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const isLocationMatch = (targetLocation, locationName) => {
  return (
    locationName === targetLocation ||
    locationName.startsWith(`${targetLocation}/`)
  );
};

export const RGBToHex = (r, g, b) => {
  const componentToHex = (c) => {
    const hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  const redHex = componentToHex(r);
  const greenHex = componentToHex(g);
  const blueHex = componentToHex(b);

  return "#" + redHex + greenHex + blueHex;
};

export function hslToHex(hsl) {
  // Remove "hsla(" and ")" from the HSL string
  hsl = hsl.replace("hsla(", "").replace(")", "");

  // Split the HSL string into an array of H, S, and L values
  const [h, s, l] = hsl.split(" ").map((value) => {
    if (value.endsWith("%")) {
      // Remove the "%" sign and parse as a float
      return parseFloat(value.slice(0, -1));
    } else {
      // Parse as an integer
      return parseInt(value);
    }
  });

  // Function to convert HSL to RGB
  function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    // Convert RGB values to integers
    const rInt = Math.round(r * 255);
    const gInt = Math.round(g * 255);
    const bInt = Math.round(b * 255);

    // Convert RGB values to a hex color code
    const rgbToHex = (value) => {
      const hex = value.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${rgbToHex(rInt)}${rgbToHex(gInt)}${rgbToHex(bInt)}`;
  }

  // Call the hslToRgb function and return the hex color code
  return hslToRgb(h, s, l);
}

export const hexToRGB = (hex, alpha) => {
  var r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);

  if (alpha) {
    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
  } else {
    return "rgb(" + r + ", " + g + ", " + b + ")";
  }
};

export const formatTime = (time) => {
  if (!time) return "";

  const date = new Date(time);
  const formattedTime = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // Add this option to display AM/PM
  });

  return formattedTime;
};

// object check
export function isObjectNotEmpty(obj) {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }
  return Object.keys(obj).length > 0;
}

export const formatDate = (date) => {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(date).toLocaleDateString("en-US", options);
};

// random word
export function getWords(inputString) {
  // Remove spaces from the input string
  const stringWithoutSpaces = inputString.replace(/\s/g, "");

  // Extract the first three characters
  return stringWithoutSpaces.substring(0, 3);
}

export const removeUselessValues = (obj) => {
  Object.keys(obj).forEach(
    (key) => (obj[key] === undefined || obj[key] === null) && delete obj[key]
  );
  return obj;
};

export default class Utility {
  static today = moment().format(DateminFormat);

  static todayTime = moment().format(ViewTimeOnly);
  static todayDatetime = moment().format(DateTimeminFormat);

  //convert 2024-12-30T11:00:00 to 30-12-2024 11:00 AM
  static formatDateTime = (dateString) => {
    return moment(dateString).format(ViewDateTimeFormat);
  };

  static checkValidTimeOfDate = (value) => {
    const timePart = moment(value).format(TimeFormat);
    return Common.Utility.CheckTime(timePart);
  };

  static formatNumber = (value) => {
    // Handle null, undefined, or non-numeric values
    if (!value || isNaN(value)) return "0";

    // Convert to absolute number to handle negative values
    const num = Math.abs(value);

    // Convert number to thousands/millions/billions
    if (num >= 1000000000) {
      return (value / 1000000000).toFixed(1) + "b";
    } else if (num >= 1000000) {
      return (value / 1000000).toFixed(1) + "m";
    } else if (num >= 1000) {
      return (value / 1000).toFixed(1) + "k";
    }

    return value.toString();
  };

  static formatTimeToAMPM = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const formattedHour = hours % 12 || 12; // Convert to 12-hour format
    return `${formattedHour}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Utility function to convert to HH:mm format
  static formatTimeToHHMM = (timeString) => {
    const date = new Date(`1970-01-01T${timeString}`);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  static checkPreviousTimeOfDate = (value) => {
    const datePart = moment(value).format(DateminFormat);
    const today = moment().format(DateminFormat);

    if (datePart === today) {
      const timePart = moment(value).format(TimeFormat);
      return Common.Utility.checkTodayTime(timePart);
    }

    return true;
  };

  static checkTodayTime = (value) => {
    const nowTime = moment().format(TimeFormat);
    const inputTime = moment(value, TimeFormat);
    return (
      inputTime.isValid() &&
      inputTime.isSameOrAfter(moment(nowTime, TimeFormat))
    );
  };

  static formatTimeToCSharp = (time) => {
    // Assuming time is in the format "HH:mm" or similar
    if (!time) return time; // Return as is if time is undefined or null
    const date = new Date(`1970-01-01T${time}:00Z`); // Create a date object with time
    return date.toISOString().substr(11, 8); // Extract "HH:mm:ss" part
  };

  static handleBlur = (value, columnName, toaster) => {
    const isValidFormat = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/.test(value);
    const isCustomValid = Common.Utility.CheckTime(value);

    if (!isValidFormat || !isCustomValid) {
      if (toaster)
        toast.error(
          `Invalid time format for ${columnName} should be in 00, 30, or 23:59 format.`
        );
      else
        Common.showToast(
          `Invalid time format for ${columnName} should be in 00, 30, or 23:59 format.`
        );
    }
  };

  static checkPreviousDate = (val, columnName) => {
    const inputDate = moment(val, DateminFormat);
    const todayDate = moment(Common.Utility.today, DateminFormat);

    if (inputDate.isBefore(todayDate, "day")) {
      toast.error(`${columnName} should not be in the past`);
      return false;
    }

    return true;
  };

  //utc date with custom hours
  static GetCurrentDateTime = (Hours) => {
    const utcNow = moment.utc();
    const hoursToAdd = Hours ?? AddHours;
    const date = utcNow.add(hoursToAdd, "hours");
    return date.format(DateTimeSec);
  };

  static ShowOnValidateDateOperation(detail, columnName, op, isAdd, hours = 0) {
    if (!detail || !detail[columnName]) return false;

    const columnDate = moment.utc(`${detail[columnName]}Z`);
    if (!columnDate.isValid()) return false;

    let adjustedDate;

    if (isAdd) {
      adjustedDate = columnDate.clone().add(hours, "hours");
    } else {
      adjustedDate = columnDate.clone().subtract(hours, "hours");
    }

    const currentUtc = moment.utc();
    // const currentUtc = current.add(hours, 'hours');

    switch (op) {
      case ">=":
        return adjustedDate.isSameOrAfter(currentUtc);
      case "<=":
        return adjustedDate.isSameOrBefore(currentUtc);
      case ">":
        return adjustedDate.isAfter(currentUtc);
      case "<":
        return adjustedDate.isBefore(currentUtc);
      case "==":
        return adjustedDate.isSame(currentUtc);
      default:
        return false; // Return false if the comparisonType is invalid
    }
  }

  static CheckTime = (time) => {
    const pattern = /^(0[0-9]|1[0-9]|2[0-3]):(00|30)$/;
    return pattern.test(time) || time === "23:59";
  };

  static CheckTimes = (time) => {
    const patterns = [
      /^(0[0-9]|1[0-9]|2[0-3]):00$/, // Matches HH:00 format
      /^(0[0-9]|1[0-9]|2[0-3]):30$/, // Matches HH:30 format
      /^(0[0-9]|1[0-9]|2[0-3]):50$/, // Matches HH:50 format  //dumy
      /^23:59$/, // Matches 23:59 specifically
    ];
    return patterns.some((pattern) => pattern.test(time));
  };

  static generateShortUniqueId = () => {
    return Math.floor(10000 + Math.random() * 90000).toString(); // Generates a number between 10000 and 99999
  };

  static delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  static getKeyByValue = (object, value) =>
    Object.keys(object)
      .find((key) => object[key] === value)
      ?.replace(/_/g, " ");

  static enumToArray = (enumObj) => {
    return Object.keys(enumObj).map((key) => ({
      id: enumObj[key],
      name: key.replace(/_/g, " "),
    }));
  };

  static getUpdatedArray = (array, id, key, val) => {
    return array.map((item) => {
      if (item.id == id) {
        item[key] = val;
      }
      return item;
    });
  };

  static ConvertTime = (dateString) => {
    if (!dateString) return null;
    return moment(dateString).add(5, "hours").format(ViewDateTimeFormat);
  };

  // Function to convert "HH:mm" to "HH:mm:ss"
  static ConvertToFullTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0);
    const formattedTime = date.toTimeString().split(" ")[0];
    return formattedTime;
  };

  static ConvertDate = (dateString) => {
    if (!dateString) return null;
    return moment(dateString).add(5, "hours").format(ViewDateFormat);
  };

  static handleFileUpload = (files) => {
    return new Promise(async (resolve) => {
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file);
      });

      let response = await Common.ApiService.getInstance().request(
        "UploadFiles",
        formData,
        "POST"
      );

      resolve(response.data);
    });
  };

  static isTokenExpired = (expTimestamp) => {
    debugger;
    let tokenExpiry = new Date(expTimestamp * 1000);
    let currentTime = new Date();
    return currentTime > tokenExpiry;
  };

  static getGroupColor = (group) => {
    const g = group ? group.toUpperCase() : "";
    switch (g) {
      case "A":
        return "text-blue-500";
      case "B":
        return "text-green-500";
      case "C":
        return "text-purple-500";
      case "D":
        return "text-red-500";
      case "E":
        return "text-indigo-500";
      case "F":
        return "text-yellow-500";
      case "G":
        return "text-pink-500";
      case "H":
        return "text-orange-500";
      case "I":
        return "text-teal-500";
      case "J":
        return "text-cyan-500";
      case "K":
        return "text-amber-500";
      case "L":
        return "text-lime-500";
      case "M":
        return "text-emerald-500";
      case "N":
        return "text-fuchsia-500";
      case "O":
        return "text-violet-500";
      case "P":
        return "text-sky-500";
      case "Q":
        return "text-rose-500";
      case "R":
        return "text-gray-500";
      case "S":
        return "text-zinc-500";
      case "T":
        return "text-stone-500";
      case "U":
        return "text-neutral-500";
      case "V":
        return "text-slate-500";
      case "W":
        return "text-blue-400";
      case "X":
        return "text-green-400";
      case "Y":
        return "text-yellow-400";
      case "Z":
        return "text-indigo-400";
      default:
        return "text-gray-500";
    }
  };
}
