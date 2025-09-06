import moment from "moment";
import {
  setUser,
  getUser,
  clearUser,
  setToken,
  getToken,
  clearToken,
} from "./sessionHelper";
import Utility from "./utilityHelper";
import SweetAlert from "./sweetAlert";
import AppConstant from "../const/appConstant";
import ApiService from "../services/HttpServiceManager";

import showToast from "./toast";

const delay = (milliseconds = 500) =>
  new Promise((res) => setTimeout(res, milliseconds));

export default {
  AppConstant,
  moment,
  ApiService,
  setUser,
  getUser,
  clearUser,
  setToken,
  getToken,
  clearToken,
  Utility,
  delay,
  SweetAlert,
  showToast,
};
