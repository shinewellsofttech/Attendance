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

interface FormValues {
  LeaveName: string;
  Code: string;
  PayType: string; // "Paid" or "Unpaid" (will convert to number)
  Description: string;
  LeavePeriodicity: string; // "Monthly", "Yearly" (will convert to number: Monthly=1, Yearly=2)
  LeaveDays: number;
  IsLeaveReset: boolean;
  LeaveResetPeriodicity: string; // "Monthly", "Yearly" (will convert to number: Monthly=1, Yearly=2)
  IsCarryForward: boolean;
  MaxCarryForward: number;
  IsEnCash: boolean;
  MaxEncashDays: number;
  IsPostponeLeaveCredit: boolean;
  PostponeCount: number;
  PostponePeriodicity: string; // "Months", "Years" (will convert to number: Months=1, Years=2)
}

const API_URL_SAVE = "LeaveType/0/token";
const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/LeaveType/Id";

// Helper functions to convert frequency/periodicity to numbers
// Monthly = 1, Yearly = 2
const convertLeavePeriodicityToNumber = (value: string): number => {
  const map: { [key: string]: number } = {
    "Monthly": 1,
    "Yearly": 2,
  };
  return map[value] || 1;
};

const convertLeavePeriodicityToString = (value: number): string => {
  const map: { [key: number]: string } = {
    1: "Monthly",
    2: "Yearly",
  };
  return map[value] || "Monthly";
};

const convertResetPeriodicityToNumber = (value: string): number => {
  const map: { [key: string]: number } = {
    "Monthly": 1,
    "Yearly": 2,
  };
  return map[value] || 1;
};

const convertResetPeriodicityToString = (value: number): string => {
  const map: { [key: number]: string } = {
    1: "Monthly",
    2: "Yearly",
  };
  return map[value] || "Monthly";
};

const convertPostponePeriodicityToNumber = (value: string): number => {
  const map: { [key: string]: number } = {
    "Months": 1,
    "Years": 2,
  };
  return map[value] || 1;
};

const convertPostponePeriodicityToString = (value: number): string => {
  const map: { [key: number]: string } = {
    1: "Months",
    2: "Years",
  };
  return map[value] || "Months";
};

