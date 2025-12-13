import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_DeleteData } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";

const API_URL = `${API_WEB_URLS.MASTER}/0/token/EmpShiftEditMaster`;

const PageList_EmpShiftEditMasterContainer = () => {
  const [gridData, setGridData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin (userType === 8)
    try {
      const storedUser = localStorage.getItem("authUser");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const userType = parsedUser?.F_UserType;
        if (userType !== 8) {
          navigate(`${process.env.PUBLIC_URL}/reports`, { replace: true });
          return;
        }
      } else {
        navigate(`${process.env.PUBLIC_URL}/reports`, { replace: true });
        return;
      }
    } catch (error) {
      console.error("Error parsing authUser from localStorage:", error);
      navigate(`${process.env.PUBLIC_URL}/reports`, { replace: true });
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Fn_FillListData(dispatch, setGridData, "gridData", API_URL + "/Id/0");
    setLoading(false);
  };

  const handleEdit = (id: number) => {
    navigate("/addEdit_EmpShiftEditMaster", { state: { Id: id } });
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this employee shift assignment?");
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
    navigate("/addEdit_EmpShiftEditMaster", { state: { Id: 0 } });
  };

  const filteredData = (Array.isArray(gridData) ? gridData : []).filter((item: any) => {
    const searchText = filterText.toLowerCase();
    return (
      (item.EmployeeName && item.EmployeeName.toLowerCase().includes(searchText)) ||
      (item.EmployeeId && item.EmployeeId.toString().includes(searchText)) ||
      (item.ShiftName && item.ShiftName.toLowerCase().includes(searchText))
    );
  });

  return (
    <>
      <Breadcrumbs mainTitle="Employee Shift Edit Master List" parent="Masters" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon
                title="Employee Shift Edit Master List"
                tagClass="card-title mb-0"
              />
              <CardBody>
                <Row className="mb-3">
                  <Col md="6">
                    <div className="dataTables_filter d-flex align-items-center">
                      <Label className="me-2">Search:</Label>
                      <Input
                        type="search"
                        placeholder="Search by employee name or shift..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                      />
                    </div>
                  </Col>
                  <Col md="6" className="text-end">
                    <Btn
                      color="primary"
                      onClick={handleAdd}
                    >
                      <i className="fa fa-plus me-2"></i>Add New Assignment
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
                          <th>Employee</th>
                          <th>Shift</th>
                          <th>Shift Time</th>
                          <th style={{ width: "150px", textAlign: "center" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center p-4">
                              No data found
                            </td>
                          </tr>
                        ) : (
                          filteredData.map((item: any, index: number) => (
                            <tr key={item.Id || index}>
                              <td>{index + 1}</td>
                              <td>{item.EmployeeName || item.Employee || "-"}</td>
                              <td>{item.ShiftName || item.Shift || "-"}</td>
                              <td>
                                {item.InTime && item.OutTime 
                                  ? `${item.InTime} - ${item.OutTime}`
                                  : "-"}
                              </td>
                              <td style={{ width: "150px", whiteSpace: "nowrap" }}>
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

export default PageList_EmpShiftEditMasterContainer;



