import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { formatDateForDisplay, formatDateForInput } from "../../utils/dateFormatUtils";

const API_URL_EMPLOYEE = `${API_WEB_URLS.MASTER}/0/token/EmployeeMaster/Id/0`;
// TODO: Update with actual Audit Attendance API endpoint
const API_URL_AUDIT_ATTENDANCE = `${API_WEB_URLS.MASTER}/0/token/AuditAttendance`;  

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

  const dispatch = useDispatch();

  useEffect(() => {
    // Load Employee data for dropdown
    loadEmployeeData();
    
    // Set default dates (current month)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setFromDate(formatDateForInput(firstDay.toISOString().split('T')[0]));
    setToDate(formatDateForInput(lastDay.toISOString().split('T')[0]));
  }, []);
 
  
  const loadEmployeeData = async () => {
    try {
      await Fn_FillListData(dispatch, (response: any) => {
        if (response && response.data && response.data.dataList) {
          setEmployeeArray(response.data.dataList);
        }
      }, "EmployeeArray", API_URL_EMPLOYEE);
    } catch (error) {
      console.error("Error loading employee data:", error);
    }
  };

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
      // TODO: Update with actual API call
      // const url = `${API_URL_AUDIT_ATTENDANCE}?EmployeeId=${selectedEmployee}&FromDate=${fromDate}&ToDate=${toDate}`;
      // await Fn_FillListData(dispatch, (response: any) => {
      //   if (response && response.data && response.data.dataList) {
      //     setAttendanceData(response.data.dataList);
      //   }
      // }, "attendanceData", url);
      
      // Mock data for now - remove when API is ready
      setAttendanceData([]);
    } catch (error) {
      console.error("Error loading attendance data:", error);
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

