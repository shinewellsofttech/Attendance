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

interface AttendanceRecord {
  Id: number;
  Check: string; // Full date and time: "02/Apr/2024 11:40:59 AM"
  Date: string; // Date only: "02/04/2024"
  Time: string; // Time only: "11:40"
  AM_PM: string; // "AM" or "PM"
  [key: string]: any;
}

const AuditAttendanceContainer = () => {
  const [employeeArray, setEmployeeArray] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  
  // State object for Fn_FillListData
  const [employeeState, setEmployeeState] = useState({
    EmployeeArray: [] as any[],
    isProgress: true,
  });

  const dispatch = useDispatch();

  useEffect(() => {
    // Load Employee data for dropdown
    loadEmployeeData();
    
    // Set default dates (Indian Financial Year: April 1 to March 31)
    const { fromDate: fyFromDate, toDate: fyToDate } = getCurrentFinancialYearDates();
    setFromDate(formatDateForInput(fyFromDate));
    setToDate(formatDateForInput(fyToDate));
  }, []);
 
  
  const loadEmployeeData = async () => {
    try {
      await Fn_FillListData(dispatch, setEmployeeState, "EmployeeArray", API_URL_EMPLOYEE);
    } catch (error) {
      console.error("Error loading employee data:", error);
    }
  };

  // Update employeeArray when employeeState changes
  useEffect(() => {
    if (employeeState.EmployeeArray && employeeState.EmployeeArray.length > 0) {
      setEmployeeArray(employeeState.EmployeeArray);
    }
  }, [employeeState.EmployeeArray]);

  // setState function for Fn_GetReport to update attendanceData
  const setStateForReport = useCallback((data: any) => {
    console.log("setStateForReport called with:", data);
    if (data && Array.isArray(data)) {
      setAttendanceData(data);
    } else {
      setAttendanceData([]);
    }
  }, []);

  const loadAttendanceData = async () => {
    if (!selectedEmployee) {
      alert("Please select an employee");
      return;
    }
    if (!fromDate || !toDate) {
      alert("Please select From and To dates");
      return;
    }

    setLoading(true);
    try {
      // Get UserId from localStorage
      let userId = "0";
      try {
        const authUserStr = localStorage.getItem("authUser");
        if (authUserStr) {
          const authUser = JSON.parse(authUserStr);
          userId = authUser?.Id ? String(authUser.Id) : "0";
        }
      } catch (error) {
        console.error("Error parsing authUser from localStorage:", error);
      }

      // Prepare FormData for request body
      const formatDate = (date: string) => {
        const fromDateFormatted = formatDateForAPI(date) || date;
        return fromDateFormatted;
      };

      let vformData = new FormData();
      vformData.append("FromDate", formatDate(fromDate));
      vformData.append("ToDate", formatDate(toDate));
      vformData.append("Id", selectedEmployee); // Employee ID

      // Use Fn_GetReport with same pattern as Report_GroupWise.js
      const response = await Fn_GetReport(
        dispatch,
        setStateForReport,
        "attendanceData",
        `GetAttendancePunch/${userId}/token`,
        { arguList: { formData: vformData } },
        true
      );

      if (Array.isArray(response)) {
        setAttendanceData(response);
      } else {
        setAttendanceData([]);
      }
    } catch (error) {
      console.error("Error loading attendance data:", error);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedEmployee(e.target.value);
    setAttendanceData([]);
    setSelectedRows(new Set());
  };

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromDate(e.target.value);
    setAttendanceData([]);
    setSelectedRows(new Set());
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToDate(e.target.value);
    setAttendanceData([]);
    setSelectedRows(new Set());
  };

  const handleRowCheckboxChange = (id: number) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleSave = () => {
    // TODO: Implement save logic
    const rowsToDelete = Array.from(selectedRows);
    console.log("Rows to delete:", rowsToDelete);
    // Call API to delete selected rows
    setIsEditMode(false);
    setSelectedRows(new Set());
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setSelectedRows(new Set());
  };

  const handleClose = () => {
    // TODO: Navigate back or close modal
    window.history.back();
  };

  // Parse Check field to extract Date, Time, and AM/PM
  const parseCheckField = (checkString: string) => {
    if (!checkString) return { date: "-", time: "-", ampm: "-" };
    
    try {
      // Format: "02/Apr/2024 11:40:59 AM"
      const parts = checkString.split(" ");
      if (parts.length >= 3) {
        const datePart = parts[0]; // "02/Apr/2024"
        const timePart = parts[1]; // "11:40:59"
        const ampmPart = parts[2]; // "AM"
        
        // Convert date from "02/Apr/2024" to "02/04/2024"
        const dateObj = new Date(datePart);
        const formattedDate = formatDateForDisplay(dateObj.toISOString().split('T')[0]);
        
        // Extract time without seconds: "11:40:59" -> "11:40"
        const timeParts = timePart.split(":");
        const time = `${timeParts[0]}:${timeParts[1]}`;
        
        return {
          date: formattedDate,
          time: time,
          ampm: ampmPart
        };
      }
    } catch (error) {
      console.error("Error parsing check field:", error);
    }
    
    return { date: checkString, time: "-", ampm: "-" };
  };

  return (
    <div className="page-body">
      <Breadcrumbs mainTitle="Audit Attendance" parent="Transactions" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon
                title="Audit Attendance"
                tagClass="card-title mb-0"
              />
              <CardBody>
                {/* Input Fields */}
                <Row className="mb-3">
                  <Col md="3">
                    <Label>Employee</Label>
                    <Input
                      type="select"
                      value={selectedEmployee}
                      onChange={handleEmployeeChange}
                    >
                      <option value="">Select Employee</option>
                      {employeeArray.map((employee: any) => (
                        <option key={employee.Id} value={employee.Id}>
                          {employee.Name || employee.MachineEnrollmentNo || `Employee ${employee.Id}`}
                        </option>
                      ))}
                    </Input>
                  </Col>
                  <Col md="3">
                    <Label>From</Label>
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={handleFromDateChange}
                    />
                  </Col>
                  <Col md="3">
                    <Label>To</Label>
                    <Input
                      type="date"
                      value={toDate}
                      onChange={handleToDateChange}
                    />
                  </Col>
                  <Col md="3" className="d-flex align-items-end">
                    <Btn
                      color="primary"
                      onClick={loadAttendanceData}
                      disabled={loading || !selectedEmployee || !fromDate || !toDate}
                    >
                      {loading ? "Loading..." : "Load Data"}
                    </Btn>
                  </Col>
                </Row>

                {/* Table */}
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>S.</th>
                        <th>Check</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>AM/PM</th>
                        <th>Del</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center p-4">
                            {loading ? "Loading..." : "No data found. Please select employee and date range, then click Load Data."}
                          </td>
                        </tr>
                      ) : (
                        attendanceData.map((item: AttendanceRecord, index: number) => {
                          const parsed = parseCheckField(item.Check || item.check || "");
                          return (
                            <tr key={item.Id || index}>
                              <td>{index + 1}</td>
                              <td>{item.Check || item.check || "-"}</td>
                              <td>{parsed.date}</td>
                              <td>{parsed.time}</td>
                              <td>{parsed.ampm}</td>
                              <td>
                                <Input
                                  type="checkbox"
                                  checked={selectedRows.has(item.Id)}
                                  onChange={() => handleRowCheckboxChange(item.Id)}
                                  disabled={!isEditMode}
                                />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </Table>
                </div>

                {/* Action Buttons */}
                <Row className="mt-3">
                  <Col xs="12" className="text-end">
                    <Btn
                      color="primary"
                      className="me-2"
                      onClick={handleEdit}
                      disabled={isEditMode || attendanceData.length === 0}
                    >
                      Edit
                    </Btn>
                    <Btn
                      color="success"
                      className="me-2"
                      onClick={handleSave}
                      disabled={!isEditMode || selectedRows.size === 0}
                    >
                      Save
                    </Btn>
                    <Btn
                      color="secondary"
                      className="me-2"
                      onClick={handleCancel}
                      disabled={!isEditMode}
                    >
                      Cancel
                    </Btn>
                    <Btn
                      color="danger"
                      onClick={handleClose}
                    >
                      Close
                    </Btn>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AuditAttendanceContainer;

