import axios from "axios";
import toast from "react-hot-toast";
import { loader } from "react-global-loader";
import Cookies from "js-cookie";
import AppConstant, {
  ResultStatus,
  CustomTimeoutUrlEnum,
} from "../const/appConstant";
import { removeUselessValues } from "../helper/utilityHelper";
import common from "../helper/common";

class HttpServiceManager {
  log = console.log;

  static errorcounter = 0;
  static myInstance = null;
  axiosInstance = null;
  userToken = "";

  static url = AppConstant.serviceUrl;

  static getInstance() {
    if (HttpServiceManager.myInstance == null) {
      HttpServiceManager.myInstance = new HttpServiceManager();
      HttpServiceManager.myInstance.initialize(HttpServiceManager.url);
    }
    return HttpServiceManager.myInstance;
  }

  initialize(baseURL, authHeader) {
    this.axiosInstance = axios.create({
      baseURL: baseURL,
      timeout: 60000,
      headers: authHeader,
      timeoutErrorMessage:
        "Request Timeout, Please check your network connection",
    });

    //this.axiosInstance.interceptors.request.use(
    //  (config) => {
    //    let token = Cookies.get("token");
    //    if (token != null) config.headers.Authorization = `Bearer ${token}`;
    //    return config;
    //  },
    //  (error) => {
    //    log("header Config err:", error);
    //    return Promise.reject(error);
    //  }
    //  );
    debugger;
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // debugger;
        let token = Cookies.get("token");
        // let currentPath = window.location.pathname.toLowerCase(); // Normalize path

        // if (!token && currentPath !== "/login") {
        //   redirectToLogin();
        //   return Promise.reject(
        //     "User not authenticated. Redirecting to login."
        //   );
        // }

        // if (token && currentPath !== "/login") {
        //   //try {
        //   let payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT
        //   if (common.Utility.isTokenExpired(payload.exp)) {
        //     redirectToLogin();
        //     return Promise.reject("Token expired. Redirecting to login.");
        //   }
        //   //} catch (e) {
        //   //    redirectToLogin();
        //   //    return Promise.reject("Invalid token. Redirecting to login.");
        //   // }
        // }

        config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => {
        this.log("header Config err:", error);
        return Promise.reject(error);
      }
    );

    // function redirectToLogin() {
    //   common.clearUser();
    //   common.clearToken();
    //   window.location.href = "/login";
    // }

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        this.log("HttpServiceManager_res_err", error);
        this.log(error.response.data);
        HttpServiceManager.customcheckError(error, true);
        return Promise.reject(error);
      }
    );
  }

  getRequestObject(requestName, parameters, method) {
    if (this.axiosInstance !== null) {
      return this.axiosInstance.request({
        method: method,
        url: requestName,
        params: parameters,
      });
    } else {
      console.warn(
        'HttpServiceManager method "initialize" is not called, call it in App.js componentDidMount'
      );
      return {};
    }
  }

  request(
    requestName,
    parameters,
    method = "Get",
    showLoader = true,
    showMessage = true
  ) {
    let axiosInstance = HttpServiceManager.getInstance().axiosInstance;
    if (axiosInstance !== null) {
      if (showLoader) {
        loader.show();
      }
      return new Promise((resolve, reject) => {
        /* let customTimeout = requestName.includes(CustomTimeoutUrlEnum.SendPushNotificationToUsers) ? 0 : 60000;*/

        let customTimeout = Object.values(CustomTimeoutUrlEnum).includes(
          requestName
        )
          ? 0
          : 60000;

        const reqParam = {
          method: method,
          url: requestName,
          data:
            parameters instanceof FormData || !parameters
              ? parameters
              : removeUselessValues(parameters),
          timeout: customTimeout,
        };

        this.log(
          "--------------------------------------------------------------------------------------",
          "\n- REQUEST : ",
          reqParam,
          "\n--------------------------------------------------------------------------------------"
        );

        axiosInstance
          .request(reqParam)
          .then((response) => {
            this.log(
              "--------------------------------------------------------------------------------------",
              "\n- RESPONSE123 : ",
              response.data,
              "\n--------------------------------------------------------------------------------------"
            );
            if (response.data.status == ResultStatus.Success) {
              resolve(response.data);
            } else if (
              response.data.status == ResultStatus.Error ||
              response.data.status == ResultStatus.NotFound ||
              response.data.status == ResultStatus.Unauthorized
            ) {
              resolve(
                HttpServiceManager.customcheckError(response, showMessage)
              );

              if (response.data.status == ResultStatus.Unauthorized) {
                common.clearUser();
                common.clearToken();
                window.location.href = "/404";
              }
            }

            if (showLoader) {
              loader.hide();
              // setTimeout(() => loader.hide(), 20000);
            }
          })
          .catch((error) => {
            this.log("API Error", error);
            debugger;
            resolve(HttpServiceManager.customcheckError(error, showMessage));
            if (showLoader) {
              loader.hide();
            }
          });
      });
    } else {
      console.warn(
        'HttpServiceManager method "initialize" is not called, call it in App.js componentDidMount'
      );

      if (showLoader) {
        loader.hide();
      }
      return Promise.reject("HttpServiceManager not initialized");
    }
  }

  static customcheckError(response, showMessage) {
    HttpServiceManager.getInstance().log(
      "--------------------------------------------------------------------------------------",
      "\n-CUSTOM ERROR : ",
      response,
      "\n--------------------------------------------------------------------------------------"
    );
    let error = response?.data?.message;
    if (showMessage && error) {
      toast.error(error);
    } else if (
      /*this.errorcounter == 0 && */ response.message &&
      (response.message === "Network Error" ||
        response.status == 500 ||
        response.message.includes("timeout"))
    ) {
      // this.errorcounter++;
      common.SweetAlert.poorconnectivety("No Internet Connection");
    }
    //else if (showMessage) {
    //    toast.error(response.message);
    //}

    return error;
  }

  //static customcheckError(response, showMessage) {
  //    log(
  //        "--------------------------------------------------------------------------------------",
  //        "\n-CUSTOM ERROR : ",
  //        response,
  //        "\n--------------------------------------------------------------------------------------"
  //    );
  //    let error = response?.data?.message;

  //    if (showMessage && error) {
  //        toast.error(error);
  //    } else if (showMessage) {
  //        debugger
  //        //toast.error(
  //        //    <div style={{ display: "flex", alignItems: "center" }}>
  //        //     //   <Icon icon="ic:round-wifi-off" style={{ marginRight: "10px", fontSize: "24px", color: "red" }} />

  //        //        <span>No Internet Connection. Please check your connection.</span>
  //        //    </div>
  //        //);

  //        common.SweetAlert.poorconnectivety("No Internet Connection");
  //    }
  //    return error;
  //}
}
export default HttpServiceManager;
