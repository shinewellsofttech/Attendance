import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Formik, Form, ErrorMessage } from "formik";
import type { FormikProps } from "formik";
import * as Yup from "yup";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row } from "reactstrap";
import { Btn, FeatherIcons } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_DisplayData, Fn_AddEditData } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";

interface FormValues {
  CompanyName: string;
  UserName: string;
  Address: string;
  F_StateMaster: string;
  F_CityMaster: string;
  PFNo: string;
  ESINo: string;
  Signature: string;
  NatureOfBusiness: string;
  UserPassword: string;
}

const API_URL_SAVE = "CompanyMaster/0/token";
const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/CompanyMaster/Id";
const API_URL_STATE = API_WEB_URLS.MASTER + "/0/token/StateMaster/Id/0";
const API_URL_CITY = API_WEB_URLS.MASTER + "/0/token/CityMaster/Id/0";

const AddEdit_CompanyMasterContainer = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [state, setState] = useState({
    id: 0,
    FillArray: [],
    StateArray: [] as any[],
    CityArray: [] as any[],
    formData: {} as any,
    OtherDataScore: [],
    isProgress: true,
  });

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle Enter key to move to next field
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, currentFieldName: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (!form) return;

      // Define field order
      const fieldOrder = ["CompanyName", "UserName", "UserPassword", "Address", "F_StateMaster", "F_CityMaster", "PFNo", "ESINo", "NatureOfBusiness", "Signature"];
      const currentIndex = fieldOrder.indexOf(currentFieldName);

      if (currentIndex < fieldOrder.length - 1) {
        // Move to next field
        const nextFieldName = fieldOrder[currentIndex + 1];
        const nextInput = form.querySelector(`input[name="${nextFieldName}"], textarea[name="${nextFieldName}"], select[name="${nextFieldName}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        if (nextInput) {
          if (nextInput instanceof HTMLInputElement && !nextInput.readOnly && !nextInput.disabled) {
            nextInput.focus();
          } else if (nextInput instanceof HTMLSelectElement && !nextInput.disabled) {
            nextInput.focus();
          } else if (nextInput instanceof HTMLTextAreaElement) {
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
    // Load State data for dropdown
    Fn_FillListData(dispatch, setState, "StateArray", API_URL_STATE);

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
        const firstInput = document.querySelector('.theme-form input[name="CompanyName"]') as HTMLInputElement;
        if (firstInput && !firstInput.readOnly) {
          firstInput.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [state.isProgress, state.formData]);

  const validationSchema = Yup.object({
    CompanyName: Yup.string(),
    UserName: Yup.string().required("UserName is required"),
    Address: Yup.string(),
    F_StateMaster: Yup.string(),
    F_CityMaster: Yup.string(),
    PFNo: Yup.string(),
    ESINo: Yup.string(),
    NatureOfBusiness: Yup.string(),
    Signature: Yup.string(),
    UserPassword: Yup.string()
      .required("UserPassword is required")
      .min(6, "Password must be at least 6 characters"),
  });

  const handleSubmit = (values: FormValues) => {
    const obj = JSON.parse(localStorage.getItem("user") || "{}");
    let vformData = new FormData();

    vformData.append("CompanyName", values.CompanyName);
    vformData.append("UserName", values.UserName);
    vformData.append("UserPassword", values.UserPassword);
    vformData.append("Address", values.Address);
    vformData.append("F_StateMaster", values.F_StateMaster || "");
    vformData.append("F_CityMaster", values.F_CityMaster || "");
    vformData.append("PFNo", values.PFNo);
    vformData.append("ESINo", values.ESINo);
    vformData.append("NatureOfBusiness", values.NatureOfBusiness);
    vformData.append("Signature", values.Signature);
    vformData.append("UserId", obj === null || obj === undefined ? 0 : obj.uid);

    Fn_AddEditData(
      dispatch,
      setState,
      { arguList: { id: state.id, formData: vformData } },
      API_URL_SAVE,
      true,
      "memberid",
      navigate,
      "/companyMaster"
    );
  };

  const isEditMode = state.id > 0;
  const initialValues: FormValues = {
    CompanyName: state.formData?.CompanyName || "",
    UserName: state.formData?.UserName || "",
    UserPassword: state.formData?.UserPassword || "",
    Address: state.formData?.Address || "",
    F_StateMaster: state.formData?.F_StateMaster || state.formData?.StateId || "",
    F_CityMaster: state.formData?.F_CityMaster || state.formData?.CityId || "",
    PFNo: state.formData?.PFNo || "",
    ESINo: state.formData?.ESINo || "",
    Signature: state.formData?.Signature || "",
    NatureOfBusiness: state.formData?.NatureOfBusiness || "",
  };

  // Load all cities on mount (will be filtered by selected state)
  useEffect(() => {
    Fn_FillListData(dispatch, setState, "CityArray", API_URL_CITY);
  }, [dispatch]);

  return (
    <>
      <style>{`
        .theme-form input[type="text"],
        .theme-form input[type="password"] {
          color: #000000 !important;
        }
        body.dark-only .theme-form input[type="text"],
        body.dark-only .theme-form input[type="password"] {
          color: #ffffff !important;
        }
      `}</style>
      <Breadcrumbs mainTitle="Company Master" parent="Masters" />
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
                // Filter cities based on selected state
                const filteredCities = state.CityArray.filter((city: any) => {
                  if (!values.F_StateMaster) return false;
                  return city.F_StateMaster === parseInt(values.F_StateMaster) || city.StateId === parseInt(values.F_StateMaster);
                });

                // Load cities when state changes
                const handleStateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                  const selectedStateId = e.target.value;
                  handleChange(e);
                  setFieldValue("F_CityMaster", ""); // Reset city when state changes
                };

                return (
                <Form className="theme-form">
                  <Card>
                    <CardHeaderCommon
                      title={`${isEditMode ? "Edit" : "Add"} Company Master`}
                      tagClass="card-title mb-0"
                    />
                    <CardBody>
                      <Row>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Company Name <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="text"
                              name="CompanyName"
                              placeholder="Enter Company Name"
                              value={values.CompanyName}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "CompanyName")}
                              invalid={touched.CompanyName && !!errors.CompanyName}
                            />
                            <ErrorMessage name="CompanyName" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              UserName <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="text"
                              name="UserName"
                              placeholder="Enter UserName"
                              value={values.UserName}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "UserName")}
                              invalid={touched.UserName && !!errors.UserName}
                            />
                            <ErrorMessage name="UserName" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              UserPassword <span className="text-danger">*</span>
                            </Label>
                            <div style={{ position: "relative" }}>
                              <Input
                                type={showPassword ? "text" : "password"}
                                name="UserPassword"
                                placeholder="Enter UserPassword"
                                value={values.UserPassword}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={(e) => handleKeyDown(e, "UserPassword")}
                                invalid={touched.UserPassword && !!errors.UserPassword}
                                style={{ paddingRight: "40px" }}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                  position: "absolute",
                                  right: "10px",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  padding: "5px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#6c757d",
                                }}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                              >
                                <FeatherIcons
                                  iconName={showPassword ? "EyeOff" : "Eye"}
                                  className="feather-sm"
                                />
                              </button>
                            </div>
                            <ErrorMessage name="UserPassword" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Address
                            </Label>
                            <Input
                              type="textarea"
                              name="Address"
                              placeholder="Enter Address"
                              value={values.Address}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "Address")}
                              invalid={touched.Address && !!errors.Address}
                              rows={3}
                            />
                            <ErrorMessage name="Address" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              State
                            </Label>
                            <Input
                              type="select"
                              name="F_StateMaster"
                              value={values.F_StateMaster}
                              onChange={handleStateChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "F_StateMaster")}
                              className="btn-square"
                              invalid={touched.F_StateMaster && !!errors.F_StateMaster}
                            >
                              <option value="">Select State</option>
                              {state.StateArray.map((item: any) => (
                                <option key={item.Id} value={item.Id}>
                                  {item.Name || `State ${item.Id}`}
                                </option>
                              ))}
                            </Input>
                            <ErrorMessage name="F_StateMaster" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              City
                            </Label>
                            <Input
                              type="select"
                              name="F_CityMaster"
                              value={values.F_CityMaster}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "F_CityMaster")}
                              className="btn-square"
                              invalid={touched.F_CityMaster && !!errors.F_CityMaster}
                              disabled={!values.F_StateMaster}
                            >
                              <option value="">{values.F_StateMaster ? "Select City" : "Select State First"}</option>
                              {filteredCities.map((item: any) => (
                                <option key={item.Id} value={item.Id}>
                                  {item.Name || `City ${item.Id}`}
                                </option>
                              ))}
                            </Input>
                            <ErrorMessage name="F_CityMaster" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              PF No.
                            </Label>
                            <Input
                              type="text"
                              name="PFNo"
                              placeholder="Enter PF No."
                              value={values.PFNo}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "PFNo")}
                              invalid={touched.PFNo && !!errors.PFNo}
                            />
                            <ErrorMessage name="PFNo" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              ESI No.
                            </Label>
                            <Input
                              type="text"
                              name="ESINo"
                              placeholder="Enter ESI No."
                              value={values.ESINo}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "ESINo")}
                              invalid={touched.ESINo && !!errors.ESINo}
                            />
                            <ErrorMessage name="ESINo" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Nature Of Business
                            </Label>
                            <Input
                              type="text"
                              name="NatureOfBusiness"
                              placeholder="Enter Nature Of Business"
                              value={values.NatureOfBusiness}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "NatureOfBusiness")}
                              invalid={touched.NatureOfBusiness && !!errors.NatureOfBusiness}
                            />
                            <ErrorMessage name="NatureOfBusiness" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Signature
                            </Label>
                            <Input
                              type="text"
                              name="Signature"
                              placeholder="Enter Signature"
                              value={values.Signature}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "Signature")}
                              invalid={touched.Signature && !!errors.Signature}
                            />
                            <ErrorMessage name="Signature" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                      </Row>
                    </CardBody>
                    <CardFooter className="text-end">
                      <Btn
                        color="secondary"
                        type="button"
                        className="me-2"
                        onClick={() => navigate("/companyMaster")}
                      >
                        Cancel
                      </Btn>
                      <Btn color="primary" type="submit">
                        {isEditMode ? "Update" : "Submit"}
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

export default AddEdit_CompanyMasterContainer;

