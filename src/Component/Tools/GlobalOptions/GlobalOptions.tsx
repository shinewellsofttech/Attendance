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
interface FormValues {
  // Holidays
  HolidayDay: number | string;
  // Shift
  F_ShiftMaster: number | string;
  // Working Hours
  MinWorkingHoursFullDay: number;
  MaxWorkingHoursFullDay: number;
  MinWorkingHoursHalfDay: number;
  MaxWorkingHoursHalfDay: number;
  // Checkboxes
  IsRailwayTime: boolean;
  IsOverTimeApply: boolean;
  CountNextDayInAfterHours: number;
  // Machine Settings
  F_MachineType: number | string;
  F_MachineId: number | string;
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
    ShiftMaster: [] as any[],
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
      const fieldOrder = ["HolidayDay", "F_ShiftMaster", "MinWorkingHoursFullDay", "MinWorkingHoursHalfDay", "MaxWorkingHoursHalfDay", "CountNextDayInAfterHours", "F_MachineType", "F_MachineId", "MachineNo", "IPAddress", "PortNo"];
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

    // Load ShiftMaster data for dropdown
    const API_URL_SHIFT_MASTER = `${API_WEB_URLS.MASTER}/0/token/ShiftMaster`;
    Fn_FillListData(dispatch, setState, "ShiftMaster", API_URL_SHIFT_MASTER + "/Id/0");

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
    
