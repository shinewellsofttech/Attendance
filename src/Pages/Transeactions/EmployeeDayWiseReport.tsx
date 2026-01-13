import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_GetReport } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { formatDateForDisplay, formatDateForInput, formatDateForAPI } from "../../utils/dateFormatUtils";
import { convertTo12Hour } from "../../utils/timeFormatUtils";

const API_URL_EMPLOYEE = `${API_WEB_URLS.MASTER}/0/token/EmployeeMaster/Id/0`;
const API_URL_DEPARTMENT = `${API_WEB_URLS.MASTER}/0/token/DepartmentMaster/Id/0`;
const API_URL_SHIFT = `${API_WEB_URLS.MASTER}/0/token/ShiftMaster/Id/0`;

interface DayWiseAttendanceRecord {
  Id?: number;
  SNo?: number;
  PayNo?: string;
  EmployeeName?: string;
  Aadhar?: string;
  Hours?: string; // Status like "P 0", "A", "L", etc.
  CheckIn?: string;
  CheckOut?: string;
  AddLess?: string; // Time value like "00:00"
  WorkingHours?: string; // Format: "H:MM" like "0:12", "6:06", "8:22"
  OverTime?: string; // Format: "HH:MM" like "00:12", "06:06", "08:22"
  LessTime?: string;
  AttType?: string; // "Full", "Half", etc.
  Remarks?: string;
  F_EmployeeMaster?: number;
  F_Department?: number;
  F_ShiftMaster?: number;
  DepartmentName?: string;
  ShiftName?: string;
  ShiftTime?: string; // e.g., "10:00 AM - 06:30 PM"
  DailySalaryExpense?: number;
  [key: string]: any;
}

