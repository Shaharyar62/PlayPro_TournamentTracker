const getEnviromentConfig = (config) => {
  switch (config) {
    case EnviromentTypeEnum.Local:
      return {
        baseUrl: "https://localhost:7094/",
        serviceUrl: "https://localhost:7094/api/Service",
        imgBaseurl: "https://localhost:7094/img/upload/",
      };
    case EnviromentTypeEnum.QA:
      return {
        baseUrl: "http://qa_playpro.nascentinnovations.com/",
        serviceUrl: "http://qa_playpro.nascentinnovations.com/api/Service",
        imgBaseurl: "http://qa_playpro.nascentinnovations.com/img/upload/",
      };
    case EnviromentTypeEnum.Dev:
      return {
        baseUrl: "https://dev2playpro.nascentinnovations.com/",
        serviceUrl: "https://dev2playpro.nascentinnovations.com/api/Service",
        imgBaseurl: "https://dev2playpro.nascentinnovations.com/img/upload/",
      };
    case EnviromentTypeEnum.Production:
      return {
        baseUrl: "https://playpro.nascentinnovations.com/",
        serviceUrl: "https://playpro.nascentinnovations.com/api/Service",
        imgBaseurl: "https://playpro.nascentinnovations.com/img/upload/",
      };
    case EnviromentTypeEnum.Demo:
      return {
        baseUrl: "https://playprodemo.nascentinnovations.com",
        serviceUrl: "https://playprodemo.nascentinnovations.com/api/Service",
        imgBaseurl: "https://playprodemo.nascentinnovations.com/img/upload/",
      };
  }
};

export const ToCSharpFormat = "YYYY-MM-DDTHH:mm:ss";
export const ViewDateFormat = "DD MMM yyyy";
export const ViewDateTimeFormat = "DD MMM yyyy, hh:mm A";
export const DateTimeFormat = "DD MMM YYYY, hh:mm A";
export const TimeFormat = "HH:mm";
export const ViewTimeOnly = "hh:mm A";
export const DateTimeminFormat = "YYYY-MM-DDTHH:mm";
export const DateminFormat = "YYYY-MM-DD";
export const AddHours = 5;
export const DateTime = "YYYY-MM-DD HH:mm";
export const DateTimeSec = "YYYY-MM-DD HH:mm:ss";
export const FloatMin = 1.175494351e-38;
export const FloatMax = 3.402823466e38; // 32-bit floating point
export const DoubleMin = 0.0; // range - 2.2250738585072014e-308;
export const DoubleMax = 200.0; // range -  1.7976931348623157e308; //64-bit double-precision floating point
export const DoubleMaximum = 1.7976931348623157e308;
export const IntMin = 0;
export const IntMax = 99999999;
export const IntCourtPriceMin = 100;
export const IntMinLevel = 1;
export const IntSportMaxLevel = 50;
export const IntMinPlatFormFees = 10;
export const IntMaxPlatFormFees = 100000;
export const IntMaxnoofplayers = 20;
export const UnAuthorizedMessageForKey =
  "You're not authorized to perform this action as you provide wrong key!";
export const duration = [
  { id: 30, name: "30 min" },
  { id: 60, name: "1 hr" },
  { id: 90, name: "1 hr 30 min" },
  { id: 120, name: "2 hr" },
  { id: 150, name: "2 hr 30 min" },
  { id: 180, name: "3 hr" },
];

const EnviromentTypeEnum = Object.freeze({
  Local: 1,
  QA: 2,
  Dev: 3,
  Production: 4,
  Demo: 5,
});

const envType = EnviromentTypeEnum.Production;

export const envIsLive =
  envType == EnviromentTypeEnum.Demo ||
  envType == EnviromentTypeEnum.Production;

export const ResultStatus = Object.freeze({
  Unauthorized: 0,
  Success: 1,
  Error: 2,
  NotFound: 3,
  Warning: 4,
  InProcess: 5,
});

export const SignUpTypeEnum = Object.freeze({
  EmailorPhone: 1,
  Google: 2,
  Apple: 3,
  // Facebook: 3
});

export const GenderTypeEnum = Object.freeze({
  Male: 1,
  Female: 2,
  Other: 3,
});

export const UserTypeEnum = Object.freeze({
  User: 1,
});

export const RoleEnum = Object.freeze({
  Super_Admin: 1,
  Club_Manager: 2,
  Club_Sub_User: 3,
  Player: 4,
  Tournament_Manager: 6,
});

export const SportFeatureTypeEnum = Object.freeze({
  Type: 1,
  Feature: 2,
  No_of_Players: 3,
});

