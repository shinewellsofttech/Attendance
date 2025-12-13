// import React, { useState, useEffect, useMemo } from "react";
// import { useDispatch } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import { Card, CardBody, Col, Container, Row, Nav, NavItem, NavLink, TabContent, TabPane, Table } from "reactstrap";
// import ReactApexChart from "react-apexcharts";
// import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
// import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
// import { Fn_FillListData } from "../../store/Functions";
// import { API_WEB_URLS } from "../../constants/constAPI";

// const Report = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState("1");
//   const [statusMasterData, setStatusMasterData] = useState([]);
//   const [statusWiseData, setStatusWiseData] = useState([]);
//   const [tasksData, setTasksData] = useState([]);
//   const [employeesData, setEmployeesData] = useState([]);
//   const [ownersData, setOwnersData] = useState([]);
//   const [departmentData, setDepartmentData] = useState([]);
//   const [priorityData, setPriorityData] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // API URLs
//   const API_StatusWiseData = API_WEB_URLS.MASTER + "/0/token/StatusWiseData";
//   const API_URL4 = API_WEB_URLS.MASTER + "/0/token/GetTasks";
//   const API_StatusMaster = API_WEB_URLS.MASTER + "/0/token/StatusMaster";
//   const API_GetUserByType = API_WEB_URLS.MASTER + "/0/token/GetUserByType";
//   const API_DepartmentMaster = API_WEB_URLS.MASTER + "/0/token/DepartmentMaster";
//   const API_PriorityMaster = API_WEB_URLS.MASTER + "/0/token/PriorityMaster";

//   // Fetch status master data to map IDs to names
//   const getStatusMaster = async () => {
//     try {
//       const tempState = {};
//       const data = await Fn_FillListData(
//         dispatch,
//         (prevState) => ({ ...prevState, ...tempState }),
//         "FillArrayStatusMaster",
//         API_StatusMaster + "/Id/0"
//       );
//       console.log("Status master data received:", data);
//       return data || [];
//     } catch (error) {
//       console.error("Error fetching status master:", error);
//       return [];
//     }
//   };

//   // Fetch status-wise task data (already calculated by backend)
//   const getStatusWiseData = async () => {
//     try {
//       const tempState = {};
//       const data = await Fn_FillListData(
//         dispatch,
//         (prevState) => ({ ...prevState, ...tempState }),
//         "FillArrayStatus",
//         API_StatusWiseData + "/Id/0"
//       );
//       console.log("Status-wise data received:", data);
//       return data || [];
//     } catch (error) {
//       console.error("Error fetching status-wise data:", error);
//       return [];
//     }
//   };

//   // Fetch employees data (UserType = 9)
//   const getEmployees = async () => {
//     try {
//       const tempState = {};
//       const data = await Fn_FillListData(
//         dispatch,
//         (prevState) => ({ ...prevState, ...tempState }),
//         "FillArrayEmployees",
//         API_GetUserByType + "/Id/9"
//       );
//       console.log("Employees data received:", data);
//       return data || [];
//     } catch (error) {
//       console.error("Error fetching employees:", error);
//       return [];
//     }
//   };

//   // Fetch owners data (UserType = 8)
//   const getOwners = async () => {
//     try {
//       const tempState = {};
//       const data = await Fn_FillListData(
//         dispatch,
//         (prevState) => ({ ...prevState, ...tempState }),
//         "FillArrayOwners",
//         API_GetUserByType + "/Id/8"
//       );
//       console.log("Owners data received:", data);
//       return data || [];
//     } catch (error) {
//       console.error("Error fetching owners:", error);
//       return [];
//     }
//   };

//   // Fetch department master data
//   const getDepartments = async () => {
//     try {
//       const tempState = {};
//       const data = await Fn_FillListData(
//         dispatch,
//         (prevState) => ({ ...prevState, ...tempState }),
//         "FillArrayDepartments",
//         API_DepartmentMaster + "/Id/0"
//       );
//       console.log("Departments data received:", data);
//       return data || [];
//     } catch (error) {
//       console.error("Error fetching departments:", error);
//       return [];
//     }
//   };

//   // Fetch priority master data
//   const getPriorities = async () => {
//     try {
//       const tempState = {};
//       const data = await Fn_FillListData(
//         dispatch,
//         (prevState) => ({ ...prevState, ...tempState }),
//         "FillArrayPriorities",
//         API_PriorityMaster + "/Id/0"
//       );
//       console.log("Priorities data received:", data);
//       return data || [];
//     } catch (error) {
//       console.error("Error fetching priorities:", error);
//       return [];
//     }
//   };

//   // Fetch tasks for overdue calculation
//   const getTasks = async () => {
//     try {
//       const obj = JSON.parse(localStorage.getItem("authUser"));
//       const tempState = {};
//       const data = await Fn_FillListData(
//         dispatch,
//         (prevState) => ({ ...prevState, ...tempState }),
//         "FillArray9",
//         API_URL4 + "/Id/" + obj.Id
//       );
//       console.log("Tasks data received:", data);
//       return data || [];
//     } catch (error) {
//       console.error("Error fetching tasks:", error);
//       return [];
//     }
//   };

//   // Check if user is admin (UserType === 8)
//   useEffect(() => {
//     try {
//       const storedUser = localStorage.getItem("authUser");
//       if (storedUser) {
//         const parsedUser = JSON.parse(storedUser);
//         const userType = parsedUser?.F_UserType;
//         if (userType !== 8) {
//           // If not admin, redirect to employee reports
//           navigate(`${process.env.PUBLIC_URL}/employeeReports`, { replace: true });
//           return;
//         }
//       } else {
//         navigate(`${process.env.PUBLIC_URL}/login`, { replace: true });
//         return;
//       }
//     } catch (error) {
//       console.error("Error parsing authUser from localStorage:", error);
//       navigate(`${process.env.PUBLIC_URL}/login`, { replace: true });
//       return;
//     }
//   }, [navigate]);

//   // Load all data on component mount
//   useEffect(() => {
//     const loadData = async () => {
//       setLoading(true);
//       try {
//         const [statusMaster, statusWise, tasks, employees, owners, departments, priorities] = await Promise.all([
//           getStatusMaster(),
//           getStatusWiseData(),
//           getTasks(),
//           getEmployees(),
//           getOwners(),
//           getDepartments(),
//           getPriorities(),
//         ]);
        
