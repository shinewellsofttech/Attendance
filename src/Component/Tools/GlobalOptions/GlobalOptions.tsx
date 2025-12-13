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
import { Fn_FillListData, Fn_DisplayData, Fn_AddEditData } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";
import { convertTo12Hour, convertTo24Hour, formatTimeForAPI } from "../../../utils/timeFormatUtils";

interface FormValues {
  // Holidays
  Holidays: string;
  // Time Settings
  InTime: string;
  OutTime: string;
  // Working Hours
  MinWorkingHoursFullDay: string;
  MaxWorkingHoursFullDay: string;
  MinWorkingHoursHalfDay: string;
  MaxWorkingHoursHalfDay: string;
  // Checkboxes
  RailwayTime: boolean;
  OverTimeApply: boolean;
  CountNextDayIn: boolean;
  CountNextDayInHours: string;
  // Machine Settings
  MachineType: string;
  MachineName: string;
  MachineNo: string;
  IPAddress: string;
  PortNo: string;
}

const API_URL_SAVE = "GlobalOptions/0/token";
const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/GlobalOptions/Id/1";

const GlobalOptionsContainer = () => {
  const [state, setState] = useState({
    id: 0,
    formData: {} as any,
    isProgress: true,
    MachineTypeMaster: [] as any[],
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
      const fieldOrder = ["Holidays", "InTime", "OutTime", "MinWorkingHoursFullDay", "MinWorkingHoursHalfDay", "MaxWorkingHoursHalfDay", "CountNextDayInHours", "MachineType", "MachineName", "MachineNo", "IPAddress", "PortNo"];
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

    // Load MachineTypeMaster data for dropdown
    const API_URL_MACHINE_TYPE = `${API_WEB_URLS.MASTER}/0/token/MachineTypeMaster`;
    Fn_FillListData(dispatch, setState, "MachineTypeMaster", API_URL_MACHINE_TYPE + "/Id/0");

    // Load existing global options (assuming ID 1 for global settings)
    Fn_DisplayData(dispatch, setState, 1, API_URL_EDIT);
  }, [dispatch, navigate]);

  // Auto-focus on first field when form is ready
  useEffect(() => {
    if (!state.isProgress) {
      const timer = setTimeout(() => {
        const firstInput = document.querySelector('.theme-form select[name="Holidays"]') as HTMLSelectElement;
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [state.isProgress, state.formData]);


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
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      
      return `${hours}.${Math.round((minutes / 60) * 100)}`;
    } catch (e) {
      return "";
    }
  };

  const validationSchema = Yup.object({
    Holidays: Yup.string().required("Holidays is required"),
    InTime: Yup.string().required("In Time is required"),
    OutTime: Yup.string().required("Out Time is required"),
    MinWorkingHoursFullDay: Yup.string().required("Min Working Hours Full Day is required"),
    MaxWorkingHoursFullDay: Yup.string().required("Max Working Hours Full Day is required"),
    MinWorkingHoursHalfDay: Yup.string().required("Min Working Hours Half Day is required"),
    MaxWorkingHoursHalfDay: Yup.string().required("Max Working Hours Half Day is required"),
    CountNextDayInHours: Yup.string().when("CountNextDayIn", {
      is: true,
      then: (schema) => schema.required("Hours is required when Count Next Day IN is enabled"),
      otherwise: (schema) => schema,
    }),
    MachineType: Yup.string().required("Machine Type is required"),
    MachineName: Yup.string().required("Machine Name is required"),
    MachineNo: Yup.string().required("Machine No. is required"),
    IPAddress: Yup.string().required("IP Address is required"),
    PortNo: Yup.string().required("Port No is required"),
  });

  const handleSubmit = (values: FormValues) => {
    const obj = JSON.parse(localStorage.getItem("user") || "{}");
    let vformData = new FormData();

    // Holidays
    vformData.append("Holidays", values.Holidays || "");
    
    // Time Settings - Always send in 24-hour format
    vformData.append("InTime", formatTimeForAPI(values.InTime));
    vformData.append("OutTime", formatTimeForAPI(values.OutTime));
    
    // Working Hours
    vformData.append("MinWorkingHoursFullDay", values.MinWorkingHoursFullDay);
    vformData.append("MaxWorkingHoursFullDay", values.MaxWorkingHoursFullDay);
    vformData.append("MinWorkingHoursHalfDay", values.MinWorkingHoursHalfDay);
    vformData.append("MaxWorkingHoursHalfDay", values.MaxWorkingHoursHalfDay);
    
    // Checkboxes
    vformData.append("RailwayTime", values.RailwayTime ? "true" : "false");
    vformData.append("OverTimeApply", values.OverTimeApply ? "true" : "false");
    vformData.append("CountNextDayIn", values.CountNextDayIn ? "true" : "false");
    vformData.append("CountNextDayInHours", values.CountNextDayInHours || "0");
    
    // Machine Settings
    vformData.append("F_MachineTypeMaster", values.MachineType);
    vformData.append("MachineName", values.MachineName);
    vformData.append("MachineNo", values.MachineNo);
    vformData.append("IPAddress", values.IPAddress);
    vformData.append("PortNo", values.PortNo);
    
    vformData.append("UserId", obj === null || obj === undefined ? 0 : obj.uid);

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
        RailwayTime: values.RailwayTime,
        InTime: formatTimeForAPI(values.InTime),
        OutTime: formatTimeForAPI(values.OutTime),
        // Add other important settings if needed
      };
      localStorage.setItem("globalOptions", JSON.stringify(optionsToCache));
    });
  };

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Parse holidays from string or array
  const parseHolidays = (holidays: string | string[] | undefined): string => {
    if (!holidays) return "";
    if (Array.isArray(holidays)) return holidays[0] || "";
    if (typeof holidays === "string") {
      return holidays;
    }
    return "";
  };

  // Format time for display based on RailwayTime setting
  const formatTimeForDisplay = (time: string, isRailway: boolean): string => {
    if (!time) return "";
    if (isRailway) {
      // Return in 24-hour format
      return time.includes("AM") || time.includes("PM") ? convertTo24Hour(time) : time;
    } else {
      // Return in 12-hour format
      return time.includes("AM") || time.includes("PM") ? time : convertTo12Hour(time);
    }
  };

  const isRailwayTimeInitial = state.formData?.RailwayTime === true || 
                               state.formData?.RailwayTime === "true" || 
                               state.formData?.RailwayTime === 1;

  const initialValues: FormValues = {
    Holidays: parseHolidays(state.formData?.Holidays),
    InTime: formatTimeForDisplay(state.formData?.InTime || "", isRailwayTimeInitial),
    OutTime: formatTimeForDisplay(state.formData?.OutTime || "", isRailwayTimeInitial),
    MinWorkingHoursFullDay: state.formData?.MinWorkingHoursFullDay || "",
    MaxWorkingHoursFullDay: state.formData?.MaxWorkingHoursFullDay || calculateWorkingHours(state.formData?.InTime || "", state.formData?.OutTime || ""),
    MinWorkingHoursHalfDay: state.formData?.MinWorkingHoursHalfDay || "",
    MaxWorkingHoursHalfDay: state.formData?.MaxWorkingHoursHalfDay || "",
    RailwayTime: state.formData?.RailwayTime || false,
    OverTimeApply: state.formData?.OverTimeApply || false,
    CountNextDayIn: state.formData?.CountNextDayIn || false,
    CountNextDayInHours: state.formData?.CountNextDayInHours || "0",
    MachineType: state.formData?.F_MachineTypeMaster || state.formData?.MachineType || "",
    MachineName: state.formData?.MachineName || "",
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
                              name="Holidays"
                              value={values.Holidays}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "Holidays")}
                              className="btn-square"
                              invalid={touched.Holidays && !!errors.Holidays}
                            >
                              <option value="">Select Day</option>
                              {daysOfWeek.map((day) => (
                                <option key={day} value={day}>
                                  {day}
                                </option>
                              ))}
                            </Input>
                            <ErrorMessage name="Holidays" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>

                        {/* Time Settings */}
                        <Col md="3">
                          <FormGroup>
                            <Label>
                              In Time <span className="text-danger">*</span>
                            </Label>
                            {values.RailwayTime ? (
                              <Input
                                type="time"
                                name="InTime"
                                value={values.InTime}
                                onChange={(e) => {
                                  handleChange(e);
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
                                value={values.InTime.includes("AM") || values.InTime.includes("PM") 
                                  ? values.InTime 
                                  : convertTo12Hour(values.InTime)}
                                onChange={(e) => {
                                  const time24 = convertTo24Hour(e.target.value);
                                  setFieldValue("InTime", time24);
                                  if (values.OutTime) {
                                    const hours = calculateWorkingHours(time24, values.OutTime);
                                    if (hours) {
                                      setFieldValue("MaxWorkingHoursFullDay", hours);
                                    }
                                  }
                                }}
                                onBlur={(e) => {
                                  const time24 = convertTo24Hour(e.target.value);
                                  setFieldValue("InTime", time24);
                                  handleBlur(e);
                                }}
                                onKeyDown={(e) => handleKeyDown(e, "InTime")}
                                invalid={touched.InTime && !!errors.InTime}
                                pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]\\s?(AM|PM)$"
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
                            {values.RailwayTime ? (
                              <Input
                                type="time"
                                name="OutTime"
                                value={values.OutTime}
                                onChange={(e) => {
                                  handleChange(e);
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
                                value={values.OutTime.includes("AM") || values.OutTime.includes("PM") 
                                  ? values.OutTime 
                                  : convertTo12Hour(values.OutTime)}
                                onChange={(e) => {
                                  const time24 = convertTo24Hour(e.target.value);
                                  setFieldValue("OutTime", time24);
                                  if (values.InTime) {
                                    const hours = calculateWorkingHours(values.InTime, time24);
                                    if (hours) {
                                      setFieldValue("MaxWorkingHoursFullDay", hours);
                                    }
                                  }
                                }}
                                onBlur={(e) => {
                                  const time24 = convertTo24Hour(e.target.value);
                                  setFieldValue("OutTime", time24);
                                  handleBlur(e);
                                }}
                                onKeyDown={(e) => handleKeyDown(e, "OutTime")}
                                invalid={touched.OutTime && !!errors.OutTime}
                                pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]\\s?(AM|PM)$"
                                title="Format: HH:MM AM/PM (e.g., 09:00 AM, 06:30 PM)"
                              />
                            )}
                            <ErrorMessage name="OutTime" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>

                        {/* Working Hours */}
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Min Working Hours for Full day <span className="text-danger">*</span>
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
                              Max Working Hours for Full day <span className="text-danger">*</span>
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
                              Min Working Hours for Half day <span className="text-danger">*</span>
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
                              Max Working Hours for Half day <span className="text-danger">*</span>
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

                        {/* Checkboxes */}
                        <Col md="6">
                          <FormGroup>
                            <div className="form-check form-switch">
                              <Input
                                type="checkbox"
                                name="RailwayTime"
                                checked={values.RailwayTime}
                                onChange={(e) => {
                                  const isRailwayTime = e.target.checked;
                                  setFieldValue("RailwayTime", isRailwayTime);
                                  // Convert times when switching format
                                  if (values.InTime) {
                                    if (isRailwayTime) {
                                      // Switching to 24-hour: ensure it's in 24-hour format
                                      const inTime24 = values.InTime.includes("AM") || values.InTime.includes("PM") 
                                        ? convertTo24Hour(values.InTime) 
                                        : values.InTime;
                                      setFieldValue("InTime", inTime24);
                                    } else {
                                      // Switching to 12-hour: convert to 12-hour format
                                      const inTime12 = convertTo12Hour(values.InTime);
                                      setFieldValue("InTime", inTime12);
                                    }
                                  }
                                  if (values.OutTime) {
                                    if (isRailwayTime) {
                                      // Switching to 24-hour: ensure it's in 24-hour format
                                      const outTime24 = values.OutTime.includes("AM") || values.OutTime.includes("PM") 
                                        ? convertTo24Hour(values.OutTime) 
                                        : values.OutTime;
                                      setFieldValue("OutTime", outTime24);
                                    } else {
                                      // Switching to 12-hour: convert to 12-hour format
                                      const outTime12 = convertTo12Hour(values.OutTime);
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
                                name="OverTimeApply"
                                checked={values.OverTimeApply}
                                onChange={(e) => setFieldValue("OverTimeApply", e.target.checked)}
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
                                  name="CountNextDayInHours"
                                  value={values.CountNextDayInHours}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "CountNextDayInHours")}
                                  disabled={!values.CountNextDayIn}
                                  invalid={touched.CountNextDayInHours && !!errors.CountNextDayInHours}
                                  style={{ width: "100px" }}
                                />
                              </div>
                              <Label>Hours</Label>
                            </div>
                            <ErrorMessage name="CountNextDayInHours" component="div" className="text-danger small" />
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
                              name="MachineType"
                              value={values.MachineType}
                              onChange={(e) => {
                                handleChange(e);
                                // Auto-fill Machine Name when Machine Type is selected
                                const selectedMachineType = state.MachineTypeMaster.find(
                                  (item: any) => String(item.Id) === String(e.target.value)
                                );
                                if (selectedMachineType) {
                                  setFieldValue("MachineName", selectedMachineType.MachineName || "");
                                }
                              }}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "MachineType")}
                              className="btn-square"
                              invalid={touched.MachineType && !!errors.MachineType}
                            >
                              <option value="">Select Machine Type</option>
                              {state.MachineTypeMaster.map((item: any) => (
                                <option key={item.Id} value={item.Id}>
                                  {item.MachineType}
                                </option>
                              ))}
                            </Input>
                            <ErrorMessage name="MachineType" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="3">
                          <FormGroup>
                            <Label>
                              Machine Name <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="text"
                              name="MachineName"
                              placeholder="Auto-filled from Machine Type"
                              value={values.MachineName}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "MachineName")}
                              invalid={touched.MachineName && !!errors.MachineName}
                            />
                            <ErrorMessage name="MachineName" component="div" className="text-danger small" />
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

