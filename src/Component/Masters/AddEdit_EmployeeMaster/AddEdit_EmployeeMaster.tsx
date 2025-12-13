import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Formik, Form, ErrorMessage } from "formik";
import type { FormikProps } from "formik";
import * as Yup from "yup";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import { Btn, FeatherIcons } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_DisplayData, Fn_AddEditData } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";
import { useRailwayTime } from "../../../hooks/useRailwayTime";
import { convertTo12Hour, convertTo24Hour, formatTimeForAPI } from "../../../utils/timeFormatUtils";
import { formatDateForInput, formatDateForAPI, formatDateForDisplay } from "../../../utils/dateFormatUtils";

interface FormValues {
  // Tab 1 Fields
  Name: string;
  FatherName: string;
  MachineEnrollmentNo: string;
  DateOfBirth: string;
  Age: string;
  DateOfJoining: string;
  Gender: string;
  MobileNo: string;
  Address: string;
  WorkingStatus: string;
  SelectShift: string;
  // Tab 2 Fields
  InTime: string;
  OutTime: string;
  MaxWorkingHoursFullDay: string;
  MinWorkingHoursFullDay: string;
  MaxWorkingHoursHalfDay: string;
  MinWorkingHoursHalfDay: string;
  OverTimeApplicable: boolean;
  GracePeriodMinsOverTime: string;
  WeeklyHoliday: string;
  MaxAllowedLeavesPerMonth: string;
  // Tab 3 Fields - Family Details
  FathersName: string;
  FathersDateOfBirth: string;
  MothersName: string;
  MothersDateOfBirth: string;
  WifesName: string;
  WifesDateOfBirth: string;
  // Tab 3 Fields - Children (dynamic)
  Children: Array<{
    Name: string;
    DateOfBirth: string;
    Gender: string;
  }>;
  // Tab 3 Fields - Qualification
  Qualification: string;
  // Tab 3 Fields - Documents
  Document1Type: string;
  Document1No: string;
  Document2Type: string;
  Document2No: string;
}

const API_URL_SAVE = "EmployeeMaster/0/token";
const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/EmployeeMaster/Id";
const API_URL_SHIFT = API_WEB_URLS.MASTER + "/0/token/ShiftMaster/Id/0";

