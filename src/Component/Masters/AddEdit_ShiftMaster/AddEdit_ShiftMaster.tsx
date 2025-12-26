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
    // Check if user is admin (userType === 8)
    try {
      const storedUser = localStorage.getItem("authUser");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const userType = parsedUser?.F_UserType;
        if (userType !== 8) {
          navigate(`${process.env.PUBLIC_URL}/reports`, { replace: true });
          return;
        }
      } else {
        navigate(`${process.env.PUBLIC_URL}/reports`, { replace: true });
        return;
      }
    } catch (error) {
      console.error("Error parsing authUser from localStorage:", error);
      navigate(`${process.env.PUBLIC_URL}/reports`, { replace: true });
      return;
    }
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

  const validationSchema = Yup.object({
    Name: Yup.string().required("Name is required"),
    InTime: Yup.string().required("In Time is required"),
    OutTime: Yup.string().required("Out Time is required"),
    LunchInTime: Yup.string().required("Lunch In Time is required"),
    LunchOutTime: Yup.string().required("Lunch Out Time is required"),
    MaxWorkingMinutesFullDay: Yup.number().required("Max Working Minutes Full Day is required"),
    MinWorkingMinutesFullDay: Yup.number().required("Min Working Minutes Full Day is required"),
    MaxWorkingMinutesHalfDay: Yup.number().required("Max Working Minutes Half Day is required"),
    MinWorkingMinutesHalfDay: Yup.number().required("Min Working Minutes Half Day is required"),
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
    vformData.append("MaxWorkingMinutesFullDay", String(values.MaxWorkingMinutesFullDay || 0));
    vformData.append("MinWorkingMinutesFullDay", String(values.MinWorkingMinutesFullDay || 0));
    vformData.append("MaxWorkingMinutesHalfDay", String(values.MaxWorkingMinutesHalfDay || 0));
    vformData.append("MinWorkingMinutesHalfDay", String(values.MinWorkingMinutesHalfDay || 0));
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
  const formatTimeForDisplay = (time: string): string => {
    if (!time) return "";
    if (isRailwayTime) {
      // Return in 24-hour format
      return time.includes("AM") || time.includes("PM") ? convertTo24Hour(time) : time;
    } else {
      // Return in 12-hour format
      return time.includes("AM") || time.includes("PM") ? time : convertTo12Hour(time);
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
    MaxWorkingMinutesFullDay: state.formData?.MaxWorkingMinutesFullDay || (state.formData?.MaxWorkingHoursFullDay ? (parseFloat(state.formData?.MaxWorkingHoursFullDay) * 60) : calculateWorkingMinutes(parseTimeFromObject(state.formData?.InTime), parseTimeFromObject(state.formData?.OutTime))),
    MinWorkingMinutesFullDay: state.formData?.MinWorkingMinutesFullDay || (state.formData?.MinWorkingHoursFullDay ? (parseFloat(state.formData?.MinWorkingHoursFullDay) * 60) : 0),
    MaxWorkingMinutesHalfDay: state.formData?.MaxWorkingMinutesHalfDay || (state.formData?.MaxWorkingHoursHalfDay ? (parseFloat(state.formData?.MaxWorkingHoursHalfDay) * 60) : 0),
    MinWorkingMinutesHalfDay: state.formData?.MinWorkingMinutesHalfDay || (state.formData?.MinWorkingHoursHalfDay ? (parseFloat(state.formData?.MinWorkingHoursHalfDay) * 60) : 0),
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
                                value={values.InTime.includes("AM") || values.InTime.includes("PM") ? convertTo24Hour(values.InTime) : values.InTime}
                                onChange={(e) => {
                                  setFieldValue("InTime", e.target.value);
                                  if (values.OutTime) {
                                    const minutes = calculateWorkingMinutes(e.target.value, values.OutTime);
                                    if (minutes > 0) {
                                      setFieldValue("MaxWorkingMinutesFullDay", minutes);
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
                                value={
                                  values.InTime.includes("AM") || values.InTime.includes("PM") 
                                    ? values.InTime 
                                    : (values.InTime && values.InTime.includes(":") && values.InTime.split(":")[1] && values.InTime.split(":")[1].length === 2)
                                      ? convertTo12Hour(values.InTime)
                                      : values.InTime
                                }
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
                                    const outTime24 = values.OutTime.includes("AM") || values.OutTime.includes("PM") 
                                      ? convertTo24Hour(values.OutTime) 
                                      : values.OutTime;
                                    const minutes = calculateWorkingMinutes(time24, outTime24);
                                    if (minutes > 0) {
                                      setFieldValue("MaxWorkingMinutesFullDay", minutes);
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
                                value={values.OutTime.includes("AM") || values.OutTime.includes("PM") ? convertTo24Hour(values.OutTime) : values.OutTime}
                                onChange={(e) => {
                                  setFieldValue("OutTime", e.target.value);
                                  if (values.InTime) {
                                    const minutes = calculateWorkingMinutes(values.InTime, e.target.value);
                                    if (minutes > 0) {
                                      setFieldValue("MaxWorkingMinutesFullDay", minutes);
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
                                value={
                                  values.OutTime.includes("AM") || values.OutTime.includes("PM") 
                                    ? values.OutTime 
                                    : (values.OutTime && values.OutTime.includes(":") && values.OutTime.split(":")[1] && values.OutTime.split(":")[1].length === 2)
                                      ? convertTo12Hour(values.OutTime)
                                      : values.OutTime
                                }
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
                                    const inTime24 = values.InTime.includes("AM") || values.InTime.includes("PM") 
                                      ? convertTo24Hour(values.InTime) 
                                      : values.InTime;
                                    const minutes = calculateWorkingMinutes(inTime24, time24);
                                    if (minutes > 0) {
                                      setFieldValue("MaxWorkingMinutesFullDay", minutes);
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
                                value={values.LunchInTime.includes("AM") || values.LunchInTime.includes("PM") ? convertTo24Hour(values.LunchInTime) : values.LunchInTime}
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
                                value={
                                  values.LunchInTime.includes("AM") || values.LunchInTime.includes("PM") 
                                    ? values.LunchInTime 
                                    : (values.LunchInTime && values.LunchInTime.includes(":") && values.LunchInTime.split(":")[1] && values.LunchInTime.split(":")[1].length === 2)
                                      ? convertTo12Hour(values.LunchInTime)
                                      : values.LunchInTime
                                }
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
                                value={values.LunchOutTime.includes("AM") || values.LunchOutTime.includes("PM") ? convertTo24Hour(values.LunchOutTime) : values.LunchOutTime}
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
                                value={
                                  values.LunchOutTime.includes("AM") || values.LunchOutTime.includes("PM") 
                                    ? values.LunchOutTime 
                                    : (values.LunchOutTime && values.LunchOutTime.includes(":") && values.LunchOutTime.split(":")[1] && values.LunchOutTime.split(":")[1].length === 2)
                                      ? convertTo12Hour(values.LunchOutTime)
                                      : values.LunchOutTime
                                }
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
                              Max. Working Minutes Full Day <span className="text-danger">*</span>
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
                            />
                            <ErrorMessage name="MaxWorkingMinutesFullDay" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Min. Working Minutes Full Day <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="number"
                              name="MinWorkingMinutesFullDay"
                              placeholder="Enter Min Working Minutes Full Day"
                              value={values.MinWorkingMinutesFullDay}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "MinWorkingMinutesFullDay")}
                              invalid={touched.MinWorkingMinutesFullDay && !!errors.MinWorkingMinutesFullDay}
                            />
                            <ErrorMessage name="MinWorkingMinutesFullDay" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Max. Working Minutes (Half Day) <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="number"
                              name="MaxWorkingMinutesHalfDay"
                              placeholder="Enter Max Working Minutes Half Day"
                              value={values.MaxWorkingMinutesHalfDay}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "MaxWorkingMinutesHalfDay")}
                              invalid={touched.MaxWorkingMinutesHalfDay && !!errors.MaxWorkingMinutesHalfDay}
                            />
                            <ErrorMessage name="MaxWorkingMinutesHalfDay" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Min. Working Minutes (Half Day) <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="number"
                              name="MinWorkingMinutesHalfDay"
                              placeholder="Enter Min Working Minutes Half Day"
                              value={values.MinWorkingMinutesHalfDay}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "MinWorkingMinutesHalfDay")}
                              invalid={touched.MinWorkingMinutesHalfDay && !!errors.MinWorkingMinutesHalfDay}
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

