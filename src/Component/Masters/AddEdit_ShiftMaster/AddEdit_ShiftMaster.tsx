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
  MaxWorkingHoursFullDay: string;
  MinWorkingHoursFullDay: string;
  MaxWorkingHoursHalfDay: string;
  MinWorkingHoursHalfDay: string;
  OverTimeApplicable: boolean;
  GracePeriodMinsOverTime: string;
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

      // Define field order (including MaxWorkingHoursFullDay even though it's readonly, and OvertimeApplicable checkbox)
      const fieldOrder = ["Name", "InTime", "OutTime", "LunchInTime", "LunchOutTime", "MaxWorkingHoursFullDay", "MinWorkingHoursFullDay", "MaxWorkingHoursHalfDay", "MinWorkingHoursHalfDay", "GracePeriodMinsOverTime", "OverTimeApplicable"];
      const currentIndex = fieldOrder.indexOf(currentFieldName);

      if (currentIndex < fieldOrder.length - 1) {
        // Move to next field
        const nextFieldName = fieldOrder[currentIndex + 1];
        // Handle checkbox fields differently
        if (nextFieldName === "OverTimeApplicable") {
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
    Name: Yup.string().required("Name is required"),
    InTime: Yup.string().required("In Time is required"),
    OutTime: Yup.string().required("Out Time is required"),
    LunchInTime: Yup.string().required("Lunch In Time is required"),
    LunchOutTime: Yup.string().required("Lunch Out Time is required"),
    MaxWorkingHoursFullDay: Yup.string().required("Max Working Hours Full Day is required"),
    MinWorkingHoursFullDay: Yup.string().required("Min Working Hours Full Day is required"),
    MaxWorkingHoursHalfDay: Yup.string().required("Max Working Hours Half Day is required"),
    MinWorkingHoursHalfDay: Yup.string().required("Min Working Hours Half Day is required"),
    GracePeriodMinsOverTime: Yup.string().required("Grace Period Mins (Over Time) is required"),
  });

  const handleSubmit = (values: FormValues) => {
    const obj = JSON.parse(localStorage.getItem("user") || "{}");
    let vformData = new FormData();

    vformData.append("Name", values.Name);
    vformData.append("InTime", formatTimeForAPI(values.InTime));
    vformData.append("OutTime", formatTimeForAPI(values.OutTime));
    vformData.append("LunchInTime", formatTimeForAPI(values.LunchInTime));
    vformData.append("LunchOutTime", formatTimeForAPI(values.LunchOutTime));
    vformData.append("MaxWorkingHoursFullDay", values.MaxWorkingHoursFullDay);
    vformData.append("MinWorkingHoursFullDay", values.MinWorkingHoursFullDay);
    vformData.append("MaxWorkingHoursHalfDay", values.MaxWorkingHoursHalfDay);
    vformData.append("MinWorkingHoursHalfDay", values.MinWorkingHoursHalfDay);
    vformData.append("OverTimeApplicable", values.OverTimeApplicable ? "true" : "false");
    vformData.append("GracePeriodMinsOverTime", values.GracePeriodMinsOverTime);
    vformData.append("UserId", obj === null || obj === undefined ? 0 : obj.uid);

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
  
  const initialValues: FormValues = {
    Name: state.formData?.Name || "",
    InTime: formatTimeForDisplay(state.formData?.InTime || ""),
    OutTime: formatTimeForDisplay(state.formData?.OutTime || ""),
    LunchInTime: formatTimeForDisplay(state.formData?.LunchInTime || ""),
    LunchOutTime: formatTimeForDisplay(state.formData?.LunchOutTime || ""),
    MaxWorkingHoursFullDay: state.formData?.MaxWorkingHoursFullDay || calculateWorkingHours(state.formData?.InTime || "", state.formData?.OutTime || ""),
    MinWorkingHoursFullDay: state.formData?.MinWorkingHoursFullDay || "",
    MaxWorkingHoursHalfDay: state.formData?.MaxWorkingHoursHalfDay || "",
    MinWorkingHoursHalfDay: state.formData?.MinWorkingHoursHalfDay || "",
    OverTimeApplicable: state.formData?.OverTimeApplicable || false,
    GracePeriodMinsOverTime: state.formData?.GracePeriodMinsOverTime || "",
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
                                value={values.InTime.includes("AM") || values.InTime.includes("PM") ? values.InTime : convertTo12Hour(values.InTime)}
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
                                value={values.OutTime.includes("AM") || values.OutTime.includes("PM") ? values.OutTime : convertTo12Hour(values.OutTime)}
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
                                value={values.LunchInTime.includes("AM") || values.LunchInTime.includes("PM") ? values.LunchInTime : convertTo12Hour(values.LunchInTime)}
                                onChange={(e) => {
                                  const time24 = convertTo24Hour(e.target.value);
                                  setFieldValue("LunchInTime", time24);
                                }}
                                onBlur={(e) => {
                                  const time24 = convertTo24Hour(e.target.value);
                                  setFieldValue("LunchInTime", time24);
                                  handleBlur(e);
                                }}
                                onKeyDown={(e) => handleKeyDown(e, "LunchInTime")}
                                invalid={touched.LunchInTime && !!errors.LunchInTime}
                                pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]\\s?(AM|PM)$"
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
                                value={values.LunchOutTime.includes("AM") || values.LunchOutTime.includes("PM") ? values.LunchOutTime : convertTo12Hour(values.LunchOutTime)}
                                onChange={(e) => {
                                  const time24 = convertTo24Hour(e.target.value);
                                  setFieldValue("LunchOutTime", time24);
                                }}
                                onBlur={(e) => {
                                  const time24 = convertTo24Hour(e.target.value);
                                  setFieldValue("LunchOutTime", time24);
                                  handleBlur(e);
                                }}
                                onKeyDown={(e) => handleKeyDown(e, "LunchOutTime")}
                                invalid={touched.LunchOutTime && !!errors.LunchOutTime}
                                pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]\\s?(AM|PM)$"
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
                              type="text"
                              name="MaxWorkingHoursFullDay"
                              placeholder="Auto-filled from In/Out Time"
                              value={values.MaxWorkingHoursFullDay}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "MaxWorkingHoursFullDay")}
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
                              Grace period  <span className="text-danger">*</span>
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
                              Overtime Applicable <span className="text-danger">*</span>
                            </Label>
                            <div className="form-check form-switch">
                              <Input
                                type="checkbox"
                                name="OverTimeApplicable"
                                checked={values.OverTimeApplicable}
                                onChange={(e) => setFieldValue("OverTimeApplicable", e.target.checked)}
                                onKeyDown={(e) => handleKeyDown(e, "OverTimeApplicable")}
                                className="form-check-input"
                                role="switch"
                              />
                              <Label check className="form-check-label">
                                {values.OverTimeApplicable ? "Yes" : "No"}
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

