import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_GetReport } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { formatDateForDisplay } from "../../utils/dateFormatUtils";

const API_URL_EMPLOYEE = `${API_WEB_URLS.MASTER}/0/token/EmployeeMaster/Id/0`;

// Get month names
const getMonthName = (monthIndex: number): string => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[monthIndex] || "";
};

// Get days in month
const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

interface YearlyAttendanceRecord {
  Id?: number;
  F_EmployeeMaster: number;
  EmployeeName: string;
  EmployeeId?: number;
  Month: number; // 0-11 (0 = January, 11 = December)
  MonthName?: string;
  Present: number;
  Absent: number;
  WorkingHours: number;
  Leave: number;
  MonthDays: number;
  OverTime: string; // Format: "0 00:00" or hours
  OverTimeAmount: number;
  [key: string]: any;
}

const EmployeeWiseYearlyContainer = () => {
  const [gridData, setGridData] = useState<YearlyAttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  
  // State object for Fn_FillListData - Employee
  const [employeeState, setEmployeeState] = useState({
    EmployeeArray: [] as any[],
    isProgress: true,
  });

  const dispatch = useDispatch();

  useEffect(() => {
    loadEmployeeData();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchYearlyAttendanceData();
    }
  }, [selectedYear, selectedEmployee]);

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

  const fetchYearlyAttendanceData = async () => {
    if (!selectedYear) {
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
      vformData.append("Year", String(selectedYear));
      
      if (selectedEmployee && selectedEmployee !== "") {
        vformData.append("F_EmployeeMaster", selectedEmployee);
      } else {
        vformData.append("F_EmployeeMaster", "0");
      }

      // API URL - adjust based on your actual endpoint
      const API_URL = `EmployeeWiseYearlyAttendance/0/token`;

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
      console.error("Error fetching yearly attendance data:", error);
      setGridData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    fetchYearlyAttendanceData();
  };

  const handleResetFilter = () => {
    setSelectedEmployee("");
    setSelectedYear(new Date().getFullYear());
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

  // Group data by employee
  const groupDataByEmployee = () => {
    const grouped: { [key: number]: YearlyAttendanceRecord[] } = {};
    
    gridData.forEach((record) => {
      const empId = record.F_EmployeeMaster || record.EmployeeId || 0;
      if (!grouped[empId]) {
        grouped[empId] = [];
      }
      grouped[empId].push(record);
    });

    // Sort each employee's records by month
    Object.keys(grouped).forEach((empId) => {
      grouped[Number(empId)].sort((a, b) => {
        const monthA = a.Month !== undefined ? a.Month : (a.MonthName ? getMonthIndex(a.MonthName) : 0);
        const monthB = b.Month !== undefined ? b.Month : (b.MonthName ? getMonthIndex(b.MonthName) : 0);
        return monthA - monthB;
      });
    });

    return grouped;
  };

  // Get month index from month name
  const getMonthIndex = (monthName: string): number => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
  };

  // Get employee name by ID
  const getEmployeeName = (employeeId: number): string => {
    const employee = employeeState.EmployeeArray.find((emp: any) => emp.Id === employeeId);
    return employee?.Name || employee?.MachineEnrollmentNo || `Employee ${employeeId}`;
  };

  // Format overtime display
  const formatOverTime = (overTime: string | number | null | undefined): string => {
    if (overTime === null || overTime === undefined || overTime === "") return "-";
    if (typeof overTime === "string") {
      return overTime || "-";
    }
    // If it's a number, convert to hours format
    const hours = Math.floor(overTime);
    const minutes = Math.round((overTime - hours) * 60);
    return `${hours} ${String(minutes).padStart(2, "0")}:${String(Math.round((overTime - hours - minutes/60) * 3600)).padStart(2, "0")}`;
  };

  // Format amount
  const formatAmount = (amount: number | string | null | undefined): string => {
    if (amount === null || amount === undefined || amount === "") return "-";
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "-";
    return numAmount.toFixed(2);
  };

  // Get all 12 months data for an employee (fill missing months with empty data)
  const getMonthlyDataForEmployee = (employeeId: number, records: YearlyAttendanceRecord[]) => {
    const monthlyData: YearlyAttendanceRecord[] = [];
    
    for (let month = 0; month < 12; month++) {
      const monthRecord = records.find((r) => {
        const recordMonth = r.Month !== undefined ? r.Month : (r.MonthName ? getMonthIndex(r.MonthName) : -1);
        return recordMonth === month;
      });

      if (monthRecord) {
        monthlyData.push(monthRecord);
      } else {
        // Create empty record for missing month
        monthlyData.push({
          Id: undefined,
          F_EmployeeMaster: employeeId,
          EmployeeName: getEmployeeName(employeeId),
          Month: month,
          MonthName: getMonthName(month),
          Present: 0,
          Absent: 0,
          WorkingHours: 0,
          Leave: 0,
          MonthDays: getDaysInMonth(selectedYear, month),
          OverTime: "0 00:00",
          OverTimeAmount: 0,
        });
      }
    }

    return monthlyData;
  };

  const groupedData = groupDataByEmployee();

  return (
    <div className="page-body" style={{ backgroundColor: "#e6f3ff" }}>
      <Breadcrumbs mainTitle="Employee Wise Yearly Attendance" parent="Transactions" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon
                title="Employee Wise Yearly Attendance"
                tagClass="card-title mb-0"
              />
              <CardBody>
                {/* Filter Section */}
                <Row className="mb-3">
                  <Col md="4">
                    <Label>Year</Label>
                    <Input
                      type="number"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      min="2000"
                      max="2099"
                    />
                  </Col>
                  <Col md="4">
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
                  <Col md="4" className="d-flex align-items-end">
                    <div className="d-flex gap-2 w-100">
                      <Btn
                        color="primary"
                        onClick={handleFilterChange}
                        disabled={loading || !selectedYear}
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
                    <p>Loading yearly attendance data...</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table striped hover bordered className="table-bordered">
                      <thead style={{ backgroundColor: "#6D68CB", color: "#fff" }}>
                        <tr>
                          <th style={{ width: "100px", textAlign: "center" }}>Month</th>
                          <th style={{ width: "200px" }}>Employee's Name</th>
                          <th style={{ width: "80px", textAlign: "center" }}>Pre.</th>
                          <th style={{ width: "80px", textAlign: "center" }}>Abs.</th>
                          <th style={{ width: "80px", textAlign: "center" }}>WH</th>
                          <th style={{ width: "80px", textAlign: "center" }}>Leave</th>
                          <th style={{ width: "100px", textAlign: "center" }}>Month Day's</th>
                          <th style={{ width: "120px", textAlign: "center" }}>OT</th>
                          <th style={{ width: "120px", textAlign: "center" }}>OT Amt.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(groupedData).length === 0 ? (
                          <tr>
                            <td colSpan={9} className="text-center p-4">
                              No attendance data available
                            </td>
                          </tr>
                        ) : (
                          Object.keys(groupedData).map((employeeId) => {
                            const empId = Number(employeeId);
                            const employeeRecords = groupedData[empId];
                            const monthlyData = getMonthlyDataForEmployee(empId, employeeRecords);
                            const employeeName = getEmployeeName(empId);

                            return monthlyData.map((record, index) => {
                              const monthName = record.MonthName || getMonthName(record.Month || 0);
                              const monthDays = record.MonthDays || getDaysInMonth(selectedYear, record.Month || 0);

                              return (
                                <tr 
                                  key={`${empId}-${record.Month || index}`}
                                  style={{ 
                                    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa" 
                                  }}
                                >
                                  <td style={{ textAlign: "center" }}>{monthName}</td>
                                  <td>{employeeName}</td>
                                  <td style={{ textAlign: "center" }}>{record.Present || 0}</td>
                                  <td style={{ textAlign: "center" }}>{record.Absent || 0}</td>
                                  <td style={{ textAlign: "center" }}>{record.WorkingHours || 0}</td>
                                  <td style={{ textAlign: "center" }}>{record.Leave || 0}</td>
                                  <td style={{ textAlign: "center" }}>{monthDays || "-"}</td>
                                  <td style={{ textAlign: "center" }}>{formatOverTime(record.OverTime)}</td>
                                  <td style={{ textAlign: "right" }}>{formatAmount(record.OverTimeAmount)}</td>
                                </tr>
                              );
                            });
                          }).flat()
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
                        Showing {Object.keys(groupedData).length} employee(s) with yearly attendance data
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

export default EmployeeWiseYearlyContainer;