const AddEdit_EmployeeMasterContainer = () => {
  const [activeTab, setActiveTab] = useState("1");
  const isRailwayTime = useRailwayTime();
  const [state, setState] = useState({
    id: 0,
    FillArray: [],
    ShiftArray: [] as any[],
    formData: {} as any,
    OtherDataScore: [],
    isProgress: true,
  });
  const [files, setFiles] = useState({
    DocumentId1: null as File | null,
    DocumentId2: null as File | null,
    EmployeePhoto: null as File | null,
    EmployeeSignature: null as File | null,
  });

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle Enter key to move to next field based on active tab
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>, currentFieldName: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (!form) return;

      // Define field order for each tab
      const tab1Fields = ["Name", "FatherName", "MachineEnrollmentNo", "DateOfBirth", "DateOfJoining", "Gender", "MobileNo", "Address", "WorkingStatus", "SelectShift"];
      const tab2Fields = ["InTime", "OutTime", "MinWorkingHoursFullDay", "MaxWorkingHoursHalfDay", "MinWorkingHoursHalfDay", "GracePeriodMinsOverTime", "WeeklyHoliday", "MaxAllowedLeavesPerMonth"];
      const tab3Fields = ["FathersName", "FathersDateOfBirth", "MothersName", "MothersDateOfBirth", "WifesName", "WifesDateOfBirth", "Qualification", "Document1Type", "Document1No", "Document2Type", "Document2No"];
      
      let fieldOrder: string[] = [];
      if (activeTab === "1") fieldOrder = tab1Fields;
      else if (activeTab === "2") fieldOrder = tab2Fields;
      else if (activeTab === "3") fieldOrder = tab3Fields;

      const currentIndex = fieldOrder.indexOf(currentFieldName);

      if (currentIndex < fieldOrder.length - 1) {
        // Move to next field
        const nextFieldName = fieldOrder[currentIndex + 1];
        const nextInput = form.querySelector(`input[name="${nextFieldName}"], select[name="${nextFieldName}"], textarea[name="${nextFieldName}"]`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        if (nextInput) {
          // Check if it's an input and not readonly
          if (nextInput instanceof HTMLInputElement && !nextInput.readOnly) {
            nextInput.focus();
          } else if (nextInput instanceof HTMLSelectElement) {
            nextInput.focus();
          } else if (nextInput instanceof HTMLTextAreaElement) {
            nextInput.focus();
          }
        }
      } else {
        // Last field in tab, focus Next/Save button
        if (activeTab === "3") {
          // Last tab, focus Save button
          const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
          if (submitButton) {
            submitButton.focus();
          }
        } else {
          // Tab 1 or 2, focus Next button
          const nextButton = form.querySelector('button[type="button"].btn-primary') as HTMLButtonElement;
          if (nextButton && nextButton.textContent?.trim() === "Next") {
            nextButton.focus();
          }
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

    // Load Shift data for dropdown
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
  }, [state.isProgress, state.formData, activeTab]);

  const calculateAge = (dateOfBirth: string): string => {
    if (!dateOfBirth) return "";
    try {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age.toString();
    } catch (e) {
      return "";
    }
  };

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
    FatherName: Yup.string().required("Father Name is required"),
    MachineEnrollmentNo: Yup.string().required("Machine Enrollment No. is required"),
    DateOfBirth: Yup.string().required("Date of Birth is required"),
    DateOfJoining: Yup.string().required("Date of Joining is required"),
    Gender: Yup.string().required("Gender is required"),
    MobileNo: Yup.string().required("Mobile No. is required"),
    Address: Yup.string().required("Address is required"),
    WorkingStatus: Yup.string().required("Working Status is required"),
    SelectShift: Yup.string().required("Select Shift is required"),
    InTime: Yup.string().required("In Time is required"),
    OutTime: Yup.string().required("Out Time is required"),
    MaxWorkingHoursFullDay: Yup.string().required("Max Working Hours Full Day is required"),
    MinWorkingHoursFullDay: Yup.string().required("Min Working Hours Full Day is required"),
    MaxWorkingHoursHalfDay: Yup.string().required("Max Working Hours Half Day is required"),
    MinWorkingHoursHalfDay: Yup.string().required("Min Working Hours Half Day is required"),
    GracePeriodMinsOverTime: Yup.string().required("Grace Period Mins (Over Time) is required"),
    WeeklyHoliday: Yup.string().required("Weekly Holiday is required"),
    MaxAllowedLeavesPerMonth: Yup.string().required("Max Allowed Leaves/Month is required"),
  });

  const handleSubmit = (values: FormValues) => {
    const obj = JSON.parse(localStorage.getItem("user") || "{}");
    let vformData = new FormData();

    // Tab 1 fields
    vformData.append("Name", values.Name);
    vformData.append("FatherName", values.FatherName);
    vformData.append("MachineEnrollmentNo", values.MachineEnrollmentNo);
    vformData.append("DateOfBirth", formatDateForAPI(values.DateOfBirth));
    vformData.append("Age", values.Age);
    vformData.append("DateOfJoining", formatDateForAPI(values.DateOfJoining));
    vformData.append("Gender", values.Gender);
    vformData.append("MobileNo", values.MobileNo);
    vformData.append("Address", values.Address);
    vformData.append("WorkingStatus", values.WorkingStatus);
    vformData.append("F_ShiftMaster", values.SelectShift);

    // Tab 2 fields
    vformData.append("InTime", formatTimeForAPI(values.InTime));
    vformData.append("OutTime", formatTimeForAPI(values.OutTime));
    vformData.append("MaxWorkingHoursFullDay", values.MaxWorkingHoursFullDay);
    vformData.append("MinWorkingHoursFullDay", values.MinWorkingHoursFullDay);
    vformData.append("MaxWorkingHoursHalfDay", values.MaxWorkingHoursHalfDay);
    vformData.append("MinWorkingHoursHalfDay", values.MinWorkingHoursHalfDay);
    vformData.append("OverTimeApplicable", values.OverTimeApplicable ? "true" : "false");
    vformData.append("GracePeriodMinsOverTime", values.GracePeriodMinsOverTime);
    vformData.append("WeeklyHoliday", values.WeeklyHoliday);
    vformData.append("MaxAllowedLeavesPerMonth", values.MaxAllowedLeavesPerMonth);

    // Tab 3 fields - Family Details
    vformData.append("FathersName", values.FathersName || "");
    vformData.append("FathersDateOfBirth", values.FathersDateOfBirth ? formatDateForAPI(values.FathersDateOfBirth) : "");
    vformData.append("MothersName", values.MothersName || "");
    vformData.append("MothersDateOfBirth", values.MothersDateOfBirth ? formatDateForAPI(values.MothersDateOfBirth) : "");
    vformData.append("WifesName", values.WifesName || "");
    vformData.append("WifesDateOfBirth", values.WifesDateOfBirth ? formatDateForAPI(values.WifesDateOfBirth) : "");
    
    // Children details - dynamic
    if (values.Children && values.Children.length > 0) {
      values.Children.forEach((child, index) => {
        vformData.append(`Child${index + 1}Name`, child.Name || "");
        vformData.append(`Child${index + 1}DateOfBirth`, child.DateOfBirth ? formatDateForAPI(child.DateOfBirth) : "");
        vformData.append(`Child${index + 1}Gender`, child.Gender || "");
      });
    }

    // Qualification
    vformData.append("Qualification", values.Qualification || "");

    // Documents
    vformData.append("Document1Type", values.Document1Type || "");
    vformData.append("Document1No", values.Document1No || "");
    vformData.append("Document2Type", values.Document2Type || "");
    vformData.append("Document2No", values.Document2No || "");
    
    // File uploads
    if (files.DocumentId1) {
      vformData.append("DocumentId1", files.DocumentId1);
    }
    if (files.DocumentId2) {
      vformData.append("DocumentId2", files.DocumentId2);
    }
    if (files.EmployeePhoto) {
      vformData.append("EmployeePhoto", files.EmployeePhoto);
    }
    if (files.EmployeeSignature) {
      vformData.append("EmployeeSignature", files.EmployeeSignature);
    }
    
    vformData.append("UserId", obj === null || obj === undefined ? 0 : obj.uid);

    Fn_AddEditData(
      dispatch,
      setState,
      { arguList: { id: state.id, formData: vformData } },
      API_URL_SAVE,
      true,
      "memberid",
      navigate,
      "/employeeMaster"
    );
  };

  const isEditMode = state.id > 0;

  // Use utility function for date formatting

  const initialValues: FormValues = {
    Name: state.formData?.Name || "",
    FatherName: state.formData?.FatherName || "",
    MachineEnrollmentNo: state.formData?.MachineEnrollmentNo || "",
    DateOfBirth: formatDateForInput(state.formData?.DateOfBirth || ""),
    Age: state.formData?.Age || calculateAge(formatDateForInput(state.formData?.DateOfBirth || "")),
    DateOfJoining: formatDateForInput(state.formData?.DateOfJoining || ""),
    Gender: state.formData?.Gender || "",
    MobileNo: state.formData?.MobileNo || "",
    Address: state.formData?.Address || "",
    WorkingStatus: state.formData?.WorkingStatus || "",
    SelectShift: state.formData?.F_ShiftMaster || state.formData?.SelectShift || "",
    InTime: isRailwayTime 
      ? (state.formData?.InTime?.includes("AM") || state.formData?.InTime?.includes("PM") ? convertTo24Hour(state.formData?.InTime || "") : state.formData?.InTime || "")
      : (state.formData?.InTime?.includes("AM") || state.formData?.InTime?.includes("PM") ? state.formData?.InTime : convertTo12Hour(state.formData?.InTime || "")),
    OutTime: isRailwayTime 
      ? (state.formData?.OutTime?.includes("AM") || state.formData?.OutTime?.includes("PM") ? convertTo24Hour(state.formData?.OutTime || "") : state.formData?.OutTime || "")
      : (state.formData?.OutTime?.includes("AM") || state.formData?.OutTime?.includes("PM") ? state.formData?.OutTime : convertTo12Hour(state.formData?.OutTime || "")),
    MaxWorkingHoursFullDay: state.formData?.MaxWorkingHoursFullDay || "",
    MinWorkingHoursFullDay: state.formData?.MinWorkingHoursFullDay || "",
    MaxWorkingHoursHalfDay: state.formData?.MaxWorkingHoursHalfDay || "",
    MinWorkingHoursHalfDay: state.formData?.MinWorkingHoursHalfDay || "",
    OverTimeApplicable: state.formData?.OverTimeApplicable || false,
    GracePeriodMinsOverTime: state.formData?.GracePeriodMinsOverTime || "",
    WeeklyHoliday: state.formData?.WeeklyHoliday || "Sunday",
    MaxAllowedLeavesPerMonth: state.formData?.MaxAllowedLeavesPerMonth || "",
    // Tab 3 - Family Details
    FathersName: state.formData?.FathersName || "",
    FathersDateOfBirth: formatDateForInput(state.formData?.FathersDateOfBirth || ""),
    MothersName: state.formData?.MothersName || "",
    MothersDateOfBirth: formatDateForInput(state.formData?.MothersDateOfBirth || ""),
    WifesName: state.formData?.WifesName || "",
    WifesDateOfBirth: formatDateForInput(state.formData?.WifesDateOfBirth || ""),
    // Children - initialize with one empty child
    Children: state.formData?.Children && Array.isArray(state.formData.Children) && state.formData.Children.length > 0
      ? state.formData.Children.map((child: any) => ({
          Name: child.Name || "",
          DateOfBirth: formatDateForInput(child.DateOfBirth || ""),
          Gender: child.Gender || "",
        }))
      : [{ Name: "", DateOfBirth: "", Gender: "" }],
    // Qualification
    Qualification: state.formData?.Qualification || "",
    // Documents
    Document1Type: state.formData?.Document1Type || "",
    Document1No: state.formData?.Document1No || "",
    Document2Type: state.formData?.Document2Type || "",
    Document2No: state.formData?.Document2No || "",
  };

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <>
      <style>{`
        .theme-form input[type="text"],
        .theme-form input[type="date"],
        .theme-form input[type="tel"],
        .theme-form input[type="number"] {
          color: #000000 !important;
        }
        body.dark-only .theme-form input[type="text"],
        body.dark-only .theme-form input[type="date"],
        body.dark-only .theme-form input[type="tel"],
        body.dark-only .theme-form input[type="number"] {
          color: #ffffff !important;
        }
        .theme-form input[type="date"]::-webkit-calendar-picker-indicator {
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
      <Breadcrumbs mainTitle="Employee Master" parent="Masters" />
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
                      title={`${isEditMode ? "Edit" : "Add"} Employee Master`}
                      tagClass="card-title mb-0"
                    />
                    <CardBody>
                      <Nav tabs className="nav-tabs border-tab">
                        <NavItem>
                          <NavLink
                            className={activeTab === "1" ? "active" : ""}
                            onClick={() => setActiveTab("1")}
                            style={{ cursor: "pointer" }}
                          >
                            Personal Information
                          </NavLink>
                        </NavItem>
                        <NavItem>
                          <NavLink
                            className={activeTab === "2" ? "active" : ""}
                            onClick={() => setActiveTab("2")}
                            style={{ cursor: "pointer" }}
                          >
                            Working Hours & Settings
                          </NavLink>
                        </NavItem>
                        <NavItem>
                          <NavLink
                            className={activeTab === "3" ? "active" : ""}
                            onClick={() => setActiveTab("3")}
                            style={{ cursor: "pointer" }}
                          >
                            Family, Qualification & Documents
                          </NavLink>
                        </NavItem>
                      </Nav>
                      <TabContent activeTab={activeTab}>
                        {/* Tab 1: Personal Information */}
                        <TabPane tabId="1">
                          <Row className="mt-3">
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
                                  Father Name <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="text"
                                  name="FatherName"
                                  placeholder="Enter Father Name"
                                  value={values.FatherName}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "FatherName")}
                                  invalid={touched.FatherName && !!errors.FatherName}
                                />
                                <ErrorMessage name="FatherName" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Machine Enrollment No. <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="text"
                                  name="MachineEnrollmentNo"
                                  placeholder="Enter Machine Enrollment No."
                                  value={values.MachineEnrollmentNo}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "MachineEnrollmentNo")}
                                  invalid={touched.MachineEnrollmentNo && !!errors.MachineEnrollmentNo}
                                />
                                <ErrorMessage name="MachineEnrollmentNo" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="4">
                              <FormGroup>
                                <Label>
                                  Date of Birth <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="date"
                                  name="DateOfBirth"
                                  value={values.DateOfBirth}
                                  onChange={(e) => {
                                    handleChange(e);
                                    const age = calculateAge(e.target.value);
                                    setFieldValue("Age", age);
                                  }}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "DateOfBirth")}
                                  invalid={touched.DateOfBirth && !!errors.DateOfBirth}
                                />
                                <ErrorMessage name="DateOfBirth" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="2">
                              <FormGroup>
                                <Label>Age</Label>
                                <Input
                                  type="text"
                                  name="Age"
                                  value={values.Age}
                                  readOnly
                                  style={{ backgroundColor: "#f8f9fa" }}
                                />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Date of Joining <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="date"
                                  name="DateOfJoining"
                                  value={values.DateOfJoining}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "DateOfJoining")}
                                  invalid={touched.DateOfJoining && !!errors.DateOfJoining}
                                />
                                <ErrorMessage name="DateOfJoining" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Gender <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="select"
                                  name="Gender"
                                  value={values.Gender}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "Gender")}
                                  className="btn-square"
                                  invalid={touched.Gender && !!errors.Gender}
                                >
                                  <option value="">Select</option>
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Other">Other</option>
                                </Input>
                                <ErrorMessage name="Gender" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Mobile No. <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="tel"
                                  name="MobileNo"
                                  placeholder="Enter Mobile No."
                                  value={values.MobileNo}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "MobileNo")}
                                  invalid={touched.MobileNo && !!errors.MobileNo}
                                />
                                <ErrorMessage name="MobileNo" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Address <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="textarea"
                                  name="Address"
                                  placeholder="Enter Address"
                                  value={values.Address}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "Address")}
                                  rows={3}
                                  invalid={touched.Address && !!errors.Address}
                                />
                                <ErrorMessage name="Address" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Working Status <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="select"
                                  name="WorkingStatus"
                                  value={values.WorkingStatus}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "WorkingStatus")}
                                  className="btn-square"
                                  invalid={touched.WorkingStatus && !!errors.WorkingStatus}
                                >
                                  <option value="">Select</option>
                                  <option value="Active">Active</option>
                                  <option value="Inactive">Inactive</option>
                                  <option value="On Leave">On Leave</option>
                                  <option value="Terminated">Terminated</option>
                                </Input>
                                <ErrorMessage name="WorkingStatus" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Select Shift <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="select"
                                  name="SelectShift"
                                  value={values.SelectShift}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "SelectShift")}
                                  className="btn-square"
                                  invalid={touched.SelectShift && !!errors.SelectShift}
                                >
                                  <option value="">Select Shift</option>
                                  {state.ShiftArray.map((item: any) => (
                                    <option key={item.Id} value={item.Id}>
                                      {item.Name}
                                    </option>
                                  ))}
                                </Input>
                                <ErrorMessage name="SelectShift" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                          </Row>
                        </TabPane>

                        {/* Tab 2: Working Hours & Settings */}
                        <TabPane tabId="2">
                          <Row className="mt-3">
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
                                  Max. Working Hours Full Day <span className="text-danger">*</span>
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
                                  Overtime Applicable <span className="text-danger">*</span>
                                </Label>
                                <div className="form-check form-switch">
                                  <Input
                                    type="checkbox"
                                    name="OverTimeApplicable"
                                    checked={values.OverTimeApplicable}
                                    onChange={(e) => setFieldValue("OverTimeApplicable", e.target.checked)}
                                    className="form-check-input"
                                    role="switch"
                                  />
                                  <Label check className="form-check-label">
                                    {values.OverTimeApplicable ? "Yes" : "No"}
                                  </Label>
                                </div>
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Grace Period Mins (Over Time) <span className="text-danger">*</span>
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
                                  Weekly Holiday <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="select"
                                  name="WeeklyHoliday"
                                  value={values.WeeklyHoliday}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "WeeklyHoliday")}
                                  className="btn-square"
                                  invalid={touched.WeeklyHoliday && !!errors.WeeklyHoliday}
                                >
                                  {daysOfWeek.map((day) => (
                                    <option key={day} value={day}>
                                      {day}
                                    </option>
                                  ))}
                                </Input>
                                <ErrorMessage name="WeeklyHoliday" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>
                                  Max Allowed Leaves/Month <span className="text-danger">*</span>
                                </Label>
                                <Input
                                  type="number"
                                  name="MaxAllowedLeavesPerMonth"
                                  placeholder="Enter Max Allowed Leaves/Month"
                                  value={values.MaxAllowedLeavesPerMonth}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "MaxAllowedLeavesPerMonth")}
                                  invalid={touched.MaxAllowedLeavesPerMonth && !!errors.MaxAllowedLeavesPerMonth}
                                />
                                <ErrorMessage name="MaxAllowedLeavesPerMonth" component="div" className="text-danger small" />
                              </FormGroup>
                            </Col>
                          </Row>
                        </TabPane>

                        {/* Tab 3: Family, Qualification & Documents */}
                        <TabPane tabId="3">
                          <Row className="mt-3">
                            {/* Family Details Section */}
                            <Col xs="12">
                              <h6 className="mb-3" style={{ backgroundColor: "#f8f9fa", padding: "10px", borderRadius: "5px" }}>
                                Family Details
                              </h6>
                            </Col>
                            <Col md="4">
                              <FormGroup>
                                <Label>Father's Name</Label>
                                <Input
                                  type="text"
                                  name="FathersName"
                                  placeholder="Enter Father's Name"
                                  value={values.FathersName}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "FathersName")}
                                />
                              </FormGroup>
                            </Col>
                            <Col md="4">
                              <FormGroup>
                                <Label>Father's Date Of Birth</Label>
                                <Input
                                  type="date"
                                  name="FathersDateOfBirth"
                                  value={values.FathersDateOfBirth}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "FathersDateOfBirth")}
                                />
                              </FormGroup>
                            </Col>
                            <Col md="4">
                              <FormGroup>
                                <Label>Mother's Name</Label>
                                <Input
                                  type="text"
                                  name="MothersName"
                                  placeholder="Enter Mother's Name"
                                  value={values.MothersName}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "MothersName")}
                                />
                              </FormGroup>
                            </Col>
                            <Col md="4">
                              <FormGroup>
                                <Label>Mother's Date Of Birth</Label>
                                <Input
                                  type="date"
                                  name="MothersDateOfBirth"
                                  value={values.MothersDateOfBirth}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "MothersDateOfBirth")}
                                />
                              </FormGroup>
                            </Col>
                            <Col md="4">
                              <FormGroup>
                                <Label>Wife's Name</Label>
                                <Input
                                  type="text"
                                  name="WifesName"
                                  placeholder="Enter Wife's Name"
                                  value={values.WifesName}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "WifesName")}
                                />
                              </FormGroup>
                            </Col>
                            <Col md="4">
                              <FormGroup>
                                <Label>Wife's Date Of Birth</Label>
                                <Input
                                  type="date"
                                  name="WifesDateOfBirth"
                                  value={values.WifesDateOfBirth}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "WifesDateOfBirth")}
                                />
                              </FormGroup>
                            </Col>
                            {/* Child Details Section */}
                            <Col xs="12" className="mt-4">
                              <div style={{ backgroundColor: "#f8f9fa", padding: "10px", borderRadius: "5px", marginBottom: "15px" }}>
                                <h6 className="mb-0">Child Details</h6>
                              </div>
                              <div className="table-responsive">
                                <table className="table table-bordered">
                                  <thead>
                                    <tr style={{ backgroundColor: "#f8f9fa" }}>
                                      <th style={{ width: "50px" }}>#</th>
                                      <th>Name</th>
                                      <th style={{ width: "150px" }}>Date Of Birth</th>
                                      <th style={{ width: "120px" }}>M/F</th>
                                      <th style={{ width: "100px" }}>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {values.Children.map((child, index) => (
                                      <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>
                                          <Input
                                            type="text"
                                            placeholder="Enter Name"
                                            value={child.Name}
                                            onChange={(e) => {
                                              const newChildren = [...values.Children];
                                              newChildren[index].Name = e.target.value;
                                              setFieldValue("Children", newChildren);
                                            }}
                                            onBlur={handleBlur}
                                          />
                                        </td>
                                        <td style={{ width: "150px" }}>
                                          <Input
                                            type="date"
                                            value={child.DateOfBirth}
                                            onChange={(e) => {
                                              const newChildren = [...values.Children];
                                              newChildren[index].DateOfBirth = e.target.value;
                                              setFieldValue("Children", newChildren);
                                            }}
                                            onBlur={handleBlur}
                                            style={{ width: "100%" }}
                                          />
                                        </td>
                                        <td style={{ width: "120px" }}>
                                          <Input
                                            type="select"
                                            value={child.Gender}
                                            onChange={(e) => {
                                              const newChildren = [...values.Children];
                                              newChildren[index].Gender = e.target.value;
                                              setFieldValue("Children", newChildren);
                                            }}
                                            onBlur={handleBlur}
                                            className="btn-square"
                                            style={{ width: "100%" }}
                                          >
                                            <option value="">Select</option>
                                            <option value="M">M</option>
                                            <option value="F">F</option>
                                          </Input>
                                        </td>
                                        <td>
                                          <div className="d-flex gap-2 justify-content-center">
                                            <Btn
                                              color="success"
                                              size="sm"
                                              type="button"
                                              onClick={() => {
                                                const newChildren = [...values.Children, { Name: "", DateOfBirth: "", Gender: "" }];
                                                setFieldValue("Children", newChildren);
                                              }}
                                            >
                                              <i className="fa fa-plus"></i>
                                            </Btn>
                                            {values.Children.length > 1 && (
                                              <Btn
                                                color="danger"
                                                size="sm"
                                                type="button"
                                                onClick={() => {
                                                  const newChildren = values.Children.filter((_, i) => i !== index);
                                                  setFieldValue("Children", newChildren);
                                                }}
                                              >
                                                <i className="fa fa-minus"></i>
                                              </Btn>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </Col>

                            {/* Qualification Section */}
                            <Col xs="12" className="mt-4">
                              <h6 className="mb-3" style={{ backgroundColor: "#f8f9fa", padding: "10px", borderRadius: "5px" }}>
                                Qualification
                              </h6>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>Qualification</Label>
                                <Input
                                  type="text"
                                  name="Qualification"
                                  placeholder="Enter Qualification"
                                  value={values.Qualification}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "Qualification")}
                                />
                              </FormGroup>
                            </Col>

                            {/* Documents Section */}
                            <Col xs="12" className="mt-4">
                              <h6 className="mb-3" style={{ backgroundColor: "#f8f9fa", padding: "10px", borderRadius: "5px" }}>
                                Identity Confirmation
                              </h6>
                            </Col>
                            
                            {/* Document ID 1 */}
                            <Col md="4">
                              <FormGroup>
                                <Label>Type of Document (ID 1)</Label>
                                <Input
                                  type="select"
                                  name="Document1Type"
                                  value={values.Document1Type}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "Document1Type")}
                                  className="btn-square"
                                >
                                  <option value="">Select</option>
                                  <option value="Aadhar Card">Aadhar Card</option>
                                  <option value="PAN Card">PAN Card</option>
                                  <option value="Driving License">Driving License</option>
                                  <option value="Passport">Passport</option>
                                  <option value="Voter ID">Voter ID</option>
                                  <option value="Other">Other</option>
                                </Input>
                              </FormGroup>
                            </Col>
                            <Col md="4">
                              <FormGroup>
                                <Label>Document No. (ID 1)</Label>
                                <Input
                                  type="text"
                                  name="Document1No"
                                  placeholder="Enter Document No."
                                  value={values.Document1No}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "Document1No")}
                                />
                              </FormGroup>
                            </Col>
                            <Col md="4">
                              <FormGroup>
                                <Label>DocumentId 1</Label>
                                <Input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    setFiles((prev) => ({ ...prev, DocumentId1: file }));
                                  }}
                                />
                                {files.DocumentId1 && (
                                  <small className="text-muted d-block mt-1">
                                    Selected: {files.DocumentId1.name}
                                  </small>
                                )}
                              </FormGroup>
                            </Col>

                            {/* Document ID 2 */}
                            <Col md="4">
                              <FormGroup>
                                <Label>Type of Document (ID 2)</Label>
                                <Input
                                  type="select"
                                  name="Document2Type"
                                  value={values.Document2Type}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "Document2Type")}
                                  className="btn-square"
                                >
                                  <option value="">Select</option>
                                  <option value="Aadhar Card">Aadhar Card</option>
                                  <option value="PAN Card">PAN Card</option>
                                  <option value="Driving License">Driving License</option>
                                  <option value="Passport">Passport</option>
                                  <option value="Voter ID">Voter ID</option>
                                  <option value="Other">Other</option>
                                </Input>
                              </FormGroup>
                            </Col>
                            <Col md="4">
                              <FormGroup>
                                <Label>Document No. (ID 2)</Label>
                                <Input
                                  type="text"
                                  name="Document2No"
                                  placeholder="Enter Document No."
                                  value={values.Document2No}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  onKeyDown={(e) => handleKeyDown(e, "Document2No")}
                                />
                              </FormGroup>
                            </Col>
                            <Col md="4">
                              <FormGroup>
                                <Label>DocumentId 2</Label>
                                <Input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    setFiles((prev) => ({ ...prev, DocumentId2: file }));
                                  }}
                                />
                                {files.DocumentId2 && (
                                  <small className="text-muted d-block mt-1">
                                    Selected: {files.DocumentId2.name}
                                  </small>
                                )}
                              </FormGroup>
                            </Col>

                            {/* Employee Media */}
                            <Col md="6">
                              <FormGroup>
                                <Label>Employee Photo</Label>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    setFiles((prev) => ({ ...prev, EmployeePhoto: file }));
                                  }}
                                />
                                {files.EmployeePhoto && (
                                  <small className="text-muted d-block mt-1">
                                    Selected: {files.EmployeePhoto.name}
                                  </small>
                                )}
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Label>Employee Signature</Label>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    setFiles((prev) => ({ ...prev, EmployeeSignature: file }));
                                  }}
                                />
                                {files.EmployeeSignature && (
                                  <small className="text-muted d-block mt-1">
                                    Selected: {files.EmployeeSignature.name}
                                  </small>
                                )}
                              </FormGroup>
                            </Col>
                          </Row>
                        </TabPane>
                      </TabContent>
                    </CardBody>
                    <CardFooter className="text-start">
                      <Btn
                        color="secondary"
                        type="button"
                        className="me-2"
                        onClick={() => navigate("/employeeMaster")}
                      >
                        Cancel
                      </Btn>
                      {activeTab === "3" ? (
                        <Btn color="primary" type="submit">
                          {isEditMode ? "Update" : "Save"}
                        </Btn>
                      ) : (
                        <Btn
                          color="primary"
                          type="button"
                          onClick={() => {
                            if (activeTab === "1") {
                              setActiveTab("2");
                            } else if (activeTab === "2") {
                              setActiveTab("3");
                            }
                          }}
                        >
                          Next
                        </Btn>
                      )}
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

export default AddEdit_EmployeeMasterContainer;
