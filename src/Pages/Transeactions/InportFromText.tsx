import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";

interface Attendance {
  no: string;
  tmNo: string;
  enNo: string;
  name: string;
  mode: string;
  inout: string;
  dateTime: string;
}

const API_URL_IMPORT_FROM_TEXT = `ImportFromText/0/token`;
const API_URL_MACHINE_MASTER = `${API_WEB_URLS.MASTER}/0/token/MachineMaster/Id/0`;

const AttendanceImport: React.FC = () => {
  const [data, setData] = useState<Attendance[]>([]);
  const [filteredData, setFilteredData] = useState<Attendance[]>([]);
  const [filters, setFilters] = useState<string[]>(["", "", "", "", "", "", ""]);
  const [loading, setLoading] = useState<boolean>(false);
  const [machineArray, setMachineArray] = useState<any[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>("");

  const dispatch = useDispatch();

  useEffect(() => {
    // Load Machine data for dropdown
    loadMachineData();
  }, []);

  const loadMachineData = async () => {
    try {
      const data = await Fn_FillListData(dispatch, setMachineArray, "gridData", API_URL_MACHINE_MASTER);
      console.log("Machine data loaded:", data);
    } catch (error) {
      console.error("Error loading machine data:", error);
    }
  };

  // File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      parseTxt(reader.result as string);
    };
    reader.readAsText(file);
  };



  // TXT Parsing Logic
  const parseTxt = (text: string) => {
    const rows = text.split(/\r?\n/);
    const temp: Attendance[] = [];

    rows.forEach((line) => {
      line = line.trim();
      if (!line || line.startsWith("No") || line.startsWith("----")) return;

      const parts = line.split(/\s+/);
      if (parts.length < 7) return;

      const no = parts[0];
      const tmNo = parts[1];
      const enNo = parts[2];
      const dateTime = parts.slice(-2).join(" ");
      const inout = parts[parts.length - 3];
      const mode = parts[parts.length - 4];
      const name = parts.slice(3, parts.length - 4).join(" ");

      temp.push({ no, tmNo, enNo, name, mode, inout, dateTime });
    });

    setData(temp);
    setFilteredData(temp);
  };

  // API Call
  const sendToServer = async () => {
    if (!selectedMachine) {
      alert("Please select a machine");
      return;
    }
    if (data.length === 0) {
      alert("No data to import. Please upload a file first.");
      return;
    }

    setLoading(true);
    try {
      const transformed = data.map((item) => ({
        EmpNo: item.enNo,
        Name: item.name,
        PunchTime: item.dateTime,
      }));

      const formData = new FormData();
      formData.append("Data", JSON.stringify(transformed));
      formData.append("F_MachineMaster", selectedMachine);

      const response = await fetch(`${API_WEB_URLS.BASE}${API_URL_IMPORT_FROM_TEXT}`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Data imported successfully!");
        // Clear data after successful import
        setData([]);
        setFilteredData([]);
        setFilters(["", "", "", "", "", "", ""]);
      } else {
        alert("Error importing data. Please try again.");
      }
    } catch (error) {
      console.error("Error sending data to server:", error);
      alert("Error importing data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMachineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedMachine(e.target.value);
  };

  // Search Handling
  const handleSearch = (index: number, value: string) => {
    const newFilters = [...filters];
    newFilters[index] = value.toLowerCase();
    setFilters(newFilters);

    const filtered = data.filter((item) => {
      const values = [
        item.no,
        item.tmNo,
        item.enNo,
        item.name,
        item.mode,
        item.inout,
        item.dateTime,
      ].map((v) => v.toLowerCase());

      return newFilters.every((f, i) => !f || values[i].includes(f));
    });

    setFilteredData(filtered);
  };

  return (
    <div className="page-body">
      <Breadcrumbs mainTitle="Import From Text" parent="Transactions" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon
                title="Import Attendance TXT File"
                tagClass="card-title mb-0"
              />
              <CardBody>
                {/* Input Fields */}
                <Row className="mb-3">
                  <Col md="4">
                    <Label>Machine</Label>
                    <Input
                      type="select"
                      value={selectedMachine}
                      onChange={handleMachineChange}
                    >
                      <option value="">Select Machine</option>
                      {machineArray.map((machine: any) => (
                        <option key={machine.Id} value={machine.Id}>
                          {machine.Name || `Machine ${machine.Id}`}
                        </option>
                      ))}
                    </Input>
                  </Col>
                  <Col md="4">
                    <Label>Select TXT File</Label>
                    <Input
                      type="file"
                      accept=".txt"
                      onChange={handleFileChange}
                      disabled={loading}
                    />
                  </Col>
                  <Col md="4" className="d-flex align-items-end">
                    <Btn
                      color="primary"
                      onClick={sendToServer}
                      disabled={loading || !selectedMachine || data.length === 0}
                    >
                      {loading ? "Saving..." : "Save"}
                    </Btn>
                  </Col>
                </Row>

                {/* Table */}
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        {["No", "TMNo", "EnNo", "Name", "Mode", "INOUT", "DateTime"].map(
                          (header, i) => (
                            <th key={i}>
                              <Input
                                type="text"
                                placeholder={`Search ${header}...`}
                                onChange={(e) => handleSearch(i, e.target.value)}
                                className="form-control-sm"
                              />
                            </th>
                          )
                        )}
                      </tr>
                      <tr>
                        <th>No</th>
                        <th>TMNo</th>
                        <th>EnNo</th>
                        <th>Name</th>
                        <th>Mode</th>
                        <th>INOUT</th>
                        <th>DateTime</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center p-4">
                            {loading
                              ? "Loading..."
                              : "No data found. Please upload a TXT file to import attendance data."}
                          </td>
                        </tr>
                      ) : (
                        filteredData.map((row, i) => (
                          <tr key={i}>
                            <td>{row.no}</td>
                            <td>{row.tmNo}</td>
                            <td>{row.enNo}</td>
                            <td>{row.name}</td>
                            <td>{row.mode}</td>
                            <td>{row.inout}</td>
                            <td>{row.dateTime}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AttendanceImport;