const AddEdit_LeaveTypeMasterContainer = () => {
  const [state, setState] = useState({
    id: 0,
    FillArray: [],
    formData: {} as any,
    OtherDataScore: [],
    isProgress: true,
    showDescription: false,
  });

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle Enter key to move to next field
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentFieldName: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (!form) return;

      // Define field order
      const fieldOrder = ["LeaveName", "Code", "PayType", "Description", "LeavePeriodicity", "LeaveDays"];
      const currentIndex = fieldOrder.indexOf(currentFieldName);

      if (currentIndex < fieldOrder.length - 1) {
        // Move to next field
        const nextFieldName = fieldOrder[currentIndex + 1];
        const nextInput = form.querySelector(`input[name="${nextFieldName}"]`) as HTMLInputElement;
        if (nextInput && !nextInput.readOnly) {
          nextInput.focus();
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
    } else {
      setState((prevState) => ({
        ...prevState,
        isProgress: false,
      }));
    }
  }, [dispatch, location.state, navigate]);

  // Auto-focus on first field when form is ready
  useEffect(() => {
    if (!state.isProgress) {
      const timer = setTimeout(() => {
        const firstInput = document.querySelector('.theme-form input[name="LeaveName"]') as HTMLInputElement;
        if (firstInput && !firstInput.readOnly) {
          firstInput.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [state.isProgress, state.formData]);

  const validationSchema = Yup.object({
    LeaveName: Yup.string().required("Leave Name is required"),
    Code: Yup.string().required("Code is required"),
    PayType: Yup.string().required("Select Type is required"),
    Description: Yup.string(),
    LeavePeriodicity: Yup.string().required("Leave Periodicity is required"),
    LeaveDays: Yup.number().required("Leave Days is required").min(0, "Days must be 0 or greater"),
    IsLeaveReset: Yup.boolean(),
    LeaveResetPeriodicity: Yup.string(),
    IsCarryForward: Yup.boolean(),
    MaxCarryForward: Yup.number().min(0, "Days must be 0 or greater"),
    IsEnCash: Yup.boolean(),
    MaxEncashDays: Yup.number().min(0, "Days must be 0 or greater"),
    IsPostponeLeaveCredit: Yup.boolean(),
    PostponeCount: Yup.number().min(0, "Count must be 0 or greater"),
    PostponePeriodicity: Yup.string(),
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
    vformData.append("LeaveName", values.LeaveName);
    vformData.append("Code", values.Code);
    vformData.append("PayType", values.PayType === "Paid" ? "1" : "0");
    vformData.append("Description", values.Description || "");
    vformData.append("LeavePeriodicity", String(convertLeavePeriodicityToNumber(values.LeavePeriodicity)));
    vformData.append("LeaveDays", String(values.LeaveDays));
    vformData.append("IsLeaveReset", values.IsLeaveReset ? "true" : "false");
    vformData.append("LeaveResetPeriodicity", String(convertResetPeriodicityToNumber(values.LeaveResetPeriodicity)));
    vformData.append("IsCarryForward", values.IsCarryForward ? "true" : "false");
    vformData.append("MaxCarryForward", String(values.MaxCarryForward || 0));
    vformData.append("IsEnCash", values.IsEnCash ? "true" : "false");
    vformData.append("MaxEncashDays", String(values.MaxEncashDays || 0));
    vformData.append("IsPostponeLeaveCredit", values.IsPostponeLeaveCredit ? "true" : "false");
    vformData.append("PostponeCount", String(values.PostponeCount || 0));
    vformData.append("PostponePeriodicity", String(convertPostponePeriodicityToNumber(values.PostponePeriodicity)));
    vformData.append("UserId", String(userId));

    Fn_AddEditData(
      dispatch,
      setState,
      { arguList: { id: state.id, formData: vformData } },
      API_URL_SAVE,
      true,
      "memberid",
      navigate,
      "/leaveTypeMaster"
    );
  };

  const isEditMode = state.id > 0;
  const initialValues: FormValues = {
    LeaveName: state.formData?.LeaveName || "",
    Code: state.formData?.Code || "",
    PayType: state.formData?.PayType !== undefined 
      ? (state.formData.PayType === 1 || state.formData.PayType === "1" || state.formData.PayType === true ? "Paid" : "Unpaid")
      : "Paid",
    Description: state.formData?.Description || "",
    LeavePeriodicity: state.formData?.LeavePeriodicity !== undefined
      ? convertLeavePeriodicityToString(Number(state.formData.LeavePeriodicity))
      : "Monthly",
    LeaveDays: state.formData?.LeaveDays || 0,
    IsLeaveReset: state.formData?.IsLeaveReset !== undefined
      ? (state.formData.IsLeaveReset === true || state.formData.IsLeaveReset === "true" || state.formData.IsLeaveReset === 1 || state.formData.IsLeaveReset === "1")
      : true,
    LeaveResetPeriodicity: state.formData?.LeaveResetPeriodicity !== undefined
      ? convertResetPeriodicityToString(Number(state.formData.LeaveResetPeriodicity))
      : "Monthly",
    IsCarryForward: state.formData?.IsCarryForward !== undefined
      ? (state.formData.IsCarryForward === true || state.formData.IsCarryForward === "true" || state.formData.IsCarryForward === 1 || state.formData.IsCarryForward === "1")
      : true,
    MaxCarryForward: state.formData?.MaxCarryForward || 5,
    IsEnCash: state.formData?.IsEnCash !== undefined
      ? (state.formData.IsEnCash === true || state.formData.IsEnCash === "true" || state.formData.IsEnCash === 1 || state.formData.IsEnCash === "1")
      : true,
    MaxEncashDays: state.formData?.MaxEncashDays || 0,
    IsPostponeLeaveCredit: state.formData?.IsPostponeLeaveCredit !== undefined
      ? (state.formData.IsPostponeLeaveCredit === true || state.formData.IsPostponeLeaveCredit === "true" || state.formData.IsPostponeLeaveCredit === 1 || state.formData.IsPostponeLeaveCredit === "1")
      : false,
    PostponeCount: state.formData?.PostponeCount || 0,
    PostponePeriodicity: state.formData?.PostponePeriodicity !== undefined
      ? convertPostponePeriodicityToString(Number(state.formData.PostponePeriodicity))
      : "Months",
  };

  return (
    <>
      <style>{`
        .theme-form input[type="text"] {
          color: #000000 !important;
        }
        body.dark-only .theme-form input[type="text"] {
          color: #ffffff !important;
        }
      `}</style>
      <Breadcrumbs mainTitle="Leave Type Master" parent="Masters" />
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
                      title={`${isEditMode ? "Edit" : "Add"} Leave Type Master`}
                      tagClass="card-title mb-0"
                    />
                    <CardBody>
                      {/* Basic Leave Type Information */}
                      <div className="mb-3">
                        <p className="text-muted mb-2">Let's set up a new leave type.</p>
                        <Row>
                          <Col md="4">
                            <FormGroup className="mb-2">
                              <Label>
                                Leave Name <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
                                name="LeaveName"
                                placeholder="Enter Leave Name"
                                value={values.LeaveName}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={(e) => handleKeyDown(e, "LeaveName")}
                                invalid={touched.LeaveName && !!(errors as any).LeaveName}
                              />
                              <ErrorMessage name="LeaveName" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup className="mb-2">
                              <Label>
                                Code <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
                                name="Code"
                                placeholder="Enter Code"
                                value={values.Code}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={(e) => handleKeyDown(e, "Code")}
                                invalid={touched.Code && !!errors.Code}
                              />
                              <ErrorMessage name="Code" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup className="mb-2">
                              <Label>
                                Select Type <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="select"
                                name="PayType"
                                value={values.PayType}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={(e) => handleKeyDown(e, "PayType")}
                                invalid={touched.PayType && !!errors.PayType}
                              >
                                <option value="">Select Type</option>
                                <option value="Paid">Paid</option>
                                <option value="Unpaid">Unpaid</option>
                              </Input>
                              <ErrorMessage name="PayType" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="12">
                            {!state.showDescription ? (
                              <a 
                                href="#" 
                                className="text-primary"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setState(prev => ({ ...prev, showDescription: true }));
                                }}
                              >
                                + Add Description
                              </a>
                            ) : (
                              <FormGroup className="mb-2">
                                <Label>Description</Label>
                                <Input
                                  type="textarea"
                                  name="Description"
                                  placeholder="Enter Description"
                                  value={values.Description}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  rows={2}
                                />
                              </FormGroup>
                            )}
                          </Col>
                        </Row>
                      </div>

                      {/* Leave Entitlement */}
                      <div className="mb-3">
                        <h6 className="mb-2">How many leaves do employees get? <span className="text-danger">*</span></h6>
                        <Row>
                          <Col md="4">
                            <FormGroup className="mb-2">
                              <Label>Frequency</Label>
                              <Input
                                type="select"
                                name="LeavePeriodicity"
                                value={values.LeavePeriodicity}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={touched.LeavePeriodicity && !!errors.LeavePeriodicity}
                              >
                                <option value="Monthly">Monthly</option>
                                <option value="Yearly">Yearly</option>
                              </Input>
                              <ErrorMessage name="LeavePeriodicity" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup className="mb-2">
                              <Label>Days</Label>
                              <Input
                                type="number"
                                name="LeaveDays"
                                placeholder="Enter Days"
                                value={values.LeaveDays}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                min="0"
                                invalid={touched.LeaveDays && !!errors.LeaveDays}
                              />
                              <ErrorMessage name="LeaveDays" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                        </Row>
                      </div>

                      {/* Advanced Leave Policy Settings */}
                      <div className="mb-3">
                        <h6 className="mb-2">Advanced Leave Policy Settings</h6>
                        
                        <Row>
                          <Col md="6">
                            <FormGroup className="mb-2">
                              <div className="form-check d-flex align-items-center">
                                <Input
                                  type="checkbox"
                                  name="IsLeaveReset"
                                  checked={values.IsLeaveReset}
                                  onChange={(e) => setFieldValue("IsLeaveReset", e.target.checked)}
                                  className="form-check-input"
                                />
                                <Label check className="form-check-label me-2">
                                  Reset leave balance
                                </Label>
                                {values.IsLeaveReset && (
                                  <Input
                                    type="select"
                                    name="LeaveResetPeriodicity"
                                    value={values.LeaveResetPeriodicity}
                                    onChange={handleChange}
                                    className="d-inline-block"
                                    style={{ width: "auto", minWidth: "100px" }}
                                  >
                                    <option value="Monthly">Monthly</option>
                                    <option value="Yearly">Yearly</option>
                                  </Input>
                                )}
                              </div>
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup className="mb-2">
                              <div className="form-check">
                                <Input
                                  type="checkbox"
                                  name="IsCarryForward"
                                  checked={values.IsCarryForward}
                                  onChange={(e) => setFieldValue("IsCarryForward", e.target.checked)}
                                  className="form-check-input"
                                />
                                <Label check className="form-check-label">
                                  Carry forward unused leave days
                                </Label>
                              </div>
                              {values.IsCarryForward && (
                                <div className="mt-1 ms-4">
                                  <Input
                                    type="number"
                                    name="MaxCarryForward"
                                    value={values.MaxCarryForward}
                                    onChange={handleChange}
                                    min="0"
                                    placeholder="Max days"
                                    style={{ maxWidth: "150px" }}
                                  />
                                </div>
                              )}
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup className="mb-2">
                              <div className="form-check">
                                <Input
                                  type="checkbox"
                                  name="IsEnCash"
                                  checked={values.IsEnCash}
                                  onChange={(e) => setFieldValue("IsEnCash", e.target.checked)}
                                  className="form-check-input"
                                />
                                <Label check className="form-check-label">
                                  Encash remaining leave days
                                </Label>
                              </div>
                              {values.IsEnCash && (
                                <div className="mt-1 ms-4">
                                  <Input
                                    type="number"
                                    name="MaxEncashDays"
                                    value={values.MaxEncashDays}
                                    onChange={handleChange}
                                    min="0"
                                    placeholder="Max days"
                                    style={{ maxWidth: "150px" }}
                                  />
                                </div>
                              )}
                            </FormGroup>
                          </Col>
                          <Col md="12">
                            <FormGroup className="mb-2">
                              <div className="form-check d-flex align-items-center flex-wrap">
                                <Input
                                  type="checkbox"
                                  name="IsPostponeLeaveCredit"
                                  checked={values.IsPostponeLeaveCredit}
                                  onChange={(e) => setFieldValue("IsPostponeLeaveCredit", e.target.checked)}
                                  className="form-check-input"
                                />
                                <Label check className="form-check-label me-2">
                                  Postpone leave credits
                                </Label>
                                {values.IsPostponeLeaveCredit && (
                                  <>
                                    <Input
                                      type="number"
                                      name="PostponeCount"
                                      value={values.PostponeCount}
                                      onChange={handleChange}
                                      min="0"
                                      className="d-inline-block me-2"
                                      style={{ maxWidth: "80px" }}
                                      placeholder="0"
                                    />
                                    <Input
                                      type="select"
                                      name="PostponePeriodicity"
                                      value={values.PostponePeriodicity}
                                      onChange={handleChange}
                                      className="d-inline-block me-2"
                                      style={{ width: "auto", minWidth: "100px" }}
                                    >
                                      <option value="Months">Months</option>
                                      <option value="Years">Years</option>
                                    </Input>
                                    <span className="me-2">after date of joining</span>
                                  </>
                                )}
                              </div>
                            </FormGroup>
                          </Col>
                        </Row>
                      </div>
                    </CardBody>
                    <CardFooter className="text-end">
                      <Btn
                        color="secondary"
                        type="button"
                        className="me-2"
                        onClick={() => navigate("/leaveTypeMaster")}
                      >
                        Cancel
                      </Btn>
                      <Btn color="primary" type="submit" id="submitButton">
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

export default AddEdit_LeaveTypeMasterContainer;

