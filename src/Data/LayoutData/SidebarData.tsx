import { MenuItem } from "../../Types/Layout/SidebarType";

// Helper function to get menu list based on user type
export const getMenuList = (): MenuItem[] => {
  try {
    const storedUser = localStorage.getItem("authUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const userType = parsedUser?.F_UserType;
      
      // Admin menu (UserType === 8)
      if (userType === 8) {
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
            ],
          },
          {
            title: "Attendance management",
            // Items: [{ id: 1, title: "Task Management", path: `${process.env.PUBLIC_URL}/taskManagement`, icon: "Paper-plus", type: "link", bookmark: true }],
          },
          {
            title: "Tools",
            Items: [
              {id:1,title:"Global Options",path:`${process.env.PUBLIC_URL}/globalOptions`,icon:"Building",type:"link",bookmark:true}
            ]
          }
        ];
      } else {
        // Employee menu (UserType !== 8)
        return [
          {
            title: "Dashboard",
            Items: [{ id: 1, title: "My Reports", path: `${process.env.PUBLIC_URL}/employeeReports`, icon: "home", type: "link", bookmark: true }],
          },
          {
            title: "Attendance management",
            Items: [{ id: 1, title: "Task Management", path: `${process.env.PUBLIC_URL}/taskManagement`, icon: "Paper-plus", type: "link", bookmark: true }],
          },
        ];
      }
    }
  } catch (error) {
    console.error("Error parsing authUser from localStorage:", error);
  }
  
  // Default: Employee menu
  return [
    {
      title: "Dashboard",
      Items: [{ id: 1, title: "My Reports", path: `${process.env.PUBLIC_URL}/employeeReports`, icon: "home", type: "link", bookmark: true }],
    },
    {
      title: "Attendance management",
      Items: [{ id: 1, title: "Task Management", path: `${process.env.PUBLIC_URL}/taskManagement`, icon: "Paper-plus", type: "link", bookmark: true }],
    },
  ];
};

// Default export for backward compatibility
export const MenuList: MenuItem[] = getMenuList();
