import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Row, Table, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_DisplayData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { formatDateForDisplay } from "../../utils/dateFormatUtils";

const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/EmployeeMaster/Id";

const EmployeeReportContainer = () => {
  const [state, setState] = useState({
    formData: {} as any,
    isProgress: true,
    printModalOpen: false,
  });

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const employeeId = (location.state && (location.state as any).EmployeeId) || 0;

    if (employeeId > 0) {
      Fn_DisplayData(dispatch, setState, employeeId, API_URL_EDIT);
      // Set a timeout to stop loading after 10 seconds if no response
      const timeoutId = setTimeout(() => {
        setState((prevState) => ({
          ...prevState,
          isProgress: false,
        }));
      }, 10000);

      return () => clearTimeout(timeoutId);
    } else {
      setState((prevState) => ({
        ...prevState,
        isProgress: false,
      }));
    }
  }, [dispatch, location.state, navigate]);

  // Set isProgress to false when formData is loaded
  useEffect(() => {
    if (state.formData && Object.keys(state.formData).length > 0 && state.isProgress) {
      setState((prevState) => ({
        ...prevState,
        isProgress: false,
      }));
    }
  }, [state.formData, state.isProgress]);

  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString) || "-";
  };

  const togglePrintModal = () => {
    setState((prevState) => ({
      ...prevState,
      printModalOpen: !prevState.printModalOpen,
    }));
  };

  const handlePrintOption = (printType: string) => {
    togglePrintModal();
    
    if (printType === "all") {
      printAllForms();
    } else if (printType === "pfDeclaration") {
      printPFDeclaration();
    } else if (printType === "form18") {
      printFormNo18();
    } else if (printType === "appointment") {
      printAppointmentLetter();
    } else if (printType === "application") {
      printApplicationForm();
    } else if (printType === "declaration") {
      printDeclarationForm();
    }
    // Other print types will be implemented later
  };

  const printAllForms = () => {
    // Print all forms sequentially with delays to ensure proper printing
    printPFDeclaration();
    setTimeout(() => {
      printFormNo18();
    }, 500);
    setTimeout(() => {
      printAppointmentLetter();
    }, 1000);
    setTimeout(() => {
      printApplicationForm();
    }, 1500);
    setTimeout(() => {
      printDeclarationForm();
    }, 2000);
  };

  const printPFDeclaration = () => {
    const employeeData = state.formData;
    
    // Get current date in DD.MM.YYYY format
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    const formattedDate = `${day}.${month}.${year}`;

    // Extract data with fallbacks
    const name = employeeData?.Name || "";
    const fatherName = employeeData?.FatherName || "";
    const companyName = employeeData?.CompanyName || ""; // Company name from employee data
    const location = employeeData?.Region || employeeData?.Address?.split(',')[0] || "जोधपुर";
    const employeeCode = employeeData?.EmployeeCode || "";
    const designation = employeeData?.DesignationName || employeeData?.Designation || "";
    const salary = employeeData?.SalaryAmount || "15000";
    
    // Format company name part - if companyName exists, show "संस्था {companyName}", otherwise just "संस्था"
    const companyText = companyName ? `संस्था <strong>${companyName}</strong>` : "संस्था";

    // Create print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>PF Declaration</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          @page {
            size: A4;
            margin: 2cm;
          }
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          .declaration-container {
            border: 2px solid #000;
            padding: 40px;
            min-height: 600px;
          }
          .title {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 40px;
          }
          .declaration-text {
            font-size: 16px;
            line-height: 1.8;
            text-align: justify;
            margin-bottom: 60px;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            margin-top: 80px;
          }
          .footer-left, .footer-right {
            width: 45%;
          }
          .footer-label {
            font-weight: bold;
            margin-bottom: 40px;
          }
          .button-container {
            text-align: center;
            margin: 20px 0;
          }
          .print-btn {
            padding: 10px 30px;
            font-size: 16px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          .print-btn:hover {
            background-color: #0056b3;
          }
        </style>
      </head>
      <body>
        <div class="button-container no-print">
          <button class="print-btn" onclick="window.print()">Print</button>
          <button class="print-btn" onclick="window.close()" style="background-color: #6c757d; margin-left: 10px;">Close</button>
        </div>
        <div class="declaration-container">
          <div class="title">घोषणा</div>
          <div class="declaration-text">
            मैं <strong>${name}</strong> पुत्र श्री <strong>${fatherName}</strong> ${companyText} ${location}, जोधपुर कोड नं. <strong>${employeeCode}</strong> में <strong>${designation}</strong> के पद पर कार्य करता हूँ, मेरा वेतन नियुक्ति तिथि से रु. <strong>${salary}/-</strong> से अधिक रहा है तथा मैं पूर्व में कभी कर्मचारी भविष्य निधि का सदस्य नहीं रहा हूँ।
          </div>
          <div class="footer">
            <div class="footer-left">
              <div class="footer-label">प्रमाणितकर्त्ता</div>
              <div>दिनांक : ${formattedDate}</div>
            </div>
            <div class="footer-right" style="text-align: right;">
              <div class="footer-label">घोषणाकर्त्ता के हस्ताक्षर</div>
            </div>
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

  const printFormNo18 = () => {
    const employeeData = state.formData;
    
    // Extract employee data
    const employeeName = employeeData?.Name || "";
    const fatherName = employeeData?.FatherName || "";
    const gender = employeeData?.Gender || "";
    const employeeAddress = employeeData?.Address || employeeData?.LocalAddress || "";
    const employeeCode = employeeData?.EmployeeCode || "";
    
    // Determine S/D/W/o based on gender and status
    let relationPrefix = "";
    if (gender === "F" || gender === "Female") {
      const status = employeeData?.Status || "";
      if (status === "Married") {
        relationPrefix = "W/o"; // Wife of
      } else {
        relationPrefix = "D/o"; // Daughter of
      }
    } else {
      relationPrefix = "S/o"; // Son of
    }
    
    // Company details - can be fetched from company master or use defaults
    const companyName = employeeData?.CompanyName || "LATIYAL HANDICRAFTS PVT LTD";
    const companyAddress = employeeData?.CompanyAddress || "Plot No. SPL #1, 2nd Phase,\nRIICO Industrial Area, Boranada,\nJodhpur - 342012. Rajasthan";
    
    // Beneficiary details (using father as beneficiary, relationship as FATHER)
    const beneficiaryName = fatherName;
    const beneficiaryRelationship = "FATHER";
    const beneficiaryAddress = employeeAddress || "N/A";

    // Create print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Form No. 18</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 1.2cm;
          }
          body {
            font-family: Arial, sans-serif;
            padding: 10px;
            max-width: 900px;
            margin: 0 auto;
            line-height: 1.5;
          }
          .form-container {
            padding: 20px;
            border: 2px solid #000;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          @media print {
            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body { 
              margin: 0;
              padding: 0;
              width: 100%;
            }
            .no-print { 
              display: none !important; 
            }
            body > div:last-child {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: avoid !important;
            }
            .form-container {
              padding: 20px;
              border: 2px solid #000;
              box-sizing: border-box;
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
              break-inside: avoid !important;
              overflow: visible;
              position: relative;
              width: 100%;
              max-width: 100%;
            }
            @page {
              margin: 1.2cm;
            }
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
          }
          @media print {
            .header {
              margin-bottom: 10px;
            }
          }
          .title {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 3px;
          }
          @media print {
            .title {
              font-size: 20px;
              margin-bottom: 2px;
            }
          }
          .subtitle {
            font-size: 14px;
            font-weight: normal;
          }
          @media print {
            .subtitle {
              font-size: 12px;
            }
          }
          .factory-section {
            margin-bottom: 15px;
          }
          @media print {
            .factory-section {
              margin-bottom: 10px;
            }
          }
          .factory-label {
            font-weight: bold;
            margin-bottom: 8px;
          }
          @media print {
            .factory-label {
              margin-bottom: 5px;
              font-size: 13px;
            }
          }
          .factory-box {
            border: 2px solid #000;
            padding: 10px;
            min-height: 70px;
            white-space: pre-line;
            font-size: 14px;
          }
          @media print {
            .factory-box {
              min-height: 50px;
              padding: 8px;
              font-size: 12px;
            }
          }
          .declaration-text {
            margin: 15px 0;
            text-align: justify;
            font-size: 14px;
            line-height: 1.5;
            page-break-inside: avoid;
          }
          @media print {
            .declaration-text {
              margin: 10px 0;
              line-height: 1.3;
              font-size: 13px;
            }
          }
          .footer {
            display: flex;
            justify-content: space-between;
            margin-top: auto;
            padding-top: 20px;
            font-size: 14px;
            page-break-inside: avoid;
          }
          @media print {
            .footer {
              padding-top: 15px;
              margin-top: 15px;
              font-size: 13px;
            }
          }
          .footer-left, .footer-right {
            width: 45%;
          }
          .footer-label {
            margin-bottom: 15px;
          }
          @media print {
            .footer-label {
              margin-bottom: 10px;
              font-size: 13px;
            }
          }
          .code-placeholder {
            border-bottom: 1px solid #000;
            display: inline-block;
            min-width: 200px;
            padding-bottom: 5px;
          }
          .signature-space {
            border-top: 1px solid #000;
            display: inline-block;
            min-width: 200px;
            padding-top: 5px;
            margin-top: 40px;
          }
          .button-container {
            text-align: center;
            margin: 20px 0;
          }
          .print-btn {
            padding: 10px 30px;
            font-size: 16px;
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
        </style>
      </head>
      <body>
        <div class="button-container no-print">
          <button class="print-btn" onclick="window.print()">Print</button>
          <button class="print-btn close-btn" onclick="window.close()">Close</button>
        </div>
        <div style="page-break-inside: avoid; break-inside: avoid;">
          <div class="form-container">
          <div class="header">
            <div class="title">Form No. 18</div>
            <div class="subtitle">(Prescribed under Rule 98)</div>
          </div>
          
          <div class="factory-section">
            <div class="factory-label">Name of Factory/Establishment:</div>
            <div class="factory-box">${companyName}
${companyAddress}</div>
          </div>
          
          <div class="declaration-text">
            I <strong>${employeeName}</strong> ${relationPrefix} Sh. <strong>${beneficiaryName}</strong> hereby declare that in the event of my death before resuming work, the balance of my pay Due for the period of Leave with wages not availed of, be paid to <strong>${beneficiaryName}</strong> who is my <strong>${beneficiaryRelationship}</strong> and residence at <strong>${beneficiaryAddress}</strong>.
          </div>
          
          <div class="footer">
            <div class="footer-left">
              <div class="footer-label">Code No. <span class="code-placeholder">${employeeCode }</span></div>
            </div>
            <div class="footer-right" style="text-align: right;">
              <div class="footer-label">Sign. of the worker</div>
            </div>
          </div>
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

  const printAppointmentLetter = () => {
    const employeeData = state.formData;
    
    // Get current date in DD.MM.YYYY format
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    const formattedDate = `${day}.${month}.${year}`;

    // Extract employee data
    const employeeName = employeeData?.Name || "";
    const fatherName = employeeData?.FatherName || "";
    const designation = employeeData?.DesignationName || employeeData?.Designation || "OPERATOR";
    const salary = employeeData?.SalaryAmount || "27000";
    
    // Convert salary to words (simple conversion for common amounts)
    const salaryInWords = employeeData?.SalaryInWords || getSalaryInWords(salary);
    
    // Company details
    const companyName = employeeData?.CompanyName || "Latiyal Handicrafts Pvt. Ltd.";
    const companyAddress = employeeData?.CompanyAddress || "Plot No. SPL #1, 2nd Phase,\nRIICO Industrial Area, Boranada,\nJodhpur - 342012. Rajasthan";
    const gstNo = employeeData?.GSTNo || "08AABCL0833A1Z5";
    const cinNo = employeeData?.CINNo || "U74994RJ2005PTC020855";
    
    // Get joining date
    const joiningDate = formatDateForDisplay(employeeData?.DateOfJoining) || formattedDate;
    const joiningDateFormatted = joiningDate.split('-').reverse().join('.'); // Convert DD-MM-YYYY to DD.MM.YYYY

    // Create print content with two pages
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Appointment Letter</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 1.2cm;
          }
          @media print {
            body { 
              margin: 0;
              padding: 0;
            }
            .no-print { 
              display: none !important; 
            }
            .page {
              page-break-after: always;
              page-break-inside: avoid;
            }
            .page:last-child {
              page-break-after: auto;
            }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 10px;
            max-width: 900px;
            margin: 0 auto;
            line-height: 1.6;
          }
          .page {
            padding: 20px;
            border: 2px solid #000;
            box-sizing: border-box;
            min-height: calc(29.7cm - 2.4cm);
            margin-bottom: 20px;
          }
          @media print {
            .page {
              margin-bottom: 0;
            }
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
          }
          .company-info {
            flex: 1;
          }
          .company-logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .company-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .company-address {
            font-size: 12px;
            line-height: 1.4;
            white-space: pre-line;
          }
          .date-section {
            text-align: right;
            font-size: 14px;
          }
          .title {
            text-align: center;
            font-size: 22px;
            font-weight: bold;
            margin: 20px 0;
          }
          .employee-details {
            margin-bottom: 20px;
          }
          .employee-details div {
            margin-bottom: 5px;
            font-size: 14px;
          }
          .main-body {
            text-align: justify;
            font-size: 14px;
            line-height: 1.8;
            margin-bottom: 20px;
          }
          .terms-list {
            margin: 20px 0;
          }
          .terms-list ol {
            padding-left: 25px;
            margin: 0;
          }
          .terms-list li {
            margin-bottom: 12px;
            text-align: justify;
            font-size: 14px;
            line-height: 1.6;
          }
          .closing-statements {
            margin-top: 20px;
            font-size: 14px;
            line-height: 1.6;
          }
          .closing-statements p {
            margin-bottom: 10px;
          }
          .footer {
            margin-top: 2 0px;
            text-align: center;
            font-size: 12px;
          }
          .footer-company {
            font-weight: bold;
            margin-bottom: 2px;
          }
          .footer-address {
            font-size: 11px;
            margin-bottom: 2px;
          }
          .footer-numbers {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin-top: 10px;
          }
          .facilities-title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0;
          }
          .facilities-list {
            margin: 20px 0;
          }
          .facilities-list ol {
            padding-left: 25px;
            margin: 0;
          }
          .facilities-list li {
            margin-bottom: 12px;
            text-align: justify;
            font-size: 14px;
            line-height: 1.6;
          }
          .facilities-list li strong {
            display: block;
            margin-bottom: 3px;
          }
          .signature-section {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
          }
          .signature-item {
            font-size: 14px;
          }
          .place-section {
            margin-top: 20px;
            font-size: 14px;
          }
          .button-container {
            text-align: center;
            margin: 20px 0;
          }
          .print-btn {
            padding: 10px 30px;
            font-size: 16px;
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
        </style>
      </head>
      <body>
        <div class="button-container no-print">
          <button class="print-btn" onclick="window.print()">Print</button>
          <button class="print-btn close-btn" onclick="window.close()">Close</button>
        </div>

        <!-- Page 1: Appointment Letter -->
        <div class="page">
          <div class="header">
            <div class="company-info">
              <div class="company-logo">LH</div>
              <div class="company-name">${companyName}</div>
              <div class="company-address">${companyAddress}</div>
            </div>
            <div class="date-section">
              दिनांक :- ${formattedDate}
            </div>
          </div>

          <div class="title">
            परीवीक्षाधीन/स्थायी - नियुक्ति पत्र
          </div>

          <div class="employee-details">
            <div>कर्मचारी का नाम :- <strong>${employeeName}</strong></div>
            <div>पिता का नाम:- <strong>${fatherName}</strong></div>
          </div>

          <div class="main-body">
            <p>आपके आवेदन एवं साक्षात्कार के पश्चात हमें आपको सूचित करते हुए खुशी है कि आप का चयन <strong>${designation}</strong> पद के लिए किया जाता है, आपकी नियुक्ति निम्न शर्तों के अधीन रहेगी।</p>
          </div>

          <div class="terms-list">
            <ol>
              <li>आपको ${designation} के पद पर प्रथमतः 6 माह की परीवीक्षाकाल अवधि के लिए नियोजित किया जा रहा है, इसमें नियोजकों द्वारा अधिकतम 6 माह की अवधि के लिए वृद्वि की जा सकेगी एवं आपका यह नियोजन दिनांक ${joiningDateFormatted} से प्रभावशील होगा।</li>
              <li>इस परीवीक्षाकाल की मूल अथवा वृद्धिकृत अवधि में कभी भी आप सेवा मुक्त हो सकते हैं।</li>
              <li>इस परीवीक्षाकाल की अवधि में परिवर्तन होने पर आपको लिखित में सूचित किया जायेगा।</li>
              <li>इस परीवीक्षाकाल की मूल अथवा वृद्धिकृत अवधि समाप्त होने के पश्चात स्वतः ही स्थायी नियुक्ति मान ली जायेगी।</li>
              <li>आपका सर्वसम्मिलित मासिक वेतन ${salary} रु. अक्षरे <strong>${salaryInWords}</strong> मात्र होगा।</li>
              <li>आपको अपनी सेवा के दौरान कंपनी द्वारा बनाए गए सभी नियमों की पालना करनी होगी।</li>
              <li>कारखाना अधिनियम के प्रावधानों के अनुसार आप समस्त अवकाशों इत्यादि सुविधाओं के हकदार होंगे।</li>
              <li>आपको अपने कार्यभार के अतिरिक्त अपने वरिष्ठ अधिकारी द्वारा समय समय पर जारी किये गये समस्त आदेशों, अनुदेशों तथा निर्देशों की पालना करनी होगी।</li>
              <li>सेवा छोड़ने से एक माह पूर्व आपको लिखित में सूचना देनी होगी अथवा एक माह का कुल वेतन जमा करवाना होगा।</li>
              <li>सेवा छोड़ने के समय आपके पास कंपनी की जो भी धरोहर/सम्पति होगी उसे लौटाना होगा।</li>
              <li>कार्य के दौरान यदि आपको कहीं पर बाहर जाना पड़े तो आपको कम्पनी कार्य हेतू गेट पास लेना होगा।</li>
              <li>निजी कार्य के लिए बाहर जाने पर आपको निजी कार्य हेतू गेट पास लेना पड़ेगा जिसमें आने जाने के समयानुसार कटौती की जायेगी।</li>
            </ol>
          </div>

          <div class="closing-statements">
            <p>आप से अनुरोध है कि दिनांक ${joiningDateFormatted} को कार्यभार संभालने हेतु प्रस्तुत होवें अन्यथा यह मान लिया जायेगा कि आप हमारे संस्थान में कार्य करने के इच्छुक नही है।</p>
            <p>इस मूल पत्र की प्रतिलिपि पर हस्ताक्षर कर इसे मानव संसाधन प्रबंधक (एच. आर.) को देवें जिससे इससे बात की पुष्टि होगी कि आपकों कम्पनी के समस्त नियम व शर्ते मंजूर है।</p>
          </div>

          <div class="footer">
            <div class="footer-company">${companyName}</div>
            <div class="footer-address">Regd. Office & Operations: ${companyAddress.replace(/\n/g, ', ')}</div>
            <div class="footer-numbers">
              <div>GST NO. ${gstNo}</div>
              <div>CIN: CIN NO. ${cinNo}</div>
            </div>
          </div>
        </div>

        <!-- Page 2: Facilities -->
        <div class="page">
          <div class="header">
            <div class="company-info">
              <div class="company-logo">LH</div>
              <div class="company-name">${companyName}</div>
              <div class="company-address">${companyAddress}</div>
            </div>
          </div>

          <div class="facilities-title">
            नियमानुसार आप कम्पनी द्वारा निम्नलिखित सुविधाओं के हकदार होंगे
          </div>

          <div class="facilities-list">
            <ol>
              <li>ई. एस. आई व भविष्य निधि के अन्तर्गत आने वाले कर्मचारी इन दोनों सुविधाओं के हकदार होंगे।</li>
              <li>ई. एस. आई के अन्तर्गत कर्मचारी का हिस्सा कुल वेतन का 0.75 प्रतिशत तथा कम्पनी द्वारा 3.25 प्रतिशत देय होंगे।</li>
              <li>भविष्य निधि योजना के अन्तर्गत कर्मचारी के द्वारा अपने बेसिक वेतन का 12 प्रतिशत भाग देय होगा ठीक उसी प्रकार कम्पनी द्वारा भी वेतन का 12 प्रतिशत भाग भविष्य निधि में जमा करवाया जायेगा।</li>
              <li>कम्पनी द्वारा वर्ष में 15 छुट्टिया (अर्न लीव) दी जायेगी जो कि आपकी उपस्थिति पर निर्भर करेगी।</li>
              <li>कम्पनी द्वारा आप बोनस के हकदार होंगे।</li>
              <li>साप्ताहिक अवकाश कम्पनी द्वारा देय होगा।</li>
              <li>प्रतिवर्ष कम्पनी द्वारा वेतन वृद्धि की जायेगी।</li>
              <li>कम्पनी आपके निजी हितों को ध्यान में रखते हुए आपको सभी प्रकार के सुरक्षा साधन उपलब्ध करवायेगी।</li>
              <li>कम्पनी में राष्ट्रीय अवकाश व त्यौहारों पर छुटटी रहेगी।</li>
              <li>कम्पनी द्वारा आपके कार्य की प्रकृति को ध्यान में रखते हुए संचार साधन (मोबाईल फोन) उपलब्ध करवायेगी।</li>
              <li>कम्पनी द्वारा आपको दिन में दो बार चाय, कॉफी इत्यादि की सुविधा दी जायेगी।</li>
              <li>कम्पनी परिसर में ही डिस्पेंसरी की व्यवस्था की गयी है।</li>
              <li>कम्पनी द्वारा तय किये गये निश्चित घण्टों का ओवर टाईम देय होगा।</li>
              <li>कम्पनी में शिकायत समिति की व्यवस्था की गई है जिसमें आप अपनी शिकायतों व सुझावों को प्रस्तुत कर सकते है।</li>
              <li>आवश्यक होने पर कम्पनी द्वारा आपके स्वास्थ्य को ध्यान में रखते हुए समय समय पर आपका स्वास्थ्य परीक्षण करवाया जायेगा।</li>
            </ol>
          </div>

          <div class="signature-section">
            <div class="signature-item">दिनांक :- ${formattedDate}</div>
            <div class="signature-item">ह. कर्मचारी</div>
            <div class="signature-item">अधिकृत ह.</div>
          </div>

          <div class="place-section">
            स्थान :- जोधपुर
          </div>

          <div class="footer" style="margin-top: 50px;">
            <div class="footer-company">${companyName}</div>
            <div class="footer-address">Regd. Office & Operations: ${companyAddress.replace(/\n/g, ', ')}</div>
            <div class="footer-numbers">
              <div>GST NO. ${gstNo}</div>
              <div>CIN: CIN NO. ${cinNo}</div>
            </div>
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

  const printApplicationForm = () => {
    const employeeData = state.formData;
    
    // Extract employee data
    const employeeName = employeeData?.Name || "";
    const dateOfBirth = formatDateForDisplay(employeeData?.DateOfBirth) || "";
    const dateOfBirthFormatted = dateOfBirth ? dateOfBirth.split('-').reverse().join('.') : "";
    const fatherName = employeeData?.FatherName || "";
    const fatherDOB = formatDateForDisplay(employeeData?.FatherDateOfBirth || employeeData?.FathersDateOfBirth || "") || "";
    const fatherDOBFormatted = fatherDOB ? fatherDOB.split('-').reverse().join('.') : "";
    const motherName = employeeData?.MotherName || employeeData?.MothersName || "";
    const motherDOB = formatDateForDisplay(employeeData?.MotherDateOfBirth || employeeData?.MothersDateOfBirth || "") || "";
    const motherDOBFormatted = motherDOB ? motherDOB.split('-').reverse().join('.') : "";
    const wifeName = employeeData?.WifeName || employeeData?.WifesName || "";
    const wifeDOB = formatDateForDisplay(employeeData?.WifeDateOfBirth || employeeData?.WifesDateOfBirth || "") || "";
    const wifeDOBFormatted = wifeDOB ? wifeDOB.split('-').reverse().join('.') : "";
    const gender = employeeData?.Gender || "";
    const bloodGroup = employeeData?.BloodGroup || "";
    const religion = employeeData?.Religion || "";
    const caste = employeeData?.Caste || "";
    const permanentAddress = employeeData?.Address || "";
    const localAddress = employeeData?.LocalAddress || "";
    const contactNumber = employeeData?.MobileNo || "";
    const mobileNo = employeeData?.MobileNo || "";
    const oldESINo = employeeData?.OldESINo || employeeData?.EmployeeESICNo || "";
    const uanNo = employeeData?.UANNo || "";
    const localReference = employeeData?.LocalReference || "";
    const qualification = employeeData?.Qualification || "";
    const workingExperience = employeeData?.WorkingExperience || "";
    const dateOfJoining = formatDateForDisplay(employeeData?.DateOfJoining) || "";
    const dateOfJoiningFormatted = dateOfJoining ? dateOfJoining.split('-').reverse().join('.') : "";
    const department = employeeData?.DepartmentName || employeeData?.Department || "";
    const designation = employeeData?.DesignationName || employeeData?.Designation || "";
    const salary = employeeData?.SalaryAmount || "";
    
    // Get children data if available
    const children = employeeData?.Children || [];
    
    // Company details
    const companyName = employeeData?.CompanyName || "Latiyal Handicrafts Pvt. Ltd";
    const companyAddress = employeeData?.CompanyAddress || "Plot No. SPL #1, 2nd Phase, RIICO Industrial Area, Boranada, Jodhpur - 342012. Rajasthan";

    // Create print content
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
            border-bottom: 1px solid #000;
            padding: 2px 4px;
            min-height: 16px;
          }
          .form-value-empty {
            border-bottom: 1px solid #000;
            min-height: 16px;
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
            border-bottom: 1px solid #000;
            padding: 2px 4px;
            min-height: 18px;
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
              <div class="form-value" style="display: inline-block; width: calc(100% - 130px);">${employeeName}</div>
            </div>

            <!-- Row 2: DOB and Blood Group -->
            <div class="two-column-section">
              <div class="form-row">
                <div class="form-label">Date Of Birth:</div>
                <div class="form-value">${dateOfBirthFormatted}</div>
              </div>
              <div class="form-row">
                <div class="form-label">Blood Group:</div>
                <div class="form-value">${bloodGroup}</div>
              </div>
            </div>

            <!-- Row 3: Father Name and Father DOB -->
            <div class="two-column-section">
              <div class="form-row">
                <div class="form-label">Father's Name:-</div>
                <div class="form-value">${fatherName}</div>
              </div>
              <div class="form-row">
                <div class="form-label">Date Of Birth:</div>
                <div class="form-value">${fatherDOBFormatted}</div>
              </div>
            </div>

            <!-- Row 4: Mother Name and Mother DOB -->
            <div class="two-column-section">
              <div class="form-row">
                <div class="form-label">Mother's Name:</div>
                <div class="form-value">${motherName}</div>
              </div>
              <div class="form-row">
                <div class="form-label">Date Of Birth:</div>
                <div class="form-value">${motherDOBFormatted}</div>
              </div>
            </div>

            <!-- Row 5: Wife Name and Wife DOB -->
            <div class="two-column-section">
              <div class="form-row">
                <div class="form-label">Wife's Name:</div>
                <div class="form-value">${wifeName}</div>
              </div>
              <div class="form-row">
                <div class="form-label">Date Of Birth:</div>
                <div class="form-value">${wifeDOBFormatted}</div>
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
                        <td>${child.Name || ""}</td>
                        <td>${childDOB}</td>
                        <td>${child.Gender || ""}</td>
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
                <div class="form-value">${religion}</div>
              </div>
            </div>

            <!-- Permanent Address -->
            <div class="form-row" style="margin-top: 8px;">
              <div class="form-label">Permanent Address:</div>
              <div class="form-value">${permanentAddress}</div>
            </div>
          </div>

          <div class="two-column-section">
            <div class="form-row">
              <div class="form-label">Contact Number:</div>
              <div class="form-value">${contactNumber}</div>
            </div>
            <div class="form-row">
              <div class="form-label">Mobile No.:</div>
              <div class="form-value">${mobileNo}</div>
            </div>
          </div>

          <div class="full-width-row">
            <div class="full-width-label">Local Address:-</div>
            <div class="full-width-value">${localAddress}</div>
          </div>

          <div class="two-column-section">
            <div class="form-row">
              <div class="form-label">Old ESI No.:</div>
              <div class="form-value">${oldESINo}</div>
            </div>
            <div class="form-row">
              <div class="form-label">UAN No.:</div>
              <div class="form-value">${uanNo}</div>
            </div>
          </div>

          <div class="full-width-row">
            <div class="full-width-label">Local Reference:-</div>
            <div class="full-width-value">${localReference}</div>
          </div>

          <div class="full-width-row">
            <div class="full-width-label">Qualification:-</div>
            <div class="full-width-value" style="min-height: 35px;">${qualification}</div>
          </div>

          <div class="full-width-row">
            <div class="full-width-label">Working Experience (if Any):</div>
            <div class="full-width-value" style="min-height: 40px;">${workingExperience}</div>
          </div>

          <div class="office-use-section">
            <div class="office-use-title">OFFICE USE ONLY</div>
            <div class="two-column-section">
              <div class="form-row">
                <div class="form-label">Date Of Joining:</div>
                <div class="form-value">${dateOfJoiningFormatted}</div>
              </div>
              <div class="form-row">
                <div class="form-label">Salary:</div>
                <div class="form-value">${salary}</div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-label">Dept./Designation:</div>
              <div class="form-value">${department ? department + '/' : ''}${designation}</div>
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

  const printDeclarationForm = () => {
    const employeeData = state.formData;
    
    // Extract employee data
    const employeeName = employeeData?.Name || "";
    const dateOfBirth = formatDateForDisplay(employeeData?.DateOfBirth) || "";
    const dateOfBirthFormatted = dateOfBirth ? dateOfBirth.split('-').reverse().join('.') : "";
    const dateOfJoining = formatDateForDisplay(employeeData?.DateOfJoining) || "";
    const dateOfJoiningFormatted = dateOfJoining ? dateOfJoining.split('-').reverse().join('.') : "";
    const fatherName = employeeData?.FatherName || "";
    const gender = employeeData?.Gender || "";
    const status = employeeData?.Status || "";
    const aadharNumber = employeeData?.AadharNumber || "";
    const bankACNo = employeeData?.BankACNo || "";
    const mobileNo = employeeData?.MobileNo || "";
    const panNumber = employeeData?.PANNumber || "";
    const ifscCode = employeeData?.IFCSCode || "";
    const permanentAddress = employeeData?.Address || "";
    const temporaryAddress = employeeData?.LocalAddress || "";
    const employeeESINo = employeeData?.EmployeeESICNo || employeeData?.EmployeeESINo || "";
    const employeeUANNo = employeeData?.UANNo || "";
    const employeePFNo = employeeData?.EmployeePFNo || "";
    const esiDispESINo = employeeData?.ESICIPNo || "";
    
    // Company details
    const companyName = employeeData?.CompanyName || "LATIYAL HANDICRAFTS PVT LTD";
    const companyAddress = employeeData?.CompanyAddress || "Plot No. SPL #1, 2nd Phase, RIICO Industrial Area, Boranada, Jodhpur - 342012. Rajasthan";
    const employerPFNo = employeeData?.EmployerPFNo || employeeData?.CompanyPFNo || "RJJOD0017602000";
    const employerESINo = employeeData?.EmployerESINo || employeeData?.CompanyESINo || "27000250830000901";
    
    // Family Members
    const familyMembers = employeeData?.FamilyMembers || [];
    
    // Nominees
    const nominees = employeeData?.Nominees || [];

    // Create print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Declaration Form</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 1cm;
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
            font-size: 11px;
          }
          .form-container {
            padding: 15px;
            border: 2px solid #000;
            box-sizing: border-box;
          }
          .header-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
          }
          .logo-left, .logo-right {
            width: 80px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .logo-left img, .logo-right img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
          .title-section {
            flex: 1;
            text-align: center;
            margin: 0 15px;
          }
          .main-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
            text-decoration: underline;
          }
          .subtitle {
            font-size: 11px;
            font-weight: bold;
          }
          .top-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            gap: 20px;
          }
          .employee-status {
            flex: 1;
          }
          .status-label {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .checkbox-group {
            display: flex;
            gap: 15px;
            margin-bottom: 10px;
          }
          .checkbox-item {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 11px;
          }
          .checkbox {
            width: 15px;
            height: 15px;
            border: 2px solid #000;
            display: inline-block;
          }
          .status-fields {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }
          .status-field {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .status-field-label {
            font-size: 11px;
            font-weight: bold;
            min-width: 140px;
          }
          .status-field-value {
            flex: 1;
            border-bottom: 1px solid #000;
            padding: 2px 5px;
            min-height: 16px;
            font-size: 11px;
          }
          .company-details {
            flex: 1;
            border: 1px solid #000;
            padding: 10px;
          }
          .company-details-title {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          .company-name {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .company-address {
            font-size: 10px;
            line-height: 1.3;
            margin-bottom: 8px;
            white-space: pre-line;
          }
          .company-field {
            display: flex;
            gap: 8px;
            margin-bottom: 5px;
            font-size: 11px;
          }
          .company-field-label {
            font-weight: bold;
            min-width: 120px;
          }
          .company-field-value {
            flex: 1;
            border-bottom: 1px solid #000;
            padding: 2px 5px;
            min-height: 16px;
          }
          .personal-details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          .personal-details-table td {
            border: 1px solid #000;
            padding: 5px 8px;
            font-size: 11px;
          }
          .personal-details-table .label-cell {
            font-weight: bold;
            background-color: #f0f0f0;
            width: 200px;
          }
          .personal-details-table .value-cell {
            border-bottom: 1px solid #000;
          }
          .address-row {
            display: flex;
            gap: 15px;
            margin-bottom: 15px;
          }
          .address-section {
            flex: 1;
          }
          .address-label {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .address-value {
            font-size: 11px;
            border: 1px solid #000;
            padding: 5px 8px;
            min-height: 30px;
          }
          .table-section {
            margin-bottom: 15px;
          }
          .table-title {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
          }
          .data-table th,
          .data-table td {
            border: 1px solid #000;
            padding: 5px 8px;
            font-size: 10px;
            text-align: left;
          }
          .data-table th {
            font-weight: bold;
            background-color: #f0f0f0;
          }
          .data-table td {
            min-height: 20px;
          }
          .data-table.nominee-table td {
            min-height: 35px;
            padding: 8px;
          }
          .data-table .sno-cell {
            text-align: center;
            width: 40px;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            padding-top: 20px;
          }
          .signature-box {
            flex: 1;
            text-align: center;
          }
          .signature-label {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 40px;
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
        </style>
      </head>
      <body>
        <div class="button-container no-print">
          <button class="print-btn" onclick="window.print()">Print</button>
          <button class="print-btn close-btn" onclick="window.close()">Close</button>
        </div>

        <div class="form-container">
          <!-- Header with Logos -->
          <div class="header-section">
            <div class="logo-left">
              <img src="${window.location.origin}${process.env.PUBLIC_URL || ''}/assets/images/Main-Images/EPFO-logo.png" alt="EPFO Logo" />
            </div>
            <div class="title-section">
              <div class="main-title">DECLARATION FORM</div>
              <div class="subtitle">EMPLOYESS DETAILS FORM ESI FORM 1 & PF FORM 2(COMBINED FORM)</div>
            </div>
            <div class="logo-right">
              <img src="${window.location.origin}${process.env.PUBLIC_URL || ''}/assets/images/Main-Images/ESIC-logo.png" alt="ESIC Logo" />
            </div>
          </div>

          <!-- Top Section: Employee Status and Company Details -->
          <div class="top-section">
            <div class="employee-status">
              <div class="status-label">Employee Status:</div>
              <div class="checkbox-group">
                <div class="checkbox-item">
                  <span class="checkbox"></span>
                  <span>NEW</span>
                </div>
                <div class="checkbox-item">
                  <span class="checkbox"></span>
                  <span>REJOIN</span>
                </div>
              </div>
              <div class="status-fields">
                <div class="status-field">
                  <div class="status-field-label">EMPLOYEE ESI NO.</div>
                  <div class="status-field-value">${employeeESINo}</div>
                </div>
                <div class="status-field">
                  <div class="status-field-label">EMPLOYEE UAN NO.</div>
                  <div class="status-field-value">${employeeUANNo}</div>
                </div>
                <div class="status-field">
                  <div class="status-field-label">PF NO.</div>
                  <div class="status-field-value">${employeePFNo}</div>
                </div>
              </div>
            </div>

            <div class="company-details">
              <div class="company-details-title">NAME AND ADDRESS OF COMPANY:</div>
              <div class="company-name">${companyName}</div>
              <div class="company-address">${companyAddress}</div>
              <div class="company-field">
                <div class="company-field-label">EMPLOYER PF NO.:-</div>
                <div class="company-field-value">${employerPFNo}</div>
              </div>
              <div class="company-field">
                <div class="company-field-label">EMPLOYER ESI NO.:-</div>
                <div class="company-field-value">${employerESINo}</div>
              </div>
            </div>
          </div>

          <!-- Personal Details Table -->
          <table class="personal-details-table">
            <tr>
              <td class="label-cell">NAME</td>
              <td class="value-cell">${employeeName}</td>
              <td class="label-cell">DATE OF BIRTH</td>
              <td class="value-cell">${dateOfBirthFormatted}</td>
            </tr>
            <tr>
              <td class="label-cell">FATHER'S/HUSBAND NAME</td>
              <td class="value-cell">${fatherName}</td>
              <td class="label-cell">DOJ</td>
              <td class="value-cell">${dateOfJoiningFormatted}</td>
            </tr>
            <tr>
              <td class="label-cell">GENDER</td>
              <td class="value-cell">${gender}</td>
              <td class="label-cell">MOBILE NO.</td>
              <td class="value-cell">${mobileNo}</td>
            </tr>
            <tr>
              <td class="label-cell">STATUS</td>
              <td class="value-cell">${status}</td>
              <td class="label-cell">ESI DISP. ESI NO.</td>
              <td class="value-cell">${esiDispESINo}</td>
            </tr>
            <tr>
              <td class="label-cell">AADHAR NUMBER</td>
              <td class="value-cell">${aadharNumber}</td>
              <td class="label-cell">PAN NO.</td>
              <td class="value-cell">${panNumber}</td>
            </tr>
            <tr>
              <td class="label-cell">BANK A/C NUMBER</td>
              <td class="value-cell">${bankACNo}</td>
              <td class="label-cell">IFSC CODE</td>
              <td class="value-cell">${ifscCode}</td>
            </tr>
          </table>

          <!-- Address Sections -->
          <div class="address-row">
            <div class="address-section">
              <div class="address-label">ADDRESS PERMANENT</div>
              <div class="address-value">${permanentAddress}</div>
            </div>
            <div class="address-section">
              <div class="address-label">ADDRESS TEMPORARY</div>
              <div class="address-value">${temporaryAddress}</div>
            </div>
          </div>

          <!-- Family Details Table -->
          <div class="table-section">
            <div class="table-title">FAMILY DETAILS:</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th class="sno-cell">S.NO.</th>
                  <th>NAME OF FAMILY MEMBER</th>
                  <th>RELATION</th>
                  <th>DOB</th>
                  <th>AADHAR</th>
                </tr>
              </thead>
              <tbody>
                ${Array.from({ length: 6 }, (_, i) => {
                  const member = familyMembers[i] || {};
                  let memberDOB = "";
                  if (member.DateOfBirth) {
                    const dob = formatDateForDisplay(member.DateOfBirth);
                    memberDOB = dob ? dob.split('-').reverse().join('.') : "";
                  }
                  return `
                    <tr>
                      <td class="sno-cell">${i + 1}.</td>
                      <td>${member.Name || ""}</td>
                      <td>${member.Relation || ""}</td>
                      <td>${memberDOB}</td>
                      <td>${member.Aadhar || ""}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Nominee Details Table -->
          <div class="table-section">
            <div class="table-title">NOMINEE DETAILS:</div>
            <table class="data-table nominee-table">
              <thead>
                <tr>
                  <th>NOMINEE NAME</th>
                  <th>RELATION</th>
                  <th>DOB</th>
                  <th>SHARING</th>
                  <th>AADHAR</th>
                </tr>
              </thead>
              <tbody>
                ${Array.from({ length: 3 }, (_, i) => {
                  const nominee = nominees[i] || {};
                  let nomineeDOB = "";
                  if (nominee.DateOfBirth) {
                    const dob = formatDateForDisplay(nominee.DateOfBirth);
                    nomineeDOB = dob ? dob.split('-').reverse().join('.') : "";
                  }
                  const sharing = nominee.SharePercentage ? nominee.SharePercentage + "%" : "";
                  return `
                    <tr>
                      <td>${nominee.Name || ""}</td>
                      <td>${nominee.Relation || ""}</td>
                      <td>${nomineeDOB}</td>
                      <td>${sharing}</td>
                      <td>${nominee.Aadhar || ""}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Signature Section -->
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-label">Employee Sign.</div>
            </div>
            <div class="signature-box">
              <div class="signature-label">Authorized Sign.</div>
            </div>
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

  // Helper function to convert salary to words
  const getSalaryInWords = (amount: string): string => {
    const num = parseInt(amount) || 0;
    if (num === 27000) return "Twenty Seven Thousand";
    if (num === 15000) return "Fifteen Thousand";
    // Add more conversions as needed or use a library
    return "Rupees " + num.toLocaleString('en-IN');
  };

  const printOptions = [
    { value: "declaration", label: "Declaration Form" },
    { value: "appointment", label: "Appointment Letter" },
    { value: "form18", label: "Form No. 18" },
    { value: "application", label: "Application-Form" },
    { value: "pfDeclaration", label: "PF-Declaration" },
    { value: "all", label: "Print All Forms" },

  ];

  const employeeData = state.formData;

  return (
    <div className="page-body">
      <Breadcrumbs mainTitle="Employee Report" parent="Reports" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon
                title="Employee Report"
                tagClass="card-title mb-0"
              />
              <CardBody>
                {state.isProgress ? (
                  <div className="text-center py-5">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <Row>
                    <Col xs="12" className="mb-3 d-flex justify-content-between align-items-center">
                      <Btn
                        color="secondary"
                        onClick={() => navigate(`${process.env.PUBLIC_URL || ""}/pageListEmployeeReport`)}
                      >
                        <i className="fa fa-arrow-left me-2"></i>Back to List
                      </Btn>
                      <Btn
                        color="primary"
                        onClick={togglePrintModal}
                      >
                        <i className="fa fa-print me-2"></i>Print
                      </Btn>
                    </Col>
                    
                    {/* Personal Information */}
                    <Col xs="12" className="mb-4">
                      <h5 className="mb-3" style={{ backgroundColor: "#f8f9fa", padding: "10px", borderRadius: "5px" }}>
                        Personal Information
                      </h5>
                      <Table striped bordered>
                        <tbody>
                          <tr>
                            <th style={{ width: "200px" }}>Employee Code</th>
                            <td>{employeeData?.EmployeeCode || "-"}</td>
                            <th>Name</th>
                            <td>{employeeData?.Name || "-"}</td>
                          </tr>
                          <tr>
                            <th>Father Name</th>
                            <td>{employeeData?.FatherName || "-"}</td>
                            <th>Mother Name</th>
                            <td>{employeeData?.MotherName || employeeData?.MothersName || "-"}</td>
                          </tr>
                          <tr>
                            <th>Wife / Husband Name</th>
                            <td>{employeeData?.WifeName || employeeData?.WifesName || "-"}</td>
                            <th>Status</th>
                            <td>{employeeData?.Status || "-"}</td>
                          </tr>
                          <tr>
                            <th>Machine Enrollment No.</th>
                            <td>{employeeData?.MachineEnrollmentNo || "-"}</td>
                            <th>Date of Birth</th>
                            <td>{formatDate(employeeData?.DateOfBirth)}</td>
                          </tr>
                          <tr>
                            <th>Age</th>
                            <td>{employeeData?.Age || "-"}</td>
                            <th>Date of Joining</th>
                            <td>{formatDate(employeeData?.DateOfJoining)}</td>
                          </tr>
                          <tr>
                            <th>Gender</th>
                            <td>{employeeData?.Gender || "-"}</td>
                            <th>Mobile No.</th>
                            <td>{employeeData?.MobileNo || "-"}</td>
                          </tr>
                          <tr>
                            <th>Address</th>
                            <td colSpan={3}>{employeeData?.Address || "-"}</td>
                          </tr>
                          <tr>
                            <th>Working Status</th>
                            <td>{employeeData?.WorkingStatus || "-"}</td>
                            <th>Shift</th>
                            <td>{employeeData?.ShiftName || employeeData?.Shift || "-"}</td>
                          </tr>
                          <tr>
                            <th>Region</th>
                            <td>{employeeData?.Region || "-"}</td>
                            <th>Employee Type</th>
                            <td>{employeeData?.EmployeeType || "-"}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>

                    {/* Working Hours & Settings */}
                    <Col xs="12" className="mb-4">
                      <h5 className="mb-3" style={{ backgroundColor: "#f8f9fa", padding: "10px", borderRadius: "5px" }}>
                        Working Hours & Settings
                      </h5>
                      <Table striped bordered>
                        <tbody>
                          <tr>
                            <th style={{ width: "200px" }}>In Time</th>
                            <td>{employeeData?.InTime || "-"}</td>
                            <th>Out Time</th>
                            <td>{employeeData?.OutTime || "-"}</td>
                          </tr>
                          <tr>
                            <th>Max Working Hours (Full Day)</th>
                            <td>{employeeData?.MaxWorkingHoursFullDay || "-"}</td>
                            <th>Min Working Hours (Full Day)</th>
                            <td>{employeeData?.MinWorkingHoursFullDay || "-"}</td>
                          </tr>
                          <tr>
                            <th>Max Working Hours (Half Day)</th>
                            <td>{employeeData?.MaxWorkingHoursHalfDay || "-"}</td>
                            <th>Min Working Hours (Half Day)</th>
                            <td>{employeeData?.MinWorkingHoursHalfDay || "-"}</td>
                          </tr>
                          <tr>
                            <th>Overtime Applicable</th>
                            <td>{employeeData?.OverTimeApplicable ? "Yes" : "No"}</td>
                            <th>Grace Period (Over Time)</th>
                            <td>{employeeData?.GracePeriodMinsOverTime || "-"}</td>
                          </tr>
                          <tr>
                            <th>Weekly Holiday</th>
                            <td>{employeeData?.WeeklyHoliday || "-"}</td>
                            <th>Max Allowed Leaves/Month</th>
                            <td>{employeeData?.MaxAllowedLeavesPerMonth || "-"}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>

                    {/* Employment Details */}
                    <Col xs="12" className="mb-4">
                      <h5 className="mb-3" style={{ backgroundColor: "#f8f9fa", padding: "10px", borderRadius: "5px" }}>
                        Employment Details
                      </h5>
                      <Table striped bordered>
                        <tbody>
                          <tr>
                            <th style={{ width: "200px" }}>Department</th>
                            <td>{employeeData?.DepartmentName || employeeData?.Department || "-"}</td>
                            <th>Designation</th>
                            <td>{employeeData?.DesignationName || employeeData?.Designation || "-"}</td>
                          </tr>
                          <tr>
                            <th>Salary Amount</th>
                            <td>{employeeData?.SalaryAmount || "-"}</td>
                            <th>Working Experience</th>
                            <td>{employeeData?.WorkingExperience || "-"}</td>
                          </tr>
                          <tr>
                            <th>Skill Type</th>
                            <td>{employeeData?.SkillType || "-"}</td>
                            <th>Employment Nature</th>
                            <td>{employeeData?.EmploymentNature || "-"}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>

                    {/* Financial & Bank Details */}
                    <Col xs="12" className="mb-4">
                      <h5 className="mb-3" style={{ backgroundColor: "#f8f9fa", padding: "10px", borderRadius: "5px" }}>
                        Financial & Bank Details
                      </h5>
                      <Table striped bordered>
                        <tbody>
                          <tr>
                            <th style={{ width: "200px" }}>Employee ESIC No.</th>
                            <td>{employeeData?.EmployeeESICNo || "-"}</td>
                            <th>Employee PF No.</th>
                            <td>{employeeData?.EmployeePFNo || "-"}</td>
                          </tr>
                          <tr>
                            <th>ESIC IP No</th>
                            <td>{employeeData?.ESICIPNo || "-"}</td>
                            <th>UAN No</th>
                            <td>{employeeData?.UANNo || "-"}</td>
                          </tr>
                          <tr>
                            <th>Aadhar Number</th>
                            <td>{employeeData?.AadharNumber || "-"}</td>
                            <th>PAN Number</th>
                            <td>{employeeData?.PANNumber || "-"}</td>
                          </tr>
                          <tr>
                            <th>Bank Name</th>
                            <td>{employeeData?.BankName || "-"}</td>
                            <th>Bank A/C No</th>
                            <td>{employeeData?.BankACNo || "-"}</td>
                          </tr>
                          <tr>
                            <th>Bank A/c Holder Name</th>
                            <td>{employeeData?.BankACHolderName || "-"}</td>
                            <th>IFCS Code</th>
                            <td>{employeeData?.IFCSCode || "-"}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>

                    {/* Address & References */}
                    <Col xs="12" className="mb-4">
                      <h5 className="mb-3" style={{ backgroundColor: "#f8f9fa", padding: "10px", borderRadius: "5px" }}>
                        Address & References
                      </h5>
                      <Table striped bordered>
                        <tbody>
                          <tr>
                            <th style={{ width: "200px" }}>Local Address</th>
                            <td colSpan={3}>{employeeData?.LocalAddress || "-"}</td>
                          </tr>
                          <tr>
                            <th>Local Reference</th>
                            <td colSpan={3}>{employeeData?.LocalReference || "-"}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>

                    {/* Qualification & Documents */}
                    <Col xs="12" className="mb-4">
                      <h5 className="mb-3" style={{ backgroundColor: "#f8f9fa", padding: "10px", borderRadius: "5px" }}>
                        Qualification & Documents
                      </h5>
                      <Table striped bordered>
                        <tbody>
                          <tr>
                            <th style={{ width: "200px" }}>Qualification</th>
                            <td colSpan={3}>{employeeData?.Qualification || "-"}</td>
                          </tr>
                          <tr>
                            <th>Document Type 1</th>
                            <td>{employeeData?.DocumentType1Name || employeeData?.Document1Type || "-"}</td>
                            <th>Document Number 1</th>
                            <td>{employeeData?.DocumentNumber1 || "-"}</td>
                          </tr>
                          <tr>
                            <th>Document Type 2</th>
                            <td>{employeeData?.DocumentType2Name || employeeData?.Document2Type || "-"}</td>
                            <th>Document Number 2</th>
                            <td>{employeeData?.DocumentNumber2 || "-"}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>
                  </Row>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Print Options Modal */}
      <Modal isOpen={state.printModalOpen} toggle={togglePrintModal}>
        <ModalHeader toggle={togglePrintModal}>Select Print Option</ModalHeader>
        <ModalBody>
          <div className="d-flex flex-column gap-2">
            {printOptions.map((option) => (
              <Btn
                key={option.value}
                color="outline-primary"
                className="w-100 text-start"
                onClick={() => handlePrintOption(option.value)}
              >
                <i className="fa fa-file-text me-2"></i>
                {option.label}
              </Btn>
            ))}
            </div>
        </ModalBody>
        <ModalFooter>
          <Btn color="secondary" onClick={togglePrintModal}>
            Cancel
          </Btn>
        </ModalFooter>
      </Modal>
    </div>
  );
};  

export default EmployeeReportContainer;

