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

