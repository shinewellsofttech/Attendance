import AddEdit_CompanyMaster from "../Pages/Masters/AddEdit_CompanyMaster";
import PageList_CompanyMaster from "../Pages/Masters/PageList_CompanyMaster";
import AddEdit_ShiftMaster from "../Pages/Masters/AddEdit_ShiftMaster";
import PageList_ShiftMaster from "../Pages/Masters/PageList_ShiftMaster";
import AddEdit_HolidayMaster from "../Pages/Masters/AddEdit_HolidayMaster";
import PageList_HolidayMaster from "../Pages/Masters/PageList_HolidayMaster";
import TaskManagement from "../Pages/Task/TaskManagement";
import Report from "../Pages/Dashboard/Report";
import EmployeeReport from "../Pages/Dashboard/EmployeeReport";
import AddEdit_EmployeeMaster from "../Pages/Masters/AddEdit_EmployeeMaster";
import PageList_EmployeeMaster from "../Pages/Masters/PageList_EmployeeMaster";
import AddEdit_EmpShiftEditMaster from "../Pages/Masters/AddEdit_EmpShiftEditMaster";
import PageList_EmpShiftEditMaster from "../Pages/Masters/PageList_EmpShiftEditMaster";
import AddEdit_MachineTypeMaster from "../Pages/Masters/AddEdit_MachineTypeMaster";
import PageList_MachineTypeMaster from "../Pages/Masters/PageList_MachineTypeMaster";
import AddEdit_StateMaster from "../Pages/Masters/AddEdit_StateMaster";
import PageList_StateMaster from "../Pages/Masters/PageList_StateMaster";
import AddEdit_CityMaster from "../Pages/Masters/AddEdit_CityMaster";
import PageList_CityMaster from "../Pages/Masters/PageList_CityMaster";
import GlobalOptions from "../Pages/Tools/GlobalOptions";
import AdminRoute from "./AdminRoute";
import AddEdit_MachineMaster from "../Pages/Masters/AddEdit_MachineMaster";
import PageList_MachineMaster from "../Pages/Masters/PageList_MachineMaster";
import AddEdit_DepartmentMaster from "../Pages/Masters/AddEdit_DepartmentMaster";
import PageList_DepartmentMaster from "../Pages/Masters/PageList_DepartmentMaster";
import AddEdit_DesignationMaster from "../Pages/Masters/AddEdit_DesignationMaster";
import PageList_DesignationMaster from "../Pages/Masters/PageList_DesignationMaster";
import PageListEmployeeReport from "../Pages/Reports/PageListEmployeeReport";
import EmployeeReportDetail from "../Pages/Reports/EmployeeReport";
import AttendanceImport from "../Pages/Transeactions/InportFromText";

// Helper function to normalize paths
const normalizePath = (path: string): string => {
  const basePath = process.env.PUBLIC_URL || "";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (basePath) {
    return `${basePath}${cleanPath}`;
  }
  return cleanPath;
};

export const routes = [
  // Sample Page
  { path: normalizePath("/reports"), Component: <Report /> },
  { path: normalizePath("/employeeReports"), Component: <EmployeeReport /> },
  { path: normalizePath("/addEdit_CompanyMaster"), Component: <AdminRoute><AddEdit_CompanyMaster /></AdminRoute> },
  { path: normalizePath("/companyMaster"), Component: <AdminRoute><PageList_CompanyMaster /></AdminRoute> },
  { path: normalizePath("/addEdit_ShiftMaster"), Component: <AdminRoute><AddEdit_ShiftMaster /></AdminRoute> },
  { path: normalizePath("/shiftMaster"), Component: <AdminRoute><PageList_ShiftMaster /></AdminRoute> },
  { path: normalizePath("/addEdit_HolidayMaster"), Component: <AdminRoute><AddEdit_HolidayMaster /></AdminRoute> },
  { path: normalizePath("/holidayMaster"), Component: <AdminRoute><PageList_HolidayMaster /></AdminRoute> },
  { path: normalizePath("/addEdit_EmployeeMaster"), Component: <AdminRoute><AddEdit_EmployeeMaster /></AdminRoute> },
  { path: normalizePath("/employeeMaster"), Component: <AdminRoute><PageList_EmployeeMaster /></AdminRoute> },
  { path: normalizePath("/addEdit_EmpShiftEditMaster"), Component: <AdminRoute><AddEdit_EmpShiftEditMaster /></AdminRoute> },
  { path: normalizePath("/employeeShiftEditMaster"), Component: <AdminRoute><PageList_EmpShiftEditMaster /></AdminRoute> },
  { path: normalizePath("/addEdit_MachineTypeMaster"), Component: <AdminRoute><AddEdit_MachineTypeMaster /></AdminRoute> },
  { path: normalizePath("/machineTypeMaster"), Component: <AdminRoute><PageList_MachineTypeMaster /></AdminRoute> },
  { path: normalizePath("/addEdit_StateMaster"), Component: <AdminRoute><AddEdit_StateMaster /></AdminRoute> },
  { path: normalizePath("/stateMaster"), Component: <AdminRoute><PageList_StateMaster /></AdminRoute> },
  { path: normalizePath("/addEdit_CityMaster"), Component: <AdminRoute><AddEdit_CityMaster /></AdminRoute> },
  { path: normalizePath("/cityMaster"), Component: <AdminRoute><PageList_CityMaster /></AdminRoute> },
  { path: normalizePath("/addEdit_MachineMaster"), Component: <AdminRoute><AddEdit_MachineMaster /></AdminRoute> },
  { path: normalizePath("/machineMaster"), Component: <AdminRoute><PageList_MachineMaster /></AdminRoute> },
  { path: normalizePath("/globalOptions"), Component: <AdminRoute><GlobalOptions /></AdminRoute> },
  { path: normalizePath("/taskManagement"), Component: <TaskManagement /> },
  { path: normalizePath("/addEdit_DepartmentMaster"), Component: <AdminRoute><AddEdit_DepartmentMaster /></AdminRoute> },
  { path: normalizePath("/departmentMaster"), Component: <AdminRoute><PageList_DepartmentMaster /></AdminRoute> },
  { path: normalizePath("/addEdit_DesignationMaster"), Component: <AdminRoute><AddEdit_DesignationMaster /></AdminRoute> },
  { path: normalizePath("/designationMaster"), Component: <AdminRoute><PageList_DesignationMaster /></AdminRoute> },
  { path: normalizePath("/pageListEmployeeReport"), Component: <PageListEmployeeReport /> },
  { path: normalizePath("/employeeReport"), Component: <EmployeeReportDetail /> },
  { path: normalizePath("/importFromText"), Component: <AttendanceImport /> },
];
