import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Formik, Form, ErrorMessage } from "formik";
import type { FormikProps } from "formik";
import * as Yup from "yup";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row } from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_DisplayData, Fn_AddEditData } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";
import { useRailwayTime } from "../../../hooks/useRailwayTime";
import { convertTo12Hour, convertTo24Hour, formatTimeForAPI } from "../../../utils/timeFormatUtils";

interface FormValues {
  Name: string;
  InTime: string;
  OutTime: string;
  LunchInTime: string;
  LunchOutTime: string;
  MaxWorkingMinutesFullDay: number | string;
  MinWorkingMinutesFullDay: number | string;
  MaxWorkingMinutesHalfDay: number | string;
  MinWorkingMinutesHalfDay: number | string;
  IsOvertimeApplicable: boolean;
  GracePeriodMinutes: number | string;
}

const API_URL_SAVE = "ShiftMaster/0/token";
const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/ShiftMaster/Id";

const AddEdit_ShiftMasterContainer = () => {
  const [state, setState] = useState({
    id: 0,
    FillArray: [],
    formData: {} as any,
    OtherDataScore: [],
    isProgress: true,
  });

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const isRailwayTime = useRailwayTime();

  // Handle Enter key to move to next field
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentFieldName: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (!form) return;

      // Define field order
      const fieldOrder = ["Name", "InTime", "OutTime", "LunchInTime", "LunchOutTime", "MaxWorkingMinutesFullDay", "MinWorkingMinutesFullDay", "MaxWorkingMinutesHalfDay", "MinWorkingMinutesHalfDay", "GracePeriodMinutes", "IsOvertimeApplicable"];
      const currentIndex = fieldOrder.indexOf(currentFieldName);

      if (currentIndex < fieldOrder.length - 1) {
        // Move to next field
        const nextFieldName = fieldOrder[currentIndex + 1];
        // Handle checkbox fields differently
        if (nextFieldName === "IsOvertimeApplicable") {
          const nextCheckbox = form.querySelector(`input[name="${nextFieldName}"][type="checkbox"]`) as HTMLInputElement;
          if (nextCheckbox) {
            nextCheckbox.focus();
          }
        } else {
          const nextInput = form.querySelector(`input[name="${nextFieldName}"]`) as HTMLInputElement;
          if (nextInput) {
            // Allow focus even on readonly fields (like MaxWorkingHoursFullDay)
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
        const firstInput = document.querySelector('.theme-form input[name="Name"]') as HTMLInputElement;
        if (firstInput && !firstInput.readOnly) {
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
      return diffMinutes;
    } catch (e) {
      return 0;
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

  const validationSchema = Yup.object({
    Name: Yup.string().required("Name is required"),
    InTime: Yup.string().required("In Time is required"),
    OutTime: Yup.string().required("Out Time is required"),
    LunchInTime: Yup.string().required("Lunch In Time is required"),
    LunchOutTime: Yup.string().required("Lunch Out Time is required"),
    MaxWorkingMinutesFullDay: Yup.number().required("Max Working Hours Full Day is required"),
    MinWorkingMinutesFullDay: Yup.number().required("Min Working Hours Full Day is required"),
    MaxWorkingMinutesHalfDay: Yup.number().required("Max Working Hours Half Day is required"),
    MinWorkingMinutesHalfDay: Yup.number().required("Min Working Hours Half Day is required"),
    GracePeriodMinutes: Yup.number().required("Grace Period Minutes is required"),
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
    vformData.append("Name", values.Name);
    // Time fields in 24-hour format (e.g., '09:00')
    vformData.append("InTime", formatTimeForAPI(values.InTime));
    vformData.append("OutTime", formatTimeForAPI(values.OutTime));
    vformData.append("LunchInTime", formatTimeForAPI(values.LunchInTime));
    vformData.append("LunchOutTime", formatTimeForAPI(values.LunchOutTime));
    // Convert hours to minutes before sending to backend
    vformData.append("MaxWorkingMinutesFullDay", String(convertHoursToMinutes(values.MaxWorkingMinutesFullDay)));
    vformData.append("MinWorkingMinutesFullDay", String(convertHoursToMinutes(values.MinWorkingMinutesFullDay)));
    vformData.append("MaxWorkingMinutesHalfDay", String(convertHoursToMinutes(values.MaxWorkingMinutesHalfDay)));
    vformData.append("MinWorkingMinutesHalfDay", String(convertHoursToMinutes(values.MinWorkingMinutesHalfDay)));
    vformData.append("IsOvertimeApplicable", values.IsOvertimeApplicable ? "true" : "false");
    vformData.append("GracePeriodMinutes", String(values.GracePeriodMinutes || 0));
    vformData.append("UserId", String(userId));

    Fn_AddEditData(
      dispatch,
      setState,
      { arguList: { id: state.id, formData: vformData } },
      API_URL_SAVE,
      true,
      "memberid",
      navigate,
      "/shiftMaster"
    );
  };

  const isEditMode = state.id > 0;
  
  // Format time for display based on RailwayTime setting
  const formatTimeForDisplay = (time: any): string => {
    if (!time) return "";
    // Convert to string if not already
    const timeStr = typeof time === "string" ? time : String(time);
    if (!timeStr || timeStr === "undefined" || timeStr === "null") return "";
    if (isRailwayTime) {
      // Return in 24-hour format (convert from 12-hour if needed)
      return timeStr.includes("AM") || timeStr.includes("PM") ? convertTo24Hour(timeStr) : timeStr;
    } else {
      // Return in 12-hour format (convert from 24-hour if needed)
      return timeStr.includes("AM") || timeStr.includes("PM") ? timeStr : convertTo12Hour(timeStr);
    }
  };
  
  // Parse time from object if needed
  const parseTimeFromObject = (timeData: any): string => {
    if (!timeData) return "";
    if (typeof timeData === "string") return timeData;
    if (typeof timeData === "object" && timeData.time) return timeData.time;
    if (typeof timeData === "object" && timeData.InTime) return timeData.InTime;
    return "";
  };

  const initialValues: FormValues = {
    Name: state.formData?.Name || "",
    InTime: formatTimeForDisplay(parseTimeFromObject(state.formData?.InTime)),
    OutTime: formatTimeForDisplay(parseTimeFromObject(state.formData?.OutTime)),
    LunchInTime: formatTimeForDisplay(parseTimeFromObject(state.formData?.LunchInTime)),
    LunchOutTime: formatTimeForDisplay(parseTimeFromObject(state.formData?.LunchOutTime)),
    // Convert minutes to hours for display
    MaxWorkingMinutesFullDay: convertMinutesToHours(state.formData?.MaxWorkingMinutesFullDay || (state.formData?.MaxWorkingHoursFullDay ? (parseFloat(state.formData?.MaxWorkingHoursFullDay) * 60) : calculateWorkingMinutes(parseTimeFromObject(state.formData?.InTime), parseTimeFromObject(state.formData?.OutTime)))),
    MinWorkingMinutesFullDay: convertMinutesToHours(state.formData?.MinWorkingMinutesFullDay || (state.formData?.MinWorkingHoursFullDay ? (parseFloat(state.formData?.MinWorkingHoursFullDay) * 60) : 0)),
    MaxWorkingMinutesHalfDay: convertMinutesToHours(state.formData?.MaxWorkingMinutesHalfDay || (state.formData?.MaxWorkingHoursHalfDay ? (parseFloat(state.formData?.MaxWorkingHoursHalfDay) * 60) : 0)),
    MinWorkingMinutesHalfDay: convertMinutesToHours(state.formData?.MinWorkingMinutesHalfDay || (state.formData?.MinWorkingHoursHalfDay ? (parseFloat(state.formData?.MinWorkingHoursHalfDay) * 60) : 0)),
    IsOvertimeApplicable: state.formData?.IsOvertimeApplicable !== undefined ? state.formData.IsOvertimeApplicable : (state.formData?.OverTimeApplicable || false),
    GracePeriodMinutes: state.formData?.GracePeriodMinutes || state.formData?.GracePeriodMinsOverTime || 0,
  };

  return (
    <>
      <style>{`
        .theme-form input[type="text"],
        .theme-form input[type="time"] {
          color: #000000 !important;
        }
        body.dark-only .theme-form input[type="text"],
        body.dark-only .theme-form input[type="time"] {
          color: #ffffff !important;
        }
        .theme-form input[type="time"] {
          position: relative;
        }
        .theme-form input[type="time"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 1;
        }
        .theme-form input[type="number"] {
          color: #000000 !important;
        }
        body.dark-only .theme-form input[type="number"] {
          color: #ffffff !important;
        }
      `}</style>
      <Breadcrumbs mainTitle="Shift Master" parent="Masters" />
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
                      title={`${isEditMode ? "Edit" : "Add"} Shift Master`}
                      tagClass="card-title mb-0"
                    />
                    <CardBody>
                      <Row>
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
                                    const minutes = calculateWorkingMinutes(e.target.value, values.OutTime);
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
                                    const minutes = calculateWorkingMinutes(values.InTime, e.target.value);
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
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Lunch In Time <span className="text-danger">*</span>
                            </Label>
                            {isRailwayTime ? (
                              <Input
                                type="time"
                                name="LunchInTime"
                                value={typeof values.LunchInTime === "string" && (values.LunchInTime.includes("AM") || values.LunchInTime.includes("PM")) ? convertTo24Hour(values.LunchInTime) : (values.LunchInTime || "")}
                                onChange={(e) => setFieldValue("LunchInTime", e.target.value)}
                                onBlur={handleBlur}
                                onKeyDown={(e) => handleKeyDown(e, "LunchInTime")}
                                invalid={touched.LunchInTime && !!errors.LunchInTime}
                              />
                            ) : (
                              <Input
                                type="text"
                                name="LunchInTime"
                                placeholder="HH:MM AM/PM"
                                value={(() => {
                                  if (typeof values.LunchInTime !== "string") return "";
                                  // If it's already in 12-hour format (AM/PM), return as is
                                  if (values.LunchInTime.includes("AM") || values.LunchInTime.includes("PM")) return values.LunchInTime;
                                  // If it's a complete 24-hour time (HH:MM format, length 5), convert to 12-hour
                                  if (values.LunchInTime.includes(":") && values.LunchInTime.split(":")[1] && values.LunchInTime.split(":")[1].length === 2 && values.LunchInTime.length === 5) {
                                    return convertTo12Hour(values.LunchInTime);
                                  }
                                  // If it's incomplete, show raw input so user can continue typing
                                  return values.LunchInTime;
                                })()}
                                onChange={(e) => {
                                  // Store raw input while typing, convert on blur
                                  setFieldValue("LunchInTime", e.target.value);
                                }}
                                onBlur={(e) => {
                                  const time24 = convertTo24Hour(e.target.value);
                                  // Convert back to 12-hour format for display and pattern validation
                                  const time12 = convertTo12Hour(time24);
                                  setFieldValue("LunchInTime", time12);
                                  handleBlur(e);
                                }}
                                onKeyDown={(e) => handleKeyDown(e, "LunchInTime")}
                                invalid={touched.LunchInTime && !!errors.LunchInTime}
                                pattern="^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$"
                                title="Format: HH:MM AM/PM (e.g., 09:00 AM, 06:30 PM)"
                              />
                            )}
                            <ErrorMessage name="LunchInTime" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Lunch Out Time <span className="text-danger">*</span>
                            </Label>
                            {isRailwayTime ? (
                              <Input
                                type="time"
                                name="LunchOutTime"
                                value={typeof values.LunchOutTime === "string" && (values.LunchOutTime.includes("AM") || values.LunchOutTime.includes("PM")) ? convertTo24Hour(values.LunchOutTime) : (values.LunchOutTime || "")}
                                onChange={(e) => setFieldValue("LunchOutTime", e.target.value)}
                                onBlur={handleBlur}
                                onKeyDown={(e) => handleKeyDown(e, "LunchOutTime")}
                                invalid={touched.LunchOutTime && !!errors.LunchOutTime}
                              />
                            ) : (
                              <Input
                                type="text"
                                name="LunchOutTime"
                                placeholder="HH:MM AM/PM"
                                value={(() => {
                                  if (typeof values.LunchOutTime !== "string") return "";
                                  // If it's already in 12-hour format (AM/PM), return as is
                                  if (values.LunchOutTime.includes("AM") || values.LunchOutTime.includes("PM")) return values.LunchOutTime;
                                  // If it's a complete 24-hour time (HH:MM format, length 5), convert to 12-hour
                                  if (values.LunchOutTime.includes(":") && values.LunchOutTime.split(":")[1] && values.LunchOutTime.split(":")[1].length === 2 && values.LunchOutTime.length === 5) {
                                    return convertTo12Hour(values.LunchOutTime);
                                  }
                                  // If it's incomplete, show raw input so user can continue typing
                                  return values.LunchOutTime;
                                })()}
                                onChange={(e) => {
                                  // Store raw input while typing, convert on blur
                                  setFieldValue("LunchOutTime", e.target.value);
                                }}
                                onBlur={(e) => {
                                  const time24 = convertTo24Hour(e.target.value);
                                  // Convert back to 12-hour format for display and pattern validation
                                  const time12 = convertTo12Hour(time24);
                                  setFieldValue("LunchOutTime", time12);
                                  handleBlur(e);
                                }}
                                onKeyDown={(e) => handleKeyDown(e, "LunchOutTime")}
                                invalid={touched.LunchOutTime && !!errors.LunchOutTime}
                                pattern="^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$"
                                title="Format: HH:MM AM/PM (e.g., 09:00 AM, 06:30 PM)"
                              />
                            )}
                            <ErrorMessage name="LunchOutTime" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Max. Working Hours Full Day <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="number"
                              name="MaxWorkingMinutesFullDay"
                              placeholder="Auto-filled from In/Out Time"
                              value={values.MaxWorkingMinutesFullDay}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "MaxWorkingMinutesFullDay")}
                              invalid={touched.MaxWorkingMinutesFullDay && !!errors.MaxWorkingMinutesFullDay}
                              readOnly
                              style={{ backgroundColor: "#f8f9fa" }}
                              step="0.01"
                            />
                            <ErrorMessage name="MaxWorkingMinutesFullDay" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Min. Working Hours Full Day <span className="text-danger">*</span>
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
                              step="0.01"
                            />
                            <ErrorMessage name="MinWorkingMinutesFullDay" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Max. Working Hours (Half Day) <span className="text-danger">*</span>
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
                              step="0.01"
                            />
                            <ErrorMessage name="MaxWorkingMinutesHalfDay" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Min. Working Hours (Half Day) <span className="text-danger">*</span>
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
                              step="0.01"
                            />
                            <ErrorMessage name="MinWorkingMinutesHalfDay" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Grace Period Minutes <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="number"
                              name="GracePeriodMinutes"
                              placeholder="Enter Grace Period Minutes"
                              value={values.GracePeriodMinutes}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "GracePeriodMinutes")}
                              invalid={touched.GracePeriodMinutes && !!errors.GracePeriodMinutes}
                            />
                            <ErrorMessage name="GracePeriodMinutes" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Is Overtime Applicable <span className="text-danger">*</span>
                            </Label>
                            <div className="form-check form-switch">
                              <Input
                                type="checkbox"
                                name="IsOvertimeApplicable"
                                checked={values.IsOvertimeApplicable}
                                onChange={(e) => setFieldValue("IsOvertimeApplicable", e.target.checked)}
                                onKeyDown={(e) => handleKeyDown(e, "IsOvertimeApplicable")}
                                className="form-check-input"
                                role="switch"
                              />
                              <Label check className="form-check-label">
                                {values.IsOvertimeApplicable ? "Yes" : "No"}
                              </Label>
                            </div>
                          </FormGroup>
                        </Col>
                      </Row>
                    </CardBody>
                    <CardFooter className="text-end">
                      <Btn
                        color="secondary"
                        type="button"
                        className="me-2"
                        onClick={() => navigate("/shiftMaster")}
                      >
                        Cancel
                      </Btn>
                      <Btn color="primary" type="submit">
                        {isEditMode ? "Update" : "Submit"}
                      </Btn>
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

export default AddEdit_ShiftMasterContainer;

