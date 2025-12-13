import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Row, Nav, NavItem, NavLink, TabContent, TabPane, Table } from "reactstrap";
import ReactApexChart from "react-apexcharts";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";

const EmployeeReport = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("1");
  const [statusMasterData, setStatusMasterData] = useState([]);
  const [statusWiseData, setStatusWiseData] = useState([]);
  const [tasksData, setTasksData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [loading, setLoading] = useState(true);

  // API URLs
  const API_StatusWiseData = API_WEB_URLS.MASTER + "/0/token/StatusWiseData";
  const API_URL4 = API_WEB_URLS.MASTER + "/0/token/GetTasks";
  const API_StatusMaster = API_WEB_URLS.MASTER + "/0/token/StatusMaster";
  const API_DepartmentMaster = API_WEB_URLS.MASTER + "/0/token/DepartmentMaster";
  const API_PriorityMaster = API_WEB_URLS.MASTER + "/0/token/PriorityMaster";

  // Check if user is employee (not admin)
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("authUser");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const userType = parsedUser?.F_UserType;
        if (userType === 8) {
          // If admin, redirect to admin reports
          navigate(`${process.env.PUBLIC_URL}/reports`, { replace: true });
          return;
        }
      } else {
        navigate(`${process.env.PUBLIC_URL}/login`, { replace: true });
        return;
      }
    } catch (error) {
      console.error("Error parsing authUser from localStorage:", error);
      navigate(`${process.env.PUBLIC_URL}/login`, { replace: true });
      return;
    }
  }, [navigate]);

  // Fetch status master data to map IDs to names
  const getStatusMaster = async () => {
    try {
      const tempState = {};
      const data = await Fn_FillListData(
        dispatch,
        (prevState) => ({ ...prevState, ...tempState }),
        "FillArrayStatusMaster",
        API_StatusMaster + "/Id/0"
      );
      return data || [];
    } catch (error) {
      console.error("Error fetching status master:", error);
      return [];
    }
  };

  // Fetch status-wise task data for current user
  const getStatusWiseData = async () => {
    try {
      const obj = JSON.parse(localStorage.getItem("authUser"));
      const tempState = {};
      const data = await Fn_FillListData(
        dispatch,
        (prevState) => ({ ...prevState, ...tempState }),
        "FillArrayStatus",
        API_StatusWiseData + "/Id/" + obj.Id
      );
      return data || [];
    } catch (error) {
      console.error("Error fetching status-wise data:", error);
      return [];
    }
  };

  // Fetch department master data
  const getDepartments = async () => {
    try {
      const tempState = {};
      const data = await Fn_FillListData(
        dispatch,
        (prevState) => ({ ...prevState, ...tempState }),
        "FillArrayDepartments",
        API_DepartmentMaster + "/Id/0"
      );
      return data || [];
    } catch (error) {
      console.error("Error fetching departments:", error);
      return [];
    }
  };

  // Fetch priority master data
  const getPriorities = async () => {
    try {
      const tempState = {};
      const data = await Fn_FillListData(
        dispatch,
        (prevState) => ({ ...prevState, ...tempState }),
        "FillArrayPriorities",
        API_PriorityMaster + "/Id/0"
      );
      return data || [];
    } catch (error) {
      console.error("Error fetching priorities:", error);
      return [];
    }
  };

  // Fetch tasks for current user only
  const getTasks = async () => {
    try {
      const obj = JSON.parse(localStorage.getItem("authUser"));
      const tempState = {};
      const data = await Fn_FillListData(
        dispatch,
        (prevState) => ({ ...prevState, ...tempState }),
        "FillArray9",
        API_URL4 + "/Id/" + obj.Id
      );
      return data || [];
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return [];
    }
  };

  // Load all data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [statusMaster, statusWise, tasks, departments, priorities] = await Promise.all([
          getStatusMaster(),
          getStatusWiseData(),
          getTasks(),
          getDepartments(),
          getPriorities(),
        ]);
        
        setStatusMasterData(statusMaster);
        setStatusWiseData(statusWise);
        setTasksData(tasks);
        setDepartmentData(departments);
        setPriorityData(priorities);
      } catch (error) {
        console.error("Error loading report data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dispatch]);

  // Map status IDs to names
  const getStatusName = useCallback((statusId) => {
    if (!statusId) return "Unknown";
    // Try to find status by Id (number or string) - use loose equality for better matching
    const status = statusMasterData.find(
      (s) => s.Id === statusId || s.Id === parseInt(statusId) || s.Id === String(statusId) || s.Id == statusId
    );
    if (status && status.Name) return status.Name;
    return `Status ${statusId}`;
  }, [statusMasterData]);

  // Calculate overdue tasks
  const overdueTasks = useMemo(() => {
    if (!tasksData || tasksData.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasksData.filter((task) => {
      if (!task.EndDate) return false;
      const endDate = new Date(task.EndDate);
      endDate.setHours(0, 0, 0, 0);
      return endDate < today && task.F_StatusMaster && getStatusName(task.F_StatusMaster).toLowerCase() !== "completed";
    }).length;
  }, [tasksData, statusMasterData]);

  // Prepare status-wise chart data - calculate from tasksData if API data is empty
  const statusWiseChartData = useMemo(() => {
    // If API status-wise data is available, use it
    if (statusWiseData && statusWiseData.length > 0) {
      const labels = statusWiseData.map((item, index) => {
        if (item.StatusName) return item.StatusName;
        if (item.Name) return item.Name;
        if (item.Status) return item.Status;
        
        const statusId = item.F_StatusMaster || item.StatusId || item.Id;
        if (statusId !== undefined && statusId !== null) {
          const name = getStatusName(statusId);
          if (name && !name.startsWith("Status ")) return name;
        }
        
        return "Unknown";
      });

      const series = statusWiseData.map((item) => {
        return item.Count || item.TaskCount || item.Total || item.Quantity || 0;
      });

      return { labels, series };
    }

    // If API data is empty, calculate from tasksData
    if (!tasksData || tasksData.length === 0) {
      return {
        labels: [],
        series: [],
      };
    }

    // Count tasks by status
    const statusCounts = {};
    
    tasksData.forEach((task) => {
      if (!task.F_StatusMaster) {
        const key = "No Status";
        statusCounts[key] = (statusCounts[key] || 0) + 1;
        return;
      }

      const statusName = getStatusName(task.F_StatusMaster);
      if (statusName) {
        statusCounts[statusName] = (statusCounts[statusName] || 0) + 1;
      } else {
        const key = `Status ${task.F_StatusMaster}`;
        statusCounts[key] = (statusCounts[key] || 0) + 1;
      }
    });

    // Convert to arrays for chart
    const labels = Object.keys(statusCounts);
    const series = labels.map(statusName => statusCounts[statusName]);

    return { labels, series };
  }, [statusWiseData, tasksData, statusMasterData, getStatusName]);

  // Status-wise Bar Chart Data
  const statusBarChartOptions = useMemo(() => ({
    chart: {
      height: 350,
      type: "bar",
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        endingShape: "rounded",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    series: [
      {
        name: "Tasks",
        data: statusWiseChartData.series,
      },
    ],
    xaxis: {
      categories: statusWiseChartData.labels,
    },
    yaxis: {
      title: {
        text: "Number of Tasks",
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " tasks";
        },
      },
    },
    colors: ["#5C61F2"],
  }), [statusWiseChartData]);

  // Status-wise Pie Chart Data
  const statusPieChartOptions = useMemo(() => ({
    chart: {
      width: 380,
      type: "pie",
    },
    labels: statusWiseChartData.labels,
    series: statusWiseChartData.series,
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
    colors: ["#5C61F2", "#FF9766", "#51bb25", "#f8d62b", "#dc3545", "#6c757d", "#17a2b8"],
  }), [statusWiseChartData]);

  // Task Overview Radial Chart
  const taskOverviewRadialOptions = useMemo(() => {
    const totalTasks = tasksData.length || 0;
    
    // Categorize all tasks into three groups
    let completedTasks = 0;
    let inProgressTasks = 0;
    let pendingTasks = 0;
    
    tasksData.forEach((task) => {
      if (!task.F_StatusMaster) {
        pendingTasks++; // Tasks without status go to pending
        return;
      }
      
      const statusName = getStatusName(task.F_StatusMaster).toLowerCase();
      
      // Check for completed status
      if (
        statusName.includes("complete") ||
        statusName.includes("done") ||
        statusName.includes("finished") ||
        statusName.includes("success")
      ) {
        completedTasks++;
      }
      // Check for in progress status (including "Working On It")
      else if (
        statusName.includes("progress") ||
        statusName.includes("working on") ||
        statusName.includes("in progress") ||
        statusName.includes("active") ||
        statusName.includes("processing") ||
        statusName === "working on it"
      ) {
        inProgressTasks++;
      }
      // Everything else goes to pending (including Pause, Pending, Waiting, etc.)
      else {
        pendingTasks++;
      }
    });

    // Calculate percentages - ensure they add up correctly
    const completedPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const inProgressPercent = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0;
    const pendingPercent = totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0;

    return {
      chart: {
        height: 350,
        type: "radialBar",
      },
      plotOptions: {
        radialBar: {
          dataLabels: {
            name: {
              fontSize: "22px",
            },
            value: {
              fontSize: "16px",
            },
            total: {
              show: true,
              label: "Total Tasks",
              formatter: function () {
                return totalTasks.toString();
              },
            },
          },
        },
      },
      labels: ["Completed", "In Progress", "Pending"],
      series: [
        completedPercent,
        inProgressPercent,
        pendingPercent,
      ],
      colors: ["#51bb25", "#5C61F2", "#FF9766"],
    };
  }, [tasksData, statusMasterData, getStatusName]);

  // Overdue Tasks Chart
  const overdueTasksChartOptions = useMemo(() => {
    const totalTasks = tasksData.length || 0;
    const overdueCount = overdueTasks;
    const onTimeCount = totalTasks - overdueCount;

    return {
      chart: {
        height: 350,
        type: "bar",
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          dataLabels: {
            position: "top",
          },
        },
      },
      dataLabels: {
        enabled: true,
        offsetX: -6,
        style: {
          fontSize: "12px",
          colors: ["#fff"],
        },
      },
      series: [
        {
          data: [onTimeCount, overdueCount],
        },
      ],
      xaxis: {
        categories: ["On Time", "Overdue"],
      },
      colors: ["#51bb25", "#dc3545"],
    };
  }, [tasksData, overdueTasks]);

  // Priority-wise Task Chart
  const priorityChartData = useMemo(() => {
    if (!priorityData || priorityData.length === 0 || !tasksData || tasksData.length === 0) {
      return { labels: [], series: [] };
    }

    const priorityCounts = {};
    priorityData.forEach((priority) => {
      priorityCounts[priority.Id] = { name: priority.Name || `Priority ${priority.Id}`, count: 0 };
    });

    tasksData.forEach((task) => {
      const priorityId = task.F_PriorityMaster || task.PriorityId;
      if (priorityId && priorityCounts[priorityId]) {
        priorityCounts[priorityId].count++;
      }
    });

    return {
      labels: Object.values(priorityCounts).map(p => p.name),
      series: Object.values(priorityCounts).map(p => p.count),
    };
  }, [priorityData, tasksData]);

  const priorityChartOptions = useMemo(() => ({
    chart: {
      width: 380,
      type: "donut",
    },
    labels: priorityChartData.labels,
    series: priorityChartData.series,
    responsive: [{
      breakpoint: 480,
      options: {
        chart: { width: 200 },
        legend: { position: "bottom" },
      },
    }],
    colors: ["#dc3545", "#FF9766", "#f8d62b", "#51bb25", "#5C61F2"],
  }), [priorityChartData]);

  // Format date helper
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    try {
      // If date is in YYYY-MM-DD format, convert to DD-MM-YYYY
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split("-");
        return `${day}-${month}-${year}`;
      }
      // If already in DD-MM-YYYY format, return as is
      if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
        return dateString;
      }
      // Try to parse and format
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      }
    } catch (e) {
      // Ignore
    }
    return dateString;
  }, []);

  // Calculate additional metrics
  const taskMetrics = useMemo(() => {
    const total = tasksData.length;
    const completed = tasksData.filter(
      (task) => task.F_StatusMaster && getStatusName(task.F_StatusMaster).toLowerCase().includes("complete")
    ).length;
    const inProgress = tasksData.filter((task) => {
      if (!task.F_StatusMaster) return false;
      const statusName = getStatusName(task.F_StatusMaster).toLowerCase();
      return (
        statusName.includes("progress") ||
        statusName.includes("working on") ||
        statusName.includes("in progress") ||
        statusName.includes("active") ||
        statusName.includes("processing") ||
        statusName === "working on it"
      );
    }).length;
    const pending = tasksData.filter(
      (task) => task.F_StatusMaster && getStatusName(task.F_StatusMaster).toLowerCase().includes("pending")
    ).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Upcoming tasks (next 7 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999); // Include the entire 7th day
    
    const upcomingTasks = tasksData.filter((task) => {
      if (!task.EndDate) return false;
      
      // Try to parse the date - handle various date formats
      let endDate;
      try {
        // Handle date strings in different formats
        const dateStr = task.EndDate;
        if (typeof dateStr === 'string') {
          // If it's in DD-MM-YYYY format, convert it
          if (dateStr.includes('-') && dateStr.split('-').length === 3) {
            const parts = dateStr.split('-');
            if (parts[0].length <= 2 && parts[1].length <= 2) {
              // Likely DD-MM-YYYY format
              endDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            } else {
              endDate = new Date(dateStr);
            }
          } else {
            endDate = new Date(dateStr);
          }
        } else {
          endDate = new Date(dateStr);
        }
        
        if (isNaN(endDate.getTime())) {
          // Try alternative parsing
          endDate = new Date(task.EndDate);
          if (isNaN(endDate.getTime())) return false;
        }
      } catch (error) {
        console.warn("Date parsing error for task:", task.Id, task.EndDate, error);
        return false;
      }
      
      endDate.setHours(0, 0, 0, 0);
      const statusName = task.F_StatusMaster ? getStatusName(task.F_StatusMaster).toLowerCase() : "";
      
      // Include tasks that are not completed and have EndDate within next 7 days (including today)
      // Also include future tasks beyond 7 days if they're not completed
      const isTodayOrFuture = endDate >= today;
      const isWithin7Days = endDate <= nextWeek;
      const isNotCompleted = !statusName.includes("complete") && !statusName.includes("done") && !statusName.includes("finished");
      
      // Show tasks that are due today or in the next 7 days and not completed
      return isTodayOrFuture && isWithin7Days && isNotCompleted;
    }).sort((a, b) => {
      // Sort by EndDate ascending (earliest first)
      const dateA = new Date(a.EndDate);
      const dateB = new Date(b.EndDate);
      return dateA - dateB;
    });

    // Recent completed (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    const recentCompleted = tasksData.filter((task) => {
      if (!task.LastUpdateOn) return false;
      const updateDate = new Date(task.LastUpdateOn);
      updateDate.setHours(0, 0, 0, 0);
      const statusName = task.F_StatusMaster ? getStatusName(task.F_StatusMaster).toLowerCase() : "";
      return updateDate >= weekAgo && statusName.includes("complete");
    });

    return {
      total,
      completed,
      inProgress,
      pending,
      overdue: overdueTasks,
      completionRate,
      upcomingTasks: upcomingTasks.length,
      recentCompleted: recentCompleted.length,
      upcomingTasksList: upcomingTasks.slice(0, 5),
      recentCompletedList: recentCompleted.slice(0, 5),
    };
  }, [tasksData, overdueTasks, statusMasterData, getStatusName]);

  if (loading) {
    return (
      <div className="page-body">
        <Breadcrumbs mainTitle="My Reports" parent="Dashboard" />
        <Container flId>
          <Row>
            <Col>
              <Card>
                <CardBody className="text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                  <p className="mt-3">Loading report data...</p>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-body">
      <Breadcrumbs mainTitle="My Reports" parent="Dashboard" />
      <Container flId>
        {/* Quick Stats Overview */}
        <Row className="mb-3">
          <Col xl="3" md="6" sm="6">
            <Card className="text-center">
              <CardBody>
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <div className="bg-primary rounded-circle p-3 me-3" style={{ minWidth: "60px", minHeight: "60px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="icofont icofont-list text-white" style={{ fontSize: "32px" }}></i>
                  </div>
                  <div className="text-start">
                    <h3 className="mb-0 f-w-600">{taskMetrics.total}</h3>
                    <p className="mb-0 text-muted">Total Tasks</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col xl="3" md="6" sm="6">
            <Card className="text-center">
              <CardBody>
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <div className="bg-success rounded-circle p-3 me-3" style={{ minWidth: "60px", minHeight: "60px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="icofont icofont-check-circled text-white" style={{ fontSize: "32px" }}></i>
                  </div>
                  <div className="text-start">
                    <h3 className="mb-0 f-w-600">{taskMetrics.completed}</h3>
                    <p className="mb-0 text-muted">Completed</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col xl="3" md="6" sm="6">
            <Card className="text-center">
              <CardBody>
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <div className="bg-warning rounded-circle p-3 me-3" style={{ minWidth: "60px", minHeight: "60px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="icofont icofont-calendar text-white" style={{ fontSize: "32px" }}></i>
                  </div>
                  <div className="text-start">
                    <h3 className="mb-0 f-w-600">{taskMetrics.upcomingTasks}</h3>
                    <p className="mb-0 text-muted">Upcoming (7 days)</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col xl="3" md="6" sm="6">
            <Card className="text-center">
              <CardBody>
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <div className="bg-danger rounded-circle p-3 me-3" style={{ minWidth: "60px", minHeight: "60px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="icofont icofont-warning text-white" style={{ fontSize: "32px" }}></i>
                  </div>
                  <div className="text-start">
                    <h3 className="mb-0 f-w-600">{taskMetrics.overdue}</h3>
                    <p className="mb-0 text-muted">Overdue</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Card>
          <CardBody>
            <Nav tabs className="nav-tabs border-tab">
              <NavItem>
                <NavLink
                  className={activeTab === "1" ? "active" : ""}
                  onClick={() => setActiveTab("1")}
                  style={{ cursor: "pointer" }}
                >
                  <i className="icofont icofont-ui-home"></i> My Tasks
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={activeTab === "2" ? "active" : ""}
                  onClick={() => setActiveTab("2")}
                  style={{ cursor: "pointer" }}
                >
                  <i className="icofont icofont-chart-line"></i> Performance
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={activeTab === "3" ? "active" : ""}
                  onClick={() => setActiveTab("3")}
                  style={{ cursor: "pointer" }}
                >
                  <i className="icofont icofont-calendar"></i> Upcoming Tasks
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={activeTab === "4" ? "active" : ""}
                  onClick={() => setActiveTab("4")}
                  style={{ cursor: "pointer" }}
                >
                  <i className="icofont icofont-list"></i> Task Details
                </NavLink>
              </NavItem>
            </Nav>
            <TabContent activeTab={activeTab}>
              {/* My Tasks Tab */}
              <TabPane tabId="1">
                <Row className="mt-3">
                  {/* Status-wise Bar Chart */}
                  <Col xl="6" lg="12">
                    <Card>
                      <CardHeaderCommon
                        title="My Tasks by Status"
                        span={[{ text: "Number of my tasks grouped by status" }]}
                      />
                      <CardBody>
                        {statusWiseChartData.series.length > 0 ? (
                          <ReactApexChart
                            options={statusBarChartOptions}
                            series={statusBarChartOptions.series}
                            type="bar"
                            height={350}
                          />
                        ) : (
                          <div className="text-center p-4">
                            <p className="text-muted">No data available</p>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </Col>

                  {/* Overdue Tasks Chart */}
                  <Col xl="6" lg="12">
                    <Card>
                      <CardHeaderCommon
                        title="Task Timeline Status"
                        span={[{ text: "On-time vs overdue tasks comparison" }]}
                      />
                      <CardBody>
                        {tasksData.length > 0 ? (
                          <ReactApexChart
                            options={overdueTasksChartOptions}
                            series={overdueTasksChartOptions.series}
                            type="bar"
                            height={350}
                          />
                        ) : (
                          <div className="text-center p-4">
                            <p className="text-muted">No tasks data available</p>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </Col>

                  {/* Status-wise Pie Chart */}
                  <Col xl="6" lg="12">
                    <Card>
                      <CardHeaderCommon
                        title="Status Distribution"
                        span={[{ text: "Distribution of my tasks across different statuses" }]}
                      />
                      <CardBody>
                        {statusWiseChartData.series.length > 0 ? (
                          <div className="d-flex justify-content-center">
                            <ReactApexChart
                              options={statusPieChartOptions}
                              series={statusPieChartOptions.series}
                              type="pie"
                              width={380}
                            />
                          </div>
                        ) : (
                          <div className="text-center p-4">
                            <p className="text-muted">No data available</p>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </Col>

                  {/* Priority Distribution Chart */}
                  <Col xl="6" lg="12">
                    <Card>
                      <CardHeaderCommon
                        title="Task Priority Distribution"
                        span={[{ text: "My tasks grouped by priority levels" }]}
                      />
                      <CardBody>
                        {priorityChartData.series.length > 0 ? (
                          <div className="d-flex justify-content-center">
                            <ReactApexChart
                              options={priorityChartOptions}
                              series={priorityChartOptions.series}
                              type="donut"
                              width={380}
                            />
                          </div>
                        ) : (
                          <div className="text-center p-4">
                            <p className="text-muted">No priority data available</p>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </Col>

                  {/* Task Overview Radial Chart */}
                  <Col xl="6" lg="12">
                    <Card>
                      <CardHeaderCommon
                        title="Task Progress Overview"
                        span={[{ text: "My task completion progress" }]}
                      />
                      <CardBody>
                        {tasksData.length > 0 ? (
                          <ReactApexChart
                            options={taskOverviewRadialOptions}
                            series={taskOverviewRadialOptions.series}
                            type="radialBar"
                            height={350}
                          />
                        ) : (
                          <div className="text-center p-4">
                            <p className="text-muted">No tasks data available</p>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </Col>

                  {/* Summary Stats Card */}
                  <Col xl="6" lg="12">
                    <Card>
                      <CardHeaderCommon
                        title="My Task Summary"
                        span={[{ text: "Key metrics and statistics" }]}
                      />
                      <CardBody>
                        <Row className="g-3">
                          <Col sm="6">
                            <div className="p-3 bg-light rounded">
                              <h5 className="text-primary mb-1">{tasksData.length}</h5>
                              <p className="mb-0 text-muted">Total Tasks</p>
                            </div>
                          </Col>
                          <Col sm="6">
                            <div className="p-3 bg-light rounded">
                              <h5 className="text-danger mb-1">{overdueTasks}</h5>
                              <p className="mb-0 text-muted">Overdue Tasks</p>
                            </div>
                          </Col>
                          <Col sm="6">
                            <div className="p-3 bg-light rounded">
                              <h5 className="text-success mb-1">
                                {tasksData.filter(
                                  (task) =>
                                    task.F_StatusMaster &&
                                    getStatusName(task.F_StatusMaster)
                                      .toLowerCase()
                                      .includes("complete")
                                ).length}
                              </h5>
                              <p className="mb-0 text-muted">Completed</p>
                            </div>
                          </Col>
                          <Col sm="6">
                            <div className="p-3 bg-light rounded">
                              <h5 className="text-info mb-1">
                                {tasksData.filter(
                                  (task) =>
                                    task.F_StatusMaster &&
                                    getStatusName(task.F_StatusMaster)
                                      .toLowerCase()
                                      .includes("progress")
                                ).length}
                              </h5>
                              <p className="mb-0 text-muted">In Progress</p>
                            </div>
                          </Col>
                        </Row>
                      </CardBody>
                    </Card>
                  </Col>
                </Row>
              </TabPane>

              {/* Performance Tab */}
              <TabPane tabId="2">
                <Row className="mt-3">
                  {/* Performance Summary */}
                  <Col xl="12" lg="12">
                    <Card>
                      <CardHeaderCommon
                        title="My Performance Summary"
                        span={[{ text: "Comprehensive performance metrics" }]}
                      />
                      <CardBody>
                        <Row className="g-3">
                          <Col sm="6" md="3">
                            <div className="p-4 bg-primary text-white rounded text-center">
                              <h3 className="mb-1">{tasksData.length}</h3>
                              <p className="mb-0">Total Tasks</p>
                            </div>
                          </Col>
                          <Col sm="6" md="3">
                            <div className="p-4 bg-success text-white rounded text-center">
                              <h3 className="mb-1">
                                {tasksData.filter(
                                  (task) =>
                                    task.F_StatusMaster &&
                                    getStatusName(task.F_StatusMaster)
                                      .toLowerCase()
                                      .includes("complete")
                                ).length}
                              </h3>
                              <p className="mb-0">Completed</p>
                            </div>
                          </Col>
                          <Col sm="6" md="3">
                            <div className="p-4 bg-info text-white rounded text-center">
                              <h3 className="mb-1">{overdueTasks}</h3>
                              <p className="mb-0">Overdue</p>
                            </div>
                          </Col>
                          <Col sm="6" md="3">
                            <div className="p-4 bg-warning text-white rounded text-center">
                              <h3 className="mb-1">
                                {tasksData.length > 0
                                  ? Math.round(
                                      (tasksData.filter(
                                        (task) =>
                                          task.F_StatusMaster &&
                                          getStatusName(task.F_StatusMaster)
                                            .toLowerCase()
                                            .includes("complete")
                                      ).length /
                                        tasksData.length) *
                                        100
                                    )
                                  : 0}
                                %
                              </h3>
                              <p className="mb-0">Completion Rate</p>
                            </div>
                          </Col>
                        </Row>
                      </CardBody>
                    </Card>
                  </Col>

                  {/* Task Completion Rate */}
                  <Col xl="6" lg="12">
                    <Card>
                      <CardHeaderCommon
                        title="Task Completion Rate"
                        span={[{ text: "Percentage of completed tasks" }]}
                      />
                      <CardBody>
                        {tasksData.length > 0 ? (
                          <ReactApexChart
                            options={taskOverviewRadialOptions}
                            series={taskOverviewRadialOptions.series}
                            type="radialBar"
                            height={350}
                          />
                        ) : (
                          <div className="text-center p-4">
                            <p className="text-muted">No tasks data available</p>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </Col>

                  {/* Overdue Tasks */}
                  <Col xl="6" lg="12">
                    <Card>
                      <CardHeaderCommon
                        title="Task Timeline Status"
                        span={[{ text: "On-time vs overdue tasks" }]}
                      />
                      <CardBody>
                        {tasksData.length > 0 ? (
                          <ReactApexChart
                            options={overdueTasksChartOptions}
                            series={overdueTasksChartOptions.series}
                            type="bar"
                            height={350}
                          />
                        ) : (
                          <div className="text-center p-4">
                            <p className="text-muted">No tasks data available</p>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </Col>
                </Row>
              </TabPane>

              {/* Upcoming Tasks Tab */}
              <TabPane tabId="3">
                <Row className="mt-3">
                  <Col xl="12" lg="12">
                    <Card>
                      <CardHeaderCommon
                        title="Upcoming Tasks (Next 7 Days)"
                        span={[{ text: "Tasks with deadlines in the next week" }]}
                      />
                      <CardBody>
                        {taskMetrics.upcomingTasksList.length > 0 ? (
                          <div className="table-responsive">
                            <Table striped hover>
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Task Name</th>
                                  <th>Status</th>
                                  <th>Priority</th>
                                  <th>End Date</th>
                                  <th>Days Remaining</th>
                                </tr>
                              </thead>
                              <tbody>
                                {taskMetrics.upcomingTasksList.map((task, index) => {
                                  const endDate = task.EndDate ? new Date(task.EndDate) : null;
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  const daysRemaining = endDate ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : null;
                                  const statusName = task.F_StatusMaster ? getStatusName(task.F_StatusMaster) : "Unknown";
                                  const priorityName = priorityData.find(p => p.Id === task.F_PriorityMaster)?.Name || "N/A";
                                  
                                  return (
                                    <tr key={task.Id || index}>
                                      <td>{index + 1}</td>
                                      <td>{task.Name || "N/A"}</td>
                                      <td>
                                        <span className={`badge ${
                                          statusName.toLowerCase().includes("complete") ? "bg-success" :
                                          statusName.toLowerCase().includes("progress") ? "bg-primary" :
                                          statusName.toLowerCase().includes("pending") ? "bg-warning" :
                                          "bg-secondary"
                                        }`}>
                                          {statusName}
                                        </span>
                                      </td>
                                      <td>
                                        <span className={`badge ${
                                          priorityName.toLowerCase().includes("high") || priorityName.toLowerCase().includes("critical") ? "bg-danger" :
                                          priorityName.toLowerCase().includes("medium") ? "bg-warning" :
                                          "bg-info"
                                        }`}>
                                          {priorityName}
                                        </span>
                                      </td>
                                      <td>{formatDate(task.EndDate)}</td>
                                      <td>
                                        {daysRemaining !== null ? (
                                          <span className={`badge ${
                                            daysRemaining <= 1 ? "bg-danger" :
                                            daysRemaining <= 3 ? "bg-warning" :
                                            "bg-success"
                                          }`}>
                                            {daysRemaining} {daysRemaining === 1 ? "day" : "days"}
                                          </span>
                                        ) : "N/A"}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </Table>
                          </div>
                        ) : (
                          <div className="text-center p-4">
                            <p className="text-muted">No upcoming tasks in the next 7 days</p>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </Col>

                  {/* Recent Completed Tasks */}
                  <Col xl="12" lg="12" className="mt-3">
                    <Card>
                      <CardHeaderCommon
                        title="Recently Completed Tasks (Last 7 Days)"
                        span={[{ text: "Tasks you've completed recently" }]}
                      />
                      <CardBody>
                        {taskMetrics.recentCompletedList.length > 0 ? (
                          <div className="table-responsive">
                            <Table striped hover>
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Task Name</th>
                                  <th>Priority</th>
                                  <th>Completed Date</th>
                                  <th>Completion Time</th>
                                </tr>
                              </thead>
                              <tbody>
                                {taskMetrics.recentCompletedList.map((task, index) => {
                                  const priorityName = priorityData.find(p => p.Id === task.F_PriorityMaster)?.Name || "N/A";
                                  const completedDate = task.LastUpdateOn ? new Date(task.LastUpdateOn) : null;
                                  const createdDate = task.DateOfCreation ? new Date(task.DateOfCreation) : null;
                                  const completionTime = completedDate && createdDate ? 
                                    Math.ceil((completedDate - createdDate) / (1000 * 60 * 60 * 24)) : null;
                                  
                                  return (
                                    <tr key={task.Id || index}>
                                      <td>{index + 1}</td>
                                      <td>{task.Name || "N/A"}</td>
                                      <td>
                                        <span className={`badge ${
                                          priorityName.toLowerCase().includes("high") || priorityName.toLowerCase().includes("critical") ? "bg-danger" :
                                          priorityName.toLowerCase().includes("medium") ? "bg-warning" :
                                          "bg-info"
                                        }`}>
                                          {priorityName}
                                        </span>
                                      </td>
                                      <td>{formatDate(task.LastUpdateOn)}</td>
                                      <td>
                                        {completionTime !== null ? (
                                          <span className="badge bg-success">
                                            {completionTime} {completionTime === 1 ? "day" : "days"}
                                          </span>
                                        ) : "N/A"}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </Table>
                          </div>
                        ) : (
                          <div className="text-center p-4">
                            <p className="text-muted">No tasks completed in the last 7 days</p>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </Col>
                </Row>
              </TabPane>

              {/* Task Details Tab */}
              <TabPane tabId="4">
                <Row className="mt-3">
                  <Col xl="12" lg="12">
                    <Card>
                      <CardHeaderCommon
                        title="All My Tasks"
                        span={[{ text: "Complete list of all your tasks with details" }]}
                      />
                      <CardBody>
                        {tasksData.length > 0 ? (
                          <div className="table-responsive">
                            <Table striped hover>
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Task Name</th>
                                  <th>Status</th>
                                  <th>Priority</th>
                                  <th>Start Date</th>
                                  <th>End Date</th>
                                  <th>Days Left</th>
                                  <th>Last Updated</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tasksData.map((task, index) => {
                                  const endDate = task.EndDate ? new Date(task.EndDate) : null;
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  const daysRemaining = endDate ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : null;
                                  const statusName = task.F_StatusMaster ? getStatusName(task.F_StatusMaster) : "Unknown";
                                  const priorityName = priorityData.find(p => p.Id === task.F_PriorityMaster)?.Name || "N/A";
                                  const isOverdue = endDate && endDate < today && !statusName.toLowerCase().includes("complete");
                                  
                                  return (
                                    <tr key={task.Id || index} className={isOverdue ? "table-danger" : ""}>
                                      <td>{index + 1}</td>
                                      <td>
                                        <strong>{task.Name || "N/A"}</strong>
                                        {task.Note && (
                                          <div className="text-muted small mt-1">{task.Note.substring(0, 50)}{task.Note.length > 50 ? "..." : ""}</div>
                                        )}
                                      </td>
                                      <td>
                                        <span className={`badge ${
                                          statusName.toLowerCase().includes("complete") ? "bg-success" :
                                          statusName.toLowerCase().includes("progress") ? "bg-primary" :
                                          statusName.toLowerCase().includes("pending") ? "bg-warning" :
                                          statusName.toLowerCase().includes("pause") ? "bg-info" :
                                          "bg-secondary"
                                        }`}>
                                          {statusName}
                                        </span>
                                      </td>
                                      <td>
                                        <span className={`badge ${
                                          priorityName.toLowerCase().includes("high") || priorityName.toLowerCase().includes("critical") ? "bg-danger" :
                                          priorityName.toLowerCase().includes("medium") ? "bg-warning" :
                                          priorityName.toLowerCase().includes("low") ? "bg-info" :
                                          "bg-secondary"
                                        }`}>
                                          {priorityName}
                                        </span>
                                      </td>
                                      <td>{formatDate(task.StartDate)}</td>
                                      <td>
                                        {formatDate(task.EndDate)}
                                        {isOverdue && (
                                          <span className="badge bg-danger ms-2">Overdue</span>
                                        )}
                                      </td>
                                      <td>
                                        {daysRemaining !== null ? (
                                          <span className={`badge ${
                                            daysRemaining <= 1 ? "bg-danger" :
                                            daysRemaining <= 3 ? "bg-warning" :
                                            daysRemaining <= 7 ? "bg-info" :
                                            "bg-success"
                                          }`}>
                                            {daysRemaining} {daysRemaining === 1 ? "day" : "days"}
                                          </span>
                                        ) : "N/A"}
                                      </td>
                                      <td>{formatDate(task.LastUpdateOn)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </Table>
                          </div>
                        ) : (
                          <div className="text-center p-4">
                            <p className="text-muted">No tasks available</p>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </Col>

                  {/* Additional Stats */}
                  <Col xl="12" lg="12" className="mt-3">
                    <Row>
                      <Col md="4">
                        <Card className="text-center">
                          <CardBody>
                            <div className="p-3 bg-light rounded mb-2">
                              <h4 className="text-primary mb-1">{taskMetrics.completionRate}%</h4>
                              <p className="mb-0 text-muted">Completion Rate</p>
                            </div>
                          </CardBody>
                        </Card>
                      </Col>
                      <Col md="4">
                        <Card className="text-center">
                          <CardBody>
                            <div className="p-3 bg-light rounded mb-2">
                              <h4 className="text-info mb-1">{taskMetrics.inProgress}</h4>
                              <p className="mb-0 text-muted">In Progress</p>
                            </div>
                          </CardBody>
                        </Card>
                      </Col>
                      <Col md="4">
                        <Card className="text-center">
                          <CardBody>
                            <div className="p-3 bg-light rounded mb-2">
                              <h4 className="text-success mb-1">{taskMetrics.recentCompleted}</h4>
                              <p className="mb-0 text-muted">Completed This Week</p>
                            </div>
                          </CardBody>
                        </Card>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </TabPane>
            </TabContent>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default EmployeeReport;