export const PaymentTypeEnum = Object.freeze({
  Cash: 1,
  Online: 2,
  Payment_GateWay: 3,
  Pay_On_Club: 4,
  Online_Partial_Pay: 5,
});

export const MatchTypeEnum = Object.freeze({
  Friendly: 1,
  Competitive: 2,
});

export const ClubDisplayTypeEnum = Object.freeze({
  Court_First: 1,
  Slot_First: 2,
});

export const BookingPaymentMethodEnum = Object.freeze({
  Creator_Pays_All: 1,
  Each_Pays_Own: 2,
});

export const BookingModeEnum = Object.freeze({
  App_Booking: 1,
  Club_Booking: 2,
});

export const BookingStatusEnum = Object.freeze({
  Pending: 1,
  Waiting_For_Confirmation: 2,
  Booked: 3,
  Cancelled: 4,
  Cancelled_By_Club: 5,
  Cancelled_Due_To_Lack_Of_Player: 6,
});

export const MatchResultTypeEnum = Object.freeze({
  Win: 1,
  Lose: 2,
  Draw: 3,
  Reward: 4,
});

export const PaymentStatusEnum = Object.freeze({
  Paid: 1,
  Partial_Paid: 2,
  Un_Paid: 3,
});

export const BookingTypeEnum = Object.freeze({
  Public: 1,
  Private: 2,
});

export const NotificationTypeEnum = Object.freeze({
  PrivateBooking: 1,
  PublicBooking: 2,
  Booking_Confirm: 3,
  InviteFriendToPublicBooking: 4,
});

export const PlayerPointsLogTypeEnum = Object.freeze({
  Inital_Level: 1,
  Booking: 2,
  League_Reward: 3,
});

export const LeaderBoardFilterTypeEnum = Object.freeze({
  Global: 1,
  Club: 2,
  Country: 3,
  State: 4,
  City: 5,
});

export const PadelPreferenceShotType = Object.freeze({
  Forehand: 1,
  Backhand: 2,
  Volley: 3,
  Overhead: 4,
  Smash: 5,
  Slice: 6,
  Lob: 7,
  Drive: 8,
  Block: 9,
});

export const respEnum = Object.freeze({
  Unauthorized: 0,
  Success: 1,
  Error: 2,
  NotFound: 3,
  Warning: 4,
  InProcess: 5,
});

export const TransactionLogTypeEnum = Object.freeze({
  Court_Booking: 1,
  Public_Match_Joining: 2,
  Tournament_Joining: 3,
  Payment_Received: 4,
  PromoCode_Redeemed: 5,
  Club_Discount: 6,
  Payment_Refund: 7,
});

export const TransactionLogStatusEnum = Object.freeze({
  Initiate: 1,
  Success: 2,
  Failed: 3,
  Refundable: 4,
  Refunded: 5,
});

export const DayOfWeekEnum = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

export const TournamentVenueTypeEnum = Object.freeze({
  // Country_Wise : 1,
  //     State_Wise : 2,
  City_Wise: 3,
  Club_Wise: 4,
});

export const HolidayTypeEnum = Object.freeze({
  Club: 1,
  Court: 2,
});

//old name TournamentTypeEnum

export const TournamentMatchStageEnum = Object.freeze({
  Group_Match: 1,
  Quarter_Final: 2,
  Semi_Final: 3,
  Final: 4,
});

export const SlotStatusEnum = Object.freeze({
  Available: 1,
  Booked: 2,
  Club_Holiday: 3,
  Court_Holiday: 4,
});

export const TournamentMatchResultEnum = Object.freeze({
  Not_Uploaded: 0,
  Team_A_Won: 1,
  Team_B_Won: 2,
  Tied: 3,
  No_Result: 4,
});

export const PushNotificationTypeEnum = Object.freeze({
  Promotion: 1,
  Alert: 2,
  Reminder: 3,
});

export const PromoCodeDiscountTypeEnum = Object.freeze({
  Percentage: 1,
  Fixed_Amount: 2,
});

export const ClubPaymentLogTypeEnum = Object.freeze({
  Payment_Received: 1,
  Payment_Refund: 2,
});

export const ClubPaymentLogTransactionNatureEnum = Object.freeze({
  Customer_Payment: 1,
});

export const SearchTypeEnum = Object.freeze({
  Server_Search: 1,
  Local_Search: 2,
});

export const CustomTimeoutUrlEnum = Object.freeze({
  SendPushNotificationToUsers: "SendPushNotificationToUsers",
});

export const TournamentMatchPlayStatusEnum = Object.freeze({
  Pending: 0,
  In_Progress: 1,
  Completed: 2,
});

const AppConstant = getEnviromentConfig(envType);

export default AppConstant;