    // Use promise to get data directly
    Fn_FillListData(dispatch, setState, "GlobalOptionsArray", API_URL_GLOBAL_OPTIONS)
      .then((dataList: any) => {
        if (dataList && Array.isArray(dataList) && dataList.length > 0) {
          const formData = dataList[0];
          setState((prevState: any) => ({
            ...prevState,
            formData: formData,
            isProgress: false,
          }));
        } else {
          setState((prevState: any) => ({
            ...prevState,
            isProgress: false,
          }));
        }
      })
      .catch((error: any) => {
        console.error("Error loading GlobalOptions:", error);
        setState((prevState: any) => ({
          ...prevState,
          isProgress: false,
        }));
      });
  }, [dispatch, navigate]);

  // Auto-focus on first field when form is ready
  useEffect(() => {
    if (!state.isProgress) {
      const timer = setTimeout(() => {
        const firstInput = document.querySelector('.theme-form select[name="HolidayDay"]') as HTMLSelectElement;
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [state.isProgress, state.formData]);


  const validationSchema = Yup.object({
    HolidayDay: Yup.string().required("Holiday Day is required"),
    F_ShiftMaster: Yup.number().required("Shift is required").min(1, "Please select a shift"),
    MinWorkingHoursFullDay: Yup.number().required("Min Working Hours Full Day is required").min(0),
    MaxWorkingHoursFullDay: Yup.number().required("Max Working Hours Full Day is required").min(0),
    MinWorkingHoursHalfDay: Yup.number().required("Min Working Hours Half Day is required").min(0),
    MaxWorkingHoursHalfDay: Yup.number().required("Max Working Hours Half Day is required").min(0),
    CountNextDayInAfterHours: Yup.number().min(0, "Hours must be 0 or greater"),
    F_MachineType: Yup.number().required("Machine Type is required").min(1, "Please select a machine type"),
    F_MachineId: Yup.number().required("Machine is required").min(1, "Please select a machine"),
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
    vformData.append("HolidayDay", String(values.HolidayDay || ""));
    
    // Shift
    vformData.append("F_ShiftMaster", String(values.F_ShiftMaster || ""));
    
    // Working Hours - Backend expects hours (Decimal)
    vformData.append("MinWorkingHoursFullDay", String(values.MinWorkingHoursFullDay || 0));
    vformData.append("MaxWorkingHoursFullDay", String(values.MaxWorkingHoursFullDay || 0));
    vformData.append("MinWorkingHoursHalfDay", String(values.MinWorkingHoursHalfDay || 0));
    vformData.append("MaxWorkingHoursHalfDay", String(values.MaxWorkingHoursHalfDay || 0));
    
    // Checkboxes
    vformData.append("IsRailwayTime", values.IsRailwayTime ? "true" : "false");
    vformData.append("IsOverTimeApply", values.IsOverTimeApply ? "true" : "false");
    vformData.append("CountNextDayInAfterHours", String(values.CountNextDayInAfterHours || 0));
    
    // Machine Settings
    vformData.append("F_MachineType", String(values.F_MachineType || ""));
    vformData.append("F_MachineId", String(values.F_MachineId || ""));
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
        // Add other important settings if needed
      };
      localStorage.setItem("globalOptions", JSON.stringify(optionsToCache));
    });
  };


  const initialValues: FormValues = {
    // HolidayDay can be string or number, convert to string for select
    HolidayDay: state.formData?.HolidayDay 
      ? String(state.formData.HolidayDay) 
      : (state.formData?.F_DayMaster ? String(state.formData.F_DayMaster) : ""),
    // F_ShiftMaster should be number or string
    F_ShiftMaster: state.formData?.F_ShiftMaster 
      ? (typeof state.formData.F_ShiftMaster === "number" ? state.formData.F_ShiftMaster : Number(state.formData.F_ShiftMaster) || "")
      : "",
    // Working Hours - ensure numbers
    MinWorkingHoursFullDay: state.formData?.MinWorkingHoursFullDay 
      ? Number(state.formData.MinWorkingHoursFullDay) 
      : 0,
    MaxWorkingHoursFullDay: state.formData?.MaxWorkingHoursFullDay 
      ? Number(state.formData.MaxWorkingHoursFullDay) 
      : 0,
    MinWorkingHoursHalfDay: state.formData?.MinWorkingHoursHalfDay 
      ? Number(state.formData.MinWorkingHoursHalfDay) 
      : 0,
    MaxWorkingHoursHalfDay: state.formData?.MaxWorkingHoursHalfDay 
      ? Number(state.formData.MaxWorkingHoursHalfDay) 
      : 0,
    // Checkboxes - handle boolean conversion
    IsRailwayTime: state.formData?.IsRailwayTime !== undefined 
                   ? (state.formData.IsRailwayTime === true || state.formData.IsRailwayTime === "true" || state.formData.IsRailwayTime === 1)
                   : false,
    IsOverTimeApply: state.formData?.IsOverTimeApply !== undefined
                     ? (state.formData.IsOverTimeApply === true || state.formData.IsOverTimeApply === "true" || state.formData.IsOverTimeApply === 1)
                     : (state.formData?.IsOverTimeApplicable === true || state.formData?.IsOverTimeApplicable === "true" || state.formData?.IsOverTimeApplicable === 1 || false),
    // CountNextDayInAfterHours - ensure number
    CountNextDayInAfterHours: state.formData?.CountNextDayInAfterHours !== undefined
      ? Number(state.formData.CountNextDayInAfterHours)
      : (state.formData?.CountNextDayAfterHours !== undefined ? Number(state.formData.CountNextDayAfterHours) : 0),
    // Machine Type and Id - convert to number or string
    F_MachineType: state.formData?.F_MachineType !== undefined
      ? (typeof state.formData.F_MachineType === "number" ? state.formData.F_MachineType : Number(state.formData.F_MachineType) || "")
      : (state.formData?.F_MachineTypeMaster !== undefined 
          ? (typeof state.formData.F_MachineTypeMaster === "number" ? state.formData.F_MachineTypeMaster : Number(state.formData.F_MachineTypeMaster) || "")
          : ""),
    F_MachineId: state.formData?.F_MachineId !== undefined
      ? (typeof state.formData.F_MachineId === "number" ? state.formData.F_MachineId : Number(state.formData.F_MachineId) || "")
      : (state.formData?.F_MachineMaster !== undefined
          ? (typeof state.formData.F_MachineMaster === "number" ? state.formData.F_MachineMaster : Number(state.formData.F_MachineMaster) || "")
          : ""),
    // String fields
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
                const filteredMachineMaster = values.F_MachineType 
                  ? state.MachineMaster.filter((machine: any) => 
                      String(machine.F_MachineTypeMaster) === String(values.F_MachineType)
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
                              Holiday Day <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="select"
                              name="HolidayDay"
                              value={values.HolidayDay}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "HolidayDay")}
                              className="btn-square"
                              invalid={touched.HolidayDay && !!errors.HolidayDay}
                            >
                              <option value="">Select Day</option>
                              {state.DayMaster.map((day: any) => (
                                <option key={day.Id} value={day.Id}>
                                  {day.Name || day.DayName || `Day ${day.Id}`}
                                </option>
                              ))}
                            </Input>
                            <ErrorMessage name="HolidayDay" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>

                        {/* Shift Section */}
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Shift <span className="text-danger">*</span>
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
                              {state.ShiftMaster.map((shift: any) => (
                                <option key={shift.Id} value={shift.Id}>
                                  {shift.Name || shift.ShiftName || `Shift ${shift.Id}`}
                                </option>
                              ))}
                            </Input>
                            <ErrorMessage name="F_ShiftMaster" component="div" className="text-danger small" />
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
                              min="0"
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
                              type="number"
                              name="MaxWorkingHoursFullDay"
                              placeholder="Enter Max Working Hours Full Day"
                              value={values.MaxWorkingHoursFullDay}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "MaxWorkingHoursFullDay")}
                              invalid={touched.MaxWorkingHoursFullDay && !!errors.MaxWorkingHoursFullDay}
                              min="0"
                              step="0.01"
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
                              min="0"
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
                              min="0"
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
                                name="IsRailwayTime"
                                checked={values.IsRailwayTime}
                                onChange={(e) => setFieldValue("IsRailwayTime", e.target.checked)}
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
                                name="IsOverTimeApply"
                                checked={values.IsOverTimeApply}
                                onChange={(e) => setFieldValue("IsOverTimeApply", e.target.checked)}
                                className="form-check-input"
                                role="switch"
                              />
                              <Label check className="form-check-label">
                                Over Time Apply
                              </Label>
                            </div>
                          </FormGroup>
                        </Col>

                        {/* Count Next Day IN After Hours */}
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Count Next Day IN After Hours
                            </Label>
                            <Input
                              type="number"
                              name="CountNextDayInAfterHours"
                              placeholder="Enter Hours"
                              value={values.CountNextDayInAfterHours}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "CountNextDayInAfterHours")}
                              invalid={touched.CountNextDayInAfterHours && !!errors.CountNextDayInAfterHours}
                              min="0"
                            />
                            <ErrorMessage name="CountNextDayInAfterHours" component="div" className="text-danger small" />
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
                              name="F_MachineType"
                              value={values.F_MachineType}
                              onChange={(e) => {
                                handleChange(e);
                                // Clear Machine selection when Machine Type changes
                                setFieldValue("F_MachineId", "");
                              }}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "F_MachineType")}
                              className="btn-square"
                              invalid={touched.F_MachineType && !!errors.F_MachineType}
                            >
                              <option value="">Select Machine Type</option>
                              {state.MachineTypeMaster.map((item: any) => (
                                <option key={item.Id} value={item.Id}>
                                  {item.Name || item.MachineType || `Machine Type ${item.Id}`}
                                </option>
                              ))}
                            </Input>
                            <ErrorMessage name="F_MachineType" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Machine <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="select"
                              name="F_MachineId"
                              value={values.F_MachineId}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "F_MachineId")}
                              className="btn-square"
                              invalid={touched.F_MachineId && !!errors.F_MachineId}
                              disabled={!values.F_MachineType}
                            >
                              <option value="">Select Machine</option>
                              {filteredMachineMaster.map((machine: any) => (
                                <option key={machine.Id} value={machine.Id}>
                                  {machine.Name || `Machine ${machine.Id}`}
                                </option>
                              ))}
                            </Input>
                            <ErrorMessage name="F_MachineId" component="div" className="text-danger small" />
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

