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

interface EmployeeShiftRow {
  F_EmployeeMaster: string;
  F_ShiftMaster1: string;
  F_ShiftMaster2: string;
}

interface FormValues {
  Rows: EmployeeShiftRow[];
}

const API_URL_SAVE = "EmpShiftEditMaster/0/token";
const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/EmpShiftEditMaster/Id";
const API_URL_EMPLOYEE = API_WEB_URLS.MASTER + "/0/token/EmployeeMaster/Id/0";
const API_URL_SHIFT = API_WEB_URLS.MASTER + "/0/token/ShiftMaster/Id/0";

const AddEdit_EmpShiftEditMasterContainer = () => {
  const [state, setState] = useState({
    id: 0,
    EmployeeArray: [] as any[],
    ShiftArray: [] as any[],
    formData: {} as any,
    OtherDataScore: [],
    isProgress: true,
  });

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Load Employee and Shift data for dropdowns
    Fn_FillListData(dispatch, setState, "EmployeeArray", API_URL_EMPLOYEE);
    Fn_FillListData(dispatch, setState, "ShiftArray", API_URL_SHIFT);

    const Id = (location.state && (location.state as any).Id) || 0;

    if (Id > 0) {
      setState((prevState) => ({
        ...prevState,
        id: Id,
      }));
      Fn_DisplayData(dispatch, setState, Id, API_URL_EDIT);
    }
  }, [dispatch, location.state, navigate]);

  const validationSchema = Yup.object({
    Rows: Yup.array()
      .of(
        Yup.object({
          F_EmployeeMaster: Yup.string().required("Employee is required"),
          F_ShiftMaster1: Yup.string().required("Shift Master 1 is required"),
          F_ShiftMaster2: Yup.string().required("Shift Master 2 is required"),
        })
      )
      .min(1, "At least one row is required"),
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

    // Loop through all rows and append data
    values.Rows.forEach((row, index) => {
      vformData.append(`Rows[${index}].F_EmployeeMaster`, row.F_EmployeeMaster || "");
      vformData.append(`Rows[${index}].F_ShiftMaster1`, row.F_ShiftMaster1 || "");
      vformData.append(`Rows[${index}].F_ShiftMaster2`, row.F_ShiftMaster2 || "");
    });
    
    vformData.append("UserId", String(userId));

    Fn_AddEditData(
      dispatch,
      setState,
      { arguList: { id: state.id, formData: vformData } },
      API_URL_SAVE,
      true,
      "memberid",
      navigate,
      "/empShiftEditMaster"
    );
  };

  const isEditMode = state.id > 0;

  const initialValues: FormValues = {
    Rows: state.formData?.Rows && Array.isArray(state.formData.Rows) && state.formData.Rows.length > 0
      ? state.formData.Rows.map((row: any) => ({
          F_EmployeeMaster: row.F_EmployeeMaster || "",
          F_ShiftMaster1: row.F_ShiftMaster1 || "",
          F_ShiftMaster2: row.F_ShiftMaster2 || "",
        }))
      : [{
          F_EmployeeMaster: "",
          F_ShiftMaster1: "",
          F_ShiftMaster2: "",
        }],
  };

  return (
    <>
      <style>{`
        .theme-form input[type="text"],
        select.btn-square,
        select.btn-square option {
          color: #000000 !important;
        }
        body.dark-only .theme-form input[type="text"],
        body.dark-only select.btn-square,
        body.dark-only select.btn-square option {
          color: #ffffff !important;
        }
        .emp-shift-row {
          display: flex;
          align-items: flex-end;
          gap: 15px;
          margin-bottom: 20px;
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 5px;
          background-color: #ffffff;
          flex-wrap: wrap;
        }
        .row-actions {
          display: flex;
          flex-direction: row;
          gap: 5px;
          margin-left: auto;
          align-items: center;
        }
      `}</style>
      <Breadcrumbs mainTitle="Employee Shift Edit Master" parent="Masters" />
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
                      title={`${isEditMode ? "Edit" : "Add"} Employee Shift Assignment`}
                      tagClass="card-title mb-0"
                    />
                    <CardBody>
                      {/* Dynamic Rows with Employee and Two Shifts */}
                      <Row className="mt-4">
                        <Col xs="12">
                          {values.Rows.map((row, rowIndex) => (
                            <div key={rowIndex} className="emp-shift-row">
                              {/* Employee Field */}
                              <div style={{ minWidth: "200px", flex: "1 1 auto" }}>
                              <FormGroup>
                                <Label>
                                    Employee <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="select"
                                    value={row.F_EmployeeMaster}
                                    onChange={(e) => {
                                      const newRows = [...values.Rows];
                                      newRows[rowIndex].F_EmployeeMaster = e.target.value;
                                      setFieldValue("Rows", newRows);
                                    }}
                                  onBlur={handleBlur}
                                  className="btn-square"
                                    invalid={touched.Rows && errors.Rows && Array.isArray(errors.Rows) && errors.Rows[rowIndex] && !!(errors.Rows[rowIndex] as any)?.F_EmployeeMaster}
                                >
                                    <option value="">Select Employee</option>
                                  {state.EmployeeArray.map((item: any) => (
                                    <option key={item.Id} value={item.Id}>
                                      {item.Name || item.MachineEnrollmentNo || `Employee ${item.Id}`}
                                    </option>
                                  ))}
                                </Input>
                                  {touched.Rows && errors.Rows && Array.isArray(errors.Rows) && errors.Rows[rowIndex] && (errors.Rows[rowIndex] as any)?.F_EmployeeMaster && (
                                    <div className="text-danger small">
                                      {(errors.Rows[rowIndex] as any).F_EmployeeMaster}
                                    </div>
                                  )}
                              </FormGroup>
                            </div>

                              {/* Shift Master 1 Field */}
                              <div style={{ minWidth: "200px", flex: "1 1 auto" }}>
                                <FormGroup>
                                  <Label>
                                    Shift Master 1 <span className="text-danger">*</span>
                                  </Label>
                                  <Input
                                    type="select"
                                    value={row.F_ShiftMaster1}
                                    onChange={(e) => {
                                      const newRows = [...values.Rows];
                                      newRows[rowIndex].F_ShiftMaster1 = e.target.value;
                                      setFieldValue("Rows", newRows);
                                    }}
                                    onBlur={handleBlur}
                                    className="btn-square"
                                    invalid={touched.Rows && errors.Rows && Array.isArray(errors.Rows) && errors.Rows[rowIndex] && !!(errors.Rows[rowIndex] as any)?.F_ShiftMaster1}
                                  >
                                    <option value="">Select Shift</option>
                                    {state.ShiftArray.map((item: any) => (
                                      <option key={item.Id} value={item.Id}>
                                        {item.Name} ({item.InTime || ""} - {item.OutTime || ""})
                                      </option>
                                    ))}
                                  </Input>
                                  {touched.Rows && errors.Rows && Array.isArray(errors.Rows) && errors.Rows[rowIndex] && (errors.Rows[rowIndex] as any)?.F_ShiftMaster1 && (
                                    <div className="text-danger small">
                                      {(errors.Rows[rowIndex] as any).F_ShiftMaster1}
                                    </div>
                                  )}
                                </FormGroup>
                              </div>

                              {/* Shift Master 2 Field */}
                              <div style={{ minWidth: "200px", flex: "1 1 auto" }}>
                                <FormGroup>
                                  <Label>
                                    Shift Master 2 <span className="text-danger">*</span>
                                  </Label>
                                  <Input
                                    type="select"
                                    value={row.F_ShiftMaster2}
                                    onChange={(e) => {
                                      const newRows = [...values.Rows];
                                      newRows[rowIndex].F_ShiftMaster2 = e.target.value;
                                      setFieldValue("Rows", newRows);
                                    }}
                                    onBlur={handleBlur}
                                    className="btn-square"
                                    invalid={touched.Rows && errors.Rows && Array.isArray(errors.Rows) && errors.Rows[rowIndex] && !!(errors.Rows[rowIndex] as any)?.F_ShiftMaster2}
                                  >
                                    <option value="">Select Shift</option>
                                    {state.ShiftArray.map((item: any) => (
                                      <option key={item.Id} value={item.Id}>
                                        {item.Name} ({item.InTime || ""} - {item.OutTime || ""})
                                      </option>
                                    ))}
                                  </Input>
                                  {touched.Rows && errors.Rows && Array.isArray(errors.Rows) && errors.Rows[rowIndex] && (errors.Rows[rowIndex] as any)?.F_ShiftMaster2 && (
                                    <div className="text-danger small">
                                      {(errors.Rows[rowIndex] as any).F_ShiftMaster2}
                                    </div>
                                  )}
                                </FormGroup>
                              </div>

                              {/* Action Buttons for each row */}
                              <div className="row-actions">
                                {rowIndex === values.Rows.length - 1 && (
                              <Btn
                                color="success"
                                size="sm"
                                type="button"
                                onClick={() => {
                                      const newRows = [...values.Rows, {
                                        F_EmployeeMaster: "",
                                        F_ShiftMaster1: "",
                                        F_ShiftMaster2: "",
                                      }];
                                      setFieldValue("Rows", newRows);
                                }}
                                    style={{ minWidth: "40px", height: "40px" }}
                                    title="Add Row"
                              >
                                <i className="fa fa-plus"></i>
                              </Btn>
                                )}
                                {values.Rows.length > 1 && (
                                <Btn
                                  color="danger"
                                  size="sm"
                                  type="button"
                                  onClick={() => {
                                      const newRows = values.Rows.filter((_, index) => index !== rowIndex);
                                      setFieldValue("Rows", newRows);
                                  }}
                                  style={{ minWidth: "40px", height: "40px" }}
                                    title="Remove Row"
                                >
                                  <i className="fa fa-times"></i>
                                </Btn>
                              )}
                            </div>
                          </div>
                          ))}
                        </Col>
                      </Row>
                    </CardBody>
                    <CardFooter className="text-end">
                      <Btn
                        color="secondary"
                        type="button"
                        className="me-2"
                        onClick={() => navigate("/empShiftEditMaster")}
                      >
                        Cancel
                      </Btn>
                      <Btn color="primary" type="submit">
                        {isEditMode ? "Update" : "Save"}
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

export default AddEdit_EmpShiftEditMasterContainer;

