import { MenuItem } from "../../Types/Layout/SidebarType";

// Helper function to get menu list
export const getMenuList = (): MenuItem[] => {
  return [
    {
      title: "Dashboard",
      Items: [{ id: 1, title: "Reports", path: `${process.env.PUBLIC_URL}/reports`, icon: "home", type: "link", bookmark: true }],
    },
    {
      title: "Masters",
      Items: [
        { id: 1, title: "Company Master", path: `${process.env.PUBLIC_URL}/companyMaster`, icon: "Building", type: "link", bookmark: true },
        { id: 2, title: "Shift Master", path: `${process.env.PUBLIC_URL}/shiftMaster`, icon: "Building", type: "link", bookmark: true },
        { id: 3, title: "Holiday Master", path: `${process.env.PUBLIC_URL}/holidayMaster`, icon: "Building", type: "link", bookmark: true },      
        { id: 4, title: "Employee Master ", path: `${process.env.PUBLIC_URL}/employeeMaster`, icon: "Building", type: "link", bookmark: true },
        { id: 5, title: "Employee Shift Edit Master", path: `${process.env.PUBLIC_URL}/employeeShiftEditMaster`, icon: "Building", type: "link", bookmark: true },
        {id:6,title:"Machine Type Master",path:`${process.env.PUBLIC_URL}/machineTypeMaster`,icon:"Building",type:"link",bookmark:true},
        {id:7, title:"Machine Master",path:`${process.env.PUBLIC_URL}/machineMaster`,icon:"Building",type:"link",bookmark:true},
        {id:8,title:"State Master",path:`${process.env.PUBLIC_URL}/stateMaster`,icon:"Building",type:"link",bookmark:true},
        {id:9,title:"City Master",path:`${process.env.PUBLIC_URL}/cityMaster`,icon:"Building",type:"link",bookmark:true},
        {id:10,title:"Department Master",path:`${process.env.PUBLIC_URL}/departmentMaster`,icon:"Building",type:"link",bookmark:true},
        {id:11,title:"Designation Master",path:`${process.env.PUBLIC_URL}/designationMaster`,icon:"Building",type:"link",bookmark:true},
      ],
    },
    {
      title: "Attendance management",
      // Items: [{ id: 1, title: "Task Management", path: `${process.env.PUBLIC_URL}/taskManagement`, icon: "Paper-plus", type: "link", bookmark: true }],
      Items: [{ id: 1, title: "Import From Text", path: `${process.env.PUBLIC_URL}/importFromText`, icon: "Building", type: "link", bookmark: true },
        { id: 2, title: "Audit Attendance", path: `${process.env.PUBLIC_URL}/auditAttendance`, icon: "Building", type: "link", bookmark: true },
        { id: 3, title: "Attendance Adjustment", path: `${process.env.PUBLIC_URL}/attendanceAdjustment`, icon: "Building", type: "link", bookmark: true },
        { id: 4, title: "Leave Assign", path: `${process.env.PUBLIC_URL}/leaveAssign`, icon: "Building", type: "link", bookmark: true },
        ],
      
    },
    {
      title: "Reports",
      Items: [
        {id:1,title:"Employee Report",path:`${process.env.PUBLIC_URL}/PageListEmployeeReport`,icon:"Building",type:"link",bookmark:true},
        {id:2,title:"Employee Attendance Sheet",path:`${process.env.PUBLIC_URL}/employeeAttendanceSheet`,icon:"Building",type:"link",bookmark:true},
        {id:3,title:"Employee Wise Yearly",path:`${process.env.PUBLIC_URL}/employeeWiseYearly`,icon:"Building",type:"link",bookmark:true},
        {id:4,title:"Employee Day Wise Report",path:`${process.env.PUBLIC_URL}/employeeDayWiseReport`,icon:"Building",type:"link",bookmark:true},
        {id:5,title:"Department Attendance Summary",path:`${process.env.PUBLIC_URL}/departmentAttendanceSummary`,icon:"Building",type:"link",bookmark:true},
        {id:6,title:"Muster Roll OT Summary",path:`${process.env.PUBLIC_URL}/musterRollOTSummary`,icon:"Building",type:"link",bookmark:true},
      ]
    },
    {
      title: "Tools", 
      Items: [
        {id:1,title:"Global Options",path:`${process.env.PUBLIC_URL}/globalOptions`,icon:"Building",type:"link",bookmark:true}
      ]
    }
  ];
};

// Default export for backward compatibility
export const MenuList: MenuItem[] = getMenuList();
