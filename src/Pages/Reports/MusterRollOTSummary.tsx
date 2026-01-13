import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_GetReport } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { formatDateForDisplay, formatDateForInput, formatDateForAPI } from "../../utils/dateFormatUtils";

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

interface MusterRollOTRecord {
  Id?: number;
  SNo?: number;
  PayNo?: number;
  CardNo?: string;
  EmployeeName?: string;
  Name?: string;
  WorkingDays?: number;
  WD?: number;
  OverTimeDays?: string; // Format: "HH:MM"
  OTD?: string;
  Holiday?: number;
  HLD?: number;
  Leave?: number;
  Total?: number;
  Absent?: number;
  ABS?: number;
  MonthTotal?: number;
  F_EmployeeMaster?: number;
  [key: string]: any;
}

const MusterRollOTSummaryContainer = () => {
  const [gridData, setGridData] = useState<MusterRollOTRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const dispatch = useDispatch();

  useEffect(() => {
    // Set default dates (current month)
    const { fromDate: monthFromDate, toDate: monthToDate } = getCurrentMonthDates();
    setFromDate(monthFromDate);
    setToDate(monthToDate);
  }, []);

  // Load data when filters change
  useEffect(() => {
    if (fromDate && toDate) {
      fetchMusterRollOTData();
    }
  }, [fromDate, toDate]);

  // setState function for Fn_GetReport to update gridData
  const setStateForReport = (data: any) => {
    console.log("setStateForReport called with:", data);
    if (data && Array.isArray(data)) {
      setGridData(data);
    } else {
      setGridData([]);
    }
  };

  const fetchMusterRollOTData = async () => {
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

      // API URL - adjust based on your actual endpoint
      const API_URL = `MusterRollOTSummary/0/token`;

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
      console.error("Error fetching muster roll OT summary data:", error);
      setGridData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    fetchMusterRollOTData();
  };

  const handleResetFilter = () => {
    const { fromDate: monthFromDate, toDate: monthToDate } = getCurrentMonthDates();
    setFromDate(monthFromDate);
    setToDate(monthToDate);
  };

  // Format decimal values (2 decimal places)
  const formatDecimal = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === "") return "0.00";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return "0.00";
    return numValue.toFixed(2);
  };

  // Format overtime time (HH:MM format)
  const formatOverTime = (overTime: string | null | undefined): string => {
    if (!overTime || overTime === "") return "00:00";
    // If already in HH:MM format, return as is
    if (overTime.match(/^\d{2}:\d{2}$/)) {
      return overTime;
    }
    // If it's a number (hours), convert to HH:MM
    const numValue = parseFloat(overTime);
    if (!isNaN(numValue)) {
      const hours = Math.floor(numValue);
      const minutes = Math.round((numValue - hours) * 60);
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
    return overTime;
  };

  return (
    <div className="page-body" style={{ backgroundColor: "#e6f3ff" }}>
      <Breadcrumbs mainTitle="Muster Roll OT Summary" parent="Reports" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon
                title="Muster Roll OT Summary"
                tagClass="card-title mb-0"
              />
              <CardBody>
                {/* Filter Section */}
                <Row className="mb-3">
                  <Col md="4">
                    <Label>From Date</Label>
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </Col>
                  <Col md="4">
                    <Label>To Date</Label>
                    <Input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </Col>
                  <Col md="4" className="d-flex align-items-end">
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
                          FOR DATE : {formatDateForDisplay(fromDate)} To {formatDateForDisplay(toDate)}
                        </h5>
                      </div>
                    </Col>
                  </Row>
                )}

                {/* Table Section */}
                {loading ? (
                  <div className="text-center py-4">
                    <p>Loading muster roll OT summary data...</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table striped hover bordered className="table-bordered">
                      <thead style={{ backgroundColor: "#6D68CB", color: "#fff" }}>
                        <tr>
                          <th style={{ width: "60px", textAlign: "center" }}>S.No.</th>
                          <th style={{ width: "80px", textAlign: "center" }}>Pay. No.</th>
                          <th style={{ width: "100px", textAlign: "center" }}>Card No.</th>
                          <th style={{ width: "200px" }}>Name</th>
                          <th style={{ width: "100px", textAlign: "center" }}>WD</th>
                          <th style={{ width: "120px", textAlign: "center" }}>OTD(In Hours)</th>
                          <th style={{ width: "100px", textAlign: "center" }}>HLD</th>
                          <th style={{ width: "100px", textAlign: "center" }}>LEAVE</th>
                          <th style={{ width: "100px", textAlign: "center" }}>TOTAL</th>
                          <th style={{ width: "100px", textAlign: "center" }}>ABS</th>
                          <th style={{ width: "120px", textAlign: "center" }}>Month Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gridData.length === 0 ? (
                          <tr>
                            <td colSpan={11} className="text-center p-4">
                              No attendance data available
                            </td>
                          </tr>
                        ) : (
                          gridData.map((item: MusterRollOTRecord, index: number) => {
                            // Get values with fallbacks for different field names
                            const workingDays = item.WorkingDays || item.WD || 0;
                            const overTimeDays = item.OverTimeDays || item.OTD || "00:00";
                            const holiday = item.Holiday || item.HLD || 0;
                            const leave = item.Leave || 0;
                            const total = item.Total || 0;
                            const absent = item.Absent || item.ABS || 0;
                            const monthTotal = item.MonthTotal || 0;

                            return (
                              <tr 
                                key={item.Id || index} 
                                style={{ 
                                  backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa" 
                                }}
                              >
                                <td style={{ textAlign: "center" }}>{item.SNo || index + 1}</td>
                                <td style={{ textAlign: "center" }}>{item.PayNo || "-"}</td>
                                <td style={{ textAlign: "center" }}>{item.CardNo || "-"}</td>
                                <td>{item.EmployeeName || item.Name || "-"}</td>
                                <td style={{ textAlign: "center" }}>{formatDecimal(workingDays)}</td>
                                <td style={{ textAlign: "center" }}>{formatOverTime(overTimeDays)}</td>
                                <td style={{ textAlign: "center" }}>{formatDecimal(holiday)}</td>
                                <td style={{ textAlign: "center" }}>{formatDecimal(leave)}</td>
                                <td style={{ textAlign: "center" }}>{formatDecimal(total)}</td>
                                <td style={{ textAlign: "center" }}>{formatDecimal(absent)}</td>
                                <td style={{ textAlign: "center" }}>{formatDecimal(monthTotal)}</td>
                              </tr>
                            );
                          })
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
                        Showing {gridData.length} employee(s) muster roll OT summary for {formatDateForDisplay(fromDate)} to {formatDateForDisplay(toDate)}
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

export default MusterRollOTSummaryContainer;
