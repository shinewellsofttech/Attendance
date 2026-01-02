import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Formik, Form, ErrorMessage } from "formik";
import type { FormikProps } from "formik";
import * as Yup from "yup";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import { Btn, FeatherIcons } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_DisplayData, Fn_AddEditData } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";
import { useRailwayTime } from "../../../hooks/useRailwayTime";
import { convertTo12Hour, convertTo24Hour, formatTimeForAPI } from "../../../utils/timeFormatUtils";
import { formatDateForInput, formatDateForAPI, formatDateForDisplay } from "../../../utils/dateFormatUtils";

interface FormValues {
  // Tab 1 Fields - Personal Information
  EmployeeCode: string;
  Name: string;
  FatherName: string;
  MotherName: string;
  WifeName: string;
  Status: string; // Married/Single
  MachineEnrollmentNo: string;
  DateOfBirth: string;
  Age: string;
  FatherDateOfBirth: string;
  MotherDateOfBirth: string;
  WifeDateOfBirth: string;
  DateOfJoining: string;
  Gender: string;
  BloodGroup: string;
  MobileNo: string;
  Address: string;
  F_WorkingStatusMaster: number | string;
  F_ShiftMaster: number | string;
  Religion: string;
  F_EmployeeType: number | string;
  // Tab 2 Fields - Working Hours & Settings
  InTime: string;
  OutTime: string;
  MaxWorkingHoursFullDay: string;
  MinWorkingHoursFullDay: string;
  MaxWorkingHoursHalfDay: string;
  MinWorkingHoursHalfDay: string;
  OverTimeApplicable: boolean;
  GracePeriodMinsOverTime: string;
  WeeklyHoliday: string;
  MaxAllowedLeavesPerMonth: string;
  // Tab 3 Fields - Employment Details
  F_Department: number | string;
  F_Designation: number | string;
  SalaryAmount: string;
  WorkingExperience: string;
  SkillType: string;
  EmploymentNature: string; // Permanent/Temporary
  // Tab 4 Fields - Financial & Bank Details
  EmployeeESICNo: string;
  EmployeePFNo: string;
  ESICIPNo: string;
  UANNo: string;
  AadharNumber: string;
  PANNumber: string;
  BankName: string;
  BankACNo: string;
  BankACHolderName: string;
  IFCSCode: string;
  // Tab 5 Fields - Family & Nominee Details (Tab 5 merged into Tab 1)
  LocalAddress: string;
  LocalReference: string;
  FamilyMembers: Array<{
    Name: string;
    F_RelationType: number | string;
    DateOfBirth: string;
    Aadhar: string;
  }>;
  Nominees: Array<{
    Name: string;
    F_RelationType: number | string;
    DateOfBirth: string;
    SharePercentage: string;
  }>;
  // Tab 6 Fields - Qualification & Documents
  Children: Array<{
    Name: string;
    DateOfBirth: string;
    Gender: string;
  }>;
  Qualification: string;
  DocumentNo1: string;
  DocumentNo2: string;
}

const API_URL_SAVE = "EmployeeMaster/0/token";
const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/EmployeeMaster/Id";
const API_URL_SHIFT = API_WEB_URLS.MASTER + "/0/token/ShiftMaster/Id/0";
const API_URL_WORKING_STATUS = API_WEB_URLS.MASTER + "/0/token/WorkingStatusMaster/Id/0";
const API_URL_DOCUMENT_TYPE = API_WEB_URLS.MASTER + "/0/token/DocumentTypeMaster/Id/0";
const API_URL_DEPARTMENT = API_WEB_URLS.MASTER + "/0/token/DepartmentMaster/Id/0";
const API_URL_DESIGNATION = API_WEB_URLS.MASTER + "/0/token/DesignationMaster/Id/0";
const API_URL_RELATION_TYPE = API_WEB_URLS.MASTER + "/0/token/RelationType/Id/0";
const API_URL_EMPLOYEE_TYPE = API_WEB_URLS.MASTER + "/0/token/EmployeeType/Id/0";

