import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Formik, Form, ErrorMessage } from "formik";
import type { FormikProps } from "formik";
import * as Yup from "yup";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row } from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_AddEditData } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";
import { convertTo12Hour, convertTo24Hour, formatTimeForAPI } from "../../../utils/timeFormatUtils";

interface FormValues {
  // Holidays
  F_DayMaster: number | string;
  // Time Settings
  InTime: string;
  OutTime: string;
  // Working Minutes
  MinWorkingMinutesFullDay: number;
  MaxWorkingMinutesFullDay: number;
  MinWorkingMinutesHalfDay: number;
  MaxWorkingMinutesHalfDay: number;
  // Checkboxes
  IsRailwayTime: boolean;
  IsOverTimeApplicable: boolean;
  CountNextDayIn: boolean;
  CountNextDayAfterHours: number;
  // Machine Settings
  F_MachineTypeMaster: number | string;
  F_MachineMaster: number | string;
  MachineNo: string;
  IPAddress: string;
  PortNo: string;
}

const API_URL_SAVE = "GlobalOptions/0/token";
const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/GlobalOptions/Id";

const GlobalOptionsContainer = () => {
  const [state, setState] = useState({
    id: 0,
    formData: {} as any,
    isProgress: true,
    DayMaster: [] as any[],
    MachineTypeMaster: [] as any[],
    MachineMaster: [] as any[],
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Handle Enter key to move to next field
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>, currentFieldName: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (!form) return;

      // Define field order (excluding readonly and checkbox fields)
      const fieldOrder = ["F_DayMaster", "InTime", "OutTime", "MinWorkingMinutesFullDay", "MinWorkingMinutesHalfDay", "MaxWorkingMinutesHalfDay", "CountNextDayAfterHours", "F_MachineTypeMaster", "F_MachineMaster", "MachineNo", "IPAddress", "PortNo"];
      const currentIndex = fieldOrder.indexOf(currentFieldName);

      if (currentIndex < fieldOrder.length - 1) {
        // Move to next field
        const nextFieldName = fieldOrder[currentIndex + 1];
        const nextInput = form.querySelector(`input[name="${nextFieldName}"], select[name="${nextFieldName}"]`) as HTMLInputElement | HTMLSelectElement;
        if (nextInput) {
          // Check if it's an input and not readonly
          if (nextInput instanceof HTMLInputElement && !nextInput.readOnly) {
            nextInput.focus();
          } else if (nextInput instanceof HTMLSelectElement) {
            nextInput.focus();
          }
        }
      } else {
        // Last field, focus Save button
        const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
        if (submitButton) {
          submitButton.focus();
        }
      }
    }
  };

  useEffect(() => {
    // Load DayMaster data for dropdown
    const API_URL_DAY_MASTER = `${API_WEB_URLS.MASTER}/0/token/DayMaster`;
    Fn_FillListData(dispatch, setState, "DayMaster", API_URL_DAY_MASTER + "/Id/0");

    // Load MachineTypeMaster data for dropdown
    const API_URL_MACHINE_TYPE = `${API_WEB_URLS.MASTER}/0/token/MachineTypeMaster`;
    Fn_FillListData(dispatch, setState, "MachineTypeMaster", API_URL_MACHINE_TYPE + "/Id/0");

    // Load MachineMaster data for dropdown
    const API_URL_MACHINE_MASTER = `${API_WEB_URLS.MASTER}/0/token/MachineMaster`;
    Fn_FillListData(dispatch, setState, "MachineMaster", API_URL_MACHINE_MASTER + "/Id/0");

    // Load existing global options using Fn_FillListData (assuming ID 1 for global settings)
    setState((prevState) => ({
      ...prevState,
      id: 1,
    }));
    // Fn_FillListData will fetch data and store in GlobalOptionsArray, then extract first item as formData
    const API_URL_GLOBAL_OPTIONS = API_WEB_URLS.MASTER + "/0/token/GlobalOptions/Id/1";
    Fn_FillListData(dispatch, (prevState: any) => {
      // Handle both function and object forms of prevState
      const currentState = typeof prevState === "function" ? prevState({}) : prevState;
      const newState = { ...currentState };
      
      // Fn_FillListData sets data in GlobalOptionsArray, extract first item as formData
      if (newState.GlobalOptionsArray && Array.isArray(newState.GlobalOptionsArray) && newState.GlobalOptionsArray.length > 0) {
        newState.formData = newState.GlobalOptionsArray[0];
      }
      newState.isProgress = false;
      
      return newState;
    }, "GlobalOptionsArray", API_URL_GLOBAL_OPTIONS);
  }, [dispatch, navigate]);

  // Auto-focus on first field when form is ready
  useEffect(() => {
    if (!state.isProgress) {
      const timer = setTimeout(() => {
        const firstInput = document.querySelector('.theme-form select[name="F_DayMaster"]') as HTMLSelectElement;
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [state.isProgress, state.formData]);


  const calculateWorkingMinutes = (inTime: string, outTime: string): number => {
    if (!inTime || !outTime) return 0;
    try {
      // Convert to 24-hour format if needed
      const inTime24 = inTime.includes("AM") || inTime.includes("PM") ? convertTo24Hour(inTime) : inTime;
      const outTime24 = outTime.includes("AM") || outTime.includes("PM") ? convertTo24Hour(outTime) : outTime;
      
      const [inHours, inMinutes] = inTime24.split(":").map(Number);
      const [outHours, outMinutes] = outTime24.split(":").map(Number);
      
      const inTotalMinutes = inHours * 60 + inMinutes;
      const outTotalMinutes = outHours * 60 + outMinutes;
      
      const diffMinutes = outTotalMinutes - inTotalMinutes;
      return diffMinutes > 0 ? diffMinutes : 0;
    } catch (e) {
      return 0;
    }
  };

  const validationSchema = Yup.object({
    F_DayMaster: Yup.number().required("Holidays is required").min(1, "Please select a day"),
    InTime: Yup.string().required("In Time is required"),
    OutTime: Yup.string().required("Out Time is required"),
    MinWorkingMinutesFullDay: Yup.number().required("Min Working Hours Full Day is required").min(0),
    MaxWorkingMinutesFullDay: Yup.number().required("Max Working Hours Full Day is required").min(0),
    MinWorkingMinutesHalfDay: Yup.number().required("Min Working Hours Half Day is required").min(0),
    MaxWorkingMinutesHalfDay: Yup.number().required("Max Working Hours Half Day is required").min(0),
    CountNextDayAfterHours: Yup.number().when("CountNextDayIn", {
      is: true,
      then: (schema) => schema.required("Hours is required when Count Next Day IN is enabled").min(0),
      otherwise: (schema) => schema,
    }),
    F_MachineTypeMaster: Yup.number().required("Machine Type is required").min(1, "Please select a machine type"),
    F_MachineMaster: Yup.number().required("Machine is required").min(1, "Please select a machine"),
    MachineNo: Yup.string().required("Machine No. is required"),
    IPAddress: Yup.string().required("IP Address is required"),
    PortNo: Yup.string().required("Port No is required"),
  });

  const handleSubmit = (values: FormValues) => {
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

    let vformData = new FormData();

    // Holidays
    vformData.append("F_DayMaster", String(values.F_DayMaster || ""));
    
    // Time Settings - Always send in 24-hour format (e.g., '09:00')
    vformData.append("InTime", formatTimeForAPI(values.InTime));
    vformData.append("OutTime", formatTimeForAPI(values.OutTime));
    
    // Working Minutes - Convert hours to minutes before sending to backend
    vformData.append("MinWorkingMinutesFullDay", String(convertHoursToMinutes(values.MinWorkingMinutesFullDay)));
    vformData.append("MaxWorkingMinutesFullDay", String(convertHoursToMinutes(values.MaxWorkingMinutesFullDay)));
    vformData.append("MinWorkingMinutesHalfDay", String(convertHoursToMinutes(values.MinWorkingMinutesHalfDay)));
    vformData.append("MaxWorkingMinutesHalfDay", String(convertHoursToMinutes(values.MaxWorkingMinutesHalfDay)));
    
    // Checkboxes
    vformData.append("IsRailwayTime", values.IsRailwayTime ? "true" : "false");
    vformData.append("IsOverTimeApplicable", values.IsOverTimeApplicable ? "true" : "false");
    vformData.append("CountNextDayIn", values.CountNextDayIn ? "true" : "false");
    vformData.append("CountNextDayAfterHours", String(values.CountNextDayAfterHours || 0));
    
    // Machine Settings
    vformData.append("F_MachineTypeMaster", String(values.F_MachineTypeMaster || ""));
    vformData.append("F_MachineMaster", String(values.F_MachineMaster || ""));
    vformData.append("MachineNo", values.MachineNo || "");
    vformData.append("IPAddress", values.IPAddress || "");
    vformData.append("PortNo", values.PortNo || "");
    
    vformData.append("UserId", String(userId));

    Fn_AddEditData(
      dispatch,
      setState,
      { arguList: { id: state.id || 1, formData: vformData } },
      API_URL_SAVE,
      true,
      "memberid",
      navigate,
      "/globalOptions"
    ).then(() => {
      // Cache GlobalOptions in localStorage for RailwayTime access
      const optionsToCache = {
        RailwayTime: values.IsRailwayTime,
        InTime: formatTimeForAPI(values.InTime),
        OutTime: formatTimeForAPI(values.OutTime),
        // Add other important settings if needed
      };
      localStorage.setItem("globalOptions", JSON.stringify(optionsToCache));
    });
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
  const convertMinutesToHours = (minutes: string | number | undefined): number => {
    if (!minutes) return 0;
    if (typeof minutes === "number") return minutes / 60;
    try {
      const minutesNum = parseFloat(String(minutes));
      return minutesNum / 60;
    } catch (e) {
      return 0;
    }
  };

  // Helper function to safely convert time value to string
  const getTimeString = (time: any): string => {
    if (!time) return "";
    if (typeof time === "string") return time;
    if (typeof time === "object") {
      // If it's an object, try to extract time property
      if (time.time) return String(time.time);
      if (time.InTime) return String(time.InTime);
      if (time.OutTime) return String(time.OutTime);
      // If no time property, return empty string
      return "";
    }
    return String(time);
  };

  // Format time for display based on RailwayTime setting
  const formatTimeForDisplay = (time: any, isRailway: boolean): string => {
    const timeStr = getTimeString(time);
    if (!timeStr || timeStr === "undefined" || timeStr === "null") return "";
    if (isRailway) {
      // Return in 24-hour format
      return timeStr.includes("AM") || timeStr.includes("PM") ? convertTo24Hour(timeStr) : timeStr;
    } else {
      // Return in 12-hour format
      return timeStr.includes("AM") || timeStr.includes("PM") ? timeStr : convertTo12Hour(timeStr);
    }
  };

  const isRailwayTimeInitial = state.formData?.IsRailwayTime === true || 
                               state.formData?.IsRailwayTime === "true" || 
                               state.formData?.IsRailwayTime === 1 ||
                               state.formData?.RailwayTime === true || 
                               state.formData?.RailwayTime === "true" || 
                               state.formData?.RailwayTime === 1;


  const initialValues: FormValues = {
    F_DayMaster: state.formData?.F_DayMaster || state.formData?.Holidays || "",
    InTime: formatTimeForDisplay(state.formData?.InTime, isRailwayTimeInitial),
    OutTime: formatTimeForDisplay(state.formData?.OutTime, isRailwayTimeInitial),
    // Convert minutes to hours for display
    MinWorkingMinutesFullDay: convertMinutesToHours(state.formData?.MinWorkingMinutesFullDay || 
                              convertHoursToMinutes(state.formData?.MinWorkingHoursFullDay) || 0),
    MaxWorkingMinutesFullDay: convertMinutesToHours(state.formData?.MaxWorkingMinutesFullDay || 
                              (state.formData?.MaxWorkingHoursFullDay 
                                ? convertHoursToMinutes(state.formData.MaxWorkingHoursFullDay)
                                : calculateWorkingMinutes(state.formData?.InTime || "", state.formData?.OutTime || "")) || 0),
    MinWorkingMinutesHalfDay: convertMinutesToHours(state.formData?.MinWorkingMinutesHalfDay || 
                              convertHoursToMinutes(state.formData?.MinWorkingHoursHalfDay) || 0),
    MaxWorkingMinutesHalfDay: convertMinutesToHours(state.formData?.MaxWorkingMinutesHalfDay || 
                              convertHoursToMinutes(state.formData?.MaxWorkingHoursHalfDay) || 0),
    IsRailwayTime: state.formData?.IsRailwayTime !== undefined 
                   ? (state.formData.IsRailwayTime === true || state.formData.IsRailwayTime === "true" || state.formData.IsRailwayTime === 1)
                   : (state.formData?.RailwayTime === true || state.formData?.RailwayTime === "true" || state.formData?.RailwayTime === 1 || false),
    IsOverTimeApplicable: state.formData?.IsOverTimeApplicable !== undefined
                          ? (state.formData.IsOverTimeApplicable === true || state.formData.IsOverTimeApplicable === "true" || state.formData.IsOverTimeApplicable === 1)
                          : (state.formData?.OverTimeApply === true || state.formData?.OverTimeApply === "true" || state.formData?.OverTimeApply === 1 || false),
    CountNextDayIn: state.formData?.CountNextDayIn || false,
    CountNextDayAfterHours: state.formData?.CountNextDayAfterHours || state.formData?.CountNextDayInHours || 0,
    F_MachineTypeMaster: state.formData?.F_MachineTypeMaster || state.formData?.MachineType || "",
    F_MachineMaster: state.formData?.F_MachineMaster || state.formData?.MachineName || "",
    MachineNo: state.formData?.MachineNo || "",
    IPAddress: state.formData?.IPAddress || "",
    PortNo: state.formData?.PortNo || "",
  };

  return (
    <>
      <style>{`
        .theme-form input[type="text"],
        .theme-form input[type="time"],
        .theme-form input[type="number"] {
          color: #000000 !important;
        }
        body.dark-only .theme-form input[type="text"],
        body.dark-only .theme-form input[type="time"],
        body.dark-only .theme-form input[type="number"] {
          color: #ffffff !important;
        }
        .theme-form input[type="time"]::-webkit-calendar-picker-indicator {
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
      <Breadcrumbs mainTitle="Global Options" parent="Tools" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Formik<FormValues>
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ values, handleChange, handleBlur, errors, touched, setFieldValue }: FormikProps<FormValues>) => {
                // Get filtered MachineMaster list based on selected MachineType
                const filteredMachineMaster = values.F_MachineTypeMaster 
                  ? state.MachineMaster.filter((machine: any) => 
                      String(machine.F_MachineTypeMaster) === String(values.F_MachineTypeMaster)
                    )
                  : [];

                return (
                <Form className="theme-form">
                  <Card>
                    <CardHeaderCommon
                      title="Global Options"
                      tagClass="card-title mb-0"
                    />
                    <CardBody>
                      <Row>
                        {/* Holidays Section */}
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Holidays <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="select"
                              name="F_DayMaster"
                              value={values.F_DayMaster}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "F_DayMaster")}
                              className="btn-square"
                              invalid={touched.F_DayMaster && !!errors.F_DayMaster}
                            >
                              <option value="">Select Day</option>
                              {state.DayMaster.map((day: any) => (
                                <option key={day.Id} value={day.Id}>
                                  {day.Name || day.DayName || `Day ${day.Id}`}
                                </option>
                              ))}
                            </Input>
                            <ErrorMessage name="F_DayMaster" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>

                        {/* Time Settings */}
                        <Col md="3">
                          <FormGroup>
                            <Label>
                              In Time <span className="text-danger">*</span>
                            </Label>
                            {values.IsRailwayTime ? (
                              <Input
                                type="time"
                                name="InTime"
                                value={(() => {
                                  const timeStr = getTimeString(values.InTime);
                                  if (!timeStr) return "";
                                  return timeStr.includes("AM") || timeStr.includes("PM") ? convertTo24Hour(timeStr) : timeStr;
                                })()}
                                onChange={(e) => {
                                  setFieldValue("InTime", e.target.value);
                                  if (values.OutTime) {
                                    const outTime24 = typeof values.OutTime === "string" && (values.OutTime.includes("AM") || values.OutTime.includes("PM")) 
                                      ? convertTo24Hour(values.OutTime) 
                                      : (values.OutTime || "");
                                    const minutes = calculateWorkingMinutes(e.target.value, outTime24);
                                    if (minutes > 0) {
                                      setFieldValue("MaxWorkingMinutesFullDay", convertMinutesToHours(minutes));
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
                                  const timeStr = getTimeString(values.InTime);
                                  if (!timeStr) return "";
                                  // If it's already in 12-hour format (AM/PM), return as is
                                  if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;
                                  // If it's a complete 24-hour time (HH:MM format, length 5), convert to 12-hour
                                  if (timeStr.includes(":") && timeStr.split(":")[1] && timeStr.split(":")[1].length === 2 && timeStr.length === 5) {
                                    return convertTo12Hour(timeStr);
                                  }
                                  // If it's incomplete, show raw input so user can continue typing
                                  return timeStr;
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
                                    const minutes = calculateWorkingMinutes(time24, outTime24);
                                    if (minutes > 0) {
                                      setFieldValue("MaxWorkingMinutesFullDay", convertMinutesToHours(minutes));
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
                        <Col md="3">
                          <FormGroup>
                            <Label>
                              Out Time <span className="text-danger">*</span>
                            </Label>
                            {values.IsRailwayTime ? (
                              <Input
                                type="time"
                                name="OutTime"
                                value={(() => {
                                  const timeStr = getTimeString(values.OutTime);
                                  if (!timeStr) return "";
                                  return timeStr.includes("AM") || timeStr.includes("PM") ? convertTo24Hour(timeStr) : timeStr;
                                })()}
                                onChange={(e) => {
                                  setFieldValue("OutTime", e.target.value);
                                  if (values.InTime) {
                                    const inTime24 = typeof values.InTime === "string" && (values.InTime.includes("AM") || values.InTime.includes("PM")) 
                                      ? convertTo24Hour(values.InTime) 
                                      : (values.InTime || "");
                                    const minutes = calculateWorkingMinutes(inTime24, e.target.value);
                                    if (minutes > 0) {
                                      setFieldValue("MaxWorkingMinutesFullDay", convertMinutesToHours(minutes));
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
                                  const timeStr = getTimeString(values.OutTime);
                                  if (!timeStr) return "";
                                  // If it's already in 12-hour format (AM/PM), return as is
                                  if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;
                                  // If it's a complete 24-hour time (HH:MM format, length 5), convert to 12-hour
                                  if (timeStr.includes(":") && timeStr.split(":")[1] && timeStr.split(":")[1].length === 2 && timeStr.length === 5) {
                                    return convertTo12Hour(timeStr);
                                  }
                                  // If it's incomplete, show raw input so user can continue typing
                                  return timeStr;
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
                                    const minutes = calculateWorkingMinutes(inTime24, time24);
                                    if (minutes > 0) {
                                      setFieldValue("MaxWorkingMinutesFullDay", convertMinutesToHours(minutes));
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

                        {/* Working Minutes */}
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Min Working Hours for Full day <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="number"
                              name="MinWorkingMinutesFullDay"
                              placeholder="Enter Min Working Hours Full Day"
                              value={values.MinWorkingMinutesFullDay}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "MinWorkingMinutesFullDay")}
                              invalid={touched.MinWorkingMinutesFullDay && !!errors.MinWorkingMinutesFullDay}
                              min="0"
                              step="0.01"
                            />
                            <ErrorMessage name="MinWorkingMinutesFullDay" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Max Working Hours for Full day <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="number"
                              name="MaxWorkingMinutesFullDay"
                              placeholder="Auto-filled from In/Out Time"
                              value={values.MaxWorkingMinutesFullDay}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              invalid={touched.MaxWorkingMinutesFullDay && !!errors.MaxWorkingMinutesFullDay}
                              readOnly
                              style={{ backgroundColor: "#f8f9fa" }}
                              min="0"
                              step="0.01"
                            />
                            <ErrorMessage name="MaxWorkingMinutesFullDay" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Min Working Hours for Half day <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="number"
                              name="MinWorkingMinutesHalfDay"
                              placeholder="Enter Min Working Hours Half Day"
                              value={values.MinWorkingMinutesHalfDay}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "MinWorkingMinutesHalfDay")}
                              invalid={touched.MinWorkingMinutesHalfDay && !!errors.MinWorkingMinutesHalfDay}
                              min="0"
                              step="0.01"
                            />
                            <ErrorMessage name="MinWorkingMinutesHalfDay" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Max Working Hours for Half day <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="number"
                              name="MaxWorkingMinutesHalfDay"
                              placeholder="Enter Max Working Hours Half Day"
                              value={values.MaxWorkingMinutesHalfDay}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "MaxWorkingMinutesHalfDay")}
                              invalid={touched.MaxWorkingMinutesHalfDay && !!errors.MaxWorkingMinutesHalfDay}
                              min="0"
                              step="0.01"
                            />
                            <ErrorMessage name="MaxWorkingMinutesHalfDay" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>

                        {/* Checkboxes */}
                        <Col md="6">
                          <FormGroup>
                            <div className="form-check form-switch">
                              <Input
                                type="checkbox"
                                name="IsRailwayTime"
                                checked={values.IsRailwayTime}
                                onChange={(e) => {
                                  const isRailwayTime = e.target.checked;
                                  setFieldValue("IsRailwayTime", isRailwayTime);
                                  // Convert times when switching format
                                  if (values.InTime) {
                                    if (isRailwayTime) {
                                      // Switching to 24-hour: ensure it's in 24-hour format
                                      const inTime24 = typeof values.InTime === "string" && (values.InTime.includes("AM") || values.InTime.includes("PM")) 
                                        ? convertTo24Hour(values.InTime) 
                                        : (values.InTime || "");
                                      setFieldValue("InTime", inTime24);
                                    } else {
                                      // Switching to 12-hour: convert to 12-hour format
                                      const inTimeStr = typeof values.InTime === "string" ? values.InTime : String(values.InTime || "");
                                      const inTime12 = convertTo12Hour(inTimeStr);
                                      setFieldValue("InTime", inTime12);
                                    }
                                  }
                                  if (values.OutTime) {
                                    if (isRailwayTime) {
                                      // Switching to 24-hour: ensure it's in 24-hour format
                                      const outTime24 = typeof values.OutTime === "string" && (values.OutTime.includes("AM") || values.OutTime.includes("PM")) 
                                        ? convertTo24Hour(values.OutTime) 
                                        : (values.OutTime || "");
                                      setFieldValue("OutTime", outTime24);
                                    } else {
                                      // Switching to 12-hour: convert to 12-hour format
                                      const outTimeStr = typeof values.OutTime === "string" ? values.OutTime : String(values.OutTime || "");
                                      const outTime12 = convertTo12Hour(outTimeStr);
                                      setFieldValue("OutTime", outTime12);
                                    }
                                  }
                                }}
                                className="form-check-input"
                                role="switch"
                              />
                              <Label check className="form-check-label">
                                Railway Time
                              </Label>
                            </div>
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <div className="form-check form-switch">
                              <Input
                                type="checkbox"
                                name="IsOverTimeApplicable"
                                checked={values.IsOverTimeApplicable}
                                onChange={(e) => setFieldValue("IsOverTimeApplicable", e.target.checked)}
                                className="form-check-input"
                                role="switch"
                              />
                              <Label check className="form-check-label">
                                Over Time Apply
                              </Label>
                            </div>
                          </FormGroup>
                        </Col>

                        {/* Count Next Day IN */}
                        <Col md="12">
                          <FormGroup>
                            <div className="d-flex align-items-center gap-3">
                              <div className="form-check">
                                <Input
                                  type="checkbox"
                                  name="CountNextDayIn"
                                  checked={values.CountNextDayIn}
                                  onChange={(e) => setFieldValue("CountNextDayIn", e.target.checked)}
                                  className="form-check-input"
                                />
                                <Label check className="form-check-label">
                                  Count Next DAY IN if Employee not Check Out after
                                </Label>
                              </div>
                              <div style={{ minWidth: "100px" }}>
                                <Input
                                  type="number"
                                  name="CountNextDayAfterHours"
                                  value={values.CountNextDayAfterHours}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "CountNextDayAfterHours")}
                                  disabled={!values.CountNextDayIn}
                                  invalid={touched.CountNextDayAfterHours && !!errors.CountNextDayAfterHours}
                                  style={{ width: "100px" }}
                                  min="0"
                                />
                              </div>
                              <Label>Hours</Label>
                            </div>
                            <ErrorMessage name="CountNextDayAfterHours" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>

                        {/* Machine Settings */}
                        <Col xs="12" className="mt-4">
                          <h6 className="mb-3" style={{ backgroundColor: "#f8f9fa", padding: "10px", borderRadius: "5px" }}>
                            Machine Settings
                          </h6>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Machine Type <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="select"
                              name="F_MachineTypeMaster"
                              value={values.F_MachineTypeMaster}
                              onChange={(e) => {
                                handleChange(e);
                                // Clear Machine selection when Machine Type changes
                                setFieldValue("F_MachineMaster", "");
                              }}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "F_MachineTypeMaster")}
                              className="btn-square"
                              invalid={touched.F_MachineTypeMaster && !!errors.F_MachineTypeMaster}
                            >
                              <option value="">Select Machine Type</option>
                              {state.MachineTypeMaster.map((item: any) => (
                                <option key={item.Id} value={item.Id}>
                                  {item.Name || item.MachineType || `Machine Type ${item.Id}`}
                                </option>
                              ))}
                            </Input>
                            <ErrorMessage name="F_MachineTypeMaster" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Machine <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="select"
                              name="F_MachineMaster"
                              value={values.F_MachineMaster}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "F_MachineMaster")}
                              className="btn-square"
                              invalid={touched.F_MachineMaster && !!errors.F_MachineMaster}
                              disabled={!values.F_MachineTypeMaster}
                            >
                              <option value="">Select Machine</option>
                              {filteredMachineMaster.map((machine: any) => (
                                <option key={machine.Id} value={machine.Id}>
                                  {machine.Name || `Machine ${machine.Id}`}
                                </option>
                              ))}
                            </Input>
                            <ErrorMessage name="F_MachineMaster" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="3">
                          <FormGroup>
                            <Label>
                              Machine No. <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="text"
                              name="MachineNo"
                              placeholder="Enter Machine No."
                              value={values.MachineNo}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "MachineNo")}
                              invalid={touched.MachineNo && !!errors.MachineNo}
                            />
                            <ErrorMessage name="MachineNo" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              IP Address <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="text"
                              name="IPAddress"
                              placeholder="Enter IP Address"
                              value={values.IPAddress}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "IPAddress")}
                              invalid={touched.IPAddress && !!errors.IPAddress}
                            />
                            <ErrorMessage name="IPAddress" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Port No <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="text"
                              name="PortNo"
                              placeholder="Enter Port No"
                              value={values.PortNo}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "PortNo")}
                              invalid={touched.PortNo && !!errors.PortNo}
                            />
                            <ErrorMessage name="PortNo" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                      </Row>
                    </CardBody>
                    <CardFooter className="text-end">
                      <Btn color="primary" type="submit">
                        Save
                      </Btn>
                    </CardFooter>
                  </Card>
                </Form>
                );
              }}
            </Formik>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default GlobalOptionsContainer;

