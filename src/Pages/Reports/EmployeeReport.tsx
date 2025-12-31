import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Row, Table } from "reactstrap";
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
                    <Col xs="12" className="mb-3">
                      <Btn
                        color="secondary"
                        onClick={() => navigate(`${process.env.PUBLIC_URL || ""}/pageListEmployeeReport`)}
                      >
                        <i className="fa fa-arrow-left me-2"></i>Back to List
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
    </div>
  );
};

export default EmployeeReportContainer;

