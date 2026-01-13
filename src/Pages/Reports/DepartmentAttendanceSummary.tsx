import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_GetReport } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { formatDateForDisplay, formatDateForInput, formatDateForAPI } from "../../utils/dateFormatUtils";

const API_URL_DEPARTMENT = `${API_WEB_URLS.MASTER}/0/token/DepartmentMaster/Id/0`;

// Get current month dates (first day to last day of current month)
const getCurrentMonthDates = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  return {
    fromDate: formatDateForInput(firstDay.toISOString().split('T')[0]),
    toDate: formatDateForInput(lastDay.toISOString().split('T')[0]),
  };
};

interface DepartmentAttendanceRecord {
  Id?: number;
  Date: string;
  SNo?: number;
  Code?: string;
  Name?: string;
  DepartmentName?: string;
  TotalEmp?: number;
  Present?: number;
  Absent?: number;
  Leave?: number;
  WeeklyOff?: number;
  F_Department?: number;
  [key: string]: any;
}

const DepartmentAttendanceSummaryContainer = () => {
  const [gridData, setGridData] = useState<DepartmentAttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  
  // State object for Fn_FillListData - Department
  const [departmentState, setDepartmentState] = useState({
    DepartmentArray: [] as any[],
    isProgress: true,
  });

  const dispatch = useDispatch();

  useEffect(() => {
    // Load Department data
    loadDepartmentData();
    
    // Set default dates (current month)
    const { fromDate: monthFromDate, toDate: monthToDate } = getCurrentMonthDates();
    setFromDate(monthFromDate);
    setToDate(monthToDate);
  }, []);

  // Load data when filters change
  useEffect(() => {
    if (fromDate && toDate) {
      fetchDepartmentAttendanceData();
    }
  }, [fromDate, toDate, selectedDepartment]);

  const loadDepartmentData = async () => {
    try {
      await Fn_FillListData(dispatch, setDepartmentState, "DepartmentArray", API_URL_DEPARTMENT);
    } catch (error) {
      console.error("Error loading department data:", error);
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

  const fetchDepartmentAttendanceData = async () => {
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
      
      if (selectedDepartment && selectedDepartment !== "") {
        vformData.append("F_Department", selectedDepartment);
      } else {
        vformData.append("F_Department", "0");
      }

      // API URL - adjust based on your actual endpoint
      const API_URL = `DepartmentAttendanceSummary/0/token`;

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
      console.error("Error fetching department attendance summary data:", error);
      setGridData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    fetchDepartmentAttendanceData();
  };

  const handleResetFilter = () => {
    const { fromDate: monthFromDate, toDate: monthToDate } = getCurrentMonthDates();
    setFromDate(monthFromDate);
    setToDate(monthToDate);
    setSelectedDepartment("");
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

  // Group data by date
  const groupDataByDate = () => {
    const grouped: { [key: string]: DepartmentAttendanceRecord[] } = {};
    
    gridData.forEach((record) => {
      const dateKey = record.Date || "";
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(record);
    });

    // Sort dates
    const sortedDates = Object.keys(grouped).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    // Sort each date's records by SNo or Code
    sortedDates.forEach((date) => {
      grouped[date].sort((a, b) => {
        if (a.SNo && b.SNo) {
          return a.SNo - b.SNo;
        }
        if (a.Code && b.Code) {
          return a.Code.localeCompare(b.Code);
        }
        return 0;
      });
    });

    return { grouped, sortedDates };
  };

  // Calculate totals for a date
  const calculateDateTotals = (records: DepartmentAttendanceRecord[]) => {
    return records.reduce((totals, record) => {
      totals.TotalEmp += record.TotalEmp || 0;
      totals.Present += record.Present || 0;
      totals.Absent += record.Absent || 0;
      totals.Leave += record.Leave || 0;
      totals.WeeklyOff += record.WeeklyOff || 0;
      return totals;
    }, {
      TotalEmp: 0,
      Present: 0,
      Absent: 0,
      Leave: 0,
      WeeklyOff: 0,
    });
  };

  const { grouped, sortedDates } = groupDataByDate();

  return (
    <div className="page-body" style={{ backgroundColor: "#e6f3ff" }}>
      <Breadcrumbs mainTitle="Department Attendance Summary" parent="Reports" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon
                title="Department Attendance Summary"
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

                {/* Report Title */}
                {gridData.length > 0 && (
                  <Row className="mb-3">
                    <Col xs="12">
                      <div style={{ textAlign: "center", marginBottom: "15px" }}>
                        <h5 style={{ fontWeight: "bold", marginBottom: "5px" }}>
                          {formatDateForDisplay(fromDate)} To {formatDateForDisplay(toDate)}
                        </h5>
                      </div>
                    </Col>
                  </Row>
                )}

                {/* Table Section */}
                {loading ? (
                  <div className="text-center py-4">
                    <p>Loading department attendance summary data...</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    {sortedDates.length === 0 ? (
                      <div className="text-center p-4">
                        No attendance data available
                      </div>
                    ) : (
                      sortedDates.map((date, dateIndex) => {
                        const dateRecords = grouped[date];
                        const totals = calculateDateTotals(dateRecords);

                        return (
                          <div key={date} style={{ marginBottom: "30px" }}>
                            {/* Date Header */}
                            <div style={{ 
                              fontWeight: "bold", 
                              marginBottom: "10px",
                              fontSize: "16px",
                              backgroundColor: "#f8f9fa",
                              padding: "8px",
                              borderRadius: "4px"
                            }}>
                              Date : {formatDateForDisplay(date)}
                            </div>

                            {/* Table for this date */}
                            <Table striped hover bordered className="table-bordered">
                              <thead style={{ backgroundColor: "#6D68CB", color: "#fff" }}>
                                <tr>
                                  <th style={{ width: "60px", textAlign: "center" }}>S.No.</th>
                                  <th style={{ width: "100px" }}>Code</th>
                                  <th style={{ width: "250px" }}>Name</th>
                                  <th style={{ width: "100px", textAlign: "center" }}>Total Emp.</th>
                                  <th style={{ width: "100px", textAlign: "center" }}>Present</th>
                                  <th style={{ width: "100px", textAlign: "center" }}>Absent</th>
                                  <th style={{ width: "100px", textAlign: "center" }}>Leave</th>
                                  <th style={{ width: "120px", textAlign: "center" }}>Weekly Off</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dateRecords.map((item: DepartmentAttendanceRecord, index: number) => (
                                  <tr 
                                    key={item.Id || index} 
                                    style={{ 
                                      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa" 
                                    }}
                                  >
                                    <td style={{ textAlign: "center" }}>{item.SNo || index + 1}</td>
                                    <td>{item.Code || "-"}</td>
                                    <td>{item.Name || item.DepartmentName || "-"}</td>
                                    <td style={{ textAlign: "center" }}>{item.TotalEmp || 0}</td>
                                    <td style={{ textAlign: "center" }}>{item.Present || 0}</td>
                                    <td style={{ textAlign: "center" }}>{item.Absent || 0}</td>
                                    <td style={{ textAlign: "center" }}>{item.Leave || 0}</td>
                                    <td style={{ textAlign: "center" }}>{item.WeeklyOff || 0}</td>
                                  </tr>
                                ))}
                                
                                {/* Total Row for this date */}
                                <tr style={{ 
                                  fontWeight: "bold", 
                                  backgroundColor: "#e9ecef",
                                  borderTop: "2px solid #6D68CB"
                                }}>
                                  <td colSpan={3} style={{ textAlign: "right", paddingRight: "15px" }}>
                                    Total :
                                  </td>
                                  <td style={{ textAlign: "center" }}>{totals.TotalEmp}</td>
                                  <td style={{ textAlign: "center" }}>{totals.Present}</td>
                                  <td style={{ textAlign: "center" }}>{totals.Absent}</td>
                                  <td style={{ textAlign: "center" }}>{totals.Leave}</td>
                                  <td style={{ textAlign: "center" }}>{totals.WeeklyOff}</td>
                                </tr>
                              </tbody>
                            </Table>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Summary Section */}
                {gridData.length > 0 && (
                  <Row className="mt-3">
                    <Col xs="12">
                      <div className="text-muted" style={{ fontSize: "12px" }}>
                        Showing attendance summary for {sortedDates.length} date(s) from {formatDateForDisplay(fromDate)} to {formatDateForDisplay(toDate)}
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

export default DepartmentAttendanceSummaryContainer;

