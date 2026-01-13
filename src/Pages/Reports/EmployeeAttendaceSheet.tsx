import { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_GetReport } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { formatDateForDisplay, formatDateForInput, formatDateForAPI } from "../../utils/dateFormatUtils";

const API_URL_EMPLOYEE = `${API_WEB_URLS.MASTER}/0/token/EmployeeMaster/Id/0`;

// Get Indian Financial Year dates (April 1 to March 31)
const getCurrentFinancialYearDates = () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed (0 = Jan, 3 = Apr)

  // If current month is Jan, Feb, or Mar (0, 1, 2), financial year started in previous year
  const startYear = currentMonth < 3 ? currentYear - 1 : currentYear;
  const endYear = startYear + 1;

  const format = (year: number, month: number, day: number) => {
    const monthString = String(month).padStart(2, "0");
    const dayString = String(day).padStart(2, "0");
    return `${year}-${monthString}-${dayString}`;
  };

  return {
    fromDate: format(startYear, 4, 1),   // April 1
    toDate: format(endYear, 3, 31),      // March 31
  };
};

interface AttendanceSheetRecord {
  Id?: number;
  Date: string;
  InTime: string;
  OutTime: string;
  AddLess: string;
  StandardWorkingHours: number;
  WorkingHours: number;
  OverTime: number;
  TotHoursIncOT: number;
  AttType: string;
  DiffIn: string;
  DiffOut: string;
  LessWorking: number;
  Remarks: string;
  [key: string]: any;
}

