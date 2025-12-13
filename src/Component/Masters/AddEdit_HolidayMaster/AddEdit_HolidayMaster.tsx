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
import { formatDateForInput, formatDateForAPI } from "../../../utils/dateFormatUtils";

interface FormValues {
  Name: string;
  StartingFrom: string;
  EndTo: string;
}

const API_URL_SAVE = "HolidayMaster/0/token";
const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/HolidayMaster/Id";

const AddEdit_HolidayMasterContainer = () => {
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
      const fieldOrder = ["Name", "StartingFrom", "EndTo"];
      const currentIndex = fieldOrder.indexOf(currentFieldName);

      if (currentIndex < fieldOrder.length - 1) {
        // Move to next field
        const nextFieldName = fieldOrder[currentIndex + 1];
        const nextInput = form.querySelector(`input[name="${nextFieldName}"]`) as HTMLInputElement;
        if (nextInput) {
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

  const validationSchema = Yup.object({
    Name: Yup.string().required("Name is required"),
    StartingFrom: Yup.string().required("Starting From date is required"),
    EndTo: Yup.string()
      .required("End To date is required")
      .test("end-after-start", "End To date must be after or equal to Starting From date", function (value) {
        const { StartingFrom } = this.parent;
        if (!StartingFrom || !value) return true;
        return new Date(value) >= new Date(StartingFrom);
      }),
  });

  const handleSubmit = (values: FormValues) => {
    const obj = JSON.parse(localStorage.getItem("user") || "{}");
    let vformData = new FormData();

    vformData.append("Name", values.Name);
    vformData.append("StartingFrom", formatDateForAPI(values.StartingFrom));
    vformData.append("EndTo", formatDateForAPI(values.EndTo));
    vformData.append("UserId", obj === null || obj === undefined ? 0 : obj.uid);

    Fn_AddEditData(
      dispatch,
      setState,
      { arguList: { id: state.id, formData: vformData } },
      API_URL_SAVE,
      true,
      "memberid",
      navigate,
      "/holidayMaster"
    );
  };

  const isEditMode = state.id > 0;
  
  // Use utility function for date formatting

  const initialValues: FormValues = {
    Name: state.formData?.Name || "",
    StartingFrom: formatDateForInput(state.formData?.StartingFrom || ""),
    EndTo: formatDateForInput(state.formData?.EndTo || ""),
  };

  return (
    <>
      <style>{`
        .theme-form input[type="text"],
        .theme-form input[type="date"] {
          color: #000000 !important;
        }
        body.dark-only .theme-form input[type="text"],
        body.dark-only .theme-form input[type="date"] {
          color: #ffffff !important;
        }
        .theme-form input[type="date"] {
          position: relative;
        }
        .theme-form input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 1;
        }
      `}</style>
      <Breadcrumbs mainTitle="Holiday Master" parent="Masters" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Formik<FormValues>
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ values, handleChange, handleBlur, errors, touched }: FormikProps<FormValues>) => (
                <Form className="theme-form">
                  <Card>
                    <CardHeaderCommon
                      title={`${isEditMode ? "Edit" : "Add"} Holiday Master`}
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
                              placeholder="Enter Holiday Name"
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
                              Starting From <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="date"
                              name="StartingFrom"
                              value={values.StartingFrom}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "StartingFrom")}
                              invalid={touched.StartingFrom && !!errors.StartingFrom}
                            />
                            <ErrorMessage name="StartingFrom" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              End To <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="date"
                              name="EndTo"
                              value={values.EndTo}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={(e) => handleKeyDown(e, "EndTo")}
                              invalid={touched.EndTo && !!errors.EndTo}
                            />
                            <ErrorMessage name="EndTo" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                      </Row>
                    </CardBody>
                    <CardFooter className="text-end">
                      <Btn
                        color="secondary"
                        type="button"
                        className="me-2"
                        onClick={() => navigate("/holidayMaster")}
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

export default AddEdit_HolidayMasterContainer;

