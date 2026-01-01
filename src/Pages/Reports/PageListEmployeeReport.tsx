import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_GetReport } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";

const API_URL = `${API_WEB_URLS.MASTER}/0/token/EmployeeMaster`;
const API_URL_DEPARTMENT = `${API_WEB_URLS.MASTER}/0/token/DepartmentMaster/Id/0`;

const PageListEmployeeReportContainer = () => {
  const [gridData, setGridData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [departmentArray, setDepartmentArray] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    loadDepartments();
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (departmentArray.length > 0) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDepartment]);

  const loadDepartments = async () => {
    try {
      const data = await Fn_FillListData(dispatch, setDepartmentArray, "gridData", API_URL_DEPARTMENT);
      console.log("Departments loaded:", data);
    } catch (error) {
      console.error("Error loading departments:", error);
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

  const loadData = async () => {
    setLoading(true);
    try {
      let vformData = new FormData();
      // Append department ID if selected
      if (selectedDepartment && selectedDepartment !== "") {
        vformData.append("F_Department", selectedDepartment);
      } else {
        vformData.append("F_Department", "0");
      }

      // Call Fn_GetReport with FormData (same pattern as Inventory project)
      const response = await Fn_GetReport(
        dispatch,
        setStateForReport,
        "gridData",
        "EmployeeMaster/0/token",
        { arguList: { formData: vformData } },
        true
      );

      // Check if response is not null or undefined and contains data
      if (response !== null && response !== undefined && Array.isArray(response) && response.length > 0) {
        setGridData(response);
      } else {
        console.warn("Response is null, undefined, not an array, or empty:", response);
        setGridData([]);
      }
    } catch (error) {
      console.error("EmployeeReport - Error loading data:", error);
      setGridData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (employeeId: number) => {
    navigate(`${process.env.PUBLIC_URL || ""}/employeeReport`, { state: { EmployeeId: employeeId } });
  };

  const printEmptyApplicationForm = () => {
    // Default company details
    const companyName = "Latiyal Handicrafts Pvt. Ltd";
    const companyAddress = "Plot No. SPL #1, 2nd Phase, RIICO Industrial Area, Boranada, Jodhpur - 342012. Rajasthan";

    // Helper function to create character boxes for empty fields
    const createCharacterBoxes = (length: number = 30) => {
      return Array.from({ length }, (_, i) => 
        '<span style="display: inline-block; width: 18px; height: 20px; border: 1px solid #000; margin-right: 2px; vertical-align: middle;"></span>'
      ).join('');
    };

    // Create print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Application Form (Empty)</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 0.8cm;
          }
          @media print {
            body { 
              margin: 0;
              padding: 0;
            }
            .no-print { 
              display: none !important; 
            }
            .form-container {
              page-break-inside: avoid;
            }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 5px;
            margin: 0;
            line-height: 1.4;
            font-size: 12px;
          }
          .form-container {
            padding: 15px;
            border: 2px solid #000;
            box-sizing: border-box;
          }
          .header {
            margin-bottom: 10px;
            position: relative;
          }
          .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 6px;
          }
          .header-left {
            flex: 1;
          }
          .company-name {
            font-size: 25px;
            font-weight: bold;
            margin-bottom: 3px;
          }
          .company-address {
            font-size: 11px;
            line-height: 1.3;
          }
          .photo-box {
            width: 95px;
            height: 115px;
            border: 2px solid #000;
            background-color: #fff;
            flex-shrink: 0;
          }
          .form-title {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            margin: 10px 0 12px 0;
            text-decoration: underline;
          }
          .form-content {
            margin-bottom: 10px;
          }
          .full-width-row {
            width: 100%;
            margin-bottom: 5px;
          }
          .form-row {
            display: flex;
            margin-bottom: 5px;
            align-items: flex-start;
          }
          .form-label {
            font-size: 11px;
            font-weight: bold;
            min-width: 120px;
            flex-shrink: 0;
          }
          .form-value {
            font-size: 11px;
            flex: 1;
            padding: 2px 4px;
            min-height: 20px;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
          }
          .form-value-empty {
            flex: 1;
            min-height: 20px;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
          }
          .character-box {
            display: inline-block;
            width: 18px;
            height: 20px;
            border: 1px solid #000;
            margin-right: 2px;
            margin-bottom: 2px;
            vertical-align: middle;
          }
          .children-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
            margin-bottom: 5px;
          }
          .children-table th,
          .children-table td {
            border: 1px solid #000;
            padding: 3px 5px;
            font-size: 10px;
            text-align: left;
          }
          .children-table th {
            font-weight: bold;
            background-color: #f0f0f0;
          }
          .children-table td {
            min-height: 25px;
          }
          .children-table td:first-child {
            text-align: center;
            width: 45px;
          }
          .children-table .box-cell {
            display: flex;
            flex-wrap: wrap;
            gap: 2px;
            padding: 5px;
          }
          .caste-options {
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
            margin-left: 120px;
            font-size: 11px;
          }
          .caste-option {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .section-title {
            font-size: 12px;
            font-weight: bold;
            margin: 8px 0 5px 0;
            text-decoration: underline;
          }
          .full-width-label {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 3px;
          }
          .full-width-value {
            font-size: 11px;
            border: 1px solid #000;
            padding: 5px;
            min-height: 50px;
            display: flex;
            flex-wrap: wrap;
            gap: 2px;
            align-content: start;
          }
          .full-width-value .character-box {
            margin-bottom: 3px;
          }
          .office-use-section {
            margin-top: 12px;
            padding: 10px;
            border: 2px solid #000;
            background-color: #f9f9f9;
          }
          .office-use-title {
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 8px;
            text-align: center;
          }
          .footer-section {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            padding-top: 15px;
          }
          .footer-label {
            font-size: 11px;
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 5px;
            min-width: 220px;
          }
          .button-container {
            text-align: center;
            margin: 15px 0;
          }
          .print-btn {
            padding: 8px 20px;
            font-size: 14px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin: 0 5px;
          }
          .print-btn:hover {
            background-color: #0056b3;
          }
          .print-btn.close-btn {
            background-color: #6c757d;
          }
          .print-btn.close-btn:hover {
            background-color: #545b62;
          }
          .two-column-section {
            display: flex;
            gap: 12px;
            margin-bottom: 6px;
          }
          .two-column-section .form-row {
            flex: 1;
          }
        </style>
      </head>
      <body>
        <div class="button-container no-print">
          <button class="print-btn" onclick="window.print()">Print</button>
          <button class="print-btn close-btn" onclick="window.close()">Close</button>
        </div>

        <div class="form-container">
          <div class="header">
            <div class="header-top">
              <div class="header-left">
                <div class="company-name">${companyName}</div>
                <div class="company-address">${companyAddress}</div>
              </div>
              <div class="photo-box"></div>
            </div>
            <div class="form-title">Application-Form</div>
          </div>

          <div class="form-content">
            <!-- Row 1: Employee Name (Full Width) -->
            <div class="full-width-row">
              <div class="form-label" style="display: inline-block; min-width: 120px;">Employee Name:-</div>
              <div class="form-value">${createCharacterBoxes(40)}</div>
            </div>

            <!-- Row 2: DOB and Blood Group -->
            <div class="two-column-section">
              <div class="form-row">
                <div class="form-label">Date Of Birth:</div>
                <div class="form-value-empty">${createCharacterBoxes(10)}</div>
              </div>
              <div class="form-row">
                <div class="form-label">Blood Group:</div>
                <div class="form-value-empty">${createCharacterBoxes(5)}</div>
              </div>
            </div>

            <!-- Row 3: Father Name and Father DOB -->
            <div class="two-column-section">
              <div class="form-row">
                <div class="form-label">Father's Name:-</div>
                <div class="form-value-empty">${createCharacterBoxes(35)}</div>
              </div>
              <div class="form-row">
                <div class="form-label">Date Of Birth:</div>
                <div class="form-value-empty">${createCharacterBoxes(10)}</div>
              </div>
            </div>

            <!-- Row 4: Mother Name and Mother DOB -->
            <div class="two-column-section">
              <div class="form-row">
                <div class="form-label">Mother's Name:</div>
                <div class="form-value-empty">${createCharacterBoxes(35)}</div>
              </div>
              <div class="form-row">
                <div class="form-label">Date Of Birth:</div>
                <div class="form-value-empty">${createCharacterBoxes(10)}</div>
              </div>
            </div>

            <!-- Row 5: Wife Name and Wife DOB -->
            <div class="two-column-section">
              <div class="form-row">
                <div class="form-label">Wife's Name:</div>
                <div class="form-value-empty">${createCharacterBoxes(35)}</div>
              </div>
              <div class="form-row">
                <div class="form-label">Date Of Birth:</div>
                <div class="form-value-empty">${createCharacterBoxes(10)}</div>
              </div>
            </div>

            <!-- Child Details Grid: Sr.No, Name, DOB, Gender -->
            <div style="margin-top: 8px;">
              <div class="form-label" style="margin-bottom: 4px;">Child Details:</div>
              <table class="children-table">
                <thead>
                  <tr>
                    <th style="width: 40px;">Sr.No.</th>
                    <th>Name</th>
                    <th>DOB</th>
                    <th>Gender</th>
                  </tr>
                </thead>
                <tbody>
                  ${Array.from({ length: 5 }, (_, i) => `
                    <tr>
                      <td>${i + 1}</td>
                      <td class="box-cell">${createCharacterBoxes(30)}</td>
                      <td class="box-cell">${createCharacterBoxes(10)}</td>
                      <td class="box-cell">${createCharacterBoxes(5)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Row 6: Caste and Religion -->
            <div class="two-column-section" style="margin-top: 8px;">
              <div class="form-row">
                <div class="form-label">Caste:</div>
                <div class="caste-options" style="margin-left: 0; flex: 1;">
                  <div class="caste-option">
                    <span>☐</span><span>SC,</span>
                  </div>
                  <div class="caste-option">
                    <span>☐</span><span>ST,</span>
                  </div>
                  <div class="caste-option">
                    <span>☐</span><span>OBC,</span>
                  </div>
                  <div class="caste-option">
                    <span>☐</span><span>GEN.</span>
                  </div>
                </div>
              </div>
              <div class="form-row">
                <div class="form-label">Religion:</div>
                <div class="form-value-empty">${createCharacterBoxes(20)}</div>
              </div>
            </div>

            <!-- Permanent Address -->
            <div class="form-row" style="margin-top: 8px;">
              <div class="form-label">Permanent Address:</div>
              <div class="full-width-value" style="margin-left: 120px; min-height: 50px;">${createCharacterBoxes(80)}</div>
            </div>
          </div>

          <div class="two-column-section">
            <div class="form-row">
              <div class="form-label">Contact Number:</div>
              <div class="form-value-empty">${createCharacterBoxes(12)}</div>
            </div>
            <div class="form-row">
              <div class="form-label">Mobile No.:</div>
              <div class="form-value-empty">${createCharacterBoxes(12)}</div>
            </div>
          </div>

          <div class="full-width-row">
            <div class="full-width-label">Local Address:-</div>
            <div class="full-width-value" style="min-height: 50px;">${createCharacterBoxes(80)}</div>
          </div>

          <div class="two-column-section">
            <div class="form-row">
              <div class="form-label">Old ESI No.:</div>
              <div class="form-value-empty">${createCharacterBoxes(20)}</div>
            </div>
            <div class="form-row">
              <div class="form-label">UAN No.:</div>
              <div class="form-value-empty">${createCharacterBoxes(20)}</div>
            </div>
          </div>

          <div class="full-width-row">
            <div class="full-width-label">Local Reference:-</div>
            <div class="full-width-value" style="min-height: 50px;">${createCharacterBoxes(60)}</div>
          </div>

          <div class="full-width-row">
            <div class="full-width-label">Qualification:-</div>
            <div class="full-width-value" style="min-height: 50px;">${createCharacterBoxes(60)}</div>
          </div>

          <div class="full-width-row">
            <div class="full-width-label">Working Experience (if Any):</div>
            <div class="full-width-value" style="min-height: 60px;">${createCharacterBoxes(100)}</div>
          </div>

          <div class="office-use-section">
            <div class="office-use-title">OFFICE USE ONLY</div>
            <div class="two-column-section">
              <div class="form-row">
                <div class="form-label">Date Of Joining:</div>
                <div class="form-value-empty">${createCharacterBoxes(10)}</div>
              </div>
              <div class="form-row">
                <div class="form-label">Salary:</div>
                <div class="form-value-empty">${createCharacterBoxes(10)}</div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-label">Dept./Designation:</div>
              <div class="form-value-empty">${createCharacterBoxes(40)}</div>
            </div>
          </div>

          <div class="footer-section">
            <div class="footer-label">Sign/Thums Mark of Emp.</div>
            <div class="footer-label">Authorized Signatory.</div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      // Wait for content to load, then trigger print
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 250);
    }
  };

  // Frontend search filter only (department filter is handled by backend)
  const filteredData = (Array.isArray(gridData) ? gridData : []).filter((item: any) => {
    const searchText = filterText.toLowerCase();
    return (
      (item.EmployeeCode && item.EmployeeCode.toLowerCase().includes(searchText)) ||
      (item.Name && item.Name.toLowerCase().includes(searchText)) ||
      (item.FatherName && item.FatherName.toLowerCase().includes(searchText))
    );
  });

  return (
    <div className="page-body">
      <Breadcrumbs mainTitle="Employee Report List" parent="Reports" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon
                title="Employee Report List"
                tagClass="card-title mb-0"
              />
              <CardBody>
                <Row className="mb-3">
                  <Col md="4">
                    <div className="dataTables_filter d-flex align-items-center">
                      <Label className="me-2">Search:</Label>
                      <Input
                        type="search"
                        placeholder="Search by Employee Code, Name, or Father Name..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                      />
                    </div>
                  </Col>
                  <Col md="4">
                    <div className="dataTables_filter d-flex align-items-center">
                      <Label className="me-2">Department:</Label>
                      <Input
                        type="select"
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                      >
                        <option value="">All Departments</option>
                        {departmentArray.map((dept: any) => (
                          <option key={dept.Id} value={dept.Id}>
                            {dept.Name}
                          </option>
                        ))}
                      </Input>
                    </div>
                  </Col>
                </Row>
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table striped hover>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Employee Code</th>
                          <th>Name</th>
                          <th>Father Name</th>
                          <th style={{ width: "150px", textAlign: "center" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center">
                              No data found
                            </td>
                          </tr>
                        ) : (
                          filteredData.map((item: any, index: number) => (
                            <tr key={item.Id || index}>
                              <td>{index + 1}</td>
                              <td>{item.EmployeeCode || "-"}</td>
                              <td>{item.Name || "-"}</td>
                              <td>{item.FatherName || "-"}</td>
                              <td style={{ textAlign: "center" }}>
                                <Btn
                                  color="primary"
                                  size="sm"
                                  onClick={() => handleViewDetails(item.Id)}
                                >
                                  <i className="fa fa-eye me-1"></i>View Details
                                </Btn>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default PageListEmployeeReportContainer;

