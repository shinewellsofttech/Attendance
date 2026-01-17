import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { formatDateForInput } from "../../utils/dateFormatUtils";

const API_URL_EMPLOYEE = `${API_WEB_URLS.MASTER}/0/token/EmployeeMaster/Id/0`;

interface LeaveRecord {
  EmployeeId: number;
  EmployeeName: string;
  [key: string]: any; // For dynamic date columns
}

const LeaveAssignContainer = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [fromMonthYear, setFromMonthYear] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  
  // State object for Fn_FillListData - Employee
  const [employeeState, setEmployeeState] = useState({
    EmployeeArray: [] as any[],
    isProgress: true,
  });

  // Static data for demonstration
  const [tableData, setTableData] = useState<LeaveRecord[]>([]);
  const [monthDates, setMonthDates] = useState<string[]>([]);

  const dispatch = useDispatch();

  useEffect(() => {
    // Load Employee data
    loadEmployeeData();
    
    // Set default month to current month
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    setFromMonthYear(currentMonth);
    
    // Set default to date to last day of current month
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setToDate(formatDateForInput(lastDay.toISOString().split('T')[0]));
  }, []);

  // Generate month dates when fromMonthYear changes
  useEffect(() => {
    if (fromMonthYear) {
      generateMonthDates();
    }
  }, [fromMonthYear]);

  // Generate static data when month dates, employee selection, or employee data changes
  useEffect(() => {
    if (monthDates.length > 0 && selectedEmployee && employeeState.EmployeeArray.length > 0) {
      generateStaticData();
    } else {
      setTableData([]);
    }
  }, [monthDates, selectedEmployee, employeeState.EmployeeArray]);

  const loadEmployeeData = async () => {
    try {
      await Fn_FillListData(dispatch, setEmployeeState, "EmployeeArray", API_URL_EMPLOYEE);
    } catch (error) {
      console.error("Error loading employee data:", error);
    }
  };

  // Generate array of dates for the selected month
  const generateMonthDates = () => {
    if (!fromMonthYear) return;
    
    const [year, month] = fromMonthYear.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    
    const dates: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      dates.push(formatDateForInput(date.toISOString().split('T')[0]));
    }
    
    setMonthDates(dates);
  };

  // Generate static data for demonstration - only for selected employee
  const generateStaticData = () => {
    if (!selectedEmployee) {
      setTableData([]);
      return;
    }

    const staticData: LeaveRecord[] = [];
    
    // Get only the selected employee
    const employee = employeeState.EmployeeArray.find((emp: any) => emp.Id === Number(selectedEmployee));
    
    if (employee) {
      const record: LeaveRecord = {
        EmployeeId: employee.Id,
        EmployeeName: employee.Name || employee.MachineEnrollmentNo || `Employee ${employee.Id}`,
      };
      
      // Add leave data for each date in the month
      monthDates.forEach((date) => {
        // Randomly assign leave status for demonstration
        const random = Math.random();
        if (random < 0.1) {
          record[date] = "CL"; // Casual Leave
        } else if (random < 0.15) {
          record[date] = "SL"; // Sick Leave
        } else if (random < 0.2) {
          record[date] = "PL"; // Privilege Leave
        } else {
          record[date] = ""; // No leave
        }
      });
      
      staticData.push(record);
    }
    
    setTableData(staticData);
  };

  const handleFilterChange = () => {
    generateStaticData();
  };

  const handleResetFilter = () => {
    setSelectedEmployee("");
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    setFromMonthYear(currentMonth);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setToDate(formatDateForInput(lastDay.toISOString().split('T')[0]));
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
                    <Label>From Date (Month & Year)</Label>
                    <Input
                      type="month"
                      value={fromMonthYear}
                      onChange={(e) => setFromMonthYear(e.target.value)}
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
                  <Col md="3" className="d-flex align-items-end">
                    <div className="d-flex gap-2 w-100">
                      <Btn
                        color="primary"
                        onClick={handleFilterChange}
                        disabled={loading || !fromMonthYear || !toDate || !selectedEmployee}
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
                          {monthDates.map((date) => (
                            <th
                              key={date}
                              style={{
                                minWidth: "80px",
                                textAlign: "center",
                                fontSize: "12px",
                              }}
                            >
                              <div>{formatDateForTableHeader(date)}</div>
                              <div style={{ fontSize: "10px", fontWeight: "normal" }}>
                                {getDayName(date)}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.length === 0 ? (
                          <tr>
                            <td colSpan={monthDates.length + 1} className="text-center p-4">
                              {employeeState.isProgress 
                                ? "Loading employees..." 
                                : !selectedEmployee
                                ? "Please select an employee to view leave data."
                                : monthDates.length === 0
                                ? "Please select a month to view leave data."
                                : "No leave data available."}
                            </td>
                          </tr>
                        ) : (
                          tableData.map((record: LeaveRecord, index: number) => (
                            <tr key={record.EmployeeId} style={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa" }}>
                              <td style={{ position: "sticky", left: 0, backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa", zIndex: 5, fontWeight: "500" }}>
                                {record.EmployeeName}
                              </td>
                              {monthDates.map((date) => (
                                <td
                                  key={date}
                                  style={{
                                    textAlign: "center",
                                    padding: "8px 4px",
                                    fontSize: "12px",
                                  }}
                                >
                                  {record[date] || "-"}
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
                        Showing {tableData.length} employee(s) for {monthDates.length} days
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

