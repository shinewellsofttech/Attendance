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
import GlobalOptions from "../Pages/Tools/GlobalOptions";
import AdminRoute from "./AdminRoute";

export const routes = [
  // Sample Page
  { path: `${process.env.PUBLIC_URL}/reports`, Component: <Report /> },
  { path: `${process.env.PUBLIC_URL}/employeeReports`, Component: <EmployeeReport /> },
  { path: `${process.env.PUBLIC_URL}/addEdit_CompanyMaster`, Component: <AdminRoute><AddEdit_CompanyMaster /></AdminRoute> },
  { path: `${process.env.PUBLIC_URL}/companyMaster`, Component: <AdminRoute><PageList_CompanyMaster /></AdminRoute> },
  { path: `${process.env.PUBLIC_URL}/addEdit_ShiftMaster`, Component: <AdminRoute><AddEdit_ShiftMaster /></AdminRoute> },
  { path: `${process.env.PUBLIC_URL}/shiftMaster`, Component: <AdminRoute><PageList_ShiftMaster /></AdminRoute> },
  { path: `${process.env.PUBLIC_URL}/addEdit_HolidayMaster`, Component: <AdminRoute><AddEdit_HolidayMaster /></AdminRoute> },
  { path: `${process.env.PUBLIC_URL}/holidayMaster`, Component: <AdminRoute><PageList_HolidayMaster /></AdminRoute> },
  { path: `${process.env.PUBLIC_URL}/addEdit_EmployeeMaster`, Component: <AdminRoute><AddEdit_EmployeeMaster /></AdminRoute> },
  { path: `${process.env.PUBLIC_URL}/employeeMaster`, Component: <AdminRoute><PageList_EmployeeMaster /></AdminRoute> },
  { path: `${process.env.PUBLIC_URL}/addEdit_EmpShiftEditMaster`, Component: <AdminRoute><AddEdit_EmpShiftEditMaster /></AdminRoute> },
  { path: `${process.env.PUBLIC_URL}/employeeShiftEditMaster`, Component: <AdminRoute><PageList_EmpShiftEditMaster /></AdminRoute> },
  { path: `${process.env.PUBLIC_URL}/addEdit_MachineTypeMaster`, Component: <AdminRoute><AddEdit_MachineTypeMaster /></AdminRoute> },
  { path: `${process.env.PUBLIC_URL}/machineTypeMaster`, Component: <AdminRoute><PageList_MachineTypeMaster /></AdminRoute> },
  { path: `${process.env.PUBLIC_URL}/globalOptions`, Component: <AdminRoute><GlobalOptions /></AdminRoute> },
  { path: `${process.env.PUBLIC_URL}/taskManagement`, Component: <TaskManagement /> },
];
