import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Formik, Form, ErrorMessage } from "formik";
import type { FormikProps } from "formik";
import * as Yup from "yup";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_AddEditData, Fn_GetReport } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { formatDateForAPI } from "../../utils/dateFormatUtils";

const API_URL_EMPLOYEE = `${API_WEB_URLS.MASTER}/0/token/EmployeeMaster/Id/0`;
const API_URL_LEAVE_TYPE = `${API_WEB_URLS.MASTER}/0/token/LeaveType/Id/0`;

interface FormValues {
  F_EmployeeMaster: string;
  F_LeaveType: string;
  LeaveDate: string;
  Remarks: string;
}

const LeaveAssignContainer = () => {
  const [state, setState] = useState({
    id: 0,
    FillArray: [],
    formData: {} as any,
    OtherDataScore: [],
    isProgress: true,
    EmployeeArray: [] as any[],
    LeaveTypeArray: [] as any[],
  });

  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [remainingBalance, setRemainingBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);
  const [dateError, setDateError] = useState<string>("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Helper function to format date as YYYY-MM-DD without timezone issues
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calculate total applied leave days (frontend calculation)
  const calculateTotalDays = (): number => {
    if (!fromDate || !toDate) return 0;
    try {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      const diffTime = Math.abs(to.getTime() - from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both dates
      return diffDays;
    } catch (e) {
      return 0;
    }
  };

  // Get day name for date
  const getDayName = (dateString: string): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return days[date.getDay()];
    } catch (e) {
      return "";
    }
  };

  // Format date for display (DD/MM/YYYY)
  const formatDateDisplay = (dateString: string): string => {
    if (!dateString) return "";
    try {
      const [year, month, day] = dateString.split("-");
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateString;
    }
  };

  useEffect(() => {
    // Load Employee and LeaveType data
    loadEmployeeData();
    loadLeaveTypeData();

    // Set default dates to today
    const today = new Date();
    setFromDate(formatDateLocal(today));
    setToDate(formatDateLocal(today));
  }, []);

  // Fetch remaining balance when dates are selected
  useEffect(() => {
    if (fromDate && toDate && !dateError) {
      fetchRemainingBalance();
    } else {
      setRemainingBalance(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, dateError]);

  const loadEmployeeData = async () => {
    try {
      await Fn_FillListData(dispatch, setState, "EmployeeArray", API_URL_EMPLOYEE);
    } catch (error) {
      console.error("Error loading employee data:", error);
    }
  };

  const loadLeaveTypeData = async () => {
    try {
      await Fn_FillListData(dispatch, setState, "LeaveTypeArray", API_URL_LEAVE_TYPE);
    } catch (error) {
      console.error("Error loading leave type data:", error);
    }
  };

  // SetState function for Fn_GetReport
  const setStateForBalance = (data: any) => {
    // This function is called by Fn_GetReport but we'll handle data in fetchRemainingBalance
  };

  // Fetch remaining balance from backend
  const fetchRemainingBalance = async () => {
    if (!fromDate || !toDate || dateError) {
      setRemainingBalance(null);
      return;
    }

    setLoadingBalance(true);
    try {
      // Get UserId from localStorage
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

      // Create FormData for multipart request
      const formData = new FormData();
      formData.append("FromDate", formatDateForAPI(fromDate));
      formData.append("ToDate", formatDateForAPI(toDate));
      // Add Employee and LeaveType if available
      // Note: Adjust API endpoint and parameters based on your actual backend

      // API URL for remaining balance - adjust based on your actual endpoint
      const apiURL = `LeaveBalance/${userId}/token`;
      
      // Using Fn_GetReport to fetch balance
      const response = await Fn_GetReport(
        dispatch,
        setStateForBalance,
        "balanceData",
        apiURL,
        { arguList: { id: 0, formData: formData } },
        true // isMultiPart
      );

      // Process response - adjust based on your actual API response structure
      if (response && Array.isArray(response) && response.length > 0) {
        const balanceData = response[0];
        if (balanceData.RemainingBalance !== undefined) {
          setRemainingBalance(Number(balanceData.RemainingBalance));
        } else {
          setRemainingBalance(null);
        }
      } else if (response && response.RemainingBalance !== undefined) {
        setRemainingBalance(Number(response.RemainingBalance));
      } else if (response && response.data && response.data.RemainingBalance !== undefined) {
        setRemainingBalance(Number(response.data.RemainingBalance));
      } else {
        setRemainingBalance(null);
      }
    } catch (error) {
      console.error("Error fetching remaining balance:", error);
      setRemainingBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  };

  // Validate dates
  const validateDates = () => {
    if (!fromDate || !toDate) {
      setDateError("");
      return true;
    }

    try {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      
      if (to < from) {
        setDateError("To Date must be greater than or equal to From Date.");
        return false;
      }
      
      setDateError("");
      return true;
    } catch (e) {
      setDateError("Invalid date format.");
      return false;
    }
  };

  // Handle From Date change
  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>, setFieldValue: any) => {
    const newFromDate = e.target.value;
    setFromDate(newFromDate);
    setFieldValue("LeaveDate", newFromDate); // Set LeaveDate to From Date
    if (validateDates()) {
      // Dates are valid, will trigger balance fetch via useEffect
    }
  };

  // Handle To Date change
  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newToDate = e.target.value;
    setToDate(newToDate);
    if (validateDates()) {
      // Dates are valid, will trigger balance fetch via useEffect
    }
  };

  const validationSchema = Yup.object({
    F_EmployeeMaster: Yup.string().required("Employee is required"),
    F_LeaveType: Yup.string().required("Leave Type is required"),
    LeaveDate: Yup.string().required("Leave Date is required"),
    Remarks: Yup.string(),
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
    vformData.append("F_EmployeeMaster", values.F_EmployeeMaster);
    vformData.append("F_LeaveType", values.F_LeaveType);
    // Format LeaveDate as date-time string
    const leaveDateFormatted = formatDateForAPI(values.LeaveDate);
    vformData.append("LeaveDate", leaveDateFormatted);
    vformData.append("Remarks", values.Remarks || "");

    // API URL: EmployeeLeave/{UserId}/token
    const API_URL_SAVE = `EmployeeLeave/${userId}/token`;

    Fn_AddEditData(
      dispatch,
      setState,
      { arguList: { id: state.id, formData: vformData } },
      API_URL_SAVE,
      true, // isMultiPart
      "memberid",
      navigate,
      "/leaveAssign"
    );
  };

  const getInitialValues = (): FormValues => ({
    F_EmployeeMaster: "",
    F_LeaveType: "",
    LeaveDate: fromDate || "",
    Remarks: "",
  });

  const totalAppliedDays = calculateTotalDays();
  const isSameDay = fromDate === toDate;

  return (
    <div className="page-body">
      <Breadcrumbs mainTitle="Leave Assign" parent="Transactions" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Formik<FormValues>
              initialValues={getInitialValues()}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ values, handleChange, handleBlur, errors, touched, setFieldValue }: FormikProps<FormValues>) => (
                <Form className="theme-form">
                  <Card>
                    <CardHeaderCommon
                      title="Leave Type"
                      tagClass="card-title mb-0"
                    />
                    <CardBody>
                      <Row>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Leave Type <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="select"
                              name="F_LeaveType"
                              value={values.F_LeaveType}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              invalid={touched.F_LeaveType && !!errors.F_LeaveType}
                            >
                              <option value="">Select Leave Type</option>
                              {state.LeaveTypeArray.map((leaveType: any) => (
                                <option key={leaveType.Id} value={leaveType.Id}>
                                  {leaveType.LeaveName || leaveType.Name || `Leave Type ${leaveType.Id}`}
                                </option>
                              ))}
                            </Input>
                            <ErrorMessage name="F_LeaveType" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Employee <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="select"
                              name="F_EmployeeMaster"
                              value={values.F_EmployeeMaster}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              invalid={touched.F_EmployeeMaster && !!errors.F_EmployeeMaster}
                            >
                              <option value="">Select Employee</option>
                              {state.EmployeeArray.map((employee: any) => (
                                <option key={employee.Id} value={employee.Id}>
                                  {employee.Name || employee.MachineEnrollmentNo || `Employee ${employee.Id}`}
                                </option>
                              ))}
                            </Input>
                            <ErrorMessage name="F_EmployeeMaster" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              From Date <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="date"
                              name="LeaveDate"
                              value={fromDate}
                              onChange={(e) => handleFromDateChange(e, setFieldValue)}
                              invalid={!!dateError}
                            />
                            {dateError && (
                              <div className="text-danger small mt-1">{dateError}</div>
                            )}
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              To Date <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="date"
                              value={toDate}
                              onChange={handleToDateChange}
                              invalid={!!dateError}
                            />
                            {dateError && (
                              <div className="text-danger small mt-1">{dateError}</div>
                            )}
                          </FormGroup>
                        </Col>
                      </Row>

                      {/* Summary Box */}
                      {fromDate && toDate && !dateError && (
                        <Row className="mt-3 mb-3">
                          <Col md="12">
                            <div style={{ 
                              backgroundColor: "#f8f9fa", 
                              padding: "20px", 
                              borderRadius: "8px",
                              border: "1px solid #dee2e6"
                            }}>
                              <Row className="align-items-center">
                                <Col md="6">
                                  <div style={{ fontSize: "16px", marginBottom: "10px" }}>
                                    <strong>{formatDateDisplay(fromDate)} {isSameDay ? `(${getDayName(fromDate)})` : `- ${formatDateDisplay(toDate)} (${getDayName(toDate)})`}</strong>
                                  </div>
                                  <div style={{ fontSize: "14px", color: "#6c757d" }}>
                                    Full Day
                                  </div>
                                </Col>
                                <Col md="6" className="text-end">
                                  <div style={{ fontSize: "14px", marginBottom: "8px" }}>
                                    <strong>Total Applied Leave Days: {totalAppliedDays} Days</strong>
                                  </div>
                                  <div style={{ fontSize: "14px" }}>
                                    {loadingBalance ? (
                                      <span style={{ color: "#6c757d" }}>Loading balance...</span>
                                    ) : (
                                      <strong>Remaining Balance: {remainingBalance !== null ? `${remainingBalance} Days` : "N/A"}</strong>
                                    )}
                                  </div>
                                </Col>
                              </Row>
                            </div>
                          </Col>
                        </Row>
                      )}

                      <Row>
                        <Col md="12">
                          <FormGroup>
                            <Label>Reason</Label>
                            <Input
                              type="textarea"
                              name="Remarks"
                              placeholder="Enter reason for leave"
                              value={values.Remarks}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              rows={4}
                            />
                            <ErrorMessage name="Remarks" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                      </Row>
                    </CardBody>
                    <CardFooter className="text-end">
                      <Btn
                        color="secondary"
                        type="button"
                        className="me-2"
                        onClick={() => navigate("/leaveAssign")}
                      >
                        Cancel
                      </Btn>
                      <Btn color="primary" type="submit" id="submitButton">
                        Save
                      </Btn>
                    </CardFooter>
                  </Card>
                </Form>
              )}
            </Formik>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LeaveAssignContainer;
