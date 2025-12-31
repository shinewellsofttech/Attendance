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
  Name: string;
}

const API_URL_SAVE = "DesignationMaster/0/token";
const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/DesignationMaster/Id";

const AddEdit_DesignationMasterContainer = () => {
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

  // Handle Enter key to move to next field
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentFieldName: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (!form) return;

      // Define field order
      const fieldOrder = ["Name"];
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
        const firstInput = document.querySelector('.theme-form input[name="Name"]') as HTMLInputElement;
        if (firstInput && !firstInput.readOnly) {
          firstInput.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [state.isProgress, state.formData]);

  const validationSchema = Yup.object({
    Name: Yup.string().required("Name is required"),
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
    vformData.append("UserId", String(userId));

    Fn_AddEditData(
      dispatch,
      setState,
      { arguList: { id: state.id, formData: vformData } },
      API_URL_SAVE,
      true,
      "memberid",
      navigate,
      "/designationMaster"
    );
  };

  const isEditMode = state.id > 0;
  const initialValues: FormValues = {
    Name: state.formData?.Name || "",
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
      <Breadcrumbs mainTitle="Designation Master" parent="Masters" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ values, handleChange, handleBlur, errors, touched }: FormikProps<FormValues>) => (
                <Form className="theme-form">
                  <Card>
                    <CardHeaderCommon
                      title={`${isEditMode ? "Edit" : "Add"} Designation Master`}
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
                              placeholder="Enter Designation Name"
                              value={values.Name}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "Name")}
                              invalid={touched.Name && !!errors.Name}
                            />
                            <ErrorMessage name="Name" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                      </Row>
                    </CardBody>
                    <CardFooter className="text-end">
                      <Btn
                        color="secondary"
                        type="button"
                        className="me-2"
                        onClick={() => navigate("/designationMaster")}
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

export default AddEdit_DesignationMasterContainer;

