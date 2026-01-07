import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_AddEditData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { formatDateForDisplay, formatDateForInput, formatDateForAPI } from "../../utils/dateFormatUtils";

const API_URL_EMPLOYEE = `${API_WEB_URLS.MASTER}/0/token/EmployeeMaster/Id/0`;

interface AdjustmentRecord {
  Id?: number;
  F_EmployeeMaster: number | string;
  EmployeeName: string;
  TimeMinutes: number;
  AdjustmentType: "Add" | "Less";
  Remarks: string;
  [key: string]: any;
}

interface EmployeeOption {
  value: number;
  label: string;
}

const AttendanceAdjustmentContainer = () => {
  const [attendanceDate, setAttendanceDate] = useState<string>("");
  const [adjustmentRows, setAdjustmentRows] = useState<AdjustmentRecord[]>([
    {
      Id: undefined,
      F_EmployeeMaster: "",
      EmployeeName: "",
      TimeMinutes: 0,
      AdjustmentType: "Add",
      Remarks: "",
    }
  ]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  
  // State object for Fn_FillListData - Employee
  const [employeeState, setEmployeeState] = useState({
    EmployeeArray: [] as any[],
    isProgress: true,
  });

  // State for adjustment data from API (similar to gridData in PageList_ShiftMaster)
  const [adjustmentData, setAdjustmentData] = useState<any[]>([]);

  const dispatch = useDispatch();

  useEffect(() => {
    // Load Employee data
    loadEmployeeData();
    
    // Set default date to today
    const today = new Date();
    const defaultDate = formatDateForInput(today.toISOString().split('T')[0]);
    setAttendanceDate(defaultDate);
    
    // Automatically load adjustment data for today's date on page load
    if (defaultDate) {
      fetchAdjustmentData(defaultDate);
    }
  }, []);

  // Map adjustmentData to adjustmentRows when data is loaded (similar to PageList_ShiftMaster pattern)
  useEffect(() => {
    const emptyRow: AdjustmentRecord = {
      Id: undefined,
      F_EmployeeMaster: "",
      EmployeeName: "",
      TimeMinutes: 0,
      AdjustmentType: "Add",
      Remarks: "",
    };

    if (adjustmentData && adjustmentData.length > 0) {
      const mappedRows: AdjustmentRecord[] = adjustmentData.map((item: any) => ({
        Id: item.Id,
        F_EmployeeMaster: item.F_EmployeeMaster ?? "",
        EmployeeName: item.EmployeeName || "",
        TimeMinutes: Number(item.Time ?? 0),
        AdjustmentType: item.AddLess === -1 ? "Less" : "Add",
        Remarks: item.Remarks || "",
      }));

      // Always add one empty row at the end for new entry
      mappedRows.push(emptyRow);

      setAdjustmentRows(mappedRows);
      setSelectedRows(new Set());
    } else if (adjustmentData && adjustmentData.length === 0) {
      // If no data, show one empty row
      setAdjustmentRows([emptyRow]);
      setSelectedRows(new Set());
    }
  }, [adjustmentData]);

  const loadEmployeeData = async () => {
    try {
      await Fn_FillListData(dispatch, setEmployeeState, "EmployeeArray", API_URL_EMPLOYEE);
    } catch (error) {
      console.error("Error loading employee data:", error);
    }
  };

  // Convert employee array to options for React Select
  const getEmployeeOptions = (): EmployeeOption[] => {
    if (!employeeState.EmployeeArray || employeeState.EmployeeArray.length === 0) {
      return [];
    }
    return employeeState.EmployeeArray.map((employee: any) => ({
      value: employee.Id,
      label: employee.Name || employee.MachineEnrollmentNo || `Employee ${employee.Id}`
    }));
  };

  // Get employee option by value
  const getEmployeeOption = (employeeId: number | string): EmployeeOption | null => {
    if (!employeeId) return null;
    const options = getEmployeeOptions();
    return options.find(opt => opt.value === Number(employeeId)) || null;
  };

  const fetchAdjustmentData = async (entryDate: string) => {
    if (!entryDate) return;
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

      const formattedDate = formatDateForAPI(entryDate);
      // Construct API URL in format: Masters/0/token/AttendanceAdjustment/{date}/{userId}
      const API_URL = `${API_WEB_URLS.MASTER}/0/token/AttendanceAdjustment/${formattedDate}/${userId}`;

      // Use Fn_FillListData like PageList_ShiftMaster
      // This will update adjustmentData state, which will trigger useEffect to map to adjustmentRows
      await Fn_FillListData(dispatch, setAdjustmentData, "gridData", API_URL);
    } catch (error) {
      console.error("Error fetching attendance adjustment data:", error);
      // Keep existing rows if fetch fails
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setAttendanceDate(newDate);
    setSelectedRows(new Set());
    // Automatically load data when date is selected
    if (newDate) {
      fetchAdjustmentData(newDate);
    } else {
      // Reset rows if date is cleared
      setAdjustmentRows([{
        Id: undefined,
        F_EmployeeMaster: "",
        EmployeeName: "",
        TimeMinutes: 0,
        AdjustmentType: "Add",
        Remarks: "",
      }]);
    }
  };

  
  const handleEmployeeChange = (index: number, selectedOption: EmployeeOption | null) => {
    setAdjustmentRows(prev => {
      const updated = [...prev];
      if (selectedOption) {
        updated[index] = {
          ...updated[index],
          F_EmployeeMaster: selectedOption.value,
          EmployeeName: selectedOption.label
        };
      } else {
        updated[index] = {
          ...updated[index],
          F_EmployeeMaster: "",
          EmployeeName: ""
        };
      }

      // If employee and time are both filled, add a new row
      const currentRow = updated[index];
      if (currentRow.F_EmployeeMaster && currentRow.TimeMinutes > 0) {
        // Check if there's already an empty row at the end
        const lastRow = updated[updated.length - 1];
        if (!lastRow || (lastRow.F_EmployeeMaster && lastRow.TimeMinutes > 0)) {
          updated.push({
            Id: undefined,
            F_EmployeeMaster: "",
            EmployeeName: "",
            TimeMinutes: 0,
            AdjustmentType: "Add",
            Remarks: "",
          });
        }
      }

      return updated;
    });
  };

  const handleTimeMinutesChange = (index: number, value: string) => {
    const numValue = parseInt(value) || 0;
    setAdjustmentRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], TimeMinutes: numValue };

      // If employee and time are both filled, add a new row
      const currentRow = updated[index];
      if (currentRow.F_EmployeeMaster && currentRow.TimeMinutes > 0) {
        // Check if there's already an empty row at the end
        const lastRow = updated[updated.length - 1];
        if (!lastRow || (lastRow.F_EmployeeMaster && lastRow.TimeMinutes > 0)) {
          updated.push({
            Id: undefined,
            F_EmployeeMaster: "",
            EmployeeName: "",
            TimeMinutes: 0,
            AdjustmentType: "Add",
            Remarks: "",
          });
        }
      }

      return updated;
    });
  };

  const handleAdjustmentTypeChange = (index: number, type: "Add" | "Less") => {
    setAdjustmentRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], AdjustmentType: type };
      return updated;
    });
  };

  const handleRemarksChange = (index: number, value: string) => {
    setAdjustmentRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], Remarks: value };
      return updated;
    });
  };

  const handleRowCheckboxChange = (index: number) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const removeRow = (index: number) => {
    if (adjustmentRows.length > 1) {
      setAdjustmentRows(prev => prev.filter((_, i) => i !== index));
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        // Adjust indices for remaining rows
        const adjusted = new Set<number>();
        newSet.forEach(idx => {
          if (idx > index) {
            adjusted.add(idx - 1);
          } else if (idx < index) {
            adjusted.add(idx);
          }
        });
        return adjusted;
      });
    }
  };

  const handleSave = async () => {
    if (!attendanceDate) {
      alert("Please select attendance date");
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
      // Filter rows that have employee selected and time minutes > 0
      // Exclude the last empty row (always added for new entry)
      const rowsToSave = adjustmentRows.filter((row, index) => {
        // Must have employee selected
        if (!row.F_EmployeeMaster) {
          return false;
        }
        
        // Must have time minutes > 0
        if (!row.TimeMinutes || row.TimeMinutes <= 0) {
          return false;
        }
        
        // Exclude the last row if it's the empty row (no Id, empty employee, time = 0)
        const isLastRow = index === adjustmentRows.length - 1;
        if (isLastRow && !row.Id && (!row.F_EmployeeMaster || row.F_EmployeeMaster === "") && row.TimeMinutes === 0) {
          return false;
        }
        
        return true;
      });
      
      if (rowsToSave.length === 0) {
        alert("Please select employee and enter time adjustment for at least one record");
        setLoading(false);
        return;
      }

      // Use "token" as literal string (matching pattern from AuditAttendance)
      const userToken = "token";


      const jsonData = rowsToSave.map(row => ({
        Id: row.Id, // Include Id if it exists (for existing records)
        F_EmployeeMaster: Number(row.F_EmployeeMaster),
        Time: row.TimeMinutes,
        AddLess: row.AdjustmentType === "Add" ? 1 : -1,
        Remarks: row.Remarks || ""
      }));

      // Create FormData for multipart/form-data
      const formData = new FormData();
      const entryDate = formatDateForAPI(attendanceDate);
      formData.append("EntryDate", entryDate);
      formData.append("JsonData", JSON.stringify(jsonData));

      // Construct API URL: /api/V1/AttendanceAdjustment/{UserId}/{UserToken}
      const API_URL_SAVE = `AttendanceAdjustment/${userId}/${userToken}`;

      // Call API to save adjustment data
      await Fn_AddEditData(
        dispatch,
        () => {}, // setState not needed
        { arguList: { id: 0, formData: formData } },
        API_URL_SAVE,
        true, // isMultiPart
        "memberid",
        () => {}, // navigate not needed
        "" // forward not needed
      );

      setSelectedRows(new Set());
      setEditingRowIndex(null);
      
      // Reload data after saving to refresh the table
      if (attendanceDate) {
        await fetchAdjustmentData(attendanceDate);
      }
      
      alert(`${rowsToSave.length} adjustment record(s) saved successfully!`);
    } catch (error) {
      console.error("Error saving adjustment data:", error);
      alert("Error saving adjustment data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditRow = (index: number) => {
    setEditingRowIndex(index);
  };

  const handleCancelEditRow = () => {
    setEditingRowIndex(null);
    // Reload data to reset any changes made to the row
    if (attendanceDate) {
      fetchAdjustmentData(attendanceDate);
    }
  };

  const handleCancel = () => {
    setSelectedRows(new Set());
    setEditingRowIndex(null);
    // Reset to one empty row
    setAdjustmentRows([{
      Id: undefined,
      F_EmployeeMaster: "",
      EmployeeName: "",
      TimeMinutes: 0,
      AdjustmentType: "Add",
      Remarks: "",
    }]);
  };

  const handleClose = () => {
    window.history.back();
  };

  return (
    <div className="page-body" style={{ backgroundColor: "#e6f3ff" }}>
      <Breadcrumbs mainTitle="Employee Attendance Adjustment" parent="Transactions" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon
                title="Employee Attendance Adjustment"
                tagClass="card-title mb-0"
              />
              <CardBody>
                {/* Attendance Date Field */}
                <Row className="mb-3">
                  <Col md="3">
                    <Label>Att. Date</Label>
                    <Input
                      type="date"
                      value={attendanceDate}
                      onChange={handleDateChange}
                    />
                  </Col>
                </Row>

                {/* Table */}
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>S. No.</th>
                        <th>Employee</th>
                        <th>Time (Minutes)</th>
                        <th>Remarks</th>
                        <th>Del</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adjustmentRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center p-4">
                            No data available
                          </td>
                        </tr>
                      ) : (
                        adjustmentRows.map((item: AdjustmentRecord, index: number) => (
                          <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa" }}>
                            <td>{index + 1}</td>
                            <td style={{ minWidth: "200px" }}>
                              <Input
                                type="select"
                                value={item.F_EmployeeMaster || ""}
                                onChange={(e) => {
                                  const selectedId = e.target.value ? Number(e.target.value) : "";
                                  const selectedOption = selectedId ? getEmployeeOption(selectedId) : null;
                                  handleEmployeeChange(index, selectedOption);
                                }}
                                disabled={item.Id !== undefined && editingRowIndex !== index}
                                className="btn-square"
                                style={{ width: "100%", minWidth: "200px" }}
                              >
                                <option value="">Select Employee</option>
                                {getEmployeeOptions().map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </Input>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <Input
                                  type="number"
                                  value={item.TimeMinutes === 0 ? "" : item.TimeMinutes}
                                  onChange={(e) => handleTimeMinutesChange(index, e.target.value)}
                                  onFocus={(e) => {
                                    if (item.TimeMinutes === 0) {
                                      e.target.value = "";
                                    }
                                  }}
                                  disabled={item.Id !== undefined && editingRowIndex !== index}
                                  min="0"
                                  style={{ width: "80px" }}
                                />
                                <Input
                                  type="select"
                                  value={item.AdjustmentType}
                                  onChange={(e) => handleAdjustmentTypeChange(index, e.target.value as "Add" | "Less")}
                                  disabled={item.Id !== undefined && editingRowIndex !== index}
                                  style={{ width: "100px", minWidth: "100px" }}
                                >
                                  <option value="Add">Add</option>
                                  <option value="Less">Less</option>
                                </Input>
                              </div>
                            </td>
                            <td>
                              <Input
                                type="text"
                                value={item.Remarks || ""}
                                onChange={(e) => handleRemarksChange(index, e.target.value)}
                                placeholder="Enter remarks"
                                disabled={item.Id !== undefined && editingRowIndex !== index}
                                style={{ width: "100%" }}
                              />
                            </td>
                            <td>
                              <div className="d-flex gap-2 align-items-center">
                                {item.Id !== undefined ? (
                                  // Row from API - Show Edit button or Cancel button
                                  editingRowIndex === index ? (
                                    <Btn
                                      color="secondary"
                                      size="sm"
                                      type="button"
                                      onClick={handleCancelEditRow}
                                    >
                                      <i className="fa fa-times"></i>
                                    </Btn>
                                  ) : (
                                    <Btn
                                      color="primary"
                                      size="sm"
                                      type="button"
                                      onClick={() => handleEditRow(index)}
                                    >
                                      <i className="fa fa-edit"></i>
                                    </Btn>
                                  )
                                ) : (
                                  // New row - Show delete button
                                  adjustmentRows.length > 1 && (
                                    <Btn
                                      color="danger"
                                      size="sm"
                                      type="button"
                                      onClick={() => removeRow(index)}
                                    >
                                      <i className="fa fa-times"></i>
                                    </Btn>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>

                {/* Action Buttons */}
                <Row className="mt-3">
                  <Col xs="12" className="text-end">
                    <Btn
                      color="success"
                      className="me-2"
                      onClick={handleSave}
                      disabled={loading || !attendanceDate}
                    >
                      {loading ? "Saving..." : "Save"}
                    </Btn>
                    <Btn
                      color="secondary"
                      className="me-2"
                      onClick={handleCancel}
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

                {/* Instruction */}
                <Row className="mt-3">
                  <Col xs="12">
                    <p className="text-muted mb-0" style={{ fontSize: "12px" }}>
                      Press F11 - To Focus On List
                    </p>
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

export default AttendanceAdjustmentContainer;