const EmployeeAttendaceSheetContainer = () => {
  const [gridData, setGridData] = useState<AttendanceSheetRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  
  // State object for Fn_FillListData - Employee
  const [employeeState, setEmployeeState] = useState({
    EmployeeArray: [] as any[],
    isProgress: true,
  });

  const dispatch = useDispatch();

  useEffect(() => {
    // Load Employee data
    loadEmployeeData();
    
    // Set default dates (Indian Financial Year: April 1 to March 31)
    const { fromDate: fyFromDate, toDate: fyToDate } = getCurrentFinancialYearDates();
    setFromDate(formatDateForInput(fyFromDate));
    setToDate(formatDateForInput(fyToDate));
  }, []);

  // Load data when filters change
  useEffect(() => {
    if (fromDate && toDate) {
      fetchAttendanceSheetData();
    }
  }, [fromDate, toDate, selectedEmployee]);

  const loadEmployeeData = async () => {
    try {
      await Fn_FillListData(dispatch, setEmployeeState, "EmployeeArray", API_URL_EMPLOYEE);
    } catch (error) {
      console.error("Error loading employee data:", error);
    }
  };

  // setState function for Fn_GetReport to update gridData
  const setStateForReport = (data: any) => {
    console.log("setStateForReport called with:", data);
    if (data && Array.isArray(data)) {
      setGridData(data);
    } else {
      setGridData([]);
    }
  };

  const fetchAttendanceSheetData = async () => {
    if (!fromDate || !toDate) {
      return;
    }

    setLoading(true);
    try {
      // Get UserId
      let userId = "0";
      try {
        const authUserStr = localStorage.getItem("authUser");
        if (authUserStr) {
          const authUser = JSON.parse(authUserStr);
          userId = authUser?.Id ? String(authUser.Id) : "0";
        }
      } catch (err) {
        console.error("Error parsing authUser from localStorage:", err);
      }

      let vformData = new FormData();
      const formattedFromDate = formatDateForAPI(fromDate);
      const formattedToDate = formatDateForAPI(toDate);
      vformData.append("FromDate", formattedFromDate);
      vformData.append("ToDate", formattedToDate);
      
      if (selectedEmployee && selectedEmployee !== "") {
        vformData.append("F_EmployeeMaster", selectedEmployee);
      } else {
        vformData.append("F_EmployeeMaster", "0");
      }

      // API URL - adjust based on your actual endpoint
      const API_URL = `EmployeeAttendanceSheet/0/token`;

      const response = await Fn_GetReport(
        dispatch,
        setStateForReport,
        "gridData",
        API_URL,
        { arguList: { id: 0, formData: vformData } },
        true
      );

      if (response && Array.isArray(response) && response.length > 0) {
        setGridData(response);
      } else {
        setGridData([]);
      }
    } catch (error) {
      console.error("Error fetching attendance sheet data:", error);
      setGridData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    fetchAttendanceSheetData();
  };

  const handleResetFilter = () => {
    setSelectedEmployee("");
    const { fromDate: fyFromDate, toDate: fyToDate } = getCurrentFinancialYearDates();
    setFromDate(formatDateForInput(fyFromDate));
    setToDate(formatDateForInput(fyToDate));
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

  // Format time for display
  const formatTime = (timeString: string): string => {
    if (!timeString) return "-";
    // If time is in HH:MM:SS format, return as is
    if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return timeString;
    }
    // If time is in HH:MM format, return as is
    if (timeString.match(/^\d{2}:\d{2}$/)) {
      return timeString;
    }
    return timeString;
  };

  // Format hours for display
  const formatHours = (hours: number | string | null | undefined): string => {
    if (hours === null || hours === undefined || hours === "") return "-";
    const numHours = typeof hours === "string" ? parseFloat(hours) : hours;
    if (isNaN(numHours)) return "-";
    return numHours.toFixed(2);
  };

  return (
    <div className="page-body" style={{ backgroundColor: "#e6f3ff" }}>
      <Breadcrumbs mainTitle="Employee Attendance Sheet" parent="Transactions" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon
                title="Employee Attendance Sheet"
                tagClass="card-title mb-0"
              />
              <CardBody>
                {/* Filter Section */}
                <Row className="mb-3">
                  <Col md="3">
                    <Label>From Date</Label>
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </Col>
                  <Col md="3">
                    <Label>To Date</Label>
                    <Input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </Col>
                  <Col md="3">
                    <Label>Employee</Label>
                    <Input
                      type="select"
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                    >
                      <option value="">All Employees</option>
                      {getEmployeeOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Input>
                  </Col>
                  <Col md="3" className="d-flex align-items-end">
                    <div className="d-flex gap-2 w-100">
                      <Btn
                        color="primary"
                        onClick={handleFilterChange}
                        disabled={loading || !fromDate || !toDate}
                        className="flex-fill"
                      >
                        {loading ? "Loading..." : "Filter"}
                      </Btn>
                      <Btn
                        color="secondary"
                        onClick={handleResetFilter}
                        disabled={loading}
                        className="flex-fill"
                      >
                        Reset
                      </Btn>
                    </div>
                  </Col>
                </Row>

                {/* Table Section */}
                {loading ? (
                  <div className="text-center py-4">
                    <p>Loading attendance sheet data...</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table striped hover bordered className="table-bordered">
                      <thead style={{ backgroundColor: "#6D68CB", color: "#fff" }}>
                        <tr>
                          <th style={{ width: "50px", textAlign: "center" }}>S.No</th>
                          <th style={{ width: "100px" }}>Date</th>
                          <th style={{ width: "100px" }}>In Time</th>
                          <th style={{ width: "100px" }}>Out Time</th>
                          <th style={{ width: "80px" }}>Add/Less</th>
                          <th style={{ width: "120px" }}>Standard Working Hours</th>
                          <th style={{ width: "100px" }}>Working Hours</th>
                          <th style={{ width: "100px" }}>Over Time</th>
                          <th style={{ width: "120px" }}>Tot. Hours (Inc. OT)</th>
                          <th style={{ width: "100px" }}>Att Type</th>
                          <th style={{ width: "100px" }}>Diff. (In)</th>
                          <th style={{ width: "100px" }}>Diff. (Out)</th>
                          <th style={{ width: "100px" }}>Less Working</th>
                          <th style={{ width: "150px" }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gridData.length === 0 ? (
                          <tr>
                            <td colSpan={14} className="text-center p-4">
                              No attendance data available
                            </td>
                          </tr>
                        ) : (
                          gridData.map((item: AttendanceSheetRecord, index: number) => (
                            <tr key={item.Id || index} style={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa" }}>
                              <td style={{ textAlign: "center" }}>{index + 1}</td>
                              <td>{item.Date ? formatDateForDisplay(item.Date) : "-"}</td>
                              <td>{formatTime(item.InTime || "")}</td>
                              <td>{formatTime(item.OutTime || "")}</td>
                              <td>{item.AddLess || "-"}</td>
                              <td style={{ textAlign: "right" }}>{formatHours(item.StandardWorkingHours)}</td>
                              <td style={{ textAlign: "right" }}>{formatHours(item.WorkingHours)}</td>
                              <td style={{ textAlign: "right" }}>{formatHours(item.OverTime)}</td>
                              <td style={{ textAlign: "right" }}>{formatHours(item.TotHoursIncOT)}</td>
                              <td>{item.AttType || "-"}</td>
                              <td>{formatTime(item.DiffIn || "")}</td>
                              <td>{formatTime(item.DiffOut || "")}</td>
                              <td style={{ textAlign: "right" }}>{formatHours(item.LessWorking)}</td>
                              <td>{item.Remarks || "-"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}

                {/* Summary Section */}
                {gridData.length > 0 && (
                  <Row className="mt-3">
                    <Col xs="12">
                      <div className="text-muted" style={{ fontSize: "12px" }}>
                        Showing {gridData.length} attendance record(s)
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

export default EmployeeAttendaceSheetContainer;
