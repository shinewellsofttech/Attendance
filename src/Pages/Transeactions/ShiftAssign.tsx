import { useEffect, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Formik, Form, ErrorMessage } from "formik";
import type { FormikProps } from "formik";
import * as Yup from "yup";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_DisplayData, Fn_AddEditData, Fn_GetReport, showToastWithCloseButton } from "../../store/Functions";
import { callAdd_Data_Multipart } from "../../store/common-actions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { formatDateForInput, formatDateForAPI } from "../../utils/dateFormatUtils";
import { toast } from "react-toastify";

interface EmployeeShiftRow {
  F_DepartmentMaster: string;
  F_EmployeeMaster: string;
  F_ShiftMaster1: string;
  F_ShiftMaster2: string;
}

interface FormValues {
  Rows: EmployeeShiftRow[];
}

// API URL will be constructed dynamically with UserId and UserToken
const API_URL_SAVE_BASE = "ShiftAssign";
const API_URL_LOAD_DATA_BASE = API_WEB_URLS.MASTER + "/{UserId}/token/ShiftAssignData";
const API_URL_DEPARTMENT = API_WEB_URLS.MASTER + "/0/token/DepartmentMaster/Id/0";
const API_URL_EMPLOYEE = API_WEB_URLS.MASTER + "/0/token/EmployeeMaster/Id/0";
const API_URL_SHIFT = API_WEB_URLS.MASTER + "/0/token/ShiftMaster/Id/0";

