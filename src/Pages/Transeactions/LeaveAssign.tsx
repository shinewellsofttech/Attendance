import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_GetReport } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { formatDateForInput, formatDateForAPI } from "../../utils/dateFormatUtils";

const API_URL_EMPLOYEE = `${API_WEB_URLS.MASTER}/0/token/EmployeeMaster/Id/0`;

interface LeaveRecord {
  EmployeeId: number;
  EmployeeName: string;
  [key: string]: any; // For dynamic date columns
}


  const LeaveAssignContainer = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [dateError, setDateError] = useState<string>("");
  
  // State object for Fn_FillListData - Employee
  const [employeeState, setEmployeeState] = useState({
    EmployeeArray: [] as any[],
    isProgress: true,
  });

  // Table data and column keys from API response
  const [tableData, setTableData] = useState<LeaveRecord[]>([]);
  const [monthDates, setMonthDates] = useState<string[]>([]);
  const [columnKeys, setColumnKeys] = useState<string[]>([]); // Keys from API response (1, 2, 3, ...)

  const dispatch = useDispatch();

  // Helper function to format date as YYYY-MM-DD without timezone issues
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    // Load Employee data
    loadEmployeeData();
    
    // Set default dates: From Date = Day 1 of current month/year, To Date = Last day of current month/year
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed (0 = January, 11 = December)
    
    // From Date: Day 1 of current month and year
    const fromDateDefault = new Date(currentYear, currentMonth, 1);
    setFromDate(formatDateLocal(fromDateDefault));
    
    // To Date: Last day of current month and year
    const toDateDefault = new Date(currentYear, currentMonth + 1, 0); // Day 0 of next month = last day of current month
    setToDate(formatDateLocal(toDateDefault));
  }, []);

  // Generate dates when fromDate or toDate changes
  useEffect(() => {
    if (fromDate && toDate) {
      validateDates();
      generateDates();
    } else {
      setMonthDates([]);
    }
  }, [fromDate, toDate]);

  // Auto-fetch data when filters change
  useEffect(() => {
    if (selectedEmployee && fromDate && toDate && !dateError) {
      // Only fetch if all conditions are met
      fetchLeaveData();
    } else {
      // Clear table data if conditions are not met
      setTableData([]);
      setColumnKeys([]);
    }
  }, [selectedEmployee, fromDate, toDate, dateError]);

  const loadEmployeeData = async () => {
    try {
      await Fn_FillListData(dispatch, setEmployeeState, "EmployeeArray", API_URL_EMPLOYEE);
    } catch (error) {
      console.error("Error loading employee data:", error);
    }
  };

  // Validate that To Date has same month and year as From Date
  const validateDates = () => {
    if (!fromDate || !toDate) {
      setDateError("");
      return true;
    }

    try {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      
      const fromYear = from.getFullYear();
      const fromMonth = from.getMonth();
      const toYear = to.getFullYear();
      const toMonth = to.getMonth();
      
      if (fromYear !== toYear || fromMonth !== toMonth) {
        setDateError("To Date must be in the same month and year as From Date. Only the day can be different.");
        return false;
      }
      
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

  // Generate array of dates between fromDate and toDate
  const generateDates = () => {
    if (!fromDate || !toDate) {
      setMonthDates([]);
      return;
    }

    try {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      
      const dates: string[] = [];
      const currentDate = new Date(from);
      
      while (currentDate <= to) {
        dates.push(formatDateLocal(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      setMonthDates(dates);
    } catch (e) {
      setMonthDates([]);
    }
  };

  // Map API response values to display letters
  const mapValueToLetter = (value: number): string => {
    switch (value) {
      case 0:
        return "A"; // Absent
      case 1:
        return "P"; // Present
      case 2:
        return "H"; // Holiday
      case 3:
        return "O"; // Overtime
      default:
        return "-";
    }
  };

  // SetState function for Fn_GetReport
  const setStateForReport = (data: any) => {
    // This function is called by Fn_GetReport but we'll handle data in fetchLeaveData
  };

  // Fetch leave data from API using Fn_GetReport
  const fetchLeaveData = async () => {
    if (!selectedEmployee || !fromDate || !toDate || dateError) {
      return;
    }

    setLoading(true);
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
      formData.append("F_EmployeeMaster", String(selectedEmployee));

      // API URL: LeaveAssignData/{UserId}/token
      const apiURL = `LeaveAssignData/${userId}/token`;
      
      // Call Fn_GetReport
      const response = await Fn_GetReport(
        dispatch,
        setStateForReport,
        "leaveData",
        apiURL,
        { arguList: { id: 0, formData: formData } },
        true // isMultiPart
      );

      // Process response - Fn_GetReport returns response.data.response
      // But we need to handle the nested structure: { success: true, data: { response: [...] } }
      let responseData = null;
      
      if (response && Array.isArray(response)) {
        // Direct array response
        responseData = response;
      } else if (response && response.data && response.data.response && Array.isArray(response.data.response)) {
        // Nested response structure
        responseData = response.data.response;
      } else if (response && response.response && Array.isArray(response.response)) {
        // Alternative nested structure
        responseData = response.response;
      }
      
      if (responseData && responseData.length > 0) {
        const leaveData = responseData[0]; // Get first record
        
        // Extract column keys from API response (excluding F_EmployeeMaster)
        const keys = Object.keys(leaveData).filter(key => key !== "F_EmployeeMaster");
        // Sort keys numerically (1, 2, 3, ... instead of "1", "10", "11", "2", ...)
        const sortedKeys = keys.sort((a, b) => {
          const numA = parseInt(a, 10);
          const numB = parseInt(b, 10);
          return numA - numB;
        });
        setColumnKeys(sortedKeys);
        
        // Get employee details
        const employee = employeeState.EmployeeArray.find((emp: any) => emp.Id === Number(selectedEmployee));
        
        if (employee) {
          const record: LeaveRecord = {
            EmployeeId: employee.Id,
            EmployeeName: employee.Name || employee.MachineEnrollmentNo || `Employee ${employee.Id}`,
          };

          // Map API response keys (day numbers) to values
          sortedKeys.forEach((dayKey) => {
            // Get value from API response using day number as key
            const value = leaveData[dayKey];
            
            // Map value to letter (0=A, 1=P, 2=H, 3=O)
            if (value !== undefined && value !== null) {
              record[dayKey] = mapValueToLetter(Number(value));
            } else {
              record[dayKey] = "-";
            }
          });

          setTableData([record]);
        } else {
          setTableData([]);
        }
      } else {
        setTableData([]);
        setColumnKeys([]);
      }
    } catch (error) {
      console.error("Error fetching leave data:", error);
      setTableData([]);
      setColumnKeys([]);
    } finally {
      setLoading(false);
    }
  };


  const handleResetFilter = () => {
    setSelectedEmployee("");
    setDateError("");
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    setFromDate(formatDateLocal(firstDay));
    const lastDay = new Date(year, month + 1, 0);
    setToDate(formatDateLocal(lastDay));
  };

  // Handle From Date change
  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFromDate = e.target.value;
    setFromDate(newFromDate);
    
    // Always update To Date to same month/year as From Date
    if (newFromDate) {
      try {
        const from = new Date(newFromDate);
        const fromYear = from.getFullYear();
        const fromMonth = from.getMonth();
        
        // If toDate exists, try to keep the same day, otherwise use last day of month
        if (toDate) {
          const to = new Date(toDate);
          const lastDayOfMonth = new Date(fromYear, fromMonth + 1, 0).getDate();
          const currentDay = to.getDate();
          const newDay = currentDay <= lastDayOfMonth ? currentDay : lastDayOfMonth;
          const newToDate = new Date(fromYear, fromMonth, newDay);
          setToDate(formatDateLocal(newToDate));
        } else {
          // If toDate doesn't exist, set it to last day of the month
          const lastDayOfMonth = new Date(fromYear, fromMonth + 1, 0);
          setToDate(formatDateLocal(lastDayOfMonth));           
        }
      } catch (e) {
        // Ignore error
      }
    }
  };
  
  // Handle To Date change with validation
  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newToDate = e.target.value;
    setToDate(newToDate);
  };

  // Get employee options
  const getEmployeeOptions = () => {
    if (!employeeState.EmployeeArray || employeeState.EmployeeArray.length === 0) {
      return [];
    }
    return employeeState.EmployeeArray.map((employee: any) => ({
      value: employee.Id,
      label: employee.Name || employee.MachineEnrollmentNo || `Employee ${employee.Id}`
    }));
  };

  // Format date for display (DD-MM)
  const formatDateForTableHeader = (dateString: string): string => {
    if (!dateString) return "";
    try {
      const [year, month, day] = dateString.split("-");
      return `${day}-${month}`;
    } catch (e) {
      return dateString;
    }
  };

  // Get day name for date
  const getDayName = (dateString: string): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return days[date.getDay()];
    } catch (e) {
      return "";
    }
  };

  return (
    <div className="page-body" style={{ backgroundColor: "#e6f3ff" }}>
      <Breadcrumbs mainTitle="Leave Assign" parent="Transactions" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon
                title="Leave Assign"
                tagClass="card-title mb-0"
              />
              <CardBody>
                {/* Filter Section */}
                <Row className="mb-3">
                  <Col md="3">
                    <Label>Employee <span style={{ color: "red" }}>*</span></Label>
                    <Input
                      type="select"
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      required
                    >
                      <option value="">Select Employee</option>
                      {getEmployeeOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Input>
                  </Col>
                  <Col md="3">
                    <Label>From Date <span style={{ color: "red" }}>*</span></Label>
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={handleFromDateChange}
                      required
                    />
                  </Col>
                  <Col md="3">
                    <Label>To Date <span style={{ color: "red" }}>*</span></Label>
                    <Input
                      type="date"
                      value={toDate}
                      onChange={handleToDateChange}
                      required
                      invalid={!!dateError}
                    />
                    {dateError && (
                      <div className="text-danger small mt-1">{dateError}</div>
                    )}
                  </Col>
                  <Col md="3" className="d-flex align-items-end">
                    <Btn
                      color="secondary"
                      onClick={handleResetFilter}
                      disabled={loading}
                      className="w-100"
                    >
                      Reset
                    </Btn>
                  </Col>
                </Row>

                {/* Table Section */}
                {loading ? (
                  <div className="text-center py-4">
                    <p>Loading leave data...</p>
                  </div>
                ) : (
                  <div className="table-responsive" style={{ overflowX: "auto" }}>
                    <Table striped hover bordered className="table-bordered">
                      <thead style={{ backgroundColor: "#6D68CB", color: "#fff" }}>
                        <tr>
                          <th style={{ minWidth: "150px", position: "sticky", left: 0, backgroundColor: "#6D68CB", zIndex: 10 }}>
                            Employee Name
                          </th>
                          {columnKeys.map((dayKey) => (
                            <th
                              key={dayKey}
                              style={{
                                minWidth: "80px",
                                textAlign: "center",
                                fontSize: "12px",
                              }}
                            >
                              {dayKey}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.length === 0 ? (
                          <tr>
                            <td colSpan={columnKeys.length + 1} className="text-center p-4">
                              {employeeState.isProgress 
                                ? "Loading employees..." 
                                : !selectedEmployee
                                ? "Please select an employee to view leave data."
                                : !fromDate || !toDate
                                ? "Please select valid dates to view leave data."
                                : loading
                                ? "Loading leave data..."
                                : "No leave data available."}
                            </td>
                          </tr>
                        ) : (
                          tableData.map((record: LeaveRecord, index: number) => (
                            <tr key={record.EmployeeId} style={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa" }}>
                              <td style={{ position: "sticky", left: 0, backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa", zIndex: 5, fontWeight: "500" }}>
                                {record.EmployeeName}
                              </td>
                              {columnKeys.map((dayKey) => (
                                <td
                                  key={dayKey}
                                  style={{
                                    textAlign: "center",
                                    padding: "8px 4px",
                                    fontSize: "12px",
                                  }}
                                >
                                  {record[dayKey] || "-"}
                                </td>
                              ))}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}

                {/* Summary Section */}
                {tableData.length > 0 && (
                  <Row className="mt-3">
                    <Col xs="12">
                      <div className="text-muted" style={{ fontSize: "12px" }}>
                        Showing {tableData.length} employee(s) for {columnKeys.length} days
                      </div>
                    </Col>
                  </Row>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LeaveAssignContainer;