//         // Debug logging
//         console.log("=== Report Data Debug ===");
//         console.log("Status Master:", statusMaster);
//         console.log("Status Wise:", statusWise);
//         console.log("Tasks:", tasks);
//         console.log("Employees:", employees);
//         if (employees && employees.length > 0) {
//           console.log("First Employee sample:", employees[0]);
//           console.log("Employee keys:", Object.keys(employees[0] || {}));
//         }
//         console.log("Owners:", owners);
//         console.log("Departments:", departments);
//         if (departments && departments.length > 0) {
//           console.log("First Department sample:", departments[0]);
//           console.log("Department keys:", Object.keys(departments[0] || {}));
//         }
//         console.log("Priorities:", priorities);
//         console.log("========================");
        
//         setStatusMasterData(statusMaster);
//         setStatusWiseData(statusWise);
//         setTasksData(tasks);
//         setEmployeesData(employees);
//         setOwnersData(owners);
//         setDepartmentData(departments);
//         setPriorityData(priorities);
//       } catch (error) {
//         console.error("Error loading report data:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadData();
//   }, [dispatch]);

//   // Calculate overdue tasks
//   const overdueTasks = useMemo(() => {
//     if (!tasksData || tasksData.length === 0) return 0;
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     return tasksData.filter((task) => {
//       if (!task.EndDate) return false;
//       const endDate = new Date(task.EndDate);
//       endDate.setHours(0, 0, 0, 0);
//       return endDate < today && task.F_StatusMaster && task.F_StatusMaster !== "completed";
//     }).length;
//   }, [tasksData]);

//   // Map status IDs to names
//   const getStatusName = (statusId) => {
//     if (!statusId) return "Unknown";
//     // Try to find status by Id (number or string)
//     const status = statusMasterData.find(
//       (s) => s.Id === statusId || s.Id === parseInt(statusId) || s.Id === String(statusId) || s.Id == statusId
//     );
//     if (status && status.Name) return status.Name;
//     // If not found, return formatted status ID
//     return `Status ${statusId}`;
//   };

//   // Prepare status-wise chart data
//   const statusWiseChartData = useMemo(() => {
//     if (!statusWiseData || statusWiseData.length === 0) {
//       return {
//         labels: [],
//         series: [],
//       };
//     }

//     // Debug: Log the data structure
//     console.log("StatusWiseData structure:", statusWiseData);
//     console.log("StatusMasterData structure:", statusMasterData);
    
//     // Log first item structure for debugging
//     if (statusWiseData.length > 0) {
//       console.log("First StatusWiseData item keys:", Object.keys(statusWiseData[0]));
//       console.log("First StatusWiseData item:", JSON.stringify(statusWiseData[0], null, 2));
//     }
//     if (statusMasterData.length > 0) {
//       console.log("First StatusMasterData item keys:", Object.keys(statusMasterData[0]));
//       console.log("First StatusMasterData item:", JSON.stringify(statusMasterData[0], null, 2));
//     }

//     const labels = statusWiseData.map((item, index) => {
//       // Try multiple possible field names for status name (direct)
//       if (item.StatusName) return item.StatusName;
//       if (item.Name) return item.Name;
//       if (item.Status) return item.Status;
//       if (item.StatusNameText) return item.StatusNameText;
      
//       // Try nested status object
//       if (item.Status && typeof item.Status === 'object' && item.Status.Name) {
//         return item.Status.Name;
//       }
//       if (item.StatusMaster && typeof item.StatusMaster === 'object' && item.StatusMaster.Name) {
//         return item.StatusMaster.Name;
//       }
      
//       // Try multiple possible field names for status ID
//       const statusId = item.F_StatusMaster || item.StatusId || item.Id || item.F_StatusMasterId || item.StatusMasterId;
//       if (statusId !== undefined && statusId !== null) {
//         const name = getStatusName(statusId);
//         // Only use mapped name if it's not the default "Status X" format
//         if (name && !name.startsWith("Status ")) return name;
//         // If we got "Status X", try one more time with different comparison
//         if (statusMasterData.length > 0) {
//           const foundStatus = statusMasterData.find(
//             (s) => 
//               String(s.Id) === String(statusId) || 
//               s.Id === parseInt(statusId) || 
//               String(s.Id) === String(parseInt(statusId))
//           );
//           if (foundStatus && foundStatus.Name) {
//             return foundStatus.Name;
//           }
//         }
//       }
      
//       // If still not found, log for debugging
//       console.warn(`Could not find status name for item at index ${index}:`, item);
//       return "Unknown";
//     });

//     const series = statusWiseData.map((item) => {
//       return item.Count || item.TaskCount || item.Total || item.Quantity || 0;
//     });

//     console.log("Final labels:", labels);
//     console.log("Final series:", series);

//     return { labels, series };
//   }, [statusWiseData, statusMasterData]);

//   // Status-wise Bar Chart Data
//   const statusBarChartOptions = useMemo(() => ({
//     chart: {
//       height: 350,
//       type: "bar",
//       toolbar: {
//         show: false,
//       },
//     },
//     plotOptions: {
//       bar: {
//         horizontal: false,
//         columnWidth: "55%",
//         endingShape: "rounded",
//       },
//     },
//     dataLabels: {
//       enabled: false,
//     },
//     stroke: {
//       show: true,
//       width: 2,
//       colors: ["transparent"],
//     },
//     series: [
//       {
//         name: "Tasks",
//         data: statusWiseChartData.series,
//       },
//     ],
//     xaxis: {
//       categories: statusWiseChartData.labels,
//     },
//     yaxis: {
//       title: {
//         text: "Number of Tasks",
//       },
//     },
//     fill: {
//       opacity: 1,
//     },
//     tooltip: {
//       y: {
//         formatter: function (val) {
//           return val + " tasks";
//         },
//       },
//     },
//     colors: ["#5C61F2"],
//   }), [statusWiseChartData]);

//   // Status-wise Pie Chart Data
//   const statusPieChartOptions = useMemo(() => ({
//     chart: {
//       width: 380,
//       type: "pie",
//     },
//     labels: statusWiseChartData.labels,
//     series: statusWiseChartData.series,
//     responsive: [
//       {
//         breakpoint: 480,
//         options: {
//           chart: {
//             width: 200,
//           },
//           legend: {
//             position: "bottom",
//           },
//         },
//       },
//     ],
//     colors: ["#5C61F2", "#FF9766", "#51bb25", "#f8d62b", "#dc3545", "#6c757d", "#17a2b8"],
//   }), [statusWiseChartData]);

//   // Status-wise Donut Chart Data
//   const statusDonutChartOptions = useMemo(() => ({
//     chart: {
//       width: 380,
//       type: "donut",
//     },
//     labels: statusWiseChartData.labels,
//     series: statusWiseChartData.series,
//     responsive: [
//       {
//         breakpoint: 480,
//         options: {
//           chart: {
//             width: 200,
//           },
//           legend: {
//             position: "bottom",
//           },
//         },
//       },
//     ],
//     colors: ["#5C61F2", "#FF9766", "#51bb25", "#f8d62b", "#dc3545", "#6c757d", "#17a2b8"],
//   }), [statusWiseChartData]);

//   // Task Overview Radial Chart
//   const taskOverviewRadialOptions = useMemo(() => {
//     const totalTasks = tasksData.length || 0;
    
//     // Categorize all tasks into three groups
//     let completedTasks = 0;
//     let inProgressTasks = 0;
//     let pendingTasks = 0;
    
//     tasksData.forEach((task) => {
//       if (!task.F_StatusMaster) {
//         pendingTasks++; // Tasks without status go to pending
//         return;
//       }
      
//       const statusName = getStatusName(task.F_StatusMaster).toLowerCase();
      
//       // Check for completed status
//       if (
//         statusName.includes("complete") ||
//         statusName.includes("done") ||
//         statusName.includes("finished") ||
//         statusName.includes("success")
//       ) {
//         completedTasks++;
//       }
//       // Check for in progress status (including "Working On It")
//       else if (
//         statusName.includes("progress") ||
//         statusName.includes("working on") ||
//         statusName.includes("in progress") ||
//         statusName.includes("active") ||
//         statusName.includes("processing") ||
//         statusName === "working on it"
//       ) {
//         inProgressTasks++;
//       }
//       // Everything else goes to pending (including Pause, Pending, Waiting, etc.)
//       else {
//         pendingTasks++;
//       }
//     });

//     // Calculate percentages - ensure they add up correctly
//     const completedPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
//     const inProgressPercent = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0;
//     const pendingPercent = totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0;

//     return {
//       chart: {
//         height: 350,
//         type: "radialBar",
//       },
//       plotOptions: {
//         radialBar: {
//           dataLabels: {
//             name: {
//               fontSize: "22px",
//             },
//             value: {
//               fontSize: "16px",
//             },
//             total: {
//               show: true,
//               label: "Total Tasks",
//               formatter: function () {
//                 return totalTasks.toString();
//               },
//             },
//           },
//         },
//       },
//       labels: ["Completed", "In Progress", "Pending"],
//       series: [
//         completedPercent,
//         inProgressPercent,
//         pendingPercent,
//       ],
//       colors: ["#51bb25", "#5C61F2", "#FF9766"],
//     };
//   }, [tasksData, statusMasterData]);

//   // Overdue Tasks Chart
//   const overdueTasksChartOptions = useMemo(() => {
//     const totalTasks = tasksData.length || 0;
//     const overdueCount = overdueTasks;
//     const onTimeCount = totalTasks - overdueCount;

//     return {
//       chart: {
//         height: 350,
//         type: "bar",
//         toolbar: {
//           show: false,
//         },
//       },
//       plotOptions: {
//         bar: {
//           horizontal: true,
//           dataLabels: {
//             position: "top",
//           },
//         },
//       },
//       dataLabels: {
//         enabled: true,
//         offsetX: -6,
//         style: {
//           fontSize: "12px",
//           colors: ["#fff"],
//         },
//       },
//       series: [
//         {
//           data: [onTimeCount, overdueCount],
//         },
//       ],
//       xaxis: {
//         categories: ["On Time", "Overdue"],
//       },
//       colors: ["#51bb25", "#dc3545"],
//     };
//   }, [tasksData, overdueTasks]);

//   // Employee Task Assignment Data (changed from chart to table format)
//   const employeeTaskData = useMemo(() => {
//     if (!employeesData || employeesData.length === 0 || !tasksData || tasksData.length === 0) {
//       return [];
//     }

//     // Create department lookup map
//     const deptMap = {};
//     if (departmentData && departmentData.length > 0) {
//       departmentData.forEach((dept) => {
//         deptMap[dept.Id] = dept.Name || `Department ${dept.Id}`;
//       });
//     }

//     const employeeTaskCounts = {};
//     employeesData.forEach((emp) => {
//       const deptId = emp.F_DepartmentMaster || emp.DepartmentId || emp.Department;
//       const deptName = deptId ? (deptMap[deptId] || `Dept ${deptId}`) : "N/A";
      
//       employeeTaskCounts[emp.Id] = { 
//         id: emp.Id,
//         name: emp.Name || `Employee ${emp.Id}`, 
//         count: 0,
//         department: deptName
//       };
//     });

//     tasksData.forEach((task) => {
//       if (task.EmployeeIds) {
//         const empIds = typeof task.EmployeeIds === 'string' 
//           ? task.EmployeeIds.split(',').map(id => parseInt(id.trim()))
//           : Array.isArray(task.EmployeeIds) 
//             ? task.EmployeeIds.map(e => typeof e === 'object' ? e.Id : e)
//             : [];
        
//         empIds.forEach((empId) => {
//           if (employeeTaskCounts[empId]) {
//             employeeTaskCounts[empId].count++;
//           }
//         });
//       }
//     });

//     const sorted = Object.values(employeeTaskCounts)
//       .filter(emp => emp.count > 0)
//       .sort((a, b) => b.count - a.count);

//     return sorted;
//   }, [employeesData, tasksData, departmentData]);

//   // Department Distribution Chart
//   const departmentChartData = useMemo(() => {
//     if (!departmentData || departmentData.length === 0 || !employeesData || employeesData.length === 0) {
//       return { labels: [], series: [] };
//     }

//     const deptCounts = {};
//     departmentData.forEach((dept) => {
//       deptCounts[dept.Id] = { name: dept.Name || `Department ${dept.Id}`, count: 0 };
//     });

//     employeesData.forEach((emp) => {
//       const deptId = emp.F_DepartmentMaster || emp.DepartmentId;
//       if (deptId && deptCounts[deptId]) {
//         deptCounts[deptId].count++;
//       }
//     });

//     return {
//       labels: Object.values(deptCounts).map(dept => dept.name),
//       series: Object.values(deptCounts).map(dept => dept.count),
//     };
//   }, [departmentData, employeesData]);

//   const departmentChartOptions = useMemo(() => ({
//     chart: {
//       width: 380,
//       type: "pie",
//     },
//     labels: departmentChartData.labels,
//     series: departmentChartData.series,
//     responsive: [{
//       breakpoint: 480,
//       options: {
//         chart: { width: 200 },
//         legend: { position: "bottom" },
//       },
//     }],
//     colors: ["#5C61F2", "#FF9766", "#51bb25", "#f8d62b", "#dc3545", "#6c757d", "#17a2b8"],
//   }), [departmentChartData]);

//   // Priority-wise Task Chart
//   const priorityChartData = useMemo(() => {
//     if (!priorityData || priorityData.length === 0 || !tasksData || tasksData.length === 0) {
//       return { labels: [], series: [] };
//     }

//     const priorityCounts = {};
//     priorityData.forEach((priority) => {
//       priorityCounts[priority.Id] = { name: priority.Name || `Priority ${priority.Id}`, count: 0 };
//     });

//     tasksData.forEach((task) => {
//       const priorityId = task.F_PriorityMaster || task.PriorityId;
//       if (priorityId && priorityCounts[priorityId]) {
//         priorityCounts[priorityId].count++;
//       }
//     });

//     return {
//       labels: Object.values(priorityCounts).map(p => p.name),
//       series: Object.values(priorityCounts).map(p => p.count),
//     };
//   }, [priorityData, tasksData]);

//   const priorityChartOptions = useMemo(() => ({
//     chart: {
//       width: 380,
//       type: "donut",
//     },
//     labels: priorityChartData.labels,
//     series: priorityChartData.series,
//     responsive: [{
//       breakpoint: 480,
//       options: {
//         chart: { width: 200 },
//         legend: { position: "bottom" },
//       },
//     }],
//     colors: ["#dc3545", "#FF9766", "#f8d62b", "#51bb25", "#5C61F2"],
//   }), [priorityChartData]);

//   // Legacy charts (keeping for reference, can be removed if not needed)
//   // Bar Chart Data
//   const barChartOptions = {
//     chart: {
//       height: 350,
//       type: "bar",
//       toolbar: {
//         show: false,
//       },
//     },
//     plotOptions: {
//       bar: {
//         horizontal: false,
//         columnWidth: "55%",
//         endingShape: "rounded",
//       },
//     },
//     dataLabels: {
//       enabled: false,
//     },
//     stroke: {
//       show: true,
//       width: 2,
//       colors: ["transparent"],
//     },
//     series: [
//       {
//         name: "Sales",
//         data: [44, 55, 57, 56, 61, 58, 63, 60, 66],
//       },
//       {
//         name: "Revenue",
//         data: [76, 85, 101, 98, 87, 105, 91, 114, 94],
//       },
//     ],
//     xaxis: {
//       categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
//     },
//     yaxis: {
//       title: {
//         text: "$ (thousands)",
//       },
//     },
//     fill: {
//       opacity: 1,
//     },
//     tooltip: {
//       y: {
//         formatter: function (val) {
//           return "$ " + val + " thousands";
//         },
//       },
//     },
//     colors: ["#5C61F2", "#FF9766"],
//   };

//   // Line Chart Data
//   const lineChartOptions = {
//     chart: {
//       height: 350,
//       type: "line",
//       zoom: {
//         enabled: false,
//       },
//       toolbar: {
//         show: false,
//       },
//     },
//     dataLabels: {
//       enabled: false,
//     },
//     stroke: {
//       curve: "straight",
//     },
//     series: [
//       {
//         name: "Desktops",
//         data: [10, 41, 35, 51, 49, 62, 69, 91, 148],
//       },
//       {
//         name: "Mobile",
//         data: [20, 31, 45, 61, 59, 72, 79, 101, 158],
//       },
//     ],
//     title: {
//       text: "Product Trends by Month",
//       align: "left",
//     },
//     grid: {
//       row: {
//         colors: ["#f3f3f3", "transparent"],
//         opacity: 0.5,
//       },
//     },
//     xaxis: {
//       categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
//     },
//     colors: ["#5C61F2", "#51bb25"],
//   };

//   // Area Chart Data
//   const areaChartOptions = {
//     chart: {
//       height: 350,
//       type: "area",
//       toolbar: {
//         show: false,
//       },
//     },
//     dataLabels: {
//       enabled: false,
//     },
//     stroke: {
//       curve: "smooth",
//     },
//     series: [
//       {
//         name: "Series 1",
//         data: [31, 40, 28, 51, 42, 109, 100],
//       },
//       {
//         name: "Series 2",
//         data: [11, 32, 45, 32, 34, 52, 41],
//       },
//     ],
//     xaxis: {
//       type: "datetime",
//       categories: [
//         "2018-09-19T00:00:00",
//         "2018-09-19T01:30:00",
//         "2018-09-19T02:30:00",
//         "2018-09-19T03:30:00",
//         "2018-09-19T04:30:00",
//         "2018-09-19T05:30:00",
//         "2018-09-19T06:30:00",
//       ],
//     },
//     tooltip: {
//       x: {
//         format: "dd/MM/yy HH:mm",
//       },
//     },
//     colors: ["#5C61F2", "#FF9766"],
//   };

//   // Pie Chart Data
//   const pieChartOptions = {
//     chart: {
//       width: 380,
//       type: "pie",
//     },
//     labels: ["Team A", "Team B", "Team C", "Team D", "Team E"],
//     series: [44, 55, 13, 43, 22],
//     responsive: [
//       {
//         breakpoint: 480,
//         options: {
//           chart: {
//             width: 200,
//           },
//           legend: {
//             position: "bottom",
//           },
//         },
//       },
//     ],
//     colors: ["#5C61F2", "#FF9766", "#51bb25", "#f8d62b", "#dc3545"],
//   };

//   // Donut Chart Data
//   const donutChartOptions = {
//     chart: {
//       width: 380,
//       type: "donut",
//     },
//     labels: ["Team A", "Team B", "Team C", "Team D"],
//     series: [44, 55, 13, 43],
//     responsive: [
//       {
//         breakpoint: 480,
//         options: {
//           chart: {
//             width: 200,
//           },
//           legend: {
//             position: "bottom",
//           },
//         },
//       },
//     ],
//     colors: ["#5C61F2", "#FF9766", "#51bb25", "#f8d62b"],
//   };

//   // Column Chart Data
//   const columnChartOptions = {
//     chart: {
//       height: 350,
//       type: "bar",
//       toolbar: {
//         show: false,
//       },
//     },
//     plotOptions: {
//       bar: {
//         horizontal: true,
//         dataLabels: {
//           position: "top",
//         },
//       },
//     },
//     dataLabels: {
//       enabled: true,
//       offsetX: -6,
//       style: {
//         fontSize: "12px",
//         colors: ["#fff"],
//       },
//     },
//     series: [
//       {
//         data: [44, 55, 41, 64, 22, 43, 21],
//       },
//     ],
//     xaxis: {
//       categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
//     },
//     colors: ["#5C61F2"],
//   };

//   // Mixed Chart Data (Line + Column)
//   const mixedChartOptions = {
//     chart: {
//       height: 350,
//       type: "line",
//       toolbar: {
//         show: false,
//       },
//     },
//     series: [
//       {
//         name: "Website Blog",
//         type: "column",
//         data: [440, 505, 414, 671, 227, 413, 201, 352, 752, 320, 257, 160],
//       },
//       {
//         name: "Social Media",
//         type: "line",
//         data: [23, 42, 35, 27, 43, 22, 17, 31, 22, 22, 12, 16],
//       },
//     ],
//     stroke: {
//       width: [0, 4],
//     },
//     title: {
//       text: "Traffic Sources",
//     },
//     labels: [
//       "01 Jan 2001",
//       "02 Jan 2001",
//       "03 Jan 2001",
//       "04 Jan 2001",
//       "05 Jan 2001",
//       "06 Jan 2001",
//       "07 Jan 2001",
//       "08 Jan 2001",
//       "09 Jan 2001",
//       "10 Jan 2001",
//       "11 Jan 2001",
//       "12 Jan 2001",
//     ],
//     xaxis: {
//       type: "datetime",
//     },
//     yaxis: [
//       {
//         title: {
//           text: "Website Blog",
//         },
//       },
//       {
//         opposite: true,
//         title: {
//           text: "Social Media",
//         },
//       },
//     ],
//     colors: ["#5C61F2", "#51bb25"],
//   };

//   // Radial Bar Chart Data
//   const radialBarChartOptions = {
//     chart: {
//       height: 350,
//       type: "radialBar",
//     },
//     plotOptions: {
//       radialBar: {
//         dataLabels: {
//           name: {
//             fontSize: "22px",
//           },
//           value: {
//             fontSize: "16px",
//           },
//           total: {
//             show: true,
//             label: "Total",
//             formatter: function (w) {
//               return "249";
//             },
//           },
//         },
//       },
//     },
//     labels: ["Apples", "Oranges", "Bananas", "Berries"],
//     series: [44, 55, 67, 83],
//     colors: ["#5C61F2", "#FF9766", "#51bb25", "#f8d62b"],
//   };

//   if (loading) {
//     return (
//       <div className="page-body">
//         <Breadcrumbs mainTitle="Reports & Analytics" parent="Dashboard" />
//         <Container flId>
//           <Row>
//             <Col>
//               <Card>
//                 <CardBody className="text-center">
//                   <div className="spinner-border text-primary" role="status">
//                     <span className="sr-only">Loading...</span>
//                   </div>
//                   <p className="mt-3">Loading report data...</p>
//                 </CardBody>
//               </Card>
//             </Col>
//           </Row>
//         </Container>
//       </div>
//     );
//   }

//   return (
//     <div className="page-body">
//       <Breadcrumbs mainTitle="Reports & Analytics" parent="Dashboard" />
//       <Container flId>
//         <Card>
//           <CardBody>
//             <Nav tabs className="nav-tabs border-tab">
//               <NavItem>
//                 <NavLink
//                   className={activeTab === "1" ? "active" : ""}
//                   onClick={() => setActiveTab("1")}
//                   style={{ cursor: "pointer" }}
//                 >
//                   <i className="icofont icofont-ui-home"></i> Task Reports
//                 </NavLink>
//               </NavItem>
//               <NavItem>
//                 <NavLink
//                   className={activeTab === "2" ? "active" : ""}
//                   onClick={() => setActiveTab("2")}
//                   style={{ cursor: "pointer" }}
//                 >
//                   <i className="icofont icofont-man-in-glasses"></i> Employee Reports
//                 </NavLink>
//               </NavItem>
//               <NavItem>
//                 <NavLink
//                   className={activeTab === "3" ? "active" : ""}
//                   onClick={() => setActiveTab("3")}
//                   style={{ cursor: "pointer" }}
//                 >
//                   <i className="icofont icofont-building"></i> Department Reports
//                 </NavLink>
//               </NavItem>
//               <NavItem>
//                 <NavLink
//                   className={activeTab === "4" ? "active" : ""}
//                   onClick={() => setActiveTab("4")}
//                   style={{ cursor: "pointer" }}
//                 >
//                   <i className="icofont icofont-chart-line"></i> Performance Reports
//                 </NavLink>
//               </NavItem>
//             </Nav>
//             <TabContent activeTab={activeTab}>
//               {/* Task Reports Tab */}
//               <TabPane tabId="1">
//                 <Row className="mt-3">
//           {/* Status-wise Bar Chart */}
//           <Col xl="6" lg="12">
//             <Card>
//               <CardHeaderCommon
//                 title="Tasks by Status"
//                 span={[{ text: "Number of tasks grouped by status" }]}
//               />
//               <CardBody>
//                 {statusWiseChartData.series.length > 0 ? (
//                   <ReactApexChart
//                     options={statusBarChartOptions}
//                     series={statusBarChartOptions.series}
//                     type="bar"
//                     height={350}
//                   />
//                 ) : (
//                   <div className="text-center p-4">
//                     <p className="text-muted">No data available</p>
//                   </div>
//                 )}
//               </CardBody>
//             </Card>
//           </Col>

//           {/* Overdue Tasks Chart */}
//           <Col xl="6" lg="12">
//             <Card>
//               <CardHeaderCommon
//                 title="Task Timeline Status"
//                 span={[{ text: "On-time vs overdue tasks comparison" }]}
//               />
//               <CardBody>
//                 {tasksData.length > 0 ? (
//                   <ReactApexChart
//                     options={overdueTasksChartOptions}
//                     series={overdueTasksChartOptions.series}
//                     type="bar"
//                     height={350}
//                   />
//                 ) : (
//                   <div className="text-center p-4">
//                     <p className="text-muted">No tasks data available</p>
//                   </div>
//                 )}
//               </CardBody>
//             </Card>
//           </Col>

//           {/* Status-wise Pie Chart */}
//           <Col xl="6" lg="12">
//             <Card>
//               <CardHeaderCommon
//                 title="Status Distribution"
//                 span={[{ text: "Distribution of tasks across different statuses" }]}
//               />
//               <CardBody>
//                 {statusWiseChartData.series.length > 0 ? (
//                   <div className="d-flex justify-content-center">
//                     <ReactApexChart
//                       options={statusPieChartOptions}
//                       series={statusPieChartOptions.series}
//                       type="pie"
//                       width={380}
//                     />
//                   </div>
//                 ) : (
//                   <div className="text-center p-4">
//                     <p className="text-muted">No data available</p>
//                   </div>
//                 )}
//               </CardBody>
//             </Card>
//           </Col>

//           {/* Status-wise Donut Chart */}
//           <Col xl="6" lg="12">
//             <Card>
//               <CardHeaderCommon
//                 title="Status Allocation"
//                 span={[{ text: "Donut chart showing task status distribution" }]}
//               />
//               <CardBody>
//                 {statusWiseChartData.series.length > 0 ? (
//                   <div className="d-flex justify-content-center">
//                     <ReactApexChart
//                       options={statusDonutChartOptions}
//                       series={statusDonutChartOptions.series}
//                       type="donut"
//                       width={380}
//                     />
//                   </div>
//                 ) : (
//                   <div className="text-center p-4">
//                     <p className="text-muted">No data available</p>
//                   </div>
//                 )}
//               </CardBody>
//             </Card>
//           </Col>

//           {/* Task Overview Radial Chart */}
//           <Col xl="6" lg="12">
//             <Card>
//               <CardHeaderCommon
//                 title="Task Progress Overview"
//                 span={[{ text: "Radial chart showing task completion progress" }]}
//               />
//               <CardBody>
//                 {tasksData.length > 0 ? (
//                   <ReactApexChart
//                     options={taskOverviewRadialOptions}
//                     series={taskOverviewRadialOptions.series}
//                     type="radialBar"
//                     height={350}
//                   />
//                 ) : (
//                   <div className="text-center p-4">
//                     <p className="text-muted">No tasks data available</p>
//                   </div>
//                 )}
//               </CardBody>
//             </Card>
//           </Col>

//           {/* Summary Stats Card */}
//           <Col xl="6" lg="12">
//             <Card>
//               <CardHeaderCommon
//                 title="Task Summary"
//                 span={[{ text: "Key metrics and statistics" }]}
//               />
//               <CardBody>
//                 <Row className="g-3">
//                   <Col sm="6">
//                     <div className="p-3 bg-light rounded">
//                       <h5 className="text-primary mb-1">{tasksData.length}</h5>
//                       <p className="mb-0 text-muted">Total Tasks</p>
//                     </div>
//                   </Col>
//                   <Col sm="6">
//                     <div className="p-3 bg-light rounded">
//                       <h5 className="text-danger mb-1">{overdueTasks}</h5>
//                       <p className="mb-0 text-muted">Overdue Tasks</p>
//                     </div>
//                   </Col>
//                   <Col sm="6">
//                     <div className="p-3 bg-light rounded">
//                       <h5 className="text-success mb-1">
//                         {tasksData.filter(
//                           (task) =>
//                             task.F_StatusMaster &&
//                             getStatusName(task.F_StatusMaster)
//                               .toLowerCase()
//                               .includes("complete")
//                         ).length}
//                       </h5>
//                       <p className="mb-0 text-muted">Completed</p>
//                     </div>
//                   </Col>
//                   <Col sm="6">
//                     <div className="p-3 bg-light rounded">
//                       <h5 className="text-info mb-1">
//                         {tasksData.filter((task) => {
//                           if (!task.F_StatusMaster) return false;
//                           const statusName = getStatusName(task.F_StatusMaster).toLowerCase();
//                           return (
//                             statusName.includes("progress") ||
//                             statusName.includes("working on") ||
//                             statusName.includes("in progress") ||
//                             statusName.includes("active") ||
//                             statusName.includes("processing") ||
//                             statusName === "working on it"
//                           );
//                         }).length}
//                       </h5>
//                       <p className="mb-0 text-muted">In Progress</p>
//                     </div>
//                   </Col>
//                 </Row>
//               </CardBody>
//             </Card>
//           </Col>
//                 </Row>
//               </TabPane>

//               {/* Employee Reports Tab */}
//               <TabPane tabId="2">
//                 <Row className="mt-3">
//                   {/* Employee Task Assignment Table - Compact Format */}
//                   <Col xl="12" lg="12">
//                     <Card>
//                       <CardHeaderCommon
//                         title="Top Employees by Task Assignment"
//                         span={[{ text: "Employees with most assigned tasks" }]}
//                       />
//                       <CardBody>
//                         {employeeTaskData.length > 0 ? (
//                           <div style={{ maxHeight: "400px", overflowY: "auto", overflowX: "auto" }}>
//                             <Table striped hover responsive className="mb-0">
//                               <thead style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 10 }}>
//                                 <tr>
//                                   <th style={{ width: "60px", textAlign: "center" }}>#</th>
//                                   <th>Employee Name</th>
//                                   <th style={{ width: "200px" }}>Department</th>
//                                   <th style={{ width: "150px", textAlign: "center" }}>Tasks Assigned</th>
//                                   <th style={{ width: "200px" }}>Progress</th>
//                                 </tr>
//                               </thead>
//                               <tbody>
//                                 {employeeTaskData.map((emp, index) => {
//                                   const maxTasks = employeeTaskData[0]?.count || 1;
//                                   const percentage = maxTasks > 0 ? Math.round((emp.count / maxTasks) * 100) : 0;
//                                   return (
//                                     <tr key={emp.id}>
//                                       <td style={{ textAlign: "center", fontWeight: 600 }}>{index + 1}</td>
//                                       <td>
//                                         <div style={{ display: "flex", alignItems: "center" }}>
//                                           <div
//                                             style={{
//                                               width: "32px",
//                                               height: "32px",
//                                               borderRadius: "50%",
//                                               backgroundColor: "#5C61F2",
//                                               color: "#fff",
//                                               display: "flex",
//                                               alignItems: "center",
//                                               justifyContent: "center",
//                                               marginRight: "10px",
//                                               fontWeight: 600,
//                                               fontSize: "14px"
//                                             }}
//                                           >
//                                             {emp.name.charAt(0).toUpperCase()}
//                                           </div>
//                                           <span style={{ fontWeight: 500 }}>{emp.name}</span>
//                                         </div>
//                                       </td>
//                                       <td>
//                                         <span className="badge bg-light text-dark">{emp.department}</span>
//                                       </td>
//                                       <td style={{ textAlign: "center" }}>
//                                         <span
//                                           style={{
//                                             fontSize: "18px",
//                                             fontWeight: 700,
//                                             color: "#5C61F2"
//                                           }}
//                                         >
//                                           {emp.count}
//                                         </span>
//                                         <span className="text-muted ms-1" style={{ fontSize: "14px" }}>
//                                           {emp.count === 1 ? "task" : "tasks"}
//                                         </span>
//                                       </td>
//                                       <td>
//                                         <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//                                           <div
//                                             style={{
//                                               flex: 1,
//                                               height: "8px",
//                                               backgroundColor: "#e9ecef",
//                                               borderRadius: "4px",
//                                               overflow: "hidden"
//                                             }}
//                                           >
//                                             <div
//                                               style={{
//                                                 height: "100%",
//                                                 width: `${percentage}%`,
//                                                 backgroundColor: "#5C61F2",
//                                                 transition: "width 0.3s ease"
//                                               }}
//                                             />
//                                           </div>
//                                           <span style={{ fontSize: "12px", color: "#6c757d", minWidth: "40px" }}>
//                                             {percentage}%
//                                           </span>
//                                         </div>
//                                       </td>
//                                     </tr>
//                                   );
//                                 })}
//                               </tbody>
//                             </Table>
//                           </div>
//                         ) : (
//                           <div className="text-center p-4">
//                             <p className="text-muted">No employee task data available</p>
//                           </div>
//                         )}
//                       </CardBody>
//                     </Card>
//                   </Col>

//                   {/* Employee Details Table */}
//                   <Col xl="12" lg="12">
//                     <Card>
//                       <CardHeaderCommon
//                         title="Employee Details"
//                         span={[{ text: "Complete list of employees" }]}
//                       />
//                       <CardBody>
//                         {employeesData.length > 0 ? (
//                           <div className="table-responsive">
//                             <Table striped hover>
//                               <thead>
//                                 <tr>
//                                   <th>#</th>
//                                   <th>Name</th>
//                                   <th>Email</th>
//                                   <th>Phone</th>
//                                   <th>Department</th>
//                                   <th>User Type</th>
//                                 </tr>
//                               </thead>
//                               <tbody>
//                                 {employeesData.map((emp, index) => {
//                                   // Get department - handle both ID and object formats
//                                   let deptId = null;
//                                   let deptName = "N/A";
                                  
//                                   if (emp.F_DepartmentMaster) {
//                                     // Check if it's an object
//                                     if (typeof emp.F_DepartmentMaster === 'object' && emp.F_DepartmentMaster !== null) {
//                                       deptId = emp.F_DepartmentMaster.Id || emp.F_DepartmentMaster.id;
//                                       deptName = emp.F_DepartmentMaster.Name || emp.F_DepartmentMaster.name || "N/A";
//                                     } else {
//                                       deptId = emp.F_DepartmentMaster;
//                                     }
//                                   } else if (emp.DepartmentId) {
//                                     deptId = emp.DepartmentId;
//                                   } else if (emp.Department) {
//                                     if (typeof emp.Department === 'object' && emp.Department !== null) {
//                                       deptId = emp.Department.Id || emp.Department.id;
//                                       deptName = emp.Department.Name || emp.Department.name || "N/A";
//                                     } else if (typeof emp.Department === 'string' && isNaN(emp.Department)) {
//                                       // If Department is already a string name
//                                       deptName = emp.Department;
//                                     } else {
//                                       deptId = emp.Department;
//                                     }
//                                   }
                                  
//                                   // If we have a deptId but not deptName, try to find it from departmentData
//                                   if (deptId && (!deptName || deptName === "N/A")) {
//                                     const dept = departmentData.find(
//                                       (d) => d.Id === deptId || 
//                                             d.Id === parseInt(deptId) || 
//                                             d.Id === String(deptId) ||
//                                             d.Id == deptId
//                                     );
//                                     deptName = dept?.Name || dept?.name || "N/A";
//                                   }
                                  
//                                   // Get Email and Phone with fallback options
//                                   const email = emp.Email || emp.email || emp.EMail || "N/A";
//                                   const phone = emp.Phone || emp.phone || emp.Mobile || emp.phoneNumber || "N/A";
                                  
//                                   return (
//                                     <tr key={emp.Id || index}>
//                                       <td>{index + 1}</td>
//                                       <td>{emp.Name || emp.name || "N/A"}</td>
//                                       <td>{email}</td>
//                                       <td>{phone}</td>
//                                       <td>
//                                         {deptName !== "N/A" ? (
//                                           <span className="badge bg-light text-dark">{deptName}</span>
//                                         ) : (
//                                           "N/A"
//                                         )}
//                                       </td>
//                                       <td>
//                                         <span className="badge badge-primary">Employee</span>
//                                       </td>
//                                     </tr>
//                                   );
//                                 })}
//                               </tbody>
//                             </Table>
//                           </div>
//                         ) : (
//                           <div className="text-center p-4">
//                             <p className="text-muted">No employee data available</p>
//                           </div>
//                         )}
//                       </CardBody>
//                     </Card>
//                   </Col>

//                   {/* Employee Summary Stats */}
//                   <Col xl="12" lg="12">
//                     <Card>
//                       <CardHeaderCommon
//                         title="Employee Summary"
//                         span={[{ text: "Key employee metrics" }]}
//                       />
//                       <CardBody>
//                         <Row className="g-3">
//                           <Col sm="6" md="3">
//                             <div className="p-3 bg-light rounded text-center">
//                               <h5 className="text-primary mb-1">{employeesData.length}</h5>
//                               <p className="mb-0 text-muted">Total Employees</p>
//                             </div>
//                           </Col>
//                           <Col sm="6" md="3">
//                             <div className="p-3 bg-light rounded text-center">
//                               <h5 className="text-success mb-1">
//                                 {employeesData.filter((emp) => emp.Email).length}
//                               </h5>
//                               <p className="mb-0 text-muted">With Email</p>
//                             </div>
//                           </Col>
//                           <Col sm="6" md="3">
//                             <div className="p-3 bg-light rounded text-center">
//                               <h5 className="text-info mb-1">
//                                 {employeesData.filter((emp) => emp.Phone).length}
//                               </h5>
//                               <p className="mb-0 text-muted">With Phone</p>
//                             </div>
//                           </Col>
//                           <Col sm="6" md="3">
//                             <div className="p-3 bg-light rounded text-center">
//                               <h5 className="text-warning mb-1">
//                                 {new Set(employeesData.map((emp) => emp.F_DepartmentMaster || emp.DepartmentId).filter(Boolean)).size}
//                               </h5>
//                               <p className="mb-0 text-muted">Departments</p>
//                             </div>
//                           </Col>
//                         </Row>
//                       </CardBody>
//                     </Card>
//                   </Col>
//                 </Row>
//               </TabPane>

//               {/* Department Reports Tab */}
//               <TabPane tabId="3">
//                 <Row className="mt-3">
//                   {/* Department Distribution Chart */}
//                   <Col xl="6" lg="12">
//                     <Card>
//                       <CardHeaderCommon
//                         title="Department Distribution"
//                         span={[{ text: "Employee distribution across departments" }]}
//                       />
//                       <CardBody>
//                         {departmentChartData.series.length > 0 ? (
//                           <div className="d-flex justify-content-center">
//                             <ReactApexChart
//                               options={departmentChartOptions}
//                               series={departmentChartOptions.series}
//                               type="pie"
//                               width={380}
//                             />
//                           </div>
//                         ) : (
//                           <div className="text-center p-4">
//                             <p className="text-muted">No department data available</p>
//                           </div>
//                         )}
//                       </CardBody>
//                     </Card>
//                   </Col>

//                   {/* Priority Distribution Chart */}
//                   <Col xl="6" lg="12">
//                     <Card>
//                       <CardHeaderCommon
//                         title="Task Priority Distribution"
//                         span={[{ text: "Tasks grouped by priority levels" }]}
//                       />
//                       <CardBody>
//                         {priorityChartData.series.length > 0 ? (
//                           <div className="d-flex justify-content-center">
//                             <ReactApexChart
//                               options={priorityChartOptions}
//                               series={priorityChartOptions.series}
//                               type="donut"
//                               width={380}
//                             />
//                           </div>
//                         ) : (
//                           <div className="text-center p-4">
//                             <p className="text-muted">No priority data available</p>
//                           </div>
//                         )}
//                       </CardBody>
//                     </Card>
//                   </Col>

//                   {/* Department Details Table */}
//                   <Col xl="12" lg="12">
//                     <Card>
//                       <CardHeaderCommon
//                         title="Department Details"
//                         span={[{ text: "Complete list of departments" }]}
//                       />
//                       <CardBody>
//                         {departmentData.length > 0 ? (
//                           <div className="table-responsive">
//                             <Table striped hover>
//                               <thead>
//                                 <tr>
//                                   <th>#</th>
//                                   <th>Department Name</th>
//                                   <th>Employee Count</th>
//                                   <th>Description</th>
//                                 </tr>
//                               </thead>
//                               <tbody>
//                                 {departmentData.map((dept, index) => {
//                                   const empCount = employeesData.filter(
//                                     (emp) => (emp.F_DepartmentMaster || emp.DepartmentId) === dept.Id
//                                   ).length;
//                                   return (
//                                     <tr key={dept.Id || index}>
//                                       <td>{index + 1}</td>
//                                       <td>{dept.Name || "N/A"}</td>
//                                       <td>
//                                         <span className="badge badge-primary">{empCount}</span>
//                                       </td>
//                                       <td>{dept.Description || dept.Note || "N/A"}</td>
//                                     </tr>
//                                   );
//                                 })}
//                               </tbody>
//                             </Table>
//                           </div>
//                         ) : (
//                           <div className="text-center p-4">
//                             <p className="text-muted">No department data available</p>
//                           </div>
//                         )}
//                       </CardBody>
//                     </Card>
//                   </Col>
//                 </Row>
//               </TabPane>

//               {/* Performance Reports Tab */}
//               <TabPane tabId="4">
//                 <Row className="mt-3">
//                   {/* Performance Summary */}
//                   <Col xl="12" lg="12">
//                     <Card>
//                       <CardHeaderCommon
//                         title="Overall Performance Summary"
//                         span={[{ text: "Comprehensive performance metrics" }]}
//                       />
//                       <CardBody>
//                         <Row className="g-3">
//                           <Col sm="6" md="3">
//                             <div className="p-4 bg-primary text-white rounded text-center">
//                               <h3 className="mb-1">{tasksData.length}</h3>
//                               <p className="mb-0">Total Tasks</p>
//                             </div>
//                           </Col>
//                           <Col sm="6" md="3">
//                             <div className="p-4 bg-success text-white rounded text-center">
//                               <h3 className="mb-1">
//                                 {tasksData.filter(
//                                   (task) =>
//                                     task.F_StatusMaster &&
//                                     getStatusName(task.F_StatusMaster)
//                                       .toLowerCase()
//                                       .includes("complete")
//                                 ).length}
//                               </h3>
//                               <p className="mb-0">Completed</p>
//                             </div>
//                           </Col>
//                           <Col sm="6" md="3">
//                             <div className="p-4 bg-info text-white rounded text-center">
//                               <h3 className="mb-1">{employeesData.length}</h3>
//                               <p className="mb-0">Total Employees</p>
//                             </div>
//                           </Col>
//                           <Col sm="6" md="3">
//                             <div className="p-4 bg-warning text-white rounded text-center">
//                               <h3 className="mb-1">{departmentData.length}</h3>
//                               <p className="mb-0">Departments</p>
//                             </div>
//                           </Col>
//                         </Row>
//                       </CardBody>
//                     </Card>
//                   </Col>

//                   {/* Task Completion Rate */}
//                   <Col xl="6" lg="12">
//                     <Card>
//                       <CardHeaderCommon
//                         title="Task Completion Rate"
//                         span={[{ text: "Percentage of completed tasks" }]}
//                       />
//                       <CardBody>
//                         {tasksData.length > 0 ? (
//                           <ReactApexChart
//                             options={taskOverviewRadialOptions}
//                             series={taskOverviewRadialOptions.series}
//                             type="radialBar"
//                             height={350}
//                           />
//                         ) : (
//                           <div className="text-center p-4">
//                             <p className="text-muted">No tasks data available</p>
//                           </div>
//                         )}
//                       </CardBody>
//                     </Card>
//                   </Col>

//                   {/* Overdue Tasks */}
//                   <Col xl="6" lg="12">
//                     <Card>
//                       <CardHeaderCommon
//                         title="Task Timeline Status"
//                         span={[{ text: "On-time vs overdue tasks" }]}
//                       />
//                       <CardBody>
//                         {tasksData.length > 0 ? (
//                           <ReactApexChart
//                             options={overdueTasksChartOptions}
//                             series={overdueTasksChartOptions.series}
//                             type="bar"
//                             height={350}
//                           />
//                         ) : (
//                           <div className="text-center p-4">
//                             <p className="text-muted">No tasks data available</p>
//                           </div>
//                         )}
//                       </CardBody>
//                     </Card>
//                   </Col>
//                 </Row>
//               </TabPane>
//             </TabContent>
//           </CardBody>
//         </Card>
//       </Container>
//     </div>
//   );
// };

// export default Report;

import React from 'react'

const Report = () => {
  return (
    <h1 className='text-center mt-5'>Dashboard</h1>
    
  )
}

export default Report