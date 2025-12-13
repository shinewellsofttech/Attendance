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

interface ShiftAssignment {
  ShiftId: string;
}

interface FormValues {
  EmployeeId: string;
  ShiftAssignments: ShiftAssignment[];
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
    EmployeeId: Yup.string().required("Employee is required"),
    ShiftAssignments: Yup.array()
      .of(
        Yup.object({
          ShiftId: Yup.string().required("Shift is required"),
        })
      )
      .min(1, "At least one shift is required"),
  });

  const handleSubmit = (values: FormValues) => {
    const obj = JSON.parse(localStorage.getItem("user") || "{}");
    let vformData = new FormData();

    vformData.append("F_EmployeeMaster", values.EmployeeId);
    
    // Append shift assignments
    values.ShiftAssignments.forEach((shift, index) => {
      vformData.append(`ShiftAssignments[${index}].F_ShiftMaster`, shift.ShiftId);
    });
    
    vformData.append("UserId", obj === null || obj === undefined ? 0 : obj.uid);

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

  // Format shift display name with time
  const getShiftDisplayName = (shiftId: string) => {
    if (!shiftId) return "";
    const shift = state.ShiftArray.find((s: any) => s.Id === shiftId || s.Id === Number(shiftId));
    if (shift) {
      return `${shift.Name} (${shift.InTime || ""} - ${shift.OutTime || ""})`;
    }
    return "";
  };

  const initialValues: FormValues = {
    EmployeeId: state.formData?.F_EmployeeMaster || state.formData?.EmployeeId || "",
    ShiftAssignments: state.formData?.ShiftAssignments && Array.isArray(state.formData.ShiftAssignments) && state.formData.ShiftAssignments.length > 0
      ? state.formData.ShiftAssignments.map((sa: any) => ({
          ShiftId: sa.F_ShiftMaster || sa.ShiftId || "",
        }))
      : [{ ShiftId: "" }],
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
        .shift-row {
          display: flex;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 20px;
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 5px;
          background-color: #ffffff;
          flex-wrap: wrap;
        }
        .shift-actions {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-left: auto;
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
                      {/* Dynamic Shift Assignments */}
                      <Row className="mt-4">
                        <Col xs="12">
                          <div className="shift-row">
                            {/* Employee Column */}
                            <div style={{ minWidth: "200px", flex: "0 0 auto" }}>
                              <FormGroup>
                                <Label>
                                  <strong>Employee</strong>
                                </Label>
                                <Input
                                  type="select"
                                  name="EmployeeId"
                                  value={values.EmployeeId}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  className="btn-square"
                                  invalid={touched.EmployeeId && !!errors.EmployeeId}
                                >
                                  <option value="">Employee...</option>
                                  {state.EmployeeArray.map((item: any) => (
                                    <option key={item.Id} value={item.Id}>
                                      {item.Name || item.MachineEnrollmentNo || `Employee ${item.Id}`}
                                    </option>
                                  ))}
                                </Input>
                                <ErrorMessage name="EmployeeId" component="div" className="text-danger small" />
                              </FormGroup>
                            </div>

                            {/* Shift Dropdowns */}
                            {values.ShiftAssignments.map((shift, index) => (
                              <div key={index} style={{ minWidth: "200px", flex: "0 0 auto" }}>
                                <FormGroup>
                                  <Label>
                                    <strong>Shift {index + 1}</strong>
                                  </Label>
                                  <Input
                                    type="select"
                                    value={shift.ShiftId}
                                    onChange={(e) => {
                                      const newAssignments = [...values.ShiftAssignments];
                                      newAssignments[index].ShiftId = e.target.value;
                                      setFieldValue("ShiftAssignments", newAssignments);
                                    }}
                                    onBlur={handleBlur}
                                    className="btn-square"
                                  >
                                    <option value="">Select Shift</option>
                                    {state.ShiftArray.map((item: any) => (
                                      <option key={item.Id} value={item.Id}>
                                        {item.Name} ({item.InTime || ""} - {item.OutTime || ""})
                                      </option>
                                    ))}
                                  </Input>
                                  {touched.ShiftAssignments && errors.ShiftAssignments && Array.isArray(errors.ShiftAssignments) && errors.ShiftAssignments[index] && (
                                    <div className="text-danger small">
                                      {(errors.ShiftAssignments[index] as any)?.ShiftId}
                                    </div>
                                  )}
                                </FormGroup>
                              </div>
                            ))}

                            {/* Action Buttons */}
                            <div className="shift-actions">
                              <Btn
                                color="success"
                                size="sm"
                                type="button"
                                onClick={() => {
                                  const newAssignments = [...values.ShiftAssignments, { ShiftId: "" }];
                                  setFieldValue("ShiftAssignments", newAssignments);
                                }}
                                style={{ minWidth: "40px", height: "40px", marginBottom: "5px" }}
                                title="Add Shift"
                              >
                                <i className="fa fa-plus"></i>
                              </Btn>
                              {values.ShiftAssignments.length > 1 && (
                                <Btn
                                  color="danger"
                                  size="sm"
                                  type="button"
                                  onClick={() => {
                                    const newAssignments = values.ShiftAssignments.slice(0, -1);
                                    setFieldValue("ShiftAssignments", newAssignments);
                                  }}
                                  style={{ minWidth: "40px", height: "40px" }}
                                  title="Remove Last Shift"
                                >
                                  <i className="fa fa-times"></i>
                                </Btn>
                              )}
                            </div>
                          </div>
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