const ShiftAssignContainer = () => {
  const [state, setState] = useState({
    id: 0,
    DepartmentArray: [] as any[],
    EmployeeArray: [] as any[],
    ShiftArray: [] as any[],
    formData: {} as any,
    OtherDataScore: [],
    isProgress: true,
  });

  // Store employees per row based on department selection
  const [rowEmployees, setRowEmployees] = useState<{ [key: number]: any[] }>({});
  
  // Date state for shift assignment
  const [shiftDate, setShiftDate] = useState<string>("");

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Load Department, Employee and Shift data for dropdowns
    Fn_FillListData(dispatch, setState, "DepartmentArray", API_URL_DEPARTMENT);
    Fn_FillListData(dispatch, setState, "EmployeeArray", API_URL_EMPLOYEE);
    Fn_FillListData(dispatch, setState, "ShiftArray", API_URL_SHIFT);

    // Set default date to today
    const today = new Date();
    const defaultDate = formatDateForInput(today.toISOString().split('T')[0]);
    setShiftDate(defaultDate);
  }, [dispatch]);

  // Load shift assignment data when date is selected
  useEffect(() => {
    const loadShiftDataForDate = async () => {
      if (shiftDate) {
        try {
          // Get UserId from authUser
          let userId = 0;
          try {
            const authUserStr = localStorage.getItem("authUser");
            if (authUserStr) {
              const authUser = JSON.parse(authUserStr);
              userId = authUser?.Id ? Number(authUser.Id) : 0;
            }
          } catch (error) {
            console.error("Error parsing authUser from localStorage:", error);
          }

          if (userId === 0) {
            console.error("User not authenticated");
            return;
          }

          // Construct API URL: Masters/{UserId}/token/ShiftAssignData/{date}/0
          const apiUrl = `${API_WEB_URLS.MASTER}/${userId}/token/ShiftAssignData/${shiftDate}/0`;
          
          // Create a custom setState to capture the data
          let loadedData: any[] = [];
          const customSetState = (newState: any) => {
            if (typeof newState === "function") {
              const updatedState = newState({ formData: [] });
              if (updatedState.formData && Array.isArray(updatedState.formData)) {
                loadedData = updatedState.formData;
              }
            } else {
              if (newState.formData && Array.isArray(newState.formData)) {
                loadedData = newState.formData;
              }
            }
            // Update state
            setState((prevState) => ({
              ...prevState,
              formData: loadedData,
            }));
          };
          
          const result = await Fn_FillListData(dispatch, customSetState, "formData", apiUrl);
          
          // Use result if available, otherwise use loadedData
          const dataArray = (result && Array.isArray(result)) ? result : loadedData;
          
          if (dataArray && dataArray.length > 0) {
            // Load employees for each row based on department
            for (let index = 0; index < dataArray.length; index++) {
              const row = dataArray[index];
              if (row.F_DepartmentMaster) {
                await loadEmployeesByDepartment(index, String(row.F_DepartmentMaster));
              } else {
                await loadEmployeesByDepartment(index, "");
              }
            }
          } else {
            // No data for this date, clear form data and load employees for initial empty row
            setState((prevState) => ({
              ...prevState,
              formData: [],
            }));
            setRowEmployees({});
            await loadEmployeesByDepartment(0, "");
          }
        } catch (error) {
          console.error("Error loading shift data for date:", error);
          // Clear form data and load employees for initial empty row on error
          setState((prevState) => ({
            ...prevState,
            formData: [],
          }));
          setRowEmployees({});
          await loadEmployeesByDepartment(0, "");
        }
      }
    };

    loadShiftDataForDate();
  }, [shiftDate, dispatch]);

  // Load employees for rows when formData is loaded (only when data is loaded from API, not on user interaction)
  useEffect(() => {
    const loadEmployeesForRows = async () => {
      // Only load employees when formData is set from API response, not during user interaction
      const resolvedRows = (() => {
        if (Array.isArray(state.formData) && state.formData.length > 0) return state.formData;
        if (state.formData?.dataList && Array.isArray(state.formData.dataList) && state.formData.dataList.length > 0) {
          return state.formData.dataList;
        }
        if (state.formData?.Rows && Array.isArray(state.formData.Rows) && state.formData.Rows.length > 0) {
          return state.formData.Rows;
        }
        return null;
      })();

      if (resolvedRows && resolvedRows.length > 0) {
        // Load employees for existing rows from API data
        for (let index = 0; index < resolvedRows.length; index++) {
          const row = resolvedRows[index];
          if (row.F_DepartmentMaster) {
            await loadEmployeesByDepartment(index, String(row.F_DepartmentMaster));
          } else {
            // Load all employees if no department selected
            await loadEmployeesByDepartment(index, "");
          }
        }
      } else if (!shiftDate && (!state.formData || (Array.isArray(state.formData) && state.formData.length === 0))) {
        // Add mode - load employees for the initial empty row (only if no date selected yet and no formData)
        await loadEmployeesByDepartment(0, "");
      }
    };

    loadEmployeesForRows();
  }, [shiftDate]); // Only depend on shiftDate, not formData to avoid interference

  const validationSchema = Yup.object({
    Rows: Yup.array()
      .of(
        Yup.object({
          F_DepartmentMaster: Yup.string().required("Department is required"),
          F_EmployeeMaster: Yup.string().required("Employee is required"),
          F_ShiftMaster1: Yup.string().required("Shift Master 1 is required"),
          F_ShiftMaster2: Yup.string(),
        })
      )
      .min(1, "At least one row is required"),
  });

  const handleSubmit = async (values: FormValues) => {
    if (!shiftDate) {
      alert("Please select a date");
      return;
    }

    // Get UserId and UserToken from authUser
    let userId = 0;
    let userToken = "token"; // Default token value
    try {
      const authUserStr = localStorage.getItem("authUser");
      if (authUserStr) {
        const authUser = JSON.parse(authUserStr);
        userId = authUser?.Id ? Number(authUser.Id) : 0;
        // Check if token exists in authUser, otherwise use default "token"
        userToken = authUser?.Token || authUser?.UserToken || "token";
      }
    } catch (error) {
      console.error("Error parsing authUser from localStorage:", error);
    }

    if (userId === 0) {
      alert("User not authenticated. Please login again.");
      return;
    }
    
    // Prepare data in the required format
    const shiftAssignData = values.Rows
      .filter((row) => 
        row.F_DepartmentMaster && 
        row.F_EmployeeMaster && 
        row.F_ShiftMaster1
      )
      .map((row) => ({
        F_DepartmentMaster: Number(row.F_DepartmentMaster),
        F_EmployeeMaster: Number(row.F_EmployeeMaster),
        ShiftDate: formatDateForAPI(shiftDate),
        F_ShiftMaster1: Number(row.F_ShiftMaster1),
        F_ShiftMaster2: row.F_ShiftMaster2 ? Number(row.F_ShiftMaster2) : 0,
      }));

    if (shiftAssignData.length === 0) {
      alert("Please add at least one valid row");
      return;
    }

    // Construct API URL with UserId and UserToken in path
    const apiUrl = `${API_URL_SAVE_BASE}/${userId}/${userToken}`;

    let vformData = new FormData();
    // Send JsonData as string (JSON stringified array)
    vformData.append("JsonData", JSON.stringify(shiftAssignData));
    // Send UserId as number in request body
    vformData.append("UserId", String(userId));

    // Call API directly with custom callback to handle response properly
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      const response = await new Promise((resolve, reject) => {
        const request = {
          arguList: { id: 0, formData: vformData },
          apiURL: apiUrl,
          callback: (response: any) => {
            // Clear timeout if response received
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            
            console.log("ShiftAssign API Response (Full):", JSON.stringify(response, null, 2));
            
            // Check for success in response structure
            // Response format: { success: true, status: 200, message: "Record added.", data: {...} }
            if (response && response.success === true) {
              const message = response.message || "Record saved successfully";
              console.log("Showing success toast with message:", message);
              
              // Use toast directly to ensure it shows
              toast.success(message, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              });
              
              // Also call the function for consistency
              showToastWithCloseButton("success", message);
              resolve(response);
            } else if (response && response.data && response.data.success === true) {
              // Alternative structure: response.data.success
              const message = response.data.message || "Record saved successfully";
              console.log("Showing success toast with message:", message);
              
              toast.success(message, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              });
              
              showToastWithCloseButton("success", message);
              resolve(response);
            } else if (response && (response.status === 200 || response.statusCode === 200)) {
              // Fallback: check HTTP status code
              console.log("Showing success toast (status check)");
              
              toast.success("Record saved successfully", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              });
              
              showToastWithCloseButton("success", "Record saved successfully");
              resolve(response);
            } else {
              console.log("Error response:", response);
              const errorMessage = response?.message || response?.data?.message || "Error saving shift assignment";
              
              toast.error(errorMessage, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              });
              
              showToastWithCloseButton("error", errorMessage);
              reject(response);
            }
          },
        };
        
        console.log("Dispatching API call to:", apiUrl);
        dispatch(callAdd_Data_Multipart(request));
        
        // Set timeout to catch if callback is never called
        timeoutId = setTimeout(() => {
          console.error("API call timeout - no response received");
          toast.error("Request timeout. Please try again.", {
            position: "top-right",
            autoClose: 3000,
          });
          reject(new Error("Request timeout"));
        }, 30000);
      });
      
      // Success - don't navigate, let user continue working
      console.log("Shift assignment saved successfully:", response);
    } catch (error) {
      console.error("Error saving shift assignment:", error);
      // Clear timeout if error occurred
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      // Show error toast if not already shown
      const errorObj = error as any;
      if (errorObj && typeof errorObj === 'object' && errorObj.message !== "Request timeout") {
        const errorMessage = errorObj?.message || errorObj?.data?.message || "Error saving shift assignment";
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 3000,
        });
        showToastWithCloseButton("error", errorMessage);
      } else if (errorObj?.message !== "Request timeout") {
        toast.error("Error saving shift assignment", {
          position: "top-right",
          autoClose: 3000,
        });
        showToastWithCloseButton("error", "Error saving shift assignment");
      }
    }
  };

  const isEditMode = false; // Always false since we're using date-based loading

  // Helper function to safely convert time to string
  const formatTimeToString = (time: any): string => {
    if (!time) return "";
    
    // If it's already a string, return it
    if (typeof time === "string") {
      // If it's already in HH:MM format, return as is
      if (time.match(/^\d{1,2}:\d{2}$/)) return time;
      return time;
    }
    
    // If it's an object, try to extract time value
    if (typeof time === "object" && time !== null) {
      // Check for duration object with hours/minutes (from ShiftMaster API)
      if (time.hours !== undefined && time.minutes !== undefined) {
        const hours = Math.floor(time.hours) || 0;
        const minutes = Math.floor(time.minutes) || 0;
        const hoursStr = String(hours).padStart(2, "0");
        const minutesStr = String(minutes).padStart(2, "0");
        return `${hoursStr}:${minutesStr}`;
      }
      
      // Check for totalHours and calculate hours/minutes if needed
      if (time.totalHours !== undefined) {
        const totalHours = time.totalHours;
        const hours = Math.floor(totalHours);
        const minutes = Math.floor((totalHours - hours) * 60);
        const hoursStr = String(hours).padStart(2, "0");
        const minutesStr = String(minutes).padStart(2, "0");
        return `${hoursStr}:${minutesStr}`;
      }
      
      // Check for common time object properties
      if (time.time) return String(time.time);
      if (time.value) return String(time.value);
      
      // Try toString as last resort
      if (time.toString && typeof time.toString === "function") {
        try {
          return time.toString();
        } catch (e) {
          return "";
        }
      }
      
      return "";
    }
    
    // Fallback to String conversion
    return String(time);
  };

  // Load employees based on department selection
  const loadEmployeesByDepartment = async (rowIndex: number, departmentId: string) => {
    try {
      let apiUrl = "";
      
      // If department is selected, use TBL.F_DepartmentMaster/{Department Id}
      // Otherwise, use Id/0
      if (departmentId && departmentId !== "") {
        apiUrl = `${API_WEB_URLS.MASTER}/0/token/EmployeeMasterForDropdown/TBL.F_Department/${departmentId}`;
      } else {
        apiUrl = `${API_WEB_URLS.MASTER}/0/token/EmployeeMasterForDropdown/Id/0`;
      }

      // Create a temporary state object to capture the EmployeeArray
      let capturedData: any[] = [];
      
      // setState function for Fn_FillListData
      const tempSetState = (newState: any) => {
        if (typeof newState === "function") {
          const updatedState = newState({ EmployeeArray: [] });
          if (updatedState.EmployeeArray && Array.isArray(updatedState.EmployeeArray)) {
            capturedData = updatedState.EmployeeArray;
          }
        } else {
          if (newState.EmployeeArray && Array.isArray(newState.EmployeeArray)) {
            capturedData = newState.EmployeeArray;
          }
        }
      };

      // Call Fn_FillListData to get employees filtered by department
      // Fn_FillListData returns a Promise that resolves with the dataList (response.data.dataList)
      const result = await Fn_FillListData(dispatch, tempSetState, "EmployeeArray", apiUrl);
      
      // Update rowEmployees with the result
      // Fn_FillListData resolves with the dataList array directly
      const employeeData = (result && Array.isArray(result)) ? result : (capturedData.length > 0 ? capturedData : []);
      
      setRowEmployees((prev) => ({
        ...prev,
        [rowIndex]: employeeData,
      }));
      
      console.log(`Loaded ${employeeData.length} employees for row ${rowIndex}, department: ${departmentId || 'All'}`);
    } catch (error) {
      console.error("Error loading employees by department:", error);
      setRowEmployees((prev) => ({
        ...prev,
        [rowIndex]: [],
      }));
    }
  };

  // Get filtered employees for a specific row
  const getFilteredEmployees = (rowIndex: number) => {
    return rowEmployees[rowIndex] || [];
  };

  // Resolve rows from possible response shapes (array or { dataList })
  // Memoize to prevent unnecessary recalculations
  const resolvedRows = useMemo(() => {
    if (Array.isArray(state.formData) && state.formData.length > 0) return state.formData;
    if (state.formData?.dataList && Array.isArray(state.formData.dataList) && state.formData.dataList.length > 0) {
      return state.formData.dataList;
    }
    if (state.formData?.Rows && Array.isArray(state.formData.Rows) && state.formData.Rows.length > 0) {
      return state.formData.Rows;
    }
    return null;
  }, [state.formData]);

  const initialValues: FormValues = useMemo(() => ({
    Rows: resolvedRows
      ? resolvedRows.map((row: any) => ({
          F_DepartmentMaster: String(row.F_DepartmentMaster || ""),
          F_EmployeeMaster: String(row.F_EmployeeMaster || ""),
          F_ShiftMaster1: String(row.F_ShiftMaster1 || ""),
          F_ShiftMaster2: String(row.F_ShiftMaster2 || ""),
        }))
      : [{
          F_DepartmentMaster: "",
          F_EmployeeMaster: "",
          F_ShiftMaster1: "",
          F_ShiftMaster2: "",
        }],
  }), [resolvedRows]);

  return (
    <>
    <div className="page-body" style={{ backgroundColor: "#e6f3ff" }}>
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
      
      <Breadcrumbs mainTitle="Shift Assign" parent="Transactions" />
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
                      {/* Header Section with Date */}
                      <Row className="mb-3">
                        <Col md="3">
                          <FormGroup>
                            <Label>
                              Date <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="date"
                              value={shiftDate}
                              onChange={async (e) => {
                                const selectedDate = e.target.value;
                                setShiftDate(selectedDate);
                                // Clear existing form data when date changes
                                setState((prevState) => ({
                                  ...prevState,
                                  formData: [],
                                }));
                                setRowEmployees({});
                              }}
                              className="form-control"
                              required
                            />
                          </FormGroup>
                        </Col>
                      </Row>

                      {/* Dynamic Rows with Employee and Two Shifts */}
                      <Row className="mt-4">
                        <Col xs="12">
                          {values.Rows.map((row, rowIndex) => (
                            <div key={rowIndex} className="emp-shift-row">
                              {/* Department Field */}
                              <div style={{ minWidth: "200px", flex: "1 1 auto" }}>
                                <FormGroup>
                                  <Label>
                                    Department <span className="text-danger">*</span>
                                  </Label>
                                  <Input
                                    type="select"
                                    value={row.F_DepartmentMaster}
                                    onChange={async (e) => {
                                      const newRows = [...values.Rows];
                                      newRows[rowIndex].F_DepartmentMaster = e.target.value;
                                      // Reset employee when department changes
                                      newRows[rowIndex].F_EmployeeMaster = "";
                                      setFieldValue("Rows", newRows);
                                      
                                      // Load employees based on selected department
                                      await loadEmployeesByDepartment(rowIndex, e.target.value);
                                    }}
                                    onBlur={handleBlur}
                                    className="btn-square"
                                    invalid={touched.Rows && errors.Rows && Array.isArray(errors.Rows) && errors.Rows[rowIndex] && !!(errors.Rows[rowIndex] as any)?.F_DepartmentMaster}
                                  >
                                    <option value="">Select Department</option>
                                    {state.DepartmentArray.map((item: any) => (
                                      <option key={item.Id} value={item.Id}>
                                        {item.Name || `Department ${item.Id}`}
                                      </option>
                                    ))}
                                  </Input>
                                  {touched.Rows && errors.Rows && Array.isArray(errors.Rows) && errors.Rows[rowIndex] && (errors.Rows[rowIndex] as any)?.F_DepartmentMaster && (
                                    <div className="text-danger small">
                                      {(errors.Rows[rowIndex] as any).F_DepartmentMaster}
                                    </div>
                                  )}
                                </FormGroup>
                              </div>

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
                                  {getFilteredEmployees(rowIndex).map((item: any) => (
                                    <option key={item.Id} value={item.Id}>
                                      {item.Name || item.EmployeeNo || item.MachineEnrollmentNo || `Employee ${item.Id}`}
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
                                        {item.Name} ({formatTimeToString(item.InTime)} - {formatTimeToString(item.OutTime)})
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
                                        {item.Name} ({formatTimeToString(item.InTime)} - {formatTimeToString(item.OutTime)})
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
                                onClick={async () => {
                                      const newRows = [...values.Rows, {
                                        F_DepartmentMaster: "",
                                        F_EmployeeMaster: "",
                                        F_ShiftMaster1: "",
                                        F_ShiftMaster2: "",
                                      }];
                                      setFieldValue("Rows", newRows);
                                      // Load employees for new row with department 0 (all employees)
                                      const newRowIndex = newRows.length - 1;
                                      await loadEmployeesByDepartment(newRowIndex, "");
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
                        onClick={() => navigate("/shiftAssign")}
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
      </div>
    </>
  );
};

export default ShiftAssignContainer;