const EmployeeDayWiseReportContainer = () => {
  const [gridData, setGridData] = useState<DayWiseAttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedShift, setSelectedShift] = useState<string>("");
  const [dailySalaryExpense, setDailySalaryExpense] = useState<number>(0);
  
  // State objects for Fn_FillListData
  const [employeeState, setEmployeeState] = useState({
    EmployeeArray: [] as any[],
    isProgress: true,
  });
  
  const [departmentState, setDepartmentState] = useState({
    DepartmentArray: [] as any[],
    isProgress: true,
  });
  
  const [shiftState, setShiftState] = useState({
    ShiftArray: [] as any[],
    isProgress: true,
  });

  const dispatch = useDispatch();

  useEffect(() => {
    // Load master data
    loadEmployeeData();
    loadDepartmentData();
    loadShiftData();
    
    // Set default date to today
    const today = new Date();
    const defaultDate = formatDateForInput(today.toISOString().split('T')[0]);
    setSelectedDate(defaultDate);
  }, []);

  // Load data when filters change
  useEffect(() => {
    if (selectedDate) {
      fetchDayWiseAttendanceData();
    }
  }, [selectedDate, selectedDepartment, selectedShift]);

  const loadEmployeeData = async () => {
    try {
      await Fn_FillListData(dispatch, setEmployeeState, "EmployeeArray", API_URL_EMPLOYEE);
    } catch (error) {
      console.error("Error loading employee data:", error);
    }
  };

  const loadDepartmentData = async () => {
    try {
      await Fn_FillListData(dispatch, setDepartmentState, "DepartmentArray", API_URL_DEPARTMENT);
    } catch (error) {
      console.error("Error loading department data:", error);
    }
  };

  const loadShiftData = async () => {
    try {
      await Fn_FillListData(dispatch, setShiftState, "ShiftArray", API_URL_SHIFT);
    } catch (error) {
      console.error("Error loading shift data:", error);
    }
  };

  // setState function for Fn_GetReport to update gridData
  const setStateForReport = (data: any) => {
    console.log("setStateForReport called with:", data);
    if (data && Array.isArray(data)) {
      setGridData(data);
      // Extract daily salary expense if available in response
      if (data.length > 0 && data[0].DailySalaryExpense !== undefined) {
        setDailySalaryExpense(data[0].DailySalaryExpense || 0);
      }
    } else {
      setGridData([]);
      setDailySalaryExpense(0);
    }
  };

  const fetchDayWiseAttendanceData = async () => {
    if (!selectedDate) {
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
      const formattedDate = formatDateForAPI(selectedDate);
      vformData.append("Date", formattedDate);
      
      if (selectedDepartment && selectedDepartment !== "") {
        vformData.append("F_Department", selectedDepartment);
      } else {
        vformData.append("F_Department", "0");
      }

      if (selectedShift && selectedShift !== "") {
        vformData.append("F_ShiftMaster", selectedShift);
      } else {
        vformData.append("F_ShiftMaster", "0");
      }

      // API URL - adjust based on your actual endpoint
      const API_URL = `EmployeeDayWiseReport/0/token`;

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
        // Extract daily salary expense if available
        if (response[0]?.DailySalaryExpense !== undefined) {
          setDailySalaryExpense(response[0].DailySalaryExpense || 0);
        }
      } else {
        setGridData([]);
        setDailySalaryExpense(0);
      }
    } catch (error) {
      console.error("Error fetching day wise attendance data:", error);
      setGridData([]);
      setDailySalaryExpense(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    fetchDayWiseAttendanceData();
  };

  const handleResetFilter = () => {
    const today = new Date();
    const defaultDate = formatDateForInput(today.toISOString().split('T')[0]);
    setSelectedDate(defaultDate);
    setSelectedDepartment("");
    setSelectedShift("");
  };

  // Get department options
  const getDepartmentOptions = () => {
    if (!departmentState.DepartmentArray || departmentState.DepartmentArray.length === 0) {
      return [];
    }
    return departmentState.DepartmentArray.map((dept: any) => ({
      value: dept.Id,
      label: dept.Name || `Department ${dept.Id}`
    }));
  };

  // Get shift options
  const getShiftOptions = () => {
    if (!shiftState.ShiftArray || shiftState.ShiftArray.length === 0) {
      return [];
    }
    return shiftState.ShiftArray.map((shift: any) => ({
      value: shift.Id,
      label: shift.Name || `Shift ${shift.Id}`
    }));
  };

  // Format time for display (12-hour format)
  const formatTimeDisplay = (time: string | null | undefined): string => {
    if (!time || time === "") return "-";
    // If already in 12-hour format with AM/PM, return as is
    if (time.includes("AM") || time.includes("PM")) {
      return time;
    }
    // Convert 24-hour to 12-hour format
    return convertTo12Hour(time);
  };

  // Get shift time display
  const getShiftTimeDisplay = (): string => {
    if (gridData.length > 0 && gridData[0].ShiftTime) {
      return gridData[0].ShiftTime;
    }
    if (selectedShift) {
      const shift = shiftState.ShiftArray.find((s: any) => s.Id === Number(selectedShift));
      if (shift && shift.InTime && shift.OutTime) {
        return `${formatTimeDisplay(shift.InTime)} - ${formatTimeDisplay(shift.OutTime)}`;
      }
    }
    return "-";
  };

  // Get department name display
  const getDepartmentDisplay = (): string => {
    if (gridData.length > 0 && gridData[0].DepartmentName) {
      return gridData[0].DepartmentName;
    }
    if (selectedDepartment) {
      const dept = departmentState.DepartmentArray.find((d: any) => d.Id === Number(selectedDepartment));
      return dept?.Name || "-";
    }
    return "All Departments";
  };

  return (
    <div className="page-body" style={{ backgroundColor: "#e6f3ff" }}>
      <Breadcrumbs mainTitle="Employee Day Wise Report" parent="Transactions" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon
                title="Employee Day Wise Report"
                tagClass="card-title mb-0"
              />
              <CardBody>
                {/* Filter Section */}
                <Row className="mb-3">
                  <Col md="3">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </Col>
                  <Col md="3">
                    <Label>Department</Label>
                    <Input
                      type="select"
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                    >
                      <option value="">All Departments</option>
                      {getDepartmentOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Input>
                  </Col>
                  <Col md="3">
                    <Label>Shift</Label>
                    <Input
                      type="select"
                      value={selectedShift}
                      onChange={(e) => setSelectedShift(e.target.value)}
                    >
                      <option value="">All Shifts</option>
                      {getShiftOptions().map((option) => (
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
                        disabled={loading || !selectedDate}
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

                {/* Report Header */}
                {gridData.length > 0 && (
                  <Row className="mb-3">
                    <Col xs="12">
                      <div style={{ textAlign: "center", marginBottom: "15px" }}>
                        <h5 style={{ fontWeight: "bold", marginBottom: "5px" }}>
                          FOR DATE : {formatDateForDisplay(selectedDate)}
                        </h5>
                        <div style={{ fontSize: "14px", color: "#666" }}>
                          <span style={{ marginRight: "20px" }}>
                            General Shift : {getShiftTimeDisplay()}
                          </span>
                          <span>
                            Department : {getDepartmentDisplay()}
                          </span>
                        </div>
                      </div>
                    </Col>
                  </Row>
                )}

                {/* Daily Company Salary Expense Amount */}
                <Row className="mb-3">
                  <Col md="4">
                    <Label>Daily Company Salary Expense Amount</Label>
                    <Input
                      type="number"
                      value={dailySalaryExpense}
                      onChange={(e) => setDailySalaryExpense(Number(e.target.value))}
                      readOnly
                      style={{ backgroundColor: "#f8f9fa" }}
                    />
                  </Col>
                </Row>

                {/* Table Section */}
                {loading ? (
                  <div className="text-center py-4">
                    <p>Loading day wise attendance data...</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table striped hover bordered className="table-bordered">
                      <thead style={{ backgroundColor: "#6D68CB", color: "#fff" }}>
                        <tr>
                          <th style={{ width: "60px", textAlign: "center" }}>S.No.</th>
                          <th style={{ width: "100px" }}>Pay. No.</th>
                          <th style={{ width: "150px" }}>Name/Aadhar</th>
                          <th style={{ width: "80px", textAlign: "center" }}>Hours</th>
                          <th style={{ width: "100px", textAlign: "center" }}>Check In</th>
                          <th style={{ width: "100px", textAlign: "center" }}>Check Out</th>
                          <th style={{ width: "100px", textAlign: "center" }}>Add / Less</th>
                          <th style={{ width: "100px", textAlign: "center" }}>W. Hours</th>
                          <th style={{ width: "100px", textAlign: "center" }}>OT</th>
                          <th style={{ width: "100px", textAlign: "center" }}>Less Time</th>
                          <th style={{ width: "100px", textAlign: "center" }}>Att Type</th>
                          <th style={{ width: "150px" }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gridData.length === 0 ? (
                          <tr>
                            <td colSpan={12} className="text-center p-4">
                              No attendance data available
                            </td>
                          </tr>
                        ) : (
                          gridData.map((item: DayWiseAttendanceRecord, index: number) => (
                            <tr 
                              key={item.Id || index} 
                              style={{ 
                                backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa" 
                              }}
                            >
                              <td style={{ textAlign: "center" }}>{item.SNo || index + 1}</td>
                              <td>{item.PayNo || "-"}</td>
                              <td>
                                {item.EmployeeName || "-"}
                                {item.Aadhar && (
                                  <div style={{ fontSize: "11px", color: "#666" }}>
                                    {item.Aadhar}
                                  </div>
                                )}
                              </td>
                              <td style={{ textAlign: "center" }}>{item.Hours || "-"}</td>
                              <td style={{ textAlign: "center" }}>{formatTimeDisplay(item.CheckIn)}</td>
                              <td style={{ textAlign: "center" }}>{formatTimeDisplay(item.CheckOut)}</td>
                              <td style={{ textAlign: "center" }}>{item.AddLess || "00:00"}</td>
                              <td style={{ textAlign: "center" }}>{item.WorkingHours || "0:00"}</td>
                              <td style={{ textAlign: "center" }}>{item.OverTime || "00:00"}</td>
                              <td style={{ textAlign: "center" }}>{item.LessTime || "-"}</td>
                              <td style={{ textAlign: "center" }}>{item.AttType || "-"}</td>
                              <td>{item.Remarks || "-"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}

                {/* Abbreviation Legend */}
                <Row className="mt-4">
                  <Col xs="12">
                    <div style={{ 
                      border: "1px solid #ddd", 
                      padding: "15px", 
                      backgroundColor: "#f8f9fa",
                      borderRadius: "5px"
                    }}>
                      <h6 style={{ fontWeight: "bold", marginBottom: "10px" }}>
                        Abbrivation Used
                      </h6>
                      <div style={{ fontSize: "13px" }}>
                        <div style={{ marginBottom: "5px" }}>1. <strong>P</strong> - Present</div>
                        <div style={{ marginBottom: "5px" }}>2. <strong>½</strong> - Half</div>
                        <div style={{ marginBottom: "5px" }}>3. <strong>A</strong> - Absent</div>
                        <div style={{ marginBottom: "5px" }}>4. <strong>L</strong> - Leave</div>
                        <div style={{ marginBottom: "5px" }}>5. <strong>H</strong> - Holiday</div>
                        <div style={{ marginBottom: "5px" }}>6. <strong>W</strong> - Weekly Holiday</div>
                        <div style={{ marginBottom: "5px" }}>7. <strong>FH</strong> - Fastival Holiday (Count in Holidays)</div>
                        <div>8. <strong>E</strong> - Event (Count in Holidays)</div>
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Summary Section */}
                {gridData.length > 0 && (
                  <Row className="mt-3">
                    <Col xs="12">
                      <div className="text-muted" style={{ fontSize: "12px" }}>
                        Showing {gridData.length} employee(s) attendance record(s) for {formatDateForDisplay(selectedDate)}
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

export default EmployeeDayWiseReportContainer;