const AddEdit_EmployeeMasterContainer = () => {
  const [activeTab, setActiveTab] = useState("1");
  const isRailwayTime = useRailwayTime();
  const [state, setState] = useState({
    id: 0,
    FillArray: [],
    ShiftArray: [] as any[],
    WorkingStatusArray: [] as any[],
    DocumentTypeArray: [] as any[],
    DepartmentArray: [] as any[],
    DesignationArray: [] as any[],
    RelationTypeArray: [] as any[],
    EmployeeTypeArray: [] as any[],
    formData: {} as any,
    OtherDataScore: [],
    isProgress: true,
  });
  const [files, setFiles] = useState({
    Document1: null as File | null,
    Document2: null as File | null,
    EmployeePhoto: null as File | null,
    EmployeeSignature: null as File | null,
  });

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle Enter key to move to next field based on active tab
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>, currentFieldName: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (!form) return;

      // Define field order for each tab
      const tab1Fields = ["EmployeeCode", "Name", "FatherName", "MotherName", "WifeName", "Status", "MachineEnrollmentNo", "DateOfBirth", "FatherDateOfBirth", "MotherDateOfBirth", "WifeDateOfBirth", "DateOfJoining", "Gender", "BloodGroup", "MobileNo", "Address", "F_WorkingStatusMaster", "F_ShiftMaster", "Religion", "F_EmployeeType", "LocalAddress", "LocalReference"];
      const tab2Fields = ["InTime", "OutTime", "MinWorkingHoursFullDay", "MaxWorkingHoursHalfDay", "MinWorkingHoursHalfDay", "GracePeriodMinsOverTime", "WeeklyHoliday", "MaxAllowedLeavesPerMonth"];
      const tab3Fields = ["F_Department", "F_Designation", "SalaryAmount", "WorkingExperience", "SkillType", "EmploymentNature"];
      const tab4Fields = ["EmployeeESICNo", "EmployeePFNo", "ESICIPNo", "UANNo", "AadharNumber", "PANNumber", "BankName", "BankACNo", "BankACHolderName", "IFCSCode"];
      const tab5Fields: string[] = []; // Grid fields handled separately
      const tab6Fields = ["Qualification", "DocumentNo1", "DocumentNo2"];
      
      let fieldOrder: string[] = [];
      if (activeTab === "1") fieldOrder = tab1Fields;
      else if (activeTab === "2") fieldOrder = tab2Fields;
      else if (activeTab === "3") fieldOrder = tab3Fields;
      else if (activeTab === "4") fieldOrder = tab4Fields;
      else if (activeTab === "5") fieldOrder = tab5Fields;
      else if (activeTab === "6") fieldOrder = tab6Fields;

      const currentIndex = fieldOrder.indexOf(currentFieldName);

      if (currentIndex < fieldOrder.length - 1) {
        // Move to next field
        const nextFieldName = fieldOrder[currentIndex + 1];
        const nextInput = form.querySelector(`input[name="${nextFieldName}"], select[name="${nextFieldName}"], textarea[name="${nextFieldName}"]`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        if (nextInput) {
          // Check if it's an input and not readonly
          if (nextInput instanceof HTMLInputElement && !nextInput.readOnly) {
            nextInput.focus();
          } else if (nextInput instanceof HTMLSelectElement) {
            nextInput.focus();
          } else if (nextInput instanceof HTMLTextAreaElement) {
            nextInput.focus();
          }
        }
      } else {
        // Last field in tab, focus Next/Save button
        if (activeTab === "6") {  
          // Last tab, focus Save button
          const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
          if (submitButton) {
            submitButton.focus();
          }
        } else {
          // Other tabs, focus Next button
          const nextButton = form.querySelector('button[type="button"].btn-primary') as HTMLButtonElement;
          if (nextButton && nextButton.textContent?.trim() === "Next") {
            nextButton.focus();
          }
        }
      }
    }
  };

  useEffect(() => {
    // Load Shift, WorkingStatus, DocumentType, Department, Designation, RelationType, and EmployeeType data for dropdowns
    Fn_FillListData(dispatch, setState, "ShiftArray", API_URL_SHIFT);
    Fn_FillListData(dispatch, setState, "WorkingStatusArray", API_URL_WORKING_STATUS);
    Fn_FillListData(dispatch, setState, "DocumentTypeArray", API_URL_DOCUMENT_TYPE);
    Fn_FillListData(dispatch, setState, "DepartmentArray", API_URL_DEPARTMENT);
    Fn_FillListData(dispatch, setState, "DesignationArray", API_URL_DESIGNATION);
    Fn_FillListData(dispatch, setState, "RelationTypeArray", API_URL_RELATION_TYPE);
    Fn_FillListData(dispatch, setState, "EmployeeTypeArray", API_URL_EMPLOYEE_TYPE);

    const Id = (location.state && (location.state as any).Id) || 0;

    if (Id > 0) {
      setState((prevState) => ({
        ...prevState,
        id: Id,
      }));
      Fn_DisplayData(dispatch, setState, Id, API_URL_EDIT);
    }
  }, [dispatch, location.state, navigate]);

  // Auto-focus on first field when form is ready
  useEffect(() => {
    if (!state.isProgress) {
      const timer = setTimeout(() => {
        let firstInput: HTMLInputElement | null = null;
        if (activeTab === "1") {
          firstInput = document.querySelector('.theme-form input[name="EmployeeCode"]') as HTMLInputElement;
        } else if (activeTab === "2") {
          firstInput = document.querySelector('.theme-form input[name="InTime"]') as HTMLInputElement;
        } else if (activeTab === "3") {
          firstInput = document.querySelector('.theme-form select[name="F_Department"]') as HTMLInputElement;
        } else if (activeTab === "4") {
          firstInput = document.querySelector('.theme-form input[name="EmployeeESICNo"]') as HTMLInputElement;
        } else if (activeTab === "6") {
          firstInput = document.querySelector('.theme-form input[name="Qualification"]') as HTMLInputElement;
        }
        if (firstInput && !firstInput.readOnly) {
          firstInput.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [state.isProgress, state.formData, activeTab]);

  const calculateAge = (dateOfBirth: string): string => {
    if (!dateOfBirth) return "";
    try {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age.toString();
    } catch (e) {
      return "";
    }
  };

  const calculateWorkingHours = (inTime: string, outTime: string): string => {
    if (!inTime || !outTime) return "";
    try {
      // Convert to 24-hour format if needed
      const inTime24 = inTime.includes("AM") || inTime.includes("PM") ? convertTo24Hour(inTime) : inTime;
      const outTime24 = outTime.includes("AM") || outTime.includes("PM") ? convertTo24Hour(outTime) : outTime;
      
      const [inHours, inMinutes] = inTime24.split(":").map(Number);
      const [outHours, outMinutes] = outTime24.split(":").map(Number);
      
      const inTotalMinutes = inHours * 60 + inMinutes;
      const outTotalMinutes = outHours * 60 + outMinutes;
      
      const diffMinutes = outTotalMinutes - inTotalMinutes;
      const hours = diffMinutes / 60; // Return as decimal hours
      
      return hours.toFixed(2);
    } catch (e) {
      return "";
    }
  };

  // Helper function to convert hours to minutes
  const convertHoursToMinutes = (hours: string | number | undefined): number => {
    if (!hours) return 0;
    if (typeof hours === "number") return Math.round(hours * 60);
    try {
      const hoursNum = parseFloat(String(hours));
      return Math.round(hoursNum * 60);
    } catch (e) {
      return 0;
    }
  };

  // Helper function to convert minutes to hours
  const convertMinutesToHours = (minutes: string | number | undefined): string => {
    if (!minutes) return "";
    if (typeof minutes === "number") return (minutes / 60).toFixed(2);
    try {
      const minutesNum = parseFloat(String(minutes));
      return (minutesNum / 60).toFixed(2);
    } catch (e) {
      return "";
    }
  };

  const validationSchema = Yup.object({
    EmployeeCode: Yup.string().required("Employee Code is required"),
    Name: Yup.string().required("Name is required"),
    FatherName: Yup.string().required("Father Name is required"),
    MachineEnrollmentNo: Yup.string().required("Machine Enrollment No. is required"),
    DateOfBirth: Yup.string().required("Date of Birth is required"),
    DateOfJoining: Yup.string().required("Date of Joining is required"),
    Gender: Yup.string().required("Gender is required"),
    BloodGroup: Yup.string(),
    MobileNo: Yup.string().required("Mobile No. is required"),
    Address: Yup.string().required("Address is required"),
    F_WorkingStatusMaster: Yup.number().nullable().required("Working Status is required"),
    F_ShiftMaster: Yup.number().nullable().required("Shift is required"),
    Status: Yup.string(),
    Religion: Yup.string(),
    F_EmployeeType: Yup.number().nullable(),
    MotherName: Yup.string(),
    WifeName: Yup.string(),
    FatherDateOfBirth: Yup.string(),
    MotherDateOfBirth: Yup.string(),
    WifeDateOfBirth: Yup.string(),
    InTime: Yup.string().required("In Time is required"),
    OutTime: Yup.string().required("Out Time is required"),
    MaxWorkingHoursFullDay: Yup.string().required("Max Working Hours Full Day is required"),
    MinWorkingHoursFullDay: Yup.string().required("Min Working Hours Full Day is required"),
    MaxWorkingHoursHalfDay: Yup.string().required("Max Working Hours Half Day is required"),
    MinWorkingHoursHalfDay: Yup.string().required("Min Working Hours Half Day is required"),
    GracePeriodMinsOverTime: Yup.string().required("Grace Period Mins (Over Time) is required"),
    WeeklyHoliday: Yup.string().required("Weekly Holiday is required"),
    MaxAllowedLeavesPerMonth: Yup.string().required("Max Allowed Leaves/Month is required"),
    F_Department: Yup.number().nullable(),
    F_Designation: Yup.number().nullable(),
    SalaryAmount: Yup.string(),
    WorkingExperience: Yup.string(),
    SkillType: Yup.string(),
    EmploymentNature: Yup.string(),
    EmployeeESICNo: Yup.string(),
    EmployeePFNo: Yup.string(),
    ESICIPNo: Yup.string(),
    UANNo: Yup.string(),
    AadharNumber: Yup.string(),
    PANNumber: Yup.string(),
    BankName: Yup.string(),
    BankACNo: Yup.string(),
    BankACHolderName: Yup.string(),
    IFCSCode: Yup.string(),
    LocalAddress: Yup.string(),
    LocalReference: Yup.string(),
  });

  const handleSubmit = (values: FormValues) => {
    let vformData = new FormData();

    // Helper function to convert string to number
    const toNumber = (value: string | number | undefined, defaultValue: number = 0): number => {
      if (value === undefined || value === null || value === "") return defaultValue;
      if (typeof value === "number") return value;
      const num = parseFloat(String(value));
      return isNaN(num) ? defaultValue : num;
    };

    // Parameters in API specification order
    vformData.append("Name", values.Name || "");
    vformData.append("EmployeeNo", values.EmployeeCode || "");
    vformData.append("F_EmployeeType", String(toNumber(values.F_EmployeeType, 0)));
    vformData.append("FatherName", values.FatherName || "");
    vformData.append("MotherName", values.MotherName || "");
    vformData.append("WifeName", values.WifeName || "");
    vformData.append("Status", values.Status || "");
    vformData.append("MachineEnrollmentNo", values.MachineEnrollmentNo || "");
    vformData.append("DateOfBirth", formatDateForAPI(values.DateOfBirth) || "");
    vformData.append("Age", String(toNumber(values.Age, 0)));
    vformData.append("FatherDateOfBirth", values.FatherDateOfBirth ? formatDateForAPI(values.FatherDateOfBirth) : "");
    vformData.append("MotherDateOfBirth", values.MotherDateOfBirth ? formatDateForAPI(values.MotherDateOfBirth) : "");
    vformData.append("WifeDateOfBirth", values.WifeDateOfBirth ? formatDateForAPI(values.WifeDateOfBirth) : "");
    vformData.append("DateOfJoining", formatDateForAPI(values.DateOfJoining) || "");
    vformData.append("Gender", values.Gender || "");
    vformData.append("Religion", values.Religion || "");
    vformData.append("BloodGroup", values.BloodGroup || "");
    vformData.append("MobileNo", values.MobileNo || "");
    vformData.append("Address", values.Address || "");
    vformData.append("LocalAddress", values.LocalAddress || "");
    vformData.append("LocalReference", values.LocalReference || "");
    vformData.append("F_WorkingStatusMaster", String(toNumber(values.F_WorkingStatusMaster, 0)));
    vformData.append("F_ShiftMaster", String(toNumber(values.F_ShiftMaster, 0)));

    // Tab 2 fields - Working Hours & Settings
    vformData.append("InTime", formatTimeForAPI(values.InTime) || "");
    vformData.append("OutTime", formatTimeForAPI(values.OutTime) || "");
    vformData.append("MaxWorkingHoursFullDay", String(toNumber(values.MaxWorkingHoursFullDay, 0)));
    vformData.append("MinWorkingHoursFullDay", String(toNumber(values.MinWorkingHoursFullDay, 0)));
    vformData.append("MaxWorkingHoursHalfDay", String(toNumber(values.MaxWorkingHoursHalfDay, 0)));
    vformData.append("MinWorkingHoursHalfDay", String(toNumber(values.MinWorkingHoursHalfDay, 0)));
    vformData.append("OverTimeApplicable", values.OverTimeApplicable ? "true" : "false");
    vformData.append("GracePeriodMinsOverTime", String(toNumber(values.GracePeriodMinsOverTime, 0)));
    vformData.append("WeeklyHoliday", values.WeeklyHoliday || "");
    vformData.append("MaxAllowedLeavesPerMonth", String(toNumber(values.MaxAllowedLeavesPerMonth, 0)));

    // Tab 3 fields - Employment Details
    vformData.append("F_Department", String(toNumber(values.F_Department, 0)));
    vformData.append("F_Designation", String(toNumber(values.F_Designation, 0)));
    vformData.append("SalaryAmount", String(toNumber(values.SalaryAmount, 0)));
    vformData.append("WorkingExperience", values.WorkingExperience || "");
    vformData.append("SkillType", values.SkillType || "");
    vformData.append("EmploymentNature", values.EmploymentNature || "");

    // Tab 4 fields - Financial & Bank Details
    vformData.append("EmployeeESICNo", values.EmployeeESICNo || "");
    vformData.append("EmployeePFNo", values.EmployeePFNo || "");
    vformData.append("ESICIPNo", values.ESICIPNo || "");
    vformData.append("UANNo", values.UANNo || "");
    vformData.append("AadharNumber", values.AadharNumber || "");
    vformData.append("PANNumber", values.PANNumber || "");
    vformData.append("BankName", values.BankName || "");
    vformData.append("BankACNo", values.BankACNo || "");
    vformData.append("BankACHolderName", values.BankACHolderName || "");
    vformData.append("IFCSCode", values.IFCSCode || "");

    // Tab 6 fields - Qualification & Documents
    vformData.append("Qualification", values.Qualification || "");
    vformData.append("DocumentNo1", values.DocumentNo1 || "");
    vformData.append("DocumentNo2", values.DocumentNo2 || "");

    // Tab 5 fields - Family & Nominee Details (Send as JSON strings)
    if (values.FamilyMembers && values.FamilyMembers.length > 0) {
      const familyMembersArray = values.FamilyMembers
        .filter(member => member.Name && member.F_RelationType)
        .map(member => ({
          Name: member.Name || "",
          F_RelationType: toNumber(member.F_RelationType, 0),
          DOB: member.DateOfBirth ? formatDateForAPI(member.DateOfBirth) : "",
          AadharNo: member.Aadhar || ""
        }));
      vformData.append("FamilyJson", JSON.stringify(familyMembersArray));
    } else {
      vformData.append("FamilyJson", JSON.stringify([]));
    }

    if (values.Nominees && values.Nominees.length > 0) {
      const nomineesArray = values.Nominees
        .filter(nominee => nominee.Name && nominee.F_RelationType)
        .map(nominee => ({
          Name: nominee.Name || "",
          F_RelationType: toNumber(nominee.F_RelationType, 0),
          DOB: nominee.DateOfBirth ? formatDateForAPI(nominee.DateOfBirth) : "",
          SharePercent: toNumber(nominee.SharePercentage, 0)
        }));
      vformData.append("NomineeJson", JSON.stringify(nomineesArray));
    } else {
      vformData.append("NomineeJson", JSON.stringify([]));
    }

    // Tab 6 fields - Children (Send as JSON string)
    if (values.Children && values.Children.length > 0) {
      const childrenArray = values.Children
        .filter(child => child.Name)
        .map(child => ({
          ChildName: child.Name || "",
          DateOfBirth: child.DateOfBirth ? formatDateForAPI(child.DateOfBirth) : "",
          Gender: child.Gender || ""
        }));
      vformData.append("ChildJson", JSON.stringify(childrenArray));
    } else {
      vformData.append("ChildJson", JSON.stringify([]));
    }
    
    // File uploads (binary fields)
    if (files.Document1) {
      vformData.append("Document1", files.Document1);
    }
    if (files.Document2) {
      vformData.append("Document2", files.Document2);
    }
    if (files.EmployeePhoto) {
      vformData.append("EmployeePhoto", files.EmployeePhoto);
    }
    if (files.EmployeeSignature) {
      vformData.append("EmployeeSignature", files.EmployeeSignature);
    }
    
    let userId = 0;
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const obj = JSON.parse(userStr);
        userId = (obj && (obj.uid || obj.Id)) ? (obj.uid || obj.Id) : 0;
      }
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
    }
    vformData.append("UserId", String(userId));

    Fn_AddEditData(
      dispatch,
      setState,
      { arguList: { id: state.id, formData: vformData } },
      API_URL_SAVE,
      true,
      "memberid",
      navigate,
      "/employeeMaster"
    );
  };

  const isEditMode = state.id > 0;

  // Use utility function for date formatting

  // Helper function to parse JSON strings safely
  const parseJsonSafely = (jsonString: string | null | undefined, defaultValue: any[] = []): any[] => {
    if (!jsonString || typeof jsonString !== "string") return defaultValue;
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : defaultValue;
    } catch (e) {
      console.error("Error parsing JSON:", e);
      return defaultValue;
    }
  };

  const initialValues: FormValues = {
    // Tab 1 - Personal Information
    EmployeeCode: state.formData?.EmployeeCode || state.formData?.EmployeeNo || "",
    Name: state.formData?.Name || "",
    FatherName: state.formData?.FatherName || "",
    MotherName: state.formData?.MotherName || "",
    WifeName: state.formData?.WifeName || "",
    Status: state.formData?.Status || "",
    MachineEnrollmentNo: state.formData?.MachineEnrollmentNo || "",
    DateOfBirth: formatDateForInput(state.formData?.DateOfBirth || ""),
    Age: state.formData?.Age ? String(state.formData.Age) : calculateAge(formatDateForInput(state.formData?.DateOfBirth || "")),
    FatherDateOfBirth: formatDateForInput(state.formData?.FatherDateOfBirth || ""),
    MotherDateOfBirth: formatDateForInput(state.formData?.MotherDateOfBirth || ""),
    WifeDateOfBirth: formatDateForInput(state.formData?.WifeDateOfBirth || ""),
    DateOfJoining: formatDateForInput(state.formData?.DateOfJoining || ""),
    Gender: state.formData?.Gender || "",
    BloodGroup: state.formData?.BloodGroup || "",
    MobileNo: state.formData?.MobileNo || "",
    Address: state.formData?.Address || "",
    F_WorkingStatusMaster: state.formData?.F_WorkingStatusMaster ? Number(state.formData.F_WorkingStatusMaster) : "",
    F_ShiftMaster: state.formData?.F_ShiftMaster ? Number(state.formData.F_ShiftMaster) : "",
    Religion: state.formData?.Religion || "",
    F_EmployeeType: state.formData?.F_EmployeeType ? Number(state.formData.F_EmployeeType) : "",
    // Tab 2 - Working Hours & Settings
    InTime: (() => {
      const time = state.formData?.InTime;
      if (!time) return "";
      const timeStr = typeof time === "string" ? time : String(time);
      if (isRailwayTime) {
        // Railway time: return in 24-hour format
        return timeStr.includes("AM") || timeStr.includes("PM") ? convertTo24Hour(timeStr) : timeStr;
      } else {
        // 12-hour format: convert if needed
        return timeStr.includes("AM") || timeStr.includes("PM") ? timeStr : convertTo12Hour(timeStr);
      }
    })(),
    OutTime: (() => {
      const time = state.formData?.OutTime;
      if (!time) return "";
      const timeStr = typeof time === "string" ? time : String(time);
      if (isRailwayTime) {
        // Railway time: return in 24-hour format
        return timeStr.includes("AM") || timeStr.includes("PM") ? convertTo24Hour(timeStr) : timeStr;
      } else {
        // 12-hour format: convert if needed
        return timeStr.includes("AM") || timeStr.includes("PM") ? timeStr : convertTo12Hour(timeStr);
      }
    })(),
    // Working hours come as numbers (already in hours, not minutes)
    MaxWorkingHoursFullDay: state.formData?.MaxWorkingHoursFullDay !== undefined && state.formData?.MaxWorkingHoursFullDay !== null 
      ? String(state.formData.MaxWorkingHoursFullDay) 
      : "",
    MinWorkingHoursFullDay: state.formData?.MinWorkingHoursFullDay !== undefined && state.formData?.MinWorkingHoursFullDay !== null
      ? String(state.formData.MinWorkingHoursFullDay)
      : "",
    MaxWorkingHoursHalfDay: state.formData?.MaxWorkingHoursHalfDay !== undefined && state.formData?.MaxWorkingHoursHalfDay !== null
      ? String(state.formData.MaxWorkingHoursHalfDay)
      : "",
    MinWorkingHoursHalfDay: state.formData?.MinWorkingHoursHalfDay !== undefined && state.formData?.MinWorkingHoursHalfDay !== null
      ? String(state.formData.MinWorkingHoursHalfDay)
      : "",
    OverTimeApplicable: state.formData?.OverTimeApplicable === true || state.formData?.OverTimeApplicable === "true" || false,
    GracePeriodMinsOverTime: state.formData?.GracePeriodMinsOverTime !== undefined && state.formData?.GracePeriodMinsOverTime !== null
      ? String(state.formData.GracePeriodMinsOverTime)
      : "",
    WeeklyHoliday: state.formData?.WeeklyHoliday || "Sunday",
    MaxAllowedLeavesPerMonth: state.formData?.MaxAllowedLeavesPerMonth !== undefined && state.formData?.MaxAllowedLeavesPerMonth !== null
      ? String(state.formData.MaxAllowedLeavesPerMonth)
      : "",
    // Tab 3 - Employment Details
    F_Department: state.formData?.F_Department ? Number(state.formData.F_Department) : "",
    F_Designation: state.formData?.F_Designation ? Number(state.formData.F_Designation) : "",
    SalaryAmount: state.formData?.SalaryAmount !== undefined && state.formData?.SalaryAmount !== null
      ? String(state.formData.SalaryAmount)
      : "",
    WorkingExperience: state.formData?.WorkingExperience || "",
    SkillType: state.formData?.SkillType || "",
    EmploymentNature: state.formData?.EmploymentNature || "",
    // Tab 4 - Financial & Bank Details
    EmployeeESICNo: state.formData?.EmployeeESICNo || "",
    EmployeePFNo: state.formData?.EmployeePFNo || "",
    ESICIPNo: state.formData?.ESICIPNo || "",
    UANNo: state.formData?.UANNo || "",
    AadharNumber: state.formData?.AadharNumber || "",
    PANNumber: state.formData?.PANNumber || "",
    BankName: state.formData?.BankName || "",
    BankACNo: state.formData?.BankACNo || "",
    BankACHolderName: state.formData?.BankACHolderName || "",
    IFCSCode: state.formData?.IFCSCode || "",
    // Tab 1 - Address & References (merged)
    LocalAddress: state.formData?.LocalAddress || "",
    LocalReference: state.formData?.LocalReference || "",
    // Tab 5 - Family & Nominee Details (Parse from JSON strings)
    FamilyMembers: (() => {
      const familyJson = state.formData?.FamilyJson;
      const parsed = parseJsonSafely(familyJson);
      if (parsed.length > 0) {
        return parsed.map((member: any) => ({
          Name: member.Name || "",
          F_RelationType: member.F_RelationType ? Number(member.F_RelationType) : "",
          DateOfBirth: formatDateForInput(member.DOB || member.DateOfBirth || ""),
          Aadhar: member.AadharNo || member.Aadhar || "",
        }));
      }
      return [{ Name: "", F_RelationType: "", DateOfBirth: "", Aadhar: "" }];
    })(),
    Nominees: (() => {
      const nomineeJson = state.formData?.NomineeJson;
      const parsed = parseJsonSafely(nomineeJson);
      if (parsed.length > 0) {
        return parsed.map((nominee: any) => ({
          Name: nominee.Name || "",
          F_RelationType: nominee.F_RelationType ? Number(nominee.F_RelationType) : "",
          DateOfBirth: formatDateForInput(nominee.DOB || nominee.DateOfBirth || ""),
          SharePercentage: nominee.SharePercent !== undefined && nominee.SharePercent !== null
            ? String(nominee.SharePercent)
            : "",
        }));
      }
      return [{ Name: "", F_RelationType: "", DateOfBirth: "", SharePercentage: "" }];
    })(),
    // Tab 6 - Qualification & Documents (Parse from JSON string)
    Children: (() => {
      const childJson = state.formData?.ChildJson;
      const parsed = parseJsonSafely(childJson);
      if (parsed.length > 0) {
        return parsed.map((child: any) => ({
          Name: child.ChildName || child.Name || "",
          DateOfBirth: formatDateForInput(child.DateOfBirth || ""),
          Gender: child.Gender || "",
        }));
      }
      return [{ Name: "", DateOfBirth: "", Gender: "" }];
    })(),
    Qualification: state.formData?.Qualification || "",
    DocumentNo1: state.formData?.DocumentNo1 || "",
    DocumentNo2: state.formData?.DocumentNo2 || "",
  };

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <>
      <style>{`
        .theme-form input[type="text"],
        .theme-form input[type="date"],
        .theme-form input[type="tel"],
        .theme-form input[type="number"] {
          color: #000000 !important;
        }
        body.dark-only .theme-form input[type="text"],
        body.dark-only .theme-form input[type="date"],
        body.dark-only .theme-form input[type="tel"],
        body.dark-only .theme-form input[type="number"] {
          color: #ffffff !important;
        }
        .theme-form input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 1;
        }
        select.btn-square,
        select.btn-square option {
          font-family: inherit !important;
          color: #000000 !important;
        }
        body.dark-only select.btn-square,
        body.dark-only select.btn-square option {
          color: #ffffff !important;
        }
      `}</style>
      <Breadcrumbs mainTitle="Employee Master" parent="Masters" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Formik<FormValues>
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ values, handleChange, handleBlur, errors, touched, setFieldValue }: FormikProps<FormValues>) => (
                <Form className="theme-form">
                  <Card>
                    <CardHeaderCommon
                      title={`${isEditMode ? "Edit" : "Add"} Employee Master`}
                      tagClass="card-title mb-0"
                    />
                    <CardBody>
                      <Nav tabs className="nav-tabs border-tab">
                        <NavItem>
                          <NavLink
                            className={activeTab === "1" ? "active" : ""}
                            onClick={() => setActiveTab("1")}
                            style={{ cursor: "pointer" }}
                          >
                            Personal Information
                          </NavLink>
                        </NavItem>
                        <NavItem>
                          <NavLink
                            className={activeTab === "2" ? "active" : ""}
                            onClick={() => setActiveTab("2")}
                            style={{ cursor: "pointer" }}
                          >
                            Working Hours & Settings
                          </NavLink>
                        </NavItem>
                        <NavItem>
                          <NavLink
                            className={activeTab === "3" ? "active" : ""}
                            onClick={() => setActiveTab("3")}
                            style={{ cursor: "pointer" }}
                          >
                            Employment Details
                          </NavLink>
                        </NavItem>
                        <NavItem>
                          <NavLink
                            className={activeTab === "4" ? "active" : ""}
                            onClick={() => setActiveTab("4")}
                            style={{ cursor: "pointer" }}
                          >
                            Financial & Bank
                          </NavLink>
                        </NavItem>
                        <NavItem>
                          <NavLink
                            className={activeTab === "5" ? "active" : ""}
                            onClick={() => setActiveTab("5")}
                            style={{ cursor: "pointer" }}
                          >
                            Family & Nominee
                          </NavLink>
                        </NavItem>
                        <NavItem>
                          <NavLink
                            className={activeTab === "6" ? "active" : ""}
                            onClick={() => setActiveTab("6")}
                            style={{ cursor: "pointer" }}
                          >
                            Qualification & Documents
                          </NavLink>
                        </NavItem>
                      </Nav>
                      <TabContent activeTab={activeTab}>
                        {/* Tab 1: Personal Information */}
                        <TabPane tabId="1">
                          <Row className="mt-3">
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Employee Code <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="text"
                                  name="EmployeeCode"
                                  placeholder="Enter Employee Code"
                                  value={values.EmployeeCode}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "EmployeeCode")}
                                  invalid={touched.EmployeeCode && !!errors.EmployeeCode}
                                />
                                <ErrorMessage name="EmployeeCode" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Name <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="text"
                                  name="Name"
                                  placeholder="Enter Name"
                                  value={values.Name}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "Name")}
                                  invalid={touched.Name && !!errors.Name}
                                />
                                <ErrorMessage name="Name" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Father Name <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="text"
                                  name="FatherName"
                                  placeholder="Enter Father Name"
                                  value={values.FatherName}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "FatherName")}
                                  invalid={touched.FatherName && !!errors.FatherName}
                                />
                                <ErrorMessage name="FatherName" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Mother Name
                                </Label>
                                <Input
                                  type="text"
                                  name="MotherName"
                                  placeholder="Enter Mother Name"
                                  value={values.MotherName}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "MotherName")}
                                  invalid={touched.MotherName && !!errors.MotherName}
                                />
                                <ErrorMessage name="MotherName" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Wife / Husband Name
                                </Label>
                                <Input
                                  type="text"
                                  name="WifeName"
                                  placeholder="Enter Wife / Husband Name"
                                  value={values.WifeName}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "WifeName")}
                                  invalid={touched.WifeName && !!errors.WifeName}
                                />
                                <ErrorMessage name="WifeName" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Status
                                </Label>
                                <Input
                                  type="select"
                                  name="Status"
                                  value={values.Status}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "Status")}
                                  className="btn-square"
                                  invalid={touched.Status && !!errors.Status}
                                >
                                  <option value="">Select</option>
                                  <option value="Married">Married</option>
                                  <option value="Single">Single</option>
                                </Input>
                                <ErrorMessage name="Status" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Machine Enrollment No. <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="text"
                                  name="MachineEnrollmentNo"
                                  placeholder="Enter Machine Enrollment No."
                                  value={values.MachineEnrollmentNo}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "MachineEnrollmentNo")}
                                  invalid={touched.MachineEnrollmentNo && !!errors.MachineEnrollmentNo}
                                />
                                <ErrorMessage name="MachineEnrollmentNo" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="4">
                              <FormGroup>
                                <Label>
                                  Date of Birth <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="date"
                                  name="DateOfBirth"
                                  value={values.DateOfBirth}
                                  onChange={(e) => {
                                    handleChange(e);
                                    const age = calculateAge(e.target.value);
                                    setFieldValue("Age", age);
                                  }}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "DateOfBirth")}
                                  invalid={touched.DateOfBirth && !!errors.DateOfBirth}
                                />
                                <ErrorMessage name="DateOfBirth" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="2">
                              <FormGroup>
                                <Label>Age</Label>
                                <Input
                                  type="text"
                                  name="Age"
                                  value={values.Age}
                                  readOnly
                                  style={{ backgroundColor: "#f8f9fa" }}
                                />
                              </FormGroup>
                            </Col>
                            <Col md="4">
                              <FormGroup>
                                <Label>
                                  Father Date Of Birth
                                </Label>
                                <Input
                                  type="date"
                                  name="FatherDateOfBirth"
                                  value={values.FatherDateOfBirth}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "FatherDateOfBirth")}
                                  invalid={touched.FatherDateOfBirth && !!errors.FatherDateOfBirth}
                                />
                                <ErrorMessage name="FatherDateOfBirth" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="4">
                              <FormGroup>
                                <Label>
                                  Mother Date Of Birth
                                </Label>
                                <Input
                                  type="date"
                                  name="MotherDateOfBirth"
                                  value={values.MotherDateOfBirth}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "MotherDateOfBirth")}
                                  invalid={touched.MotherDateOfBirth && !!errors.MotherDateOfBirth}
                                />
                                <ErrorMessage name="MotherDateOfBirth" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="4">
                              <FormGroup>
                                <Label>
                                  Wife Date Of Birth
                                </Label>
                                <Input
                                  type="date"
                                  name="WifeDateOfBirth"
                                  value={values.WifeDateOfBirth}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "WifeDateOfBirth")}
                                  invalid={touched.WifeDateOfBirth && !!errors.WifeDateOfBirth}
                                />
                                <ErrorMessage name="WifeDateOfBirth" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Date of Joining <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="date"
                                  name="DateOfJoining"
                                  value={values.DateOfJoining}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "DateOfJoining")}
                                  invalid={touched.DateOfJoining && !!errors.DateOfJoining}
                                />
                                <ErrorMessage name="DateOfJoining" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Gender <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="select"
                                  name="Gender"
                                  value={values.Gender}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "Gender")}
                                  className="btn-square"
                                  invalid={touched.Gender && !!errors.Gender}
                                >
                                  <option value="">Select</option>
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  {/* <option value="Other">Other</option> */}
                                </Input>
                                <ErrorMessage name="Gender" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Blood Group
                                </Label>
                                <Input
                                  type="select"
                                  name="BloodGroup"
                                  value={values.BloodGroup}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "BloodGroup")}
                                  className="btn-square"
                                  invalid={touched.BloodGroup && !!errors.BloodGroup}
                                >
                                  <option value="">Select</option>
                                  <option value="A+">A+</option>
                                  <option value="A-">A-</option>
                                  <option value="B+">B+</option>
                                  <option value="B-">B-</option>
                                  <option value="AB+">AB+</option>
                                  <option value="AB-">AB-</option>
                                  <option value="O+">O+</option>
                                  <option value="O-">O-</option>
                                </Input>
                                <ErrorMessage name="BloodGroup" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Mobile No. <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="tel"
                                  name="MobileNo"
                                  placeholder="Enter Mobile No."
                                  value={values.MobileNo}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "MobileNo")}
                                  invalid={touched.MobileNo && !!errors.MobileNo}
                                />
                                <ErrorMessage name="MobileNo" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Address <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="textarea"
                                  name="Address"
                                  placeholder="Enter Address"
                                  value={values.Address}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "Address")}
                                  rows={3}
                                  invalid={touched.Address && !!errors.Address}
                                />
                                <ErrorMessage name="Address" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Working Status <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="select"
                                  name="F_WorkingStatusMaster"
                                  value={values.F_WorkingStatusMaster}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "F_WorkingStatusMaster")}
                                  className="btn-square"
                                  invalid={touched.F_WorkingStatusMaster && !!errors.F_WorkingStatusMaster}
                                >
                                  <option value="">Select Working Status</option>
                                  {state.WorkingStatusArray.map((item: any) => (
                                    <option key={item.Id} value={item.Id}>
                                      {item.Name || `Status ${item.Id}`}
                                    </option>
                                  ))}
                                </Input>
                                <ErrorMessage name="F_WorkingStatusMaster" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Shift Master <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="select"
                                  name="F_ShiftMaster"
                                  value={values.F_ShiftMaster}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "F_ShiftMaster")}
                                  className="btn-square"
                                  invalid={touched.F_ShiftMaster && !!errors.F_ShiftMaster}
                                >
                                  <option value="">Select Shift</option>
                                  {state.ShiftArray.map((item: any) => (
                                    <option key={item.Id} value={item.Id}>
                                      {item.Name}
                                    </option>
                                  ))}
                                </Input>
                                <ErrorMessage name="F_ShiftMaster" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Religion
                                </Label>
                                <Input
                                  type="text"
                                  name="Religion"
                                  placeholder="Enter Religion"
                                  value={values.Religion}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "Religion")}
                                  invalid={touched.Religion && !!errors.Religion}
                                />
                                <ErrorMessage name="Religion" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Employee Type
                                </Label>
                                <Input
                                  type="select"
                                  name="F_EmployeeType"
                                  value={values.F_EmployeeType}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "F_EmployeeType")}
                                  className="btn-square"
                                  invalid={touched.F_EmployeeType && !!errors.F_EmployeeType}
                                >
                                  <option value="">Select Employee Type</option>
                                  {state.EmployeeTypeArray.map((item: any) => (
                                    <option key={item.Id} value={item.Id}>
                                      {item.Name || `Employee Type ${item.Id}`}
                                    </option>
                                  ))}
                                </Input>
                                <ErrorMessage name="F_EmployeeType" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="12">
                              <FormGroup>
                                <Label>
                                  Local Address
                                </Label>
                                <Input
                                  type="textarea"
                                  name="LocalAddress"
                                  placeholder="Enter Local Address"
                                  value={values.LocalAddress}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "LocalAddress")}
                                  rows={4}
                                  invalid={touched.LocalAddress && !!errors.LocalAddress}
                                />
                                <ErrorMessage name="LocalAddress" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="12">
                              <FormGroup>
                                <Label>
                                  Local Reference
                                </Label>
                                <Input
                                  type="textarea"
                                  name="LocalReference"
                                  placeholder="Enter Local Reference"
                                  value={values.LocalReference}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "LocalReference")}
                                  rows={4}
                                  invalid={touched.LocalReference && !!errors.LocalReference}
                                />
                                <ErrorMessage name="LocalReference" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                          </Row>
                        </TabPane>

                        {/* Tab 2: Working Hours & Settings */}
                        <TabPane tabId="2">
                          <Row className="mt-3">
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  In Time <span className="text-danger">*</span>
                                </Label>
                                {isRailwayTime ? (
                                  <Input
                                    type="time"
                                    name="InTime"
                                    value={typeof values.InTime === "string" && (values.InTime.includes("AM") || values.InTime.includes("PM")) ? convertTo24Hour(values.InTime) : (values.InTime || "")}
                                    onChange={(e) => {
                                      setFieldValue("InTime", e.target.value);
                                      if (values.OutTime) {
                                        const hours = calculateWorkingHours(e.target.value, values.OutTime);
                                        if (hours) {
                                          setFieldValue("MaxWorkingHoursFullDay", hours);
                                        }
                                      }
                                    }}
                                    onBlur={handleBlur}
                                    onKeyDown={(e) => handleKeyDown(e, "InTime")}
                                    invalid={touched.InTime && !!errors.InTime}
                                  />
                                ) : (
                                  <Input
                                    type="text"
                                    name="InTime"
                                    placeholder="HH:MM AM/PM"
                                    value={(() => {
                                      if (typeof values.InTime !== "string") return "";
                                      // If it's already in 12-hour format (AM/PM), return as is
                                      if (values.InTime.includes("AM") || values.InTime.includes("PM")) return values.InTime;
                                      // If it's a complete 24-hour time (HH:MM format, length 5), convert to 12-hour
                                      if (values.InTime.includes(":") && values.InTime.split(":")[1] && values.InTime.split(":")[1].length === 2 && values.InTime.length === 5) {
                                        return convertTo12Hour(values.InTime);
                                      }
                                      // If it's incomplete, show raw input so user can continue typing
                                      return values.InTime;
                                    })()}
                                    onChange={(e) => {
                                      // Store raw input while typing, convert on blur
                                      setFieldValue("InTime", e.target.value);
                                    }}
                                    onBlur={(e) => {
                                      const time24 = convertTo24Hour(e.target.value);
                                      // Convert back to 12-hour format for display and pattern validation
                                      const time12 = convertTo12Hour(time24);
                                      setFieldValue("InTime", time12);
                                      if (values.OutTime) {
                                        const outTime24 = typeof values.OutTime === "string" && (values.OutTime.includes("AM") || values.OutTime.includes("PM")) 
                                          ? convertTo24Hour(values.OutTime) 
                                          : (values.OutTime || "");
                                        const hours = calculateWorkingHours(time24, outTime24);
                                        if (hours) {
                                          setFieldValue("MaxWorkingHoursFullDay", hours);
                                        }
                                      }
                                      handleBlur(e);
                                    }}
                                    onKeyDown={(e) => handleKeyDown(e, "InTime")}
                                    invalid={touched.InTime && !!errors.InTime}
                                    pattern="^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$"
                                    title="Format: HH:MM AM/PM (e.g., 09:00 AM, 06:30 PM)"
                                  />
                                )}
                                <ErrorMessage name="InTime" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Out Time <span className="text-danger">*</span>
                                </Label>
                                {isRailwayTime ? (
                                  <Input
                                    type="time"
                                    name="OutTime"
                                    value={typeof values.OutTime === "string" && (values.OutTime.includes("AM") || values.OutTime.includes("PM")) ? convertTo24Hour(values.OutTime) : (values.OutTime || "")}
                                    onChange={(e) => {
                                      setFieldValue("OutTime", e.target.value);
                                      if (values.InTime) {
                                        const hours = calculateWorkingHours(values.InTime, e.target.value);
                                        if (hours) {
                                          setFieldValue("MaxWorkingHoursFullDay", hours);
                                        }
                                      }
                                    }}
                                    onBlur={handleBlur}
                                    onKeyDown={(e) => handleKeyDown(e, "OutTime")}
                                    invalid={touched.OutTime && !!errors.OutTime}
                                  />
                                ) : (
                                  <Input
                                    type="text"
                                    name="OutTime"
                                    placeholder="HH:MM AM/PM"
                                    value={(() => {
                                      if (typeof values.OutTime !== "string") return "";
                                      // If it's already in 12-hour format (AM/PM), return as is
                                      if (values.OutTime.includes("AM") || values.OutTime.includes("PM")) return values.OutTime;
                                      // If it's a complete 24-hour time (HH:MM format, length 5), convert to 12-hour
                                      if (values.OutTime.includes(":") && values.OutTime.split(":")[1] && values.OutTime.split(":")[1].length === 2 && values.OutTime.length === 5) {
                                        return convertTo12Hour(values.OutTime);
                                      }
                                      // If it's incomplete, show raw input so user can continue typing
                                      return values.OutTime;
                                    })()}
                                    onChange={(e) => {
                                      // Store raw input while typing, convert on blur
                                      setFieldValue("OutTime", e.target.value);
                                    }}
                                    onBlur={(e) => {
                                      const time24 = convertTo24Hour(e.target.value);
                                      // Convert back to 12-hour format for display and pattern validation
                                      const time12 = convertTo12Hour(time24);
                                      setFieldValue("OutTime", time12);
                                      if (values.InTime) {
                                        const inTime24 = typeof values.InTime === "string" && (values.InTime.includes("AM") || values.InTime.includes("PM")) 
                                          ? convertTo24Hour(values.InTime) 
                                          : (values.InTime || "");
                                        const hours = calculateWorkingHours(inTime24, time24);
                                        if (hours) {
                                          setFieldValue("MaxWorkingHoursFullDay", hours);
                                        }
                                      }
                                      handleBlur(e);
                                    }}
                                    onKeyDown={(e) => handleKeyDown(e, "OutTime")}
                                    invalid={touched.OutTime && !!errors.OutTime}
                                    pattern="^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$"
                                    title="Format: HH:MM AM/PM (e.g., 09:00 AM, 06:30 PM)"
                                  />
                                )}
                                <ErrorMessage name="OutTime" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Max. Working Hours Full Day <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="text"
                                  name="MaxWorkingHoursFullDay"
                                  placeholder="Auto-filled from In/Out Time"
                                  value={values.MaxWorkingHoursFullDay}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  invalid={touched.MaxWorkingHoursFullDay && !!errors.MaxWorkingHoursFullDay}
                                  readOnly
                                  style={{ backgroundColor: "#f8f9fa" }}
                                />
                                <ErrorMessage name="MaxWorkingHoursFullDay" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Min. Working Hours Full Day <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="number"
                                  name="MinWorkingHoursFullDay"
                                  placeholder="Enter Min Working Hours Full Day"
                                  value={values.MinWorkingHoursFullDay}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "MinWorkingHoursFullDay")}
                                  invalid={touched.MinWorkingHoursFullDay && !!errors.MinWorkingHoursFullDay}
                                  step="0.01"
                                />
                                <ErrorMessage name="MinWorkingHoursFullDay" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Max. Working Hours (Half Day) <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="number"
                                  name="MaxWorkingHoursHalfDay"
                                  placeholder="Enter Max Working Hours Half Day"
                                  value={values.MaxWorkingHoursHalfDay}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "MaxWorkingHoursHalfDay")}
                                  invalid={touched.MaxWorkingHoursHalfDay && !!errors.MaxWorkingHoursHalfDay}
                                  step="0.01"
                                />
                                <ErrorMessage name="MaxWorkingHoursHalfDay" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Min. Working Hours (Half Day) <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="number"
                                  name="MinWorkingHoursHalfDay"
                                  placeholder="Enter Min Working Hours Half Day"
                                  value={values.MinWorkingHoursHalfDay}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "MinWorkingHoursHalfDay")}
                                  invalid={touched.MinWorkingHoursHalfDay && !!errors.MinWorkingHoursHalfDay}
                                  step="0.01"
                                />
                                <ErrorMessage name="MinWorkingHoursHalfDay" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Overtime Applicable <span className="text-danger">*</span>
                                </Label>
                                <div className="form-check form-switch">
                                  <Input
                                    type="checkbox"
                                    name="OverTimeApplicable"
                                    checked={values.OverTimeApplicable}
                                    onChange={(e) => setFieldValue("OverTimeApplicable", e.target.checked)}
                                    className="form-check-input"
                                    role="switch"
                                  />
                                  <Label check className="form-check-label">
                                    {values.OverTimeApplicable ? "Yes" : "No"}
                                  </Label>
                                </div>
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Grace Period Mins (Over Time) <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="number"
                                  name="GracePeriodMinsOverTime"
                                  placeholder="Enter Grace Period Mins"
                                  value={values.GracePeriodMinsOverTime}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "GracePeriodMinsOverTime")}
                                  invalid={touched.GracePeriodMinsOverTime && !!errors.GracePeriodMinsOverTime}
                                />
                                <ErrorMessage name="GracePeriodMinsOverTime" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Weekly Holiday <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="select"
                                  name="WeeklyHoliday"
                                  value={values.WeeklyHoliday}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "WeeklyHoliday")}
                                  className="btn-square"
                                  invalid={touched.WeeklyHoliday && !!errors.WeeklyHoliday}
                                >
                                  {daysOfWeek.map((day) => (
                                    <option key={day} value={day}>
                                      {day}
                                    </option>
                                  ))}
                                </Input>
                                <ErrorMessage name="WeeklyHoliday" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Max Allowed Leaves/Month <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="number"
                                  name="MaxAllowedLeavesPerMonth"
                                  placeholder="Enter Max Allowed Leaves/Month"
                                  value={values.MaxAllowedLeavesPerMonth}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "MaxAllowedLeavesPerMonth")}
                                  invalid={touched.MaxAllowedLeavesPerMonth && !!errors.MaxAllowedLeavesPerMonth}
                                />
                                <ErrorMessage name="MaxAllowedLeavesPerMonth" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                          </Row>
                        </TabPane>

                        {/* Tab 3: Employment Details */}
                        <TabPane tabId="3">
                          <Row className="mt-3">
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Department
                                </Label>
                                <Input
                                  type="select"
                                  name="F_Department"
                                  value={values.F_Department}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "F_Department")}
                                  className="btn-square"
                                  invalid={touched.F_Department && !!errors.F_Department}
                                >
                                  <option value="">Select Department</option>
                                  {state.DepartmentArray.map((item: any) => (
                                    <option key={item.Id} value={item.Id}>
                                      {item.Name || `Department ${item.Id}`}
                                    </option>
                                  ))}
                                </Input>
                                <ErrorMessage name="F_Department" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Designation
                                </Label>
                                <Input
                                  type="select"
                                  name="F_Designation"
                                  value={values.F_Designation}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "F_Designation")}
                                  className="btn-square"
                                  invalid={touched.F_Designation && !!errors.F_Designation}
                                >
                                  <option value="">Select Designation</option>
                                  {state.DesignationArray.map((item: any) => (
                                    <option key={item.Id} value={item.Id}>
                                      {item.Name || `Designation ${item.Id}`}
                                    </option>
                                  ))}
                                </Input>
                                <ErrorMessage name="F_Designation" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Salary Amount
                                </Label>
                                <Input
                                  type="number"
                                  name="SalaryAmount"
                                  placeholder="Enter Salary Amount"
                                  value={values.SalaryAmount}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "SalaryAmount")}
                                  invalid={touched.SalaryAmount && !!errors.SalaryAmount}
                                  step="0.01"
                                />
                                <ErrorMessage name="SalaryAmount" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Working Experience
                                </Label>
                                <Input
                                  type="text"
                                  name="WorkingExperience"
                                  placeholder="Enter Working Experience"
                                  value={values.WorkingExperience}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "WorkingExperience")}
                                  invalid={touched.WorkingExperience && !!errors.WorkingExperience}
                                />
                                <ErrorMessage name="WorkingExperience" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Skill Type
                                </Label>
                                <Input
                                  type="text"
                                  name="SkillType"
                                  placeholder="Enter Skill Type"
                                  value={values.SkillType}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "SkillType")}
                                  invalid={touched.SkillType && !!errors.SkillType}
                                />
                                <ErrorMessage name="SkillType" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Employment Nature
                                </Label>
                                <Input
                                  type="select"
                                  name="EmploymentNature"
                                  value={values.EmploymentNature}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "EmploymentNature")}
                                  className="btn-square"
                                  invalid={touched.EmploymentNature && !!errors.EmploymentNature}
                                >
                                  <option value="">Select</option>
                                  <option value="Permanent">Permanent</option>
                                  <option value="Temporary">Temporary</option>
                                </Input>
                                <ErrorMessage name="EmploymentNature" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                          </Row>
                        </TabPane>

                        {/* Tab 4: Financial & Bank Details */}
                        <TabPane tabId="4">
                          <Row className="mt-3">
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Employee ESIC No.
                                </Label>
                                <Input
                                  type="text"
                                  name="EmployeeESICNo"
                                  placeholder="Enter Employee ESIC No."
                                  value={values.EmployeeESICNo}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "EmployeeESICNo")}
                                  invalid={touched.EmployeeESICNo && !!errors.EmployeeESICNo}
                                />
                                <ErrorMessage name="EmployeeESICNo" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Employee PF No.
                                </Label>
                                <Input
                                  type="text"
                                  name="EmployeePFNo"
                                  placeholder="Enter Employee PF No."
                                  value={values.EmployeePFNo}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "EmployeePFNo")}
                                  invalid={touched.EmployeePFNo && !!errors.EmployeePFNo}
                                />
                                <ErrorMessage name="EmployeePFNo" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  ESIC IP No
                                </Label>
                                <Input
                                  type="text"
                                  name="ESICIPNo"
                                  placeholder="Enter ESIC IP No"
                                  value={values.ESICIPNo}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "ESICIPNo")}
                                  invalid={touched.ESICIPNo && !!errors.ESICIPNo}
                                />
                                <ErrorMessage name="ESICIPNo" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  UAN No
                                </Label>
                                <Input
                                  type="text"
                                  name="UANNo"
                                  placeholder="Enter UAN No"
                                  value={values.UANNo}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "UANNo")}
                                  invalid={touched.UANNo && !!errors.UANNo}
                                />
                                <ErrorMessage name="UANNo" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Aadhar Number
                                </Label>
                                <Input
                                  type="text"
                                  name="AadharNumber"
                                  placeholder="Enter Aadhar Number"
                                  value={values.AadharNumber}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "AadharNumber")}
                                  invalid={touched.AadharNumber && !!errors.AadharNumber}
                                  maxLength={12}
                                />
                                <ErrorMessage name="AadharNumber" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  PAN Number
                                </Label>
                                <Input
                                  type="text"
                                  name="PANNumber"
                                  placeholder="Enter PAN Number"
                                  value={values.PANNumber}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "PANNumber")}
                                  invalid={touched.PANNumber && !!errors.PANNumber}
                                  maxLength={10}
                                />
                                <ErrorMessage name="PANNumber" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Bank Name
                                </Label>
                                <Input
                                  type="text"
                                  name="BankName"
                                  placeholder="Enter Bank Name"
                                  value={values.BankName}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "BankName")}
                                  invalid={touched.BankName && !!errors.BankName}
                                />
                                <ErrorMessage name="BankName" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Bank A/C No
                                </Label>
                                <Input
                                  type="text"
                                  name="BankACNo"
                                  placeholder="Enter Bank A/C No"
                                  value={values.BankACNo}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "BankACNo")}
                                  invalid={touched.BankACNo && !!errors.BankACNo}
                                />
                                <ErrorMessage name="BankACNo" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Bank A/c Holder Name
                                </Label>
                                <Input
                                  type="text"
                                  name="BankACHolderName"
                                  placeholder="Enter Bank A/c Holder Name"
                                  value={values.BankACHolderName}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "BankACHolderName")}
                                  invalid={touched.BankACHolderName && !!errors.BankACHolderName}
                                />
                                <ErrorMessage name="BankACHolderName" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  IFCS Code
                                </Label>
                                <Input
                                  type="text"
                                  name="IFCSCode"
                                  placeholder="Enter IFCS Code"
                                  value={values.IFCSCode}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "IFCSCode")}
                                  invalid={touched.IFCSCode && !!errors.IFCSCode}
                                />
                                <ErrorMessage name="IFCSCode" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                          </Row>
                        </TabPane>

                        {/* Tab 5: Family & Nominee Details */}
                        <TabPane tabId="5">
                          <Row className="mt-3">
                            {/* Family Members Section */}
                            <Col xs="12" className="mt-4">
                              <div style={{ backgroundColor: "#f8f9fa", padding: "10px", borderRadius: "5px", marginBottom: "15px" }}>
                                <h6 className="mb-0">All Family Members List</h6>
                              </div>
                              <div className="table-responsive">
                                <table className="table table-bordered">
                                  <thead>
                                    <tr style={{ backgroundColor: "#f8f9fa" }}>
                                      <th style={{ width: "50px" }}>#</th>
                                      <th>Name</th>
                                      <th>Relation</th>
                                      <th style={{ width: "150px" }}>Date Of Birth</th>
                                      <th>Aadhar</th>
                                      <th style={{ width: "100px" }}>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {values.FamilyMembers.map((member, index) => (
                                      <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>
                                          <Input
                                            type="text"
                                            placeholder="Enter Name"
                                            value={member.Name}
                                            onChange={(e) => {
                                              const newMembers = [...values.FamilyMembers];
                                              newMembers[index].Name = e.target.value;
                                              setFieldValue("FamilyMembers", newMembers);
                                            }}
                                            onBlur={handleBlur}
                                          />
                                        </td>
                                        <td>
                                          <Input
                                            type="select"
                                            value={member.F_RelationType}
                                            onChange={(e) => {
                                              const newMembers = [...values.FamilyMembers];
                                              newMembers[index].F_RelationType = e.target.value;
                                              setFieldValue("FamilyMembers", newMembers);
                                            }}
                                            onBlur={handleBlur}
                                            className="btn-square"
                                          >
                                            <option value="">Select Relation</option>
                                            {state.RelationTypeArray.map((item: any) => (
                                              <option key={item.Id} value={item.Id}>
                                                {item.Name || `Relation ${item.Id}`}
                                              </option>
                                            ))}
                                          </Input>
                                        </td>
                                        <td>
                                          <Input
                                            type="date"
                                            value={member.DateOfBirth}
                                            onChange={(e) => {
                                              const newMembers = [...values.FamilyMembers];
                                              newMembers[index].DateOfBirth = e.target.value;
                                              setFieldValue("FamilyMembers", newMembers);
                                            }}
                                            onBlur={handleBlur}
                                            style={{ width: "100%" }}
                                          />
                                        </td>
                                        <td>
                                          <Input
                                            type="text"
                                            placeholder="Enter Aadhar"
                                            value={member.Aadhar}
                                            onChange={(e) => {
                                              const newMembers = [...values.FamilyMembers];
                                              newMembers[index].Aadhar = e.target.value;
                                              setFieldValue("FamilyMembers", newMembers);
                                            }}
                                            onBlur={handleBlur}
                                            maxLength={12}
                                          />
                                        </td>
                                        <td>
                                          <div className="d-flex gap-2 justify-content-center">
                                            <Btn
                                              color="success"
                                              size="sm"
                                              type="button"
                                              onClick={() => {
                                                const newMembers = [...values.FamilyMembers, { Name: "", F_RelationType: "", DateOfBirth: "", Aadhar: "" }];
                                                setFieldValue("FamilyMembers", newMembers);
                                              }}
                                            >
                                              <i className="fa fa-plus"></i>
                                            </Btn>
                                            {values.FamilyMembers.length > 1 && (
                                              <Btn
                                                color="danger"
                                                size="sm"
                                                type="button"
                                                onClick={() => {
                                                  const newMembers = values.FamilyMembers.filter((_, i) => i !== index);
                                                  setFieldValue("FamilyMembers", newMembers);
                                                }}
                                              >
                                                <i className="fa fa-minus"></i>
                                              </Btn>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </Col>

                            {/* Nominee Section */}
                            <Col xs="12" className="mt-4">
                              <div style={{ backgroundColor: "#f8f9fa", padding: "10px", borderRadius: "5px", marginBottom: "15px" }}>
                                <h6 className="mb-0">Nominee Details</h6>
                              </div>
                              <div className="table-responsive">
                                <table className="table table-bordered">
                                  <thead>
                                    <tr style={{ backgroundColor: "#f8f9fa" }}>
                                      <th style={{ width: "50px" }}>#</th>
                                      <th>Nominee Name</th>
                                      <th>Relation</th>
                                      <th style={{ width: "150px" }}>Date Of Birth</th>
                                      <th>Share %</th>
                                      <th style={{ width: "100px" }}>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {values.Nominees.map((nominee, index) => (
                                      <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>
                                          <Input
                                            type="text"
                                            placeholder="Enter Nominee Name"
                                            value={nominee.Name}
                                            onChange={(e) => {
                                              const newNominees = [...values.Nominees];
                                              newNominees[index].Name = e.target.value;
                                              setFieldValue("Nominees", newNominees);
                                            }}
                                            onBlur={handleBlur}
                                          />
                                        </td>
                                        <td>
                                          <Input
                                            type="select"
                                            value={nominee.F_RelationType}
                                            onChange={(e) => {
                                              const newNominees = [...values.Nominees];
                                              newNominees[index].F_RelationType = e.target.value;
                                              setFieldValue("Nominees", newNominees);
                                            }}
                                            onBlur={handleBlur}
                                            className="btn-square"
                                          >
                                            <option value="">Select Relation</option>
                                            {state.RelationTypeArray.map((item: any) => (
                                              <option key={item.Id} value={item.Id}>
                                                {item.Name || `Relation ${item.Id}`}
                                              </option>
                                            ))}
                                          </Input>
                                        </td>
                                        <td>
                                          <Input
                                            type="date"
                                            value={nominee.DateOfBirth}
                                            onChange={(e) => {
                                              const newNominees = [...values.Nominees];
                                              newNominees[index].DateOfBirth = e.target.value;
                                              setFieldValue("Nominees", newNominees);
                                            }}
                                            onBlur={handleBlur}
                                            style={{ width: "100%" }}
                                          />
                                        </td>
                                        <td>
                                          <Input
                                            type="number"
                                            placeholder="Enter Share %"
                                            value={nominee.SharePercentage}
                                            onChange={(e) => {
                                              const newNominees = [...values.Nominees];
                                              newNominees[index].SharePercentage = e.target.value;
                                              setFieldValue("Nominees", newNominees);
                                            }}
                                            onBlur={handleBlur}
                                            step="0.01"
                                            min="0"
                                            max="100"
                                          />
                                        </td>
                                        <td>
                                          <div className="d-flex gap-2 justify-content-center">
                                            <Btn
                                              color="success"
                                              size="sm"
                                              type="button"
                                              onClick={() => {
                                                const newNominees = [...values.Nominees, { Name: "", F_RelationType: "", DateOfBirth: "", SharePercentage: "" }];
                                                setFieldValue("Nominees", newNominees);
                                              }}
                                            >
                                              <i className="fa fa-plus"></i>
                                            </Btn>
                                            {values.Nominees.length > 1 && (
                                              <Btn
                                                color="danger"
                                                size="sm"
                                                type="button"
                                                onClick={() => {
                                                  const newNominees = values.Nominees.filter((_, i) => i !== index);
                                                  setFieldValue("Nominees", newNominees);
                                                }}
                                              >
                                                <i className="fa fa-minus"></i>
                                              </Btn>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </Col>

                            {/* Child Details Section */}
                            <Col xs="12" className="mt-4">
                              <div style={{ backgroundColor: "#f8f9fa", padding: "10px", borderRadius: "5px", marginBottom: "15px" }}>
                                <h6 className="mb-0">Child Details</h6>
                              </div>
                              <div className="table-responsive">
                                <table className="table table-bordered">
                                  <thead>
                                    <tr style={{ backgroundColor: "#f8f9fa" }}>
                                      <th style={{ width: "50px" }}>#</th>
                                      <th>Name</th>
                                      <th style={{ width: "150px" }}>Date Of Birth</th>
                                      <th style={{ width: "120px" }}>M/F</th>
                                      <th style={{ width: "100px" }}>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {values.Children.map((child, index) => (
                                      <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>
                                          <Input
                                            type="text"
                                            placeholder="Enter Name"
                                            value={child.Name}
                                            onChange={(e) => {
                                              const newChildren = [...values.Children];
                                              newChildren[index].Name = e.target.value;
                                              setFieldValue("Children", newChildren);
                                            }}
                                            onBlur={handleBlur}
                                          />
                                        </td>
                                        <td style={{ width: "150px" }}>
                                          <Input
                                            type="date"
                                            value={child.DateOfBirth}
                                            onChange={(e) => {
                                              const newChildren = [...values.Children];
                                              newChildren[index].DateOfBirth = e.target.value;
                                              setFieldValue("Children", newChildren);
                                            }}
                                            onBlur={handleBlur}
                                            style={{ width: "100%" }}
                                          />
                                        </td>
                                        <td style={{ width: "120px" }}>
                                          <Input
                                            type="select"
                                            value={child.Gender}
                                            onChange={(e) => {
                                              const newChildren = [...values.Children];
                                              newChildren[index].Gender = e.target.value;
                                              setFieldValue("Children", newChildren);
                                            }}
                                            onBlur={handleBlur}
                                            className="btn-square"
                                            style={{ width: "100%" }}
                                          >
                                            <option value="">Select</option>
                                            <option value="M">M</option>
                                            <option value="F">F</option>
                                          </Input>
                                        </td>
                                        <td>
                                          <div className="d-flex gap-2 justify-content-center">
                                            <Btn
                                              color="success"
                                              size="sm"
                                              type="button"
                                              onClick={() => {
                                                const newChildren = [...values.Children, { Name: "", DateOfBirth: "", Gender: "" }];
                                                setFieldValue("Children", newChildren);
                                              }}
                                            >
                                              <i className="fa fa-plus"></i>
                                            </Btn>
                                            {values.Children.length > 1 && (
                                              <Btn
                                                color="danger"
                                                size="sm"
                                                type="button"
                                                onClick={() => {
                                                  const newChildren = values.Children.filter((_, i) => i !== index);
                                                  setFieldValue("Children", newChildren);
                                                }}
                                              >
                                                <i className="fa fa-minus"></i>
                                              </Btn>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </Col>
                          </Row>
                        </TabPane>

                        {/* Tab 6: Qualification & Documents */}
                        <TabPane tabId="6">
                          <Row className="mt-3">
                            {/* Qualification Section */}
                            <Col xs="12" className="mt-4">
                              <h6 className="mb-3" style={{ backgroundColor: "#f8f9fa", padding: "10px", borderRadius: "5px" }}>
                                Qualification
                              </h6>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>Qualification</Label>
                                <Input
                                  type="text"
                                  name="Qualification"
                                  placeholder="Enter Qualification"
                                  value={values.Qualification}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "Qualification")}
                                />
                              </FormGroup>
                            </Col>

                            {/* Documents Section */}
                            <Col xs="12" className="mt-4">
                              <h6 className="mb-3" style={{ backgroundColor: "#f8f9fa", padding: "10px", borderRadius: "5px" }}>
                                Identity Confirmation
                              </h6>
                            </Col>
                            
                            {/* Aadhar Card */}
                            <Col md="6">
                              <FormGroup>
                                <Label>Aadhar Card</Label>
                                <Input
                                  type="text"
                                  name="DocumentNo1"
                                  placeholder="Enter Aadhar Card Number"
                                  value={values.DocumentNo1}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "DocumentNo1")}
                                  invalid={touched.DocumentNo1 && !!errors.DocumentNo1}
                                />
                                <ErrorMessage name="DocumentNo1" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>Aadhar Card Image</Label>
                                <Input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    setFiles((prev) => ({ ...prev, Document1: file }));
                                  }}
                                />
                                {files.Document1 && (
                                  <small className="text-muted d-block mt-1">
                                    Selected: {files.Document1.name}
                                  </small>
                                )}
                              </FormGroup>
                            </Col>

                            {/* PAN Card */}
                            <Col md="6">
                              <FormGroup>
                                <Label>PAN Card</Label>
                                <Input
                                  type="text"
                                  name="DocumentNo2"
                                  placeholder="Enter PAN Card Number"
                                  value={values.DocumentNo2}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "DocumentNo2")}
                                  invalid={touched.DocumentNo2 && !!errors.DocumentNo2}
                                />
                                <ErrorMessage name="DocumentNo2" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>PAN Card Image</Label>
                                <Input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    setFiles((prev) => ({ ...prev, Document2: file }));
                                  }}
                                />
                                {files.Document2 && (
                                  <small className="text-muted d-block mt-1">
                                    Selected: {files.Document2.name}
                                  </small>
                                )}
                              </FormGroup>
                            </Col>

                            {/* Employee Media */}
                            <Col md="6">
                              <FormGroup>
                                <Label>Employee Photo</Label>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    setFiles((prev) => ({ ...prev, EmployeePhoto: file }));
                                  }}
                                />
                                {files.EmployeePhoto && (
                                  <small className="text-muted d-block mt-1">
                                    Selected: {files.EmployeePhoto.name}
                                  </small>
                                )}
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>Employee Signature</Label>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    setFiles((prev) => ({ ...prev, EmployeeSignature: file }));
                                  }}
                                />
                                {files.EmployeeSignature && (
                                  <small className="text-muted d-block mt-1">
                                    Selected: {files.EmployeeSignature.name}
                                  </small>
                                )}
                              </FormGroup>
                            </Col>
                          </Row>
                        </TabPane>
                      </TabContent>
                    </CardBody>
                    <CardFooter className="text-start">
                      <Btn
                        color="secondary"
                        type="button"
                        className="me-2"
                        onClick={() => navigate("/employeeMaster")}
                      >
                        Cancel
                      </Btn>
                      {activeTab === "6" ? (
                        // Save button - Only on last tab, submits all tabs data at once
                        <Btn color="primary" type="submit">
                          {isEditMode ? "Update" : "Save"}
                        </Btn>
                      ) : (
                        // Next button - Only navigates to next tab, does NOT save data
                        <Btn
                          color="primary"
                          type="button"
                          onClick={(e) => {
                            e.preventDefault(); // Prevent any form submission
                            if (activeTab === "1") {
                              setActiveTab("2");
                            } else if (activeTab === "2") {
                              setActiveTab("3");
                            } else if (activeTab === "3") {
                              setActiveTab("4");
                            } else if (activeTab === "4") {
                              setActiveTab("5");
                            } else if (activeTab === "5") {
                              setActiveTab("6");
                            }
                          }}
                        >
                          Next
                        </Btn>
                      )}
                    </CardFooter>
                  </Card>
                </Form>
              )}
            </Formik>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default AddEdit_EmployeeMasterContainer;
