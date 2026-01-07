import { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_GetReport, Fn_AddEditData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { formatDateForDisplay, formatDateForInput, formatDateForAPI } from "../../utils/dateFormatUtils";
import { convertTo12Hour, convertTo24Hour } from "../../utils/timeFormatUtils";

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
  F_EmployeeMaster: number;
  EmployeeNo: string;
  EmployeeName: string;
  PunchDateTime: string; // "2024-05-16T14:02:26"
  PunchDate: string; // "2024-05-16T00:00:00"
  PunchTime: string; // "14:02:26"
  EntryType: number;
  EntryTypeName: string;
  F_MachineMaster: number;
  MachineName: string;
  MachinePunchId: string;
  UserId: number;
  DateOfCreation: string;
  LastUpdateOn: string;
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
  const [newRows, setNewRows] = useState<Array<{
    date: string;
    time: string;
    ampm: string;
  }>>([]);
  
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
    // Handle nested response structure: { success: true, data: { response: [...] } }
    if (data && data.data && data.data.response && Array.isArray(data.data.response)) {
      setAttendanceData(data.data.response);
    } else if (data && data.response && Array.isArray(data.response)) {
      setAttendanceData(data.response);
    } else if (data && Array.isArray(data)) {
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

      // Handle nested response structure: { success: true, data: { response: [...] } }
      if (response && response.data && response.data.response && Array.isArray(response.data.response)) {
        setAttendanceData(response.data.response);
      } else if (response && response.response && Array.isArray(response.response)) {
        setAttendanceData(response.response);
      } else if (Array.isArray(response)) {
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
    // Initialize with one new row with current date
    const today = new Date();
    setNewRows([{
      date: formatDateForInput(today.toISOString().split('T')[0]),
      time: "",
      ampm: "AM"
    }]);
  };

  const handleSave = async () => {
    if (!selectedEmployee) {
      alert("Please select an employee");
      return;
    }

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
      alert("Error: Could not get user information");
      return;
    }

    setLoading(true);

    try {
      // Handle all new rows - Save each row via API
      const rowsToAdd = newRows.filter(row => row.date && row.time);
      
      if (rowsToAdd.length > 0) {
        // Save each row individually
        for (const row of rowsToAdd) {
          // Convert time to 24-hour format for API
          const time12 = `${row.time} ${row.ampm}`;
          const time24 = convertTo24Hour(time12);
          const dateFormatted = formatDateForAPI(row.date);
          
          // Format PunchDateTime as ISO date-time: "2024-05-16T14:02:26"
          // Add seconds if not present
          const timeWithSeconds = time24.split(':').length === 2 ? `${time24}:00` : time24;
          const punchDateTime = `${dateFormatted}T${timeWithSeconds}`;
          
          // Prepare FormData for API
          let vformData = new FormData();
          vformData.append("F_EmployeeMaster", selectedEmployee);
          vformData.append("PunchDateTime", punchDateTime);
          vformData.append("EntryType", "2"); // Set EntryType to 2
          vformData.append("F_MachineMaster", "0"); // Default value, can be updated if needed
          vformData.append("MachinePunchId", ""); // Default empty, can be updated if needed
          vformData.append("UserId", userId);
          
          // Call API to save attendance punch
          const API_URL_SAVE = `AttendancePunch/${userId}/token`;
          
          await Fn_AddEditData(
            dispatch,
            () => {}, // setState not needed for this
            { arguList: { id: 0, formData: vformData } },
            API_URL_SAVE,
            true, // isMultiPart
            "memberid",
            () => {}, // navigate not needed
            "" // forward not needed
          );
        }
        
        // Reload attendance data after saving
        await loadAttendanceData();
      }

      // TODO: Handle deletion of selected rows
      const rowsToDelete = Array.from(selectedRows);
      if (rowsToDelete.length > 0) {
        console.log("Rows to delete:", rowsToDelete);
        // TODO: Call API to delete selected rows
      }

      // Reset edit mode
      setIsEditMode(false);
      setSelectedRows(new Set());
      setNewRows([]);
      
      alert(rowsToAdd.length > 0 ? `${rowsToAdd.length} attendance record(s) saved successfully!` : "No new records to save.");
    } catch (error) {
      console.error("Error saving attendance data:", error);
      alert("Error saving attendance data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setSelectedRows(new Set());
    setNewRows([]);
  };

  // Update a specific new row
  const updateNewRow = (index: number, field: 'date' | 'time' | 'ampm', value: string) => {
    setNewRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // If date and time are both filled, add a new empty row below
      if (field === 'date' || field === 'time') {
        const currentRow = updated[index];
        if (currentRow.date && currentRow.time) {
          // Check if there's already an empty row at the end
          const lastRow = updated[updated.length - 1];
          if (!lastRow || (lastRow.date && lastRow.time)) {
            // Add new empty row
            const today = new Date();
            updated.push({
              date: formatDateForInput(today.toISOString().split('T')[0]),
              time: "",
              ampm: "AM"
            });
          }
        }
      }
      
      return updated;
    });
  };

  // Remove a new row
  const removeNewRow = (index: number) => {
    setNewRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    // TODO: Navigate back or close modal
    window.history.back();
  };

  // Parse PunchDateTime to extract Date, Time, and AM/PM
  const parsePunchData = (punchDateTime: string, punchDate: string, punchTime: string) => {
    try {
      // Format date from "2024-05-16T00:00:00" or "2024-05-16"
      let formattedDate = "-";
      if (punchDate) {
        const dateStr = punchDate.split('T')[0]; // Get date part only
        formattedDate = formatDateForDisplay(dateStr);
      } else if (punchDateTime) {
        const dateStr = punchDateTime.split('T')[0];
        formattedDate = formatDateForDisplay(dateStr);
      }

      // Format time from "14:02:26" to "02:02 PM"
      let formattedTime = "-";
      let ampm = "-";
      if (punchTime) {
        // Extract hours and minutes (remove seconds)
        const timeParts = punchTime.split(":");
        if (timeParts.length >= 2) {
          const time24 = `${timeParts[0]}:${timeParts[1]}`;
          const time12 = convertTo12Hour(time24);
          const timeParts12 = time12.split(" ");
          formattedTime = timeParts12[0]; // "02:02"
          ampm = timeParts12[1] || "-"; // "PM"
        }
      } else if (punchDateTime) {
        // Extract time from PunchDateTime "2024-05-16T14:02:26"
        const timePart = punchDateTime.split('T')[1];
        if (timePart) {
          const timeParts = timePart.split(":");
          if (timeParts.length >= 2) {
            const time24 = `${timeParts[0]}:${timeParts[1]}`;
            const time12 = convertTo12Hour(time24);
            const timeParts12 = time12.split(" ");
            formattedTime = timeParts12[0];
            ampm = timeParts12[1] || "-";
          }
        }
      }

      return {
        date: formattedDate,
        time: formattedTime,
        ampm: ampm
      };
    } catch (error) {
      console.error("Error parsing punch data:", error);
      return { date: "-", time: "-", ampm: "-" };
    }
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
                        <th>Punch DateTime</th>
                        <th style={{ width: "120px" }}>Date</th>
                        <th style={{ width: "80px" }}>Time</th>
                        <th style={{ width: "70px" }}>AM/PM</th>
                        <th>Entry Type</th>
                        <th>Machine</th>
                        <th>Del</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center p-4">
                            {loading ? "Loading..." : "No data found. Please select employee and date range, then click Load Data."}
                          </td>
                        </tr>
                      ) : (
                        <>
                          {attendanceData.map((item: AttendanceRecord, index: number) => {
                            const parsed = parsePunchData(
                              item.PunchDateTime || "",
                              item.PunchDate || "",
                              item.PunchTime || ""
                            );
                            
                            // Format PunchDateTime for display
                            let punchDateTimeDisplay = "-";
                            if (item.PunchDateTime) {
                              try {
                                const datePart = item.PunchDateTime.split('T')[0];
                                const timePart = item.PunchDateTime.split('T')[1]?.split('.')[0] || item.PunchTime || "";
                                const formattedDate = formatDateForDisplay(datePart);
                                punchDateTimeDisplay = `${formattedDate} ${timePart}`;
                              } catch (e) {
                                punchDateTimeDisplay = item.PunchDateTime;
                              }
                            }
                            
                            return (
                              <tr key={item.Id || index}>
                                <td>{index + 1}</td>
                                <td>{punchDateTimeDisplay}</td>
                                <td style={{ width: "120px" }}>{parsed.date}</td>
                                <td style={{ width: "80px" }}>{parsed.time}</td>
                                <td style={{ width: "70px" }}>{parsed.ampm}</td>
                                <td>{item.EntryTypeName || "-"}</td>
                                <td>{item.MachineName || "-"}</td>
                                <td>-</td>
                              </tr>
                            );
                          })}
                          {/* New Rows for adding attendance */}
                          {isEditMode && newRows.map((row, rowIndex) => (
                            <tr key={`new-row-${rowIndex}`} style={{ backgroundColor: "#f0f8ff" }}>
                              <td>{attendanceData.length + rowIndex + 1}</td>
                              <td>-</td>
                              <td style={{ width: "120px" }}>
                                <Input
                                  type="date"
                                  value={row.date}
                                  onChange={(e) => updateNewRow(rowIndex, 'date', e.target.value)}
                                  style={{ width: "100%" }}
                                />
                              </td>
                              <td style={{ width: "80px" }}>
                                <Input
                                  type="text"
                                  placeholder="HH:MM"
                                  value={row.time}
                                  onChange={(e) => {
                                    let value = e.target.value;
                                    // Allow only numbers and colon
                                    value = value.replace(/[^0-9:]/g, '');
                                    // Format as HH:MM
                                    if (value.length === 2 && !value.includes(':')) {
                                      value = value + ':';
                                    } else if (value.length > 5) {
                                      value = value.substring(0, 5);
                                    }
                                    updateNewRow(rowIndex, 'time', value);
                                  }}
                                  onBlur={(e) => {
                                    // Validate and format time
                                    const timeValue = e.target.value;
                                    if (timeValue && timeValue.includes(':')) {
                                      const parts = timeValue.split(':');
                                      if (parts.length === 2) {
                                        let hours = parseInt(parts[0]) || 0;
                                        let minutes = parseInt(parts[1]) || 0;
                                        
                                        // Validate hours (0-12 for 12-hour format)
                                        if (hours > 12) {
                                          hours = 12;
                                        } else if (hours < 0) {
                                          hours = 0;
                                        }
                                        
                                        // Validate minutes (0-59)
                                        if (minutes > 59) {
                                          minutes = 59;
                                        } else if (minutes < 0) {
                                          minutes = 0;
                                        }
                                        
                                        const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                                        updateNewRow(rowIndex, 'time', formattedTime);
                                      }
                                    }
                                  }}
                                  style={{ width: "100%" }}
                                />
                              </td>
                              <td style={{ width: "70px" }}>
                                <Input
                                  type="select"
                                  value={row.ampm}
                                  onChange={(e) => updateNewRow(rowIndex, 'ampm', e.target.value)}
                                  style={{ width: "100%" }}
                                >
                                  <option value="AM">AM</option>
                                  <option value="PM">PM</option>
                                </Input>
                              </td>
                              <td>-</td>
                              <td>-</td>
                              <td>
                                {newRows.length > 1 && (
                                  <Btn
                                    color="danger"
                                    size="sm"
                                    type="button"
                                    onClick={() => removeNewRow(rowIndex)}
                                  >
                                    <i className="fa fa-times"></i>
                                  </Btn>
                                )}
                              </td>
                            </tr>
                          ))}
                        </>
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
                      disabled={!isEditMode || (selectedRows.size === 0 && newRows.filter(row => row.date && row.time).length === 0)}
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

