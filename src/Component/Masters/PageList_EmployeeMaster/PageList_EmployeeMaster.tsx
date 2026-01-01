import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_DeleteData, Fn_DisplayData } from "../../../store/Functions";
import { callGet_Data } from "../../../store/common-actions";
import { API_WEB_URLS } from "../../../constants/constAPI";
import { formatDateForDisplay } from "../../../utils/dateFormatUtils";

const API_URL = `${API_WEB_URLS.MASTER}/0/token/EmployeeMaster`;

const PageList_EmployeeMasterContainer = () => {
  const [gridData, setGridData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await Fn_FillListData(dispatch, setGridData, "gridData", API_URL + "/Id/0");
      console.log("EmployeeMaster - Loaded data:", data);
    } catch (error) {
      console.error("EmployeeMaster - Error loading data:", error);
    }
    setLoading(false);
  };

  // Debug: Log gridData when it changes
  useEffect(() => {
    console.log("EmployeeMaster - gridData updated:", gridData);
    if (gridData && gridData.length > 0) {
      console.log("EmployeeMaster - First item:", gridData[0]);
    }
  }, [gridData]);

  const handleEdit = (id: number) => {
    navigate("/addEdit_EmployeeMaster", { state: { Id: id } });
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this employee?");
    if (confirmed) {
      try {
        const result = await Fn_DeleteData(dispatch, setGridData, id, API_URL, API_URL + "/Id/0");
        if (result?.success) {
          await Fn_FillListData(dispatch, setGridData, "gridData", API_URL + "/Id/0");
        }
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  const handleAdd = () => {
    navigate("/addEdit_EmployeeMaster", { state: { Id: 0 } });
  };

  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString) || "-";
  };

  // Helper function to convert text to character boxes
  const createCharacterBoxes = (text: string, maxBoxes: number = 50) => {
    const chars = (text || "").split("");
    const boxes = Array.from({ length: maxBoxes }, (_, i) => chars[i] || "");
    return boxes.map((char, idx) => 
      `<span class="char-box">${char}</span>`
    ).join("");
  };

  // Helper function to create character boxes for date (DD.MM.YYYY format)
  const createDateBoxes = (dateStr: string, maxBoxes: number = 10) => {
    if (!dateStr) {
      return Array.from({ length: maxBoxes }, () => '<span class="char-box"></span>').join("");
    }
    const chars = dateStr.split("");
    const boxes = Array.from({ length: maxBoxes }, (_, i) => chars[i] || "");
    return boxes.map((char) => 
      `<span class="char-box">${char}</span>`
    ).join("");
  };

  const handlePrintApplicationForm = async (employeeId: number) => {
    try {
      // First check if employee data is already in gridData
      let employeeData = gridData.find((emp: any) => emp.Id === employeeId);
      
      // If not found, fetch from API using Promise wrapper
      if (!employeeData) {
        employeeData = await new Promise((resolve, reject) => {
          let resolved = false;
          
          const request = {
            id: employeeId,
            apiURL: API_URL + "/Id",
            callback: (response: any) => {
              if (!resolved) {
                resolved = true;
                if (response && response.status === 200 && response.data && response.data.dataList && response.data.dataList.length > 0) {
                  resolve(response.data.dataList[0]);
                } else {
                  reject(new Error("Error fetching employee data"));
                }
              }
            },
          };
          
          dispatch(callGet_Data(request));
          
          // Timeout after 5 seconds
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              reject(new Error("Timeout fetching employee data"));
            }
          }, 5000);
        });
      }
      
      if (!employeeData || Object.keys(employeeData).length === 0) {
        alert("Employee data not found");
        return;
      }
      
      const empData = employeeData as any;

      // Extract employee data
      const employeeName = empData?.Name || "";
      const dateOfBirth = formatDateForDisplay(empData?.DateOfBirth) || "";
      const dateOfBirthFormatted = dateOfBirth ? dateOfBirth.split('-').reverse().join('.') : "";
      const fatherName = empData?.FatherName || "";
      const fatherDOB = formatDateForDisplay(empData?.FatherDateOfBirth || empData?.FathersDateOfBirth || "") || "";
      const fatherDOBFormatted = fatherDOB ? fatherDOB.split('-').reverse().join('.') : "";
      const motherName = empData?.MotherName || empData?.MothersName || "";
      const motherDOB = formatDateForDisplay(empData?.MotherDateOfBirth || empData?.MothersDateOfBirth || "") || "";
      const motherDOBFormatted = motherDOB ? motherDOB.split('-').reverse().join('.') : "";
      const wifeName = empData?.WifeName || empData?.WifesName || "";
      const wifeDOB = formatDateForDisplay(empData?.WifeDateOfBirth || empData?.WifesDateOfBirth || "") || "";
      const wifeDOBFormatted = wifeDOB ? wifeDOB.split('-').reverse().join('.') : "";
      const gender = empData?.Gender || "";
      const bloodGroup = empData?.BloodGroup || "";
      const religion = empData?.Religion || "";
      const permanentAddress = empData?.Address || "";
      const localAddress = empData?.LocalAddress || "";
      const contactNumber = empData?.MobileNo || "";
      const mobileNo = empData?.MobileNo || "";
      const oldESINo = empData?.OldESINo || empData?.EmployeeESICNo || "";
      const uanNo = empData?.UANNo || "";
      const localReference = empData?.LocalReference || "";
      const qualification = empData?.Qualification || "";
      const workingExperience = empData?.WorkingExperience || "";
      const dateOfJoining = formatDateForDisplay(empData?.DateOfJoining) || "";
      const dateOfJoiningFormatted = dateOfJoining ? dateOfJoining.split('-').reverse().join('.') : "";
      const department = empData?.DepartmentName || empData?.Department || "";
      const designation = empData?.DesignationName || empData?.Designation || "";
      const salary = empData?.SalaryAmount || "";
      
      // Get children data if available
      const children = empData?.Children || [];
      
      // Company details
      const companyName = empData?.CompanyName || "Latiyal Handicrafts Pvt. Ltd";
      const companyAddress = empData?.CompanyAddress || "Plot No. SPL #1, 2nd Phase, RIICO Industrial Area, Boranada, Jodhpur - 342012. Rajasthan";

      // Create print content with character boxes
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Application Form</title>
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
              display: flex;
              flex-wrap: wrap;
              gap: 2px;
              align-items: center;
              border-bottom: 1px solid #000;
              padding: 2px 4px;
              min-height: 20px;
            }
            .char-box {
              display: inline-block;
              width: 18px;
              height: 18px;
              border: 1px solid #000;
              text-align: center;
              line-height: 18px;
              font-size: 11px;
              margin: 0 1px;
            }
            .char-box:empty {
              background-color: transparent;
            }
            .form-value-empty {
              display: flex;
              flex-wrap: wrap;
              gap: 2px;
              border-bottom: 1px solid #000;
              padding: 2px 4px;
              min-height: 20px;
              flex: 1;
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
            .children-table td:first-child {
              text-align: center;
              width: 45px;
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
              display: flex;
              flex-wrap: wrap;
              gap: 2px;
              border-bottom: 1px solid #000;
              padding: 2px 4px;
              min-height: 20px;
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
                <div class="form-label" style="display: inline-block; min-width: 110px;">Employee Name:-</div>
                <div class="form-value" style="display: inline-block; width: calc(100% - 130px);">${createCharacterBoxes(employeeName, 50)}</div>
              </div>

              <!-- Row 2: DOB and Blood Group -->
              <div class="two-column-section">
                <div class="form-row">
                  <div class="form-label">Date Of Birth:</div>
                  <div class="form-value">${createDateBoxes(dateOfBirthFormatted, 10)}</div>
                </div>
                <div class="form-row">
                  <div class="form-label">Blood Group:</div>
                  <div class="form-value">${createCharacterBoxes(bloodGroup, 5)}</div>
                </div>
              </div>

              <!-- Row 3: Father Name and Father DOB -->
              <div class="two-column-section">
                <div class="form-row">
                  <div class="form-label">Father's Name:-</div>
                  <div class="form-value">${createCharacterBoxes(fatherName, 40)}</div>
                </div>
                <div class="form-row">
                  <div class="form-label">Date Of Birth:</div>
                  <div class="form-value">${createDateBoxes(fatherDOBFormatted, 10)}</div>
                </div>
              </div>

              <!-- Row 4: Mother Name and Mother DOB -->
              <div class="two-column-section">
                <div class="form-row">
                  <div class="form-label">Mother's Name:</div>
                  <div class="form-value">${createCharacterBoxes(motherName, 40)}</div>
                </div>
                <div class="form-row">
                  <div class="form-label">Date Of Birth:</div>
                  <div class="form-value">${createDateBoxes(motherDOBFormatted, 10)}</div>
                </div>
              </div>

              <!-- Row 5: Wife Name and Wife DOB -->
              <div class="two-column-section">
                <div class="form-row">
                  <div class="form-label">Wife's Name:</div>
                  <div class="form-value">${createCharacterBoxes(wifeName, 40)}</div>
                </div>
                <div class="form-row">
                  <div class="form-label">Date Of Birth:</div>
                  <div class="form-value">${createDateBoxes(wifeDOBFormatted, 10)}</div>
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
                    ${Array.from({ length: 5 }, (_, i) => {
                      const child = children[i] || {};
                      let childDOB = "";
                      if (child.DateOfBirth) {
                        const dob = formatDateForDisplay(child.DateOfBirth);
                        childDOB = dob ? dob.split('-').reverse().join('.') : "";
                      }
                      return `
                        <tr>
                          <td>${i + 1}</td>
                          <td><div class="form-value" style="border: none; padding: 0;">${createCharacterBoxes(child.Name || "", 30)}</div></td>
                          <td><div class="form-value" style="border: none; padding: 0;">${createDateBoxes(childDOB, 10)}</div></td>
                          <td><div class="form-value" style="border: none; padding: 0;">${createCharacterBoxes(child.Gender || "", 5)}</div></td>
                        </tr>
                      `;
                    }).join('')}
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
                  <div class="form-value">${createCharacterBoxes(religion, 15)}</div>
                </div>
              </div>

              <!-- Permanent Address -->
              <div class="form-row" style="margin-top: 8px;">
                <div class="form-label">Permanent Address:</div>
                <div class="form-value">${createCharacterBoxes(permanentAddress, 60)}</div>
              </div>
            </div>

            <div class="two-column-section">
              <div class="form-row">
                <div class="form-label">Contact Number:</div>
                <div class="form-value">${createCharacterBoxes(contactNumber, 12)}</div>
              </div>
              <div class="form-row">
                <div class="form-label">Mobile No.:</div>
                <div class="form-value">${createCharacterBoxes(mobileNo, 12)}</div>
              </div>
            </div>

            <div class="full-width-row">
              <div class="full-width-label">Local Address:-</div>
              <div class="full-width-value">${createCharacterBoxes(localAddress, 60)}</div>
            </div>

            <div class="two-column-section">
              <div class="form-row">
                <div class="form-label">Old ESI No.:</div>
                <div class="form-value">${createCharacterBoxes(oldESINo, 20)}</div>
              </div>
              <div class="form-row">
                <div class="form-label">UAN No.:</div>
                <div class="form-value">${createCharacterBoxes(uanNo, 20)}</div>
              </div>
            </div>

            <div class="full-width-row">
              <div class="full-width-label">Local Reference:-</div>
              <div class="full-width-value">${createCharacterBoxes(localReference, 50)}</div>
            </div>

            <div class="full-width-row">
              <div class="full-width-label">Qualification:-</div>
              <div class="full-width-value" style="min-height: 35px;">${createCharacterBoxes(qualification, 50)}</div>
            </div>

            <div class="full-width-row">
              <div class="full-width-label">Working Experience (if Any):</div>
              <div class="full-width-value" style="min-height: 40px;">${createCharacterBoxes(workingExperience, 80)}</div>
            </div>

            <div class="office-use-section">
              <div class="office-use-title">OFFICE USE ONLY</div>
              <div class="two-column-section">
                <div class="form-row">
                  <div class="form-label">Date Of Joining:</div>
                  <div class="form-value">${createDateBoxes(dateOfJoiningFormatted, 10)}</div>
                </div>
                <div class="form-row">
                  <div class="form-label">Salary:</div>
                  <div class="form-value">${createCharacterBoxes(salary, 10)}</div>
                </div>
              </div>
              <div class="form-row">
                <div class="form-label">Dept./Designation:</div>
                <div class="form-value">${createCharacterBoxes(department ? department + '/' + designation : designation, 30)}</div>
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
    } catch (error) {
      console.error("Error printing application form:", error);
      alert("Error loading employee data for print");
    }
  };

  const handlePrintEmptyApplicationForm = () => {
    // Company details - use defaults or empty
    const companyName = "Latiyal Handicrafts Pvt. Ltd";
    const companyAddress = "Plot No. SPL #1, 2nd Phase, RIICO Industrial Area, Boranada, Jodhpur - 342012. Rajasthan";

    // Create print content with empty character boxes
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Application Form</title>
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
            line-height: 1.5;
            font-size: 13px;
          }
          .form-container {
            padding: 18px;
            border: 2px solid #000;
            box-sizing: border-box;
            min-height: calc(29.7cm - 1.6cm);
          }
          .header {
            margin-bottom: 1px;
            position: relative;
          }
          .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: -20px;
          }
          .header-left {
            flex: 1;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 2px;
          }
          .company-address {
            font-size: 11px;
            line-height: 1.2;
          }
          .photo-box {
            width: 85px;
            height: 100px;
            border: 2px solid #000;
            background-color: #fff;
            flex-shrink: 0;
          }
          .form-title {
            font-size: 20px;
            font-weight: bold;
            text-align: center;
            margin: 6px 0 12px 0;
            text-decoration: underline;
          }
          .form-content {
            margin-bottom: 12px;
          }
          .full-width-row {
            width: 100%;
            margin-bottom: 7px;
          }
          .form-row {
            display: flex;
            margin-bottom: 7px;
            align-items: flex-start;
          }
          .form-label {
            font-size: 12px;
            font-weight: bold;
            min-width: 120px;
            flex-shrink: 0;
          }
          .form-value {
            font-size: 12px;
            flex: 1;
            display: flex;
            flex-wrap: nowrap;
            gap: 2px;
            align-items: center;
            padding: 3px 5px;
            min-height: 23px;
            overflow-x: auto;
          }
          .form-value.address-field {
            flex-wrap: wrap;
            align-content: flex-start;
            min-height: 50px;
            overflow-x: visible;
          }
          .char-box {
            display: inline-block;
            width: 19px;
            height: 21px;
            border: 1px solid #000;
            text-align: center;
            line-height: 21px;
            font-size: 12px;
            margin: 0 1px;
            flex-shrink: 0;
          }
          .char-box:empty {
            background-color: transparent;
          }
          .form-value-empty {
            display: flex;
            flex-wrap: nowrap;
            gap: 2px;
            padding: 3px 5px;
            min-height: 23px;
            flex: 1;
            overflow-x: auto;
          }
          .children-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            margin-bottom: 7px;
          }
          .children-table th,
          .children-table td {
            border: 1px solid #000;
            padding: 5px 6px;
            font-size: 11px;
            text-align: left;
          }
          .children-table th {
            font-weight: bold;
            background-color: #f0f0f0;
          }
          .children-table td:first-child {
            text-align: center;
            width: 45px;
          }
          .caste-options {
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
            margin-left: 120px;
            font-size: 12px;
          }
          .caste-option {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .caste-checkbox {
            display: inline-block;
            width: 19px;
            height: 21px;
            border: 1px solid #000;
            text-align: center;
            line-height: 21px;
            font-size: 12px;
            margin: 0;
            flex-shrink: 0;
            background-color: transparent;
          }
          .section-title {
            font-size: 13px;
            font-weight: bold;
            margin: 10px 0 6px 0;
            text-decoration: underline;
          }
          .full-width-label {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .full-width-value {
            font-size: 12px;
            display: flex;
            flex-wrap: nowrap;
            gap: 2px;
            padding: 3px 5px;
            min-height: 25px;
            overflow-x: auto;
          }
          .full-width-value.address-field {
            flex-wrap: wrap;
            align-content: flex-start;
            min-height: 50px;
            overflow-x: visible;
          }
          .office-use-section {
            margin-top: 15px;
            padding: 12px;
            border: 2px solid #000;
            background-color: #f9f9f9;
          }
          .office-use-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            text-align: center;
          }
          .footer-section {
            display: flex;
            justify-content: space-between;
            margin-top: 25px;
            padding-top: 18px;
          }
          .footer-label {
            font-size: 12px;
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 6px;
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
            <div class="form-row">
              <div class="form-label">Employee Name:-</div>
              <div class="form-value">${createCharacterBoxes("", 30)}</div>
            </div>

            <!-- Row 2: DOB and Blood Group -->
            <div class="two-column-section">
              <div class="form-row">
                <div class="form-label">Date Of Birth:</div>
                <div class="form-value">${createDateBoxes("", 8)}</div>
              </div>
              <div class="form-row">
                <div class="form-label">Blood Group:</div>
                <div class="form-value">${createCharacterBoxes("", 5)}</div>
              </div>
            </div>

            <!-- Row 3: Father Name and Father DOB -->
            <div class="two-column-section">
              <div class="form-row">
                <div class="form-label">Father's Name:-</div>
                <div class="form-value">${createCharacterBoxes("", 20)}</div>
              </div>
              <div class="form-row">
                <div class="form-label">Date Of Birth:</div>
                <div class="form-value">${createDateBoxes("", 8)}</div>
              </div>
            </div>

            <!-- Row 4: Mother Name and Mother DOB -->
            <div class="two-column-section">
              <div class="form-row">
                <div class="form-label">Mother's Name:</div>
                <div class="form-value">${createCharacterBoxes("", 20)}</div>
              </div>
              <div class="form-row">
                <div class="form-label">Date Of Birth:</div>
                <div class="form-value">${createDateBoxes("", 8)}</div>
              </div>
            </div>

            <!-- Row 5: Wife Name and Wife DOB -->
            <div class="two-column-section">
              <div class="form-row">
                <div class="form-label">Wife's Name:</div>
                <div class="form-value">${createCharacterBoxes("", 20)}</div>
              </div>
              <div class="form-row">
                <div class="form-label">Date Of Birth:</div>
                <div class="form-value">${createDateBoxes("", 8)}</div>
              </div>
            </div>

            <!-- Child Details Grid: Sr.No, Name, DOB, Gender -->
            <div style="margin-top: 10px;">
              <div class="form-label" style="margin-bottom: 5px;">Child Details:</div>
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
                      <td><div class="form-value" style="border: none; padding: 0;">${createCharacterBoxes("", 25)}</div></td>
                      <td><div class="form-value" style="border: none; padding: 0;">${createDateBoxes("", 8)}</div></td>
                      <td><div class="form-value" style="border: none; padding: 0;">${createCharacterBoxes("", 1)}</div></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Row 6: Caste and Religion -->
            <div class="two-column-section" style="margin-top: 10px;">
              <div class="form-row">
                <div class="form-label">Caste:</div>
                <div class="caste-options" style="margin-left: 0; flex: 1;">
                  <div class="caste-option">
                    <span class="caste-checkbox"></span><span>SC,</span>
                  </div>
                  <div class="caste-option">
                    <span class="caste-checkbox"></span><span>ST,</span>
                  </div>
                  <div class="caste-option">
                    <span class="caste-checkbox"></span><span>OBC,</span>
                  </div>
                  <div class="caste-option">
                    <span class="caste-checkbox"></span><span>GEN.</span>
                  </div>
                </div>
              </div>
              <div class="form-row">
                <div class="form-label">Religion:</div>
                <div class="form-value">${createCharacterBoxes("", 10)}</div>
              </div>
            </div>

            <!-- Permanent Address -->
            <div class="form-row" style="margin-top: 10px;">
              <div class="form-label">Permanent Address:</div>
              <div class="form-value address-field">${createCharacterBoxes("", 68)}</div>
            </div>
          </div>

          <div class="two-column-section">
            <div class="form-row">
              <div class="form-label">Contact Number:</div>
              <div class="form-value">${createCharacterBoxes("", 12)}</div>
            </div>
            <div class="form-row">
              <div class="form-label">Mobile No.:</div>
              <div class="form-value">${createCharacterBoxes("", 12)}</div>
            </div>
          </div>

          <div class="full-width-row">
            <div class="full-width-label">Local Address:-</div>
            <div class="full-width-value address-field">${createCharacterBoxes("", 35)}</div>
          </div>

          <div class="two-column-section">
            <div class="form-row">
              <div class="form-label">Old ESI No.:</div>
              <div class="form-value">${createCharacterBoxes("", 15)}</div>
            </div>
            <div class="form-row">
              <div class="form-label">UAN No.:</div>
              <div class="form-value">${createCharacterBoxes("", 15)}</div>
            </div>
          </div>

          <div class="full-width-row">
            <div class="full-width-label">Local Reference:-</div>
            <div class="full-width-value">${createCharacterBoxes("", 30)}</div>
          </div>

          <div class="full-width-row">
            <div class="full-width-label">Qualification:-</div>
            <div class="full-width-value" style="min-height: 35px;">${createCharacterBoxes("", 30)}</div>
          </div>

          <div class="full-width-row">
            <div class="full-width-label">Working Experience (if Any):</div>
            <div class="full-width-value" style="min-height: 40px;">${createCharacterBoxes("", 30)}</div>
          </div>

          <div class="office-use-section">
            <div class="office-use-title">OFFICE USE ONLY</div>
            <div class="two-column-section">
              <div class="form-row">
                <div class="form-label">Date Of Joining:</div>
                <div class="form-value">${createDateBoxes("", 8)}</div>
              </div>
              <div class="form-row">
                <div class="form-label">Salary:</div>
                <div class="form-value">${createCharacterBoxes("", 10)}</div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-label">Dept./Designation:</div>
              <div class="form-value">${createCharacterBoxes("", 25)}</div>
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
      printWindow.document.write(`
        <script>
          // Helper function to create character boxes
          function createCharacterBoxes(text, maxBoxes) {
            const chars = (text || "").split("");
            const boxes = Array.from({ length: maxBoxes }, (_, i) => chars[i] || "");
            return boxes.map((char, idx) => 
              '<span class="char-box">' + char + '</span>'
            ).join("");
          }
          
          // Helper function to create date boxes
          function createDateBoxes(dateStr, maxBoxes) {
            if (!dateStr) {
              return Array.from({ length: maxBoxes }, () => '<span class="char-box"></span>').join("");
            }
            const chars = dateStr.split("");
            const boxes = Array.from({ length: maxBoxes }, (_, i) => chars[i] || "");
            return boxes.map((char) => 
              '<span class="char-box">' + char + '</span>'
            ).join("");
          }
        </script>
      `);
      printWindow.document.close();
      // Wait for content to load, then trigger print
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 250);
    }
  };

  const filteredData = (Array.isArray(gridData) ? gridData : []).filter((item: any) => {
    const searchText = filterText.toLowerCase();
    return (
      (item.Name && item.Name.toLowerCase().includes(searchText)) ||
      (item.MachineEnrollmentNo && item.MachineEnrollmentNo.toLowerCase().includes(searchText)) ||
      (item.MobileNo && item.MobileNo.toLowerCase().includes(searchText)) ||
      (item.WorkingStatus && item.WorkingStatus.toLowerCase().includes(searchText))
    );
  });

  return (
    <>
      <Breadcrumbs mainTitle="Employee Master List" parent="Masters" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon
                title="Employee Master List"
                tagClass="card-title mb-0"
              />
              <CardBody>
                <Row className="mb-3">
                  <Col md="6">
                    <div className="dataTables_filter d-flex align-items-center">
                      <Label className="me-2">Search:</Label>
                      <Input
                        type="search"
                        placeholder="Search by name, enrollment no., mobile, or status..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                      />
                    </div>
                  </Col>
                  <Col md="6" className="text-end">
                    <Btn
                      color="info"
                      className="me-2"
                      onClick={handlePrintEmptyApplicationForm}
                    >
                      <i className="fa fa-print me-2"></i>Application Form
                    </Btn>
                    <Btn
                      color="primary"
                      onClick={handleAdd}
                    >
                      <i className="fa fa-plus me-2"></i>Add New Employee
                    </Btn>
                  </Col>
                </Row>
                {loading ? (
                  <div className="text-center p-4">
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
                          <th>Name</th>
                          <th>Machine Enrollment No.</th>
                          <th>Mobile No.</th>
                          <th>Date of Joining</th>
                          <th>Working Status</th>
                          <th>Gender</th>
                          <th style={{ width: "200px", textAlign: "center" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center p-4">
                              No data found
                            </td>
                          </tr>
                        ) : (
                          filteredData.map((item: any, index: number) => (
                            <tr key={item.Id || index}>
                              <td>{index + 1}</td>
                              <td>{item.Name || "-"}</td>
                              <td>{item.MachineEnrollmentNo || "-"}</td>
                              <td>{item.MobileNo || "-"}</td>
                              <td>{formatDate(item.DateOfJoining)}</td>
                              <td>
                                <span
                                  className={`badge ${
                                    item.WorkingStatus === "Active"
                                      ? "bg-success"
                                      : item.WorkingStatus === "Inactive"
                                      ? "bg-secondary"
                                      : item.WorkingStatus === "On Leave"
                                      ? "bg-warning"
                                      : item.WorkingStatus === "Terminated"
                                      ? "bg-danger"
                                      : "bg-info"
                                  }`}
                                >
                                  {item.WorkingStatus || "-"}
                                </span>
                              </td>
                              <td>{item.Gender || "-"}</td>
                              <td style={{ width: "200px", whiteSpace: "nowrap" }}>
                                <Btn
                                  color="primary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleEdit(item.Id)}
                                >
                                  <i className="fa fa-edit"></i>
                                </Btn>
                                <Btn
                                  color="danger"
                                  size="sm"
                                  onClick={() => handleDelete(item.Id)}
                                >
                                  <i className="fa fa-trash"></i>
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
    </>
  );
};

export default PageList_EmployeeMasterContainer;

