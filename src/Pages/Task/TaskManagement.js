import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { Card, CardBody, Col, Container, Input, Label, Row, Badge, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap";
import DataTable from "react-data-table-component";
import _ from "lodash";
import { MessageCircle, Trash2, Save } from "react-feather";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_DeleteData, Fn_AddEditData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import SidebarChat from "./SidebarChat";

const TaskManagement = () => {
  const [state, setState] = useState({
    Id: 0,
    FillArray: [],
    FillArray1: [],
    FillArray2: [],
    FillArray3: [],
    formData: {},
    OtherDataScore: [],
    isProgress: true,
  });
  const [taskList, setTaskList] = useState([]);
  const [userType, setUserYType] = useState(0);
  const [saveStatus, setSaveStatus] = useState("");
  const [syncStatus, setSyncStatus] = useState("idle");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [filterText, setFilterText] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [expandedRows, setExpandedRows] = useState({});
  const [subTaskLists, setSubTaskLists] = useState({});
  const [openChatTask, setOpenChatTask] = useState(null);
  const [pendingFiles, setPendingFiles] = useState({});

  const dispatch = useDispatch();
  const location = useLocation();

  const API_URL = API_WEB_URLS.MASTER + "/0/token/GetUserByType";
  const API_Data = API_WEB_URLS.MASTER + "/0/token/StatusMaster";
  const API_Data1 = API_WEB_URLS.MASTER + "/0/token/PriorityMaster";
  const API_URL2 = API_WEB_URLS.MASTER + "/0/token/NewTaskCreate";
  const API_URL4 = API_WEB_URLS.MASTER + "/0/token/GetTasks";
  const API_URL5 = API_WEB_URLS.MASTER + "/0/token/NewSubTaskCreate";
  const API_URL6 = API_WEB_URLS.MASTER + "/0/token/GetSubTasks";
  const API_Delete = API_WEB_URLS.MASTER + "/0/token/DeleteTask";

  // Check if user is admin (F_UserType == 8)
  const isUserAdmin = () => {
    try {
      const obj = JSON.parse(localStorage.getItem("authUser"));
      console.log(obj);
      return obj && obj.F_UserType === 8;
    } catch (error) {
      console.error("Error parsing authUser from localStorage:", error);
      return false;
    }
  };

  const isAdmin = isUserAdmin();

  // Helper functions
  const stringToArray = (stringValue, array) => {
    if (!stringValue || typeof stringValue !== "string") return [];
    if (!array || !Array.isArray(array)) return [];
    const ids = stringValue.split(",").map((id) => id.trim());
    return array.filter((item) => ids.includes(item.Id.toString()));
  };

  const arrayToString = (array) => {
    if (!array || array.length === 0) return "";
    return array.map((item) => item.Id).join(",");
  };

  const sortTasksByCreation = useCallback((tasks) => {
    if (!Array.isArray(tasks)) return [];
    const toTime = (item = {}) => {
      const timestamp = item.DateOfCreation || item.LastUpdateOn || 0;
      const parsed = Date.parse(timestamp);
      return Number.isNaN(parsed) ? 0 : parsed;
    };
    return [...tasks].sort((a = {}, b = {}) => {
      if (a?.isNew && !b?.isNew) return -1;
      if (!a?.isNew && b?.isNew) return 1;
      return toTime(b) - toTime(a);
    });
  }, []);

  const handleIdsArray = (idsValue) => {
    if (!idsValue) return [];
    if (Array.isArray(idsValue)) {
      return idsValue;
    }
    if (typeof idsValue === "string") {
      const ids = idsValue.split(",").map((id) => id.trim()).filter((id) => id);
      return ids.map((id) => ({ Id: parseInt(id) }));
    }
    return [];
  };

  const getDisplayValues = (idsValue, masterArray) => {
    const idsArray = handleIdsArray(idsValue);
    if (!masterArray || !Array.isArray(masterArray)) return [];
    return idsArray.map((idObj) => {
      const masterItem = masterArray.find((item) => item.Id === idObj.Id);
      return masterItem || idObj;
    });
  };

  const handleFieldChange = (taskId, fieldName, value) => {
    setTaskList((prev) => {
      const updated = prev.map((task) =>
        task.Id === taskId
          ? {
              ...task,
              [fieldName]: value,
              LastUpdated: new Date().toLocaleTimeString(),
              LastUpdateOn: new Date().toISOString(),
            }
          : task
      );

      const sortedUpdated = sortTasksByCreation(updated);

      setTimeout(() => {
        localStorage.setItem("tasks", JSON.stringify(sortedUpdated));
      }, 100);

      const task = sortedUpdated.find((t) => t.Id === taskId);
      if (task && !task.isNew) {
        debouncedSave(taskId, fieldName, value);
      }

      return sortedUpdated;
    });
  };

  const createNewTask = async () => {
    try {
      const obj = JSON.parse(localStorage.getItem("authUser"));
      const newTaskId = await getNextTaskId();

      const newTask = {
        Id: newTaskId,
        Name: "",
        Chat: "",
        OwnerIds: "",
        EmployeeIds: "",
        F_StatusMaster: "",
        StartDate: new Date().toISOString().split("T")[0],
        EndDate: new Date().toISOString().split("T")[0],
        F_PriorityMaster: "",
        Note: "",
        Budget: "",
        File: "",
        Timeline: "",
        DateOfCreation: new Date().toISOString(),
        LastUpdateOn: new Date().toISOString(),
        UserId: obj.Id,
        isNew: true,
      };

      setTaskList((prev) => sortTasksByCreation([newTask, ...prev]));
      setEditingTaskId(newTaskId);

      setTimeout(() => {
        const existingTasks = JSON.parse(localStorage.getItem("tasks") || "[]");
        const safeExisting = Array.isArray(existingTasks) ? existingTasks : [];
        const updatedTasks = sortTasksByCreation([newTask, ...safeExisting]);
        localStorage.setItem("tasks", JSON.stringify(updatedTasks));
      }, 100);
    } catch (error) {
      console.error("Error creating new task:", error);
      alert("Failed to create new task. Please try again.");
    }
  };

  const handleSaveNewTask = async (taskId) => {
    const task = taskList.find((t) => t.Id === taskId);
    if (!task || !task.isNew) return;

    if (!task.Name || task.Name.trim() === "") {
      alert("Please enter a task name");
      return;
    }

    try {
      const obj = JSON.parse(localStorage.getItem("authUser"));
      const formData = new FormData();
      formData.append("Name", task.Name || "");
      formData.append("Chat", task.Chat || "");
      formData.append("OwnerIds", task.OwnerIds || "");
      formData.append("EmployeeIds", task.EmployeeIds || "");
      formData.append("F_StatusMaster", task.F_StatusMaster || "");
      formData.append("StartDate", task.StartDate || "");
      formData.append("EndDate", task.EndDate || "");
      formData.append("F_PriorityMaster", task.F_PriorityMaster || "");
      formData.append("Note", task.Note || "");
      formData.append("Budget", task.Budget || "");
      const pendingFile = pendingFiles[taskId];
      if (pendingFile) {
        formData.append("File", pendingFile);
      } else {
        formData.append("File", task.File || "");
      }
      formData.append("UserId", obj.Id);

      await Fn_AddEditData(
        dispatch,
        setState,
        { arguList: { id: 0, formData: formData } },
        "NewTaskCreate/0/token",
        true,
        "memberid",
        null,
        null
      );

      const updatedTask = { ...task, isNew: false };
      setTaskList((prev) =>
        sortTasksByCreation(
          prev.map((t) => (t.Id === taskId ? updatedTask : t))
        )
      );
      setEditingTaskId(null);
      setPendingFiles((prev) => {
        const updated = { ...prev };
        delete updated[taskId];
        return updated;
      });
      loadTasks();
    } catch (error) {
      console.error("Error saving new task:", error);
      alert("Failed to save task. Please try again.");
    }
  };

  const toggleDropdown = (taskId, field) => {
    const key = `${taskId}-${field}`;
    setOpenDropdowns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleExpandRow = async (row) => {
    const isExpanded = expandedRows[row.Id];
    
    if (isExpanded) {
      // Collapse
      setExpandedRows((prev) => {
        const newExpanded = { ...prev };
        delete newExpanded[row.Id];
        return newExpanded;
      });
    } else {
      // Expand - load subtasks if not already loaded
      setExpandedRows((prev) => ({
        ...prev,
        [row.Id]: true,
      }));
      
      if (!subTaskLists[row.Id]) {
        try {
          const subTasks = await getSubTasks(row.Id);
          setSubTaskLists((prev) => ({
            ...prev,
            [row.Id]: subTasks || [],
          }));
        } catch (error) {
          console.error("Error loading subtasks:", error);
          setSubTaskLists((prev) => ({
            ...prev,
            [row.Id]: [],
          }));
        }
      }
    }
  };

  const renderMultiSelect = (taskId, field, array, stringValue) => {
    const safeArray = Array.isArray(array) ? array : [];
    const displayValues = getDisplayValues(stringValue, safeArray);

    if (isAdmin) {
      const dropdownKey = `${taskId}-${field}`;
      const isOpen = openDropdowns[dropdownKey] || false;

      const handleSelect = (item) => {
        const currentIdsArray = handleIdsArray(stringValue);
        const isSelected = currentIdsArray.some((idObj) => idObj.Id === item.Id);

        let updatedArray;
        if (isSelected) {
          updatedArray = currentIdsArray.filter((idObj) => idObj.Id !== item.Id);
        } else {
          updatedArray = [...currentIdsArray, { Id: item.Id }];
        }

        const updatedString = arrayToString(updatedArray);
        handleFieldChange(taskId, field, updatedString);
      };

      const handleRemove = (itemId) => {
        const currentIdsArray = handleIdsArray(stringValue);
        const updatedArray = currentIdsArray.filter((idObj) => idObj.Id !== itemId);
        const updatedString = arrayToString(updatedArray);
        handleFieldChange(taskId, field, updatedString);
      };

      // Get button text based on selected items
      const getButtonText = () => {
        if (displayValues.length === 0) {
          return `Select ${field === "OwnerIds" ? "Owners" : "Employees"}`;
        } else if (displayValues.length === 1) {
          return displayValues[0].Name;
        } else {
          // Show first name + count
          const remainingCount = displayValues.length - 1;
          return `${displayValues[0].Name} +${remainingCount}`;
        }
      };

      return (
        <div style={{ minWidth: "250px", maxWidth: "300px", position: "relative", zIndex: isOpen ? 1050 : "auto" }}>
          <Dropdown
            isOpen={isOpen}
            toggle={() => toggleDropdown(taskId, field)}
            direction="down"
          >
            <DropdownToggle
              caret
              tag="button"
              type="button"
              style={{
                width: "100%",
                textAlign: "left",
                padding: "0.375rem 0.75rem",
                backgroundColor: "#fff",
                border: "1px solid rgba(0,0,0,0.15)",
                color: "#212529",
                fontSize: "0.875rem",
                boxShadow: "none",
              }}
              className="btn btn-light"
            >
              {getButtonText()}
            </DropdownToggle>
            <DropdownMenu
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                minWidth: "250px",
                backgroundColor: "#fff",
                border: "1px solid rgba(0,0,0,0.15)",
                borderRadius: "0.25rem",
                boxShadow: "0 0.5rem 1rem rgba(0,0,0,0.15)",
                marginTop: "0.125rem",
                zIndex: 9999,
              }}
              container="body"
            >
              {safeArray.length === 0 ? (
                <DropdownItem disabled>
                  <span className="text-muted">No options available</span>
                </DropdownItem>
              ) : (
                safeArray.map((item) => {
                  const isSelected = displayValues.some((dv) => dv.Id === item.Id);
                  return (
                    <DropdownItem
                      key={item.Id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelect(item);
                      }}
                      style={{
                        backgroundColor: isSelected ? "rgba(92, 97, 242, 0.1)" : "#fff",
                        color: "#212529",
                        cursor: "pointer",
                        padding: "0.5rem 1rem",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.target.style.backgroundColor = "#f8f9fa";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.target.style.backgroundColor = "#fff";
                        } else {
                          e.target.style.backgroundColor = "rgba(92, 97, 242, 0.1)";
                        }
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between">
                        <span style={{ fontWeight: isSelected ? 500 : 400 }}>{item.Name}</span>
                        {isSelected && (
                          <i className="fa fa-check text-primary ms-2"></i>
                        )}
                      </div>
                    </DropdownItem>
                  );
                })
              )}
            </DropdownMenu>
          </Dropdown>
        </div>
      );
    } else {
      return (
        <div style={{ minWidth: "180px" }}>
          {displayValues.length > 0 ? (
            <div className="d-flex flex-wrap gap-1">
              {displayValues.map((item) => (
                <Badge key={item.Id} color="primary" pill style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}>
                  {item.Name}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted">-</span>
          )}
        </div>
      );
    }
  };

  // Helper function to get background color based on status/priority name
  const getStatusColor = (name) => {
    if (!name) return null;
    const nameLower = name.toLowerCase();
    
    // Specific status colors - check specific cases first
    if (nameLower.includes('pause') || nameLower.includes('paused')) {
      return { backgroundColor: 'rgba(68, 168, 215, 0.15)', color: '#44A8D7', borderColor: 'rgba(68, 168, 215, 0.3)' }; // Info - Blue
    }
    if (nameLower.includes('delayed')) {
      return { backgroundColor: 'rgba(248, 31, 88, 0.15)', color: '#F81F58', borderColor: 'rgba(248, 31, 88, 0.3)' }; // Danger - Red
    }
    if (nameLower.includes('working on it') || nameLower.includes('working on')) {
      return { backgroundColor: 'rgba(92, 97, 242, 0.15)', color: '#5C61F2', borderColor: 'rgba(92, 97, 242, 0.3)' }; // Primary - Purple/Blue
    }
    
    // General status colors
    if (nameLower.includes('pending') || nameLower.includes('waiting') || nameLower.includes('on hold')) {
      return { backgroundColor: 'rgba(231, 174, 47, 0.15)', color: '#E7AE2F', borderColor: 'rgba(231, 174, 47, 0.3)' }; // Warning - Yellow
    }
    if (nameLower.includes('in progress') || nameLower.includes('processing') || nameLower.includes('active')) {
      return { backgroundColor: 'rgba(92, 97, 242, 0.15)', color: '#5C61F2', borderColor: 'rgba(92, 97, 242, 0.3)' }; // Primary - Purple/Blue
    }
    if (nameLower.includes('completed') || nameLower.includes('done') || nameLower.includes('finished') || nameLower.includes('success')) {
      return { backgroundColor: 'rgba(97, 174, 65, 0.15)', color: '#61AE41', borderColor: 'rgba(97, 174, 65, 0.3)' }; // Success - Green
    }
    if (nameLower.includes('cancelled') || nameLower.includes('cancelled') || nameLower.includes('failed') || nameLower.includes('error')) {
      return { backgroundColor: 'rgba(248, 31, 88, 0.15)', color: '#F81F58', borderColor: 'rgba(248, 31, 88, 0.3)' }; // Danger - Red
    }
    if (nameLower.includes('review') || nameLower.includes('testing') || nameLower.includes('qa')) {
      return { backgroundColor: 'rgba(68, 168, 215, 0.15)', color: '#44A8D7', borderColor: 'rgba(68, 168, 215, 0.3)' }; // Info - Cyan
    }
    
    // Default color if no match
    return { backgroundColor: 'rgba(92, 97, 242, 0.1)', color: '#5C61F2', borderColor: 'rgba(92, 97, 242, 0.2)' }; // Primary light
  };

  const getPriorityColor = (name) => {
    if (!name) return null;
    const nameLower = name.toLowerCase();
    
    // Specific priority colors - check specific cases first
    if (nameLower.includes('critical')) {
      return { backgroundColor: 'rgba(248, 31, 88, 0.15)', color: '#F81F58', borderColor: 'rgba(248, 31, 88, 0.3)' }; // Danger - Red
    }
    if (nameLower.includes('high') || nameLower.includes('urgent')) {
      return { backgroundColor: 'rgba(231, 174, 47, 0.15)', color: '#E7AE2F', borderColor: 'rgba(231, 174, 47, 0.3)' }; // Warning - Yellow/Orange
    }
    if (nameLower.includes('medium') || nameLower.includes('normal') || nameLower.includes('moderate')) {
      return { backgroundColor: 'rgba(92, 97, 242, 0.15)', color: '#5C61F2', borderColor: 'rgba(92, 97, 242, 0.3)' }; // Primary - Blue/Purple
    }
    if (nameLower.includes('low') || nameLower.includes('minor')) {
      return { backgroundColor: 'rgba(97, 174, 65, 0.15)', color: '#61AE41', borderColor: 'rgba(97, 174, 65, 0.3)' }; // Success - Green
    }
    if (nameLower.includes('info') || nameLower.includes('informational')) {
      return { backgroundColor: 'rgba(68, 168, 215, 0.15)', color: '#44A8D7', borderColor: 'rgba(68, 168, 215, 0.3)' }; // Info - Cyan
    }
    
    // Default color if no match
    return { backgroundColor: 'rgba(92, 97, 242, 0.1)', color: '#5C61F2', borderColor: 'rgba(92, 97, 242, 0.2)' }; // Primary light
  };

  const renderDropdown = (taskId, field, array, value) => {
    const safeArray = Array.isArray(array) ? array : [];
    const isStatusField = field === "F_StatusMaster";
    const isPriorityField = field === "F_PriorityMaster";
    const selectedItem = safeArray.find((item) => item.Id == value);
    
    // Get color based on selected item
    const colorStyle = selectedItem 
      ? (isStatusField ? getStatusColor(selectedItem.Name) : isPriorityField ? getPriorityColor(selectedItem.Name) : null)
      : null;

    // Status field is editable for all users (admin and employees can change status)
    // Priority and other fields are editable only for admin
    const isEditable = isStatusField ? true : isAdmin;

    if (isEditable) {
      return (
        <Input
          type="select"
          value={value || ""}
          onChange={(e) => handleFieldChange(taskId, field, e.target.value)}
          style={{
            minWidth: "120px",
            padding: "0.375rem 0.75rem",
            backgroundColor: colorStyle?.backgroundColor || "#fff",
            color: colorStyle?.color || "#212529",
            borderColor: colorStyle?.borderColor || "rgba(0,0,0,0.15)",
            fontWeight: colorStyle ? 500 : 400,
            borderRadius: "0.25rem",
            border: `1px solid ${colorStyle?.borderColor || "rgba(0,0,0,0.15)"}`,
            transition: "all 0.2s ease"
          }}
        >
          <option value="">Select {field === "F_StatusMaster" ? "Status" : field === "F_PriorityMaster" ? "Priority" : ""}</option>
          {safeArray.map((item) => (
            <option key={item.Id} value={item.Id}>
              {item.Name}
            </option>
          ))}
        </Input>
      );
    } else {
      const displayText = selectedItem ? selectedItem.Name : "-";
      const colorStyle = selectedItem 
        ? (isStatusField ? getStatusColor(selectedItem.Name) : isPriorityField ? getPriorityColor(selectedItem.Name) : null)
        : null;
      
      if (colorStyle) {
        return (
          <span 
            className="data-display" 
            style={{
              padding: "0.25rem 0.5rem",
              borderRadius: "0.25rem",
              backgroundColor: colorStyle.backgroundColor,
              color: colorStyle.color,
              fontWeight: 500,
              display: "inline-block"
            }}
          >
            {displayText}
          </span>
        );
      }
      return <span className="data-display">{displayText}</span>;
    }
  };

  const renderInputOrSpan = (taskId, field, value, type = "text", placeholder = "") => {
    // StartDate is editable only for admin
    const isStartDateField = field === "StartDate";
    const isEditable = isAdmin && (isStartDateField || type !== "date");
    
    if (isAdmin) {
      if (type === "textarea") {
        return (
          <Input
            type="textarea"
            value={value || ""}
            onChange={(e) => handleFieldChange(taskId, field, e.target.value)}
            placeholder={placeholder}
            style={{ minWidth: "150px", resize: "vertical" }}
            rows={2}
          />
        );
      } else if (type === "date") {
        // StartDate is only editable for admin
        if (isStartDateField) {
        return (
          <Input
            type="date"
            value={value || ""}
            onChange={(e) => handleFieldChange(taskId, field, e.target.value)}
            style={{ minWidth: "150px" }}
          />
        );
        } else {
          // EndDate can be editable for all (or keep as is based on requirement)
          return (
            <Input
              type="date"
              value={value || ""}
              onChange={(e) => handleFieldChange(taskId, field, e.target.value)}
              style={{ minWidth: "150px" }}
            />
          );
        }
      } else if (type === "number") {
        return (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => handleFieldChange(taskId, field, e.target.value)}
            placeholder={placeholder}
            style={{ minWidth: "100px" }}
          />
        );
      } else {
        return (
          <Input
            type="text"
            value={value || ""}
            onChange={(e) => handleFieldChange(taskId, field, e.target.value)}
            placeholder={placeholder}
            style={{ minWidth: "150px" }}
          />
        );
      }
    } else {
      // For non-admin users, show read-only display
      if (type === "date") {
        if (!value) return <span className="data-display"><span className="text-muted">-</span></span>;
        try {
          // If date is in YYYY-MM-DD format, convert to DD-MM-YYYY
          if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = value.split("-");
            const formattedDate = `${day}-${month}-${year}`;
            return <span className="data-display">{formattedDate}</span>;
          }
          // If already in DD-MM-YYYY format, return as is
          if (value.match(/^\d{2}-\d{2}-\d{4}$/)) {
            return <span className="data-display">{value}</span>;
          }
          // Try to parse and format
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            const day = String(date.getDate()).padStart(2, "0");
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const year = date.getFullYear();
            const formattedDate = `${day}-${month}-${year}`;
            return <span className="data-display">{formattedDate}</span>;
          }
        } catch (e) {
          // Ignore
        }
        return <span className="data-display"><span className="text-muted">-</span></span>;
      }
      return <span className="data-display">{value || <span className="text-muted">-</span>}</span>;
    }
  };

  const renderFileField = (row) => {
    const inputId = `task-file-${row.Id}`;
    const fileName = getFileNameFromValue(row.File);
    const fileValue = row.File;
    const isUrl = typeof fileValue === "string" && /^https?:\/\//i.test(fileValue);

    const fileDisplay = () => {
      if (!fileName) return null;
      if (isUrl) {
        return (
          <a
            href={fileValue}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-truncate"
            style={{ maxWidth: "180px", display: "inline-block" }}
            title={fileName}
          >
            {fileName}
          </a>
        );
      }
      return (
        <span className="text-truncate" style={{ maxWidth: "180px", display: "inline-block" }} title={fileName}>
          {fileName}
        </span>
      );
    };

    if (isAdmin) {
      return (
        <div className="d-flex flex-column gap-2" style={{ minWidth: "220px" }}>
          {fileDisplay() && (
            <div
              className="px-2 py-1 rounded"
              style={{
                backgroundColor: "#f6f7fb",
                border: "1px solid rgba(0,0,0,0.08)",
                color: "#212529",
                fontSize: "0.85rem",
                maxWidth: "100%",
              }}
            >
              {fileDisplay()}
            </div>
          )}
          <input
            id={inputId}
            type="file"
            className="d-none"
            onChange={(e) => {
              const file = e.target.files?.[0];
              handleTaskFileChange(row.Id, file, row.isNew);
              e.target.value = "";
            }}
          />
          <label
            htmlFor={inputId}
            className="btn btn-light border mb-0"
            style={{
              width: "fit-content",
              padding: "0.375rem 0.75rem",
              backgroundColor: "#f6f7fb",
              borderColor: "rgba(0,0,0,0.15)",
              color: "#212529",
              fontSize: "0.85rem",
            }}
          >
            <i className="fa fa-upload me-1" />
            Choose File
          </label>
        </div>
      );
    }

    return (
      <div style={{ minWidth: "160px" }}>
        {fileDisplay() || <span className="text-muted">-</span>}
      </div>
    );
  };

  const getFileNameFromValue = (value) => {
    if (!value) return "";
    if (typeof value === "string") {
      const parts = value.split("/");
      return parts[parts.length - 1] || value;
    }
    return "";
  };

  const removePendingFile = (taskId) => {
    setPendingFiles((prev) => {
      if (!prev[taskId]) return prev;
      const updated = { ...prev };
      delete updated[taskId];
      return updated;
    });
  };

  const persistFileValue = (taskId, fileValue) => {
    const currentTime = new Date().toISOString();
    setTaskList((prev) =>
      sortTasksByCreation(
        prev.map((task) =>
          task.Id === taskId
            ? {
                ...task,
                File: fileValue,
                LastUpdateOn: currentTime,
                LastUpdated: new Date(currentTime).toLocaleTimeString(),
              }
            : task
        )
      )
    );

    setTimeout(() => {
      const storedTasks = JSON.parse(localStorage.getItem("tasks") || "[]").map((task) =>
        task.Id === taskId
          ? {
              ...task,
              File: fileValue,
              LastUpdateOn: currentTime,
              LastUpdated: new Date(currentTime).toLocaleTimeString(),
            }
          : task
      );
      localStorage.setItem("tasks", JSON.stringify(sortTasksByCreation(storedTasks)));
    }, 100);
  };

  const saveTaskFile = async (taskId, file) => {
    if (!file) return;
    setSaveStatus("saving");
    try {
      const formData = new FormData();
      formData.append("Id", taskId);
      formData.append("FieldName", "File");
      formData.append("FieldValue", file);
      formData.append("UserId", JSON.parse(localStorage.getItem("authUser")).Id);

      const response = await fetch(API_WEB_URLS.BASE + "TaskMasterUpdate/0/token", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("File upload failed");
      }

      let serverValue = file.name;
      try {
        const responseData = await response.json();
        if (responseData?.data && responseData.data.File) {
          serverValue = responseData.data.File;
        } else if (responseData?.response && responseData.response[0]?.File) {
          serverValue = responseData.response[0].File;
        }
      } catch (error) {
        console.log("File upload response parse error:", error.message);
      }

      persistFileValue(taskId, serverValue);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("File upload error:", error);
      setSaveStatus("error");
    } finally {
      removePendingFile(taskId);
    }
  };

  const handleTaskFileChange = (taskId, file, isNewTask = false) => {
    if (!file) return;

    setPendingFiles((prev) => ({
      ...prev,
      [taskId]: file,
    }));

    persistFileValue(taskId, file.name);

    if (!isNewTask) {
      saveTaskFile(taskId, file);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (Object.keys(openDropdowns).length > 0) {
        // Check if click is inside any dropdown (including dropdown menu rendered in body)
        const isClickInsideDropdown = 
          event.target.closest('.dropdown') || 
          event.target.closest('.dropdown-menu') ||
          event.target.closest('[role="menu"]') ||
          event.target.closest('.btn-light');
        
        if (!isClickInsideDropdown) {
          setOpenDropdowns({});
        }
      }
    };

    if (Object.keys(openDropdowns).length > 0) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openDropdowns]);

  useEffect(() => {
    const styleId = 'task-management-dropdown-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .rdt_TableCell .btn-light,
        .rdt_TableCell .dropdown-toggle.btn-light,
        .rdt_TableCell .dropdown-toggle {
          background-color: #fff !important;
          border-color: rgba(0,0,0,0.15) !important;
          color: #212529 !important;
        }
        .rdt_TableCell .btn-light:hover,
        .rdt_TableCell .dropdown-toggle.btn-light:hover {
          background-color: #f8f9fa !important;
          border-color: rgba(0,0,0,0.25) !important;
          color: #212529 !important;
        }
        .rdt_TableCell .btn-light:focus,
        .rdt_TableCell .dropdown-toggle.btn-light:focus,
        .rdt_TableCell .btn-light.show {
          background-color: #fff !important;
          border-color: rgba(0,0,0,0.25) !important;
          color: #212529 !important;
          box-shadow: 0 0 0 0.2rem rgba(0,0,0,0.1) !important;
        }
        .dropdown-menu.show {
          z-index: 9999 !important;
          background-color: #fff !important;
          border: 1px solid rgba(0,0,0,0.15) !important;
          box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15) !important;
          margin-top: 0.125rem !important;
        }
        .rdt_TableCell {
          overflow: visible !important;
          position: relative !important;
        }
        .rdt_TableRow {
          overflow: visible !important;
        }
        .table-responsive {
          overflow-x: auto !important;
          overflow-y: visible !important;
        }
        .rdt_TableBody .rdt_TableRow .rdt_TableCell {
          overflow: visible !important;
        }
        .dropdown-item:hover {
          background-color: #f8f9fa !important;
        }
        .rdt_TableCell button.btn-secondary,
        .rdt_TableCell .btn-secondary {
          background-color: #fff !important;
          border-color: rgba(0,0,0,0.15) !important;
          color: #212529 !important;
        }
        .rdt_TableRow .rdt_ExpandButton {
          color: #5C61F2 !important;
        }
        .rdt_TableRow .rdt_ExpandButton:hover {
          color: #4a4fd4 !important;
        }
        .task-management-table .rdt_TableHead .rdt_TableCol,
        .task-management-table .rdt_TableBody .rdt_TableCell,
        .task-management-table input,
        .task-management-table select,
        .task-management-table textarea,
        .task-management-table button,
        .task-management-table label,
        .task-management-table span,
        .task-management-table .rdt_TableCell * {
          font-family: 'Lexend', sans-serif !important;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const style = document.getElementById(styleId);
      if (style) {
        style.remove();
      }
    };
  }, []);

  const getNextTaskId = async () => {
    const obj = JSON.parse(localStorage.getItem("authUser"));
    const data = await Fn_FillListData(dispatch, setState, "FillArray9", API_URL2 + "/Id/" + obj.Id);
    return data[0].Id;
  };

  const deleteTask = async (taskId) => {
    // Immediately remove task from UI for instant feedback
    setTaskList(prev => sortTasksByCreation(prev.filter(task => task.Id !== taskId)))
    
    try {
      // Try DELETE method first (standard REST approach)
      let response = await fetch(API_WEB_URLS.BASE + API_WEB_URLS.MASTER + "/0/token/DeleteTask/" + taskId, {
        method: 'DELETE',
      })

      // If DELETE doesn't work (405), try POST with FormData
      if (!response.ok && response.status === 405) {
        const formData = new FormData()
        formData.append('Id', taskId)
        formData.append('UserId', JSON.parse(localStorage.getItem("authUser")).Id)

        response = await fetch(API_WEB_URLS.BASE + API_WEB_URLS.MASTER + "/0/token/DeleteTask", {
          method: 'POST',
          body: formData,
        })
      }

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`)
      }

      const responseData = await response.json()
      
      // If deletion fails, reload page to get correct data
      if (responseData && (responseData.success === false || responseData.status === false)) {
        window.location.reload()
        return { success: false }
      }

      return { success: true, data: responseData }
    } catch (error) {
      console.error('Delete error:', error)
      // Reload on error to restore correct state
      window.location.reload()
      return { success: false, error: error.message }
    }
  }

  const getSubTaskId = async (F_TaskMaster) => {
    if (!F_TaskMaster || F_TaskMaster <= 0) throw new Error("Invalid parent task ID");
    const obj = JSON.parse(localStorage.getItem("authUser"));
    const data = await Fn_FillListData(dispatch, setState, "FillArray9", API_URL5 + "/" + F_TaskMaster + "/" + obj.Id);
    if (!data || !data[0] || !data[0].Id) throw new Error("Failed to generate subtask ID");
    return data[0].Id;
  };

  const getTasks = async () => {
    const obj = JSON.parse(localStorage.getItem("authUser"));
    const data = await Fn_FillListData(dispatch, setState, "FillArray9", API_URL4 + "/Id/" + obj.Id);
    return data;
  };

  const getSubTasks = async (F_TaskMaster) => {
    const data = await Fn_FillListData(dispatch, setState, "FillArray9", API_URL6 + "/Id/" + F_TaskMaster);
    return data;
  };

  const debouncedSave = useCallback(
    _.debounce(
      async (taskId, fieldName, fieldValue, isSubTask = false, onSuccessCallback = null) => {
        setSaveStatus("saving");
        try {
          const formData = new FormData();
          formData.append("Id", taskId);
          formData.append("FieldName", fieldName);
          formData.append("FieldValue", fieldValue);
          formData.append("UserId", JSON.parse(localStorage.getItem("authUser")).Id);

          const apiEndpoint = isSubTask
            ? API_WEB_URLS.BASE + "SubTaskMasterUpdate/0/token"
            : API_WEB_URLS.BASE + "TaskMasterUpdate/0/token";

          const response = await fetch(apiEndpoint, {
            method: "POST",
            body: formData,
          });

          const currentTime = new Date().toISOString();

          if (response.ok) {
            setSaveStatus("saved");
            let savedFieldValue = fieldValue;
            try {
              const responseData = await response.json();
              if (responseData?.data && responseData.data[fieldName] !== undefined) {
                savedFieldValue = responseData.data[fieldName];
              } else if (
                responseData?.response &&
                responseData.response[0] &&
                responseData.response[0][fieldName] !== undefined
              ) {
                savedFieldValue = responseData.response[0][fieldName];
              }
            } catch (e) {
              console.log("Response parse note:", e.message);
            }

            setTaskList((prev) =>
              sortTasksByCreation(
                prev.map((task) =>
                  task.Id === taskId
                    ? {
                        ...task,
                        [fieldName]: savedFieldValue,
                        LastUpdateOn: currentTime,
                        LastUpdated: new Date(currentTime).toLocaleTimeString(),
                      }
                    : task
                )
              )
            );

            setTimeout(() => {
              const updatedTasks = JSON.parse(localStorage.getItem("tasks") || "[]").map((task) =>
                task.Id === taskId
                  ? {
                      ...task,
                      [fieldName]: savedFieldValue,
                      LastUpdateOn: currentTime,
                      LastUpdated: new Date(currentTime).toLocaleTimeString(),
                    }
                  : task
              );
              const sortedTasks = sortTasksByCreation(updatedTasks);
              localStorage.setItem("tasks", JSON.stringify(sortedTasks));
            }, 100);

            setTimeout(() => setSaveStatus("idle"), 2000);
            if (onSuccessCallback) {
              onSuccessCallback(taskId, fieldName, savedFieldValue);
            }
          } else {
            throw new Error("Update failed");
          }
        } catch (error) {
          console.error("Save error:", error);
          setSaveStatus("error");
          const currentTime = new Date().toISOString();
          setTaskList((prev) =>
            sortTasksByCreation(
              prev.map((task) =>
                task.Id === taskId
                  ? {
                      ...task,
                      LastUpdateOn: currentTime,
                      LastUpdated: new Date(currentTime).toLocaleTimeString(),
                      needsSync: true,
                    }
                  : task
              )
            )
          );
        }
      },
      500
    ),
    []
  );

  const loadTasks = async () => {
    try {
      const dbTasks = await getTasks()
      const convertedTasks = dbTasks.map(task => ({
        ...task,
        OwnerIds: task.OwnerIds ? task.OwnerIds.split(',').map(id => ({ Id: parseInt(id.trim()) })) : [],
        EmployeeIds: task.EmployeeIds ? task.EmployeeIds.split(',').map(id => ({ Id: parseInt(id.trim()) })) : [],
        StartDate: task.StartDate ? task.StartDate.split('T')[0] : new Date().toISOString().split("T")[0],
        EndDate: task.EndDate ? task.EndDate.split('T')[0] : new Date().toISOString().split("T")[0],
        LastUpdated: task.LastUpdateOn ? new Date(task.LastUpdateOn).toLocaleTimeString() : new Date().toLocaleTimeString(),
        ScheduleType: "week",
        Period: "monday",
        file: ""
      }))

      const savedTasks = localStorage.getItem('tasks')
      let localTasks = []
      if (savedTasks) {
        try {
          localTasks = JSON.parse(savedTasks)
        } catch (error) {
          console.error('Local parse error:', error)
        }
      }

      const merged = mergeTasksWithConflictResolution(convertedTasks, localTasks)
      const sortedMerged = sortTasksByCreation(merged)
      setTaskList(sortedMerged)
      localStorage.setItem('tasks', JSON.stringify(sortedMerged))
    } catch (error) {
      console.error('Load error:', error)
      const fallback = localStorage.getItem('tasks')
      if (fallback) {
        try {
          setTaskList(sortTasksByCreation(JSON.parse(fallback)))
        } catch (err) {
          console.error('Fallback parse error:', err)
          setTaskList([])
        }
      }
    }
  }

  const mergeTasksWithConflictResolution = (dbTasks, localTasks) => {
    const mergedMap = new Map();
    dbTasks.forEach((task) => {
      mergedMap.set(task.Id, {
        ...task,
        source: "database",
        dbLastUpdate: task.LastUpdateOn,
      });
    });

    localTasks.forEach((localTask) => {
      const taskId = localTask.Id;
      const dbTask = mergedMap.get(taskId);
      if (!dbTask) {
        mergedMap.set(taskId, {
          ...localTask,
          source: "local-only",
        });
      } else {
        const dbUpdateTime = new Date(dbTask.dbLastUpdate || 0);
        const localUpdateTime = new Date(localTask.LastUpdateOn || 0);
        if (localUpdateTime > dbUpdateTime) {
          mergedMap.set(taskId, {
            ...localTask,
            source: "local-newer",
          });
        }
      }
    });

    return Array.from(mergedMap.values());
  };

  useEffect(() => {
    loadTasks()
  }, [])

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(taskList))
  }, [taskList])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setSyncStatus('synced')
    }
    const handleOffline = () => {
      setIsOnline(false)
      setSyncStatus('offline')
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const syncInterval = setInterval(async () => {
      if (!isOnline) return
      try {
        setSyncStatus('syncing')
        const dbTasks = await getTasks()
        const localTasks = JSON.parse(localStorage.getItem('tasks') || '[]')
        const converted = dbTasks.map(task => ({
          ...task,
          OwnerIds: task.OwnerIds ? task.OwnerIds.split(',').map(id => ({ Id: parseInt(id.trim()) })) : [],
          EmployeeIds: task.EmployeeIds ? task.EmployeeIds.split(',').map(id => ({ Id: parseInt(id.trim()) })) : [],
          StartDate: task.StartDate ? task.StartDate.split('T')[0] : new Date().toISOString().split("T")[0],
          EndDate: task.EndDate ? task.EndDate.split('T')[0] : new Date().toISOString().split("T")[0],
          LastUpdated: task.LastUpdateOn ? new Date(task.LastUpdateOn).toLocaleTimeString() : new Date().toLocaleTimeString(),
          ScheduleType: "week",
          Period: "monday",
          file: ""
        }))
        const merged = mergeTasksWithConflictResolution(converted, localTasks)
        const sortedMerged = sortTasksByCreation(merged)
        const sortedLocal = sortTasksByCreation(localTasks)
        if (JSON.stringify(sortedMerged) !== JSON.stringify(sortedLocal)) {
          setTaskList(sortedMerged)
          localStorage.setItem('tasks', JSON.stringify(sortedMerged))
        }
        setSyncStatus('synced')
      } catch (error) {
        console.error('Sync error:', error)
        setSyncStatus('error')
      }
    }, 30000)
    return () => clearInterval(syncInterval)
  }, [isOnline])

  useEffect(() => {
    const obj = localStorage.getItem("authUser");
    const userType = JSON.parse(obj).F_UserType;
    setUserYType(userType);
    Fn_FillListData(dispatch, setState, "FillArray", API_URL + "/Id/8");
    Fn_FillListData(dispatch, setState, "FillArray1", API_URL + "/Id/9");
    Fn_FillListData(dispatch, setState, "FillArray2", API_Data + "/Id/0");
    Fn_FillListData(dispatch, setState, "FillArray3", API_Data1 + "/Id/0");

    const Id = (location.state && location.state.Id) || 0;
    if (Id > 0) {
      setState((prev) => ({ ...prev, Id: Id }));
    }
  }, [dispatch, location.state]);

  // Filter tasks based on search text
  const filteredItems = useMemo(() => {
    if (!filterText) return taskList;
    return taskList.filter(
      (item) =>
        (item.Name && item.Name.toLowerCase().includes(filterText.toLowerCase())) ||
        (item.Note && item.Note.toLowerCase().includes(filterText.toLowerCase())) ||
        (item.Budget && item.Budget.toString().includes(filterText.toLowerCase()))
    );
  }, [taskList, filterText]);

  // Handle subtask field changes
  const handleSubTaskFieldChange = useCallback((subTaskId, parentTaskId, fieldName, value) => {
    setSubTaskLists((prev) => {
      const updated = { ...prev };
      if (!updated[parentTaskId]) updated[parentTaskId] = [];
      
      let foundTask = null;
      updated[parentTaskId] = updated[parentTaskId].map((st) => {
        if (st.Id === subTaskId) {
          foundTask = {
              ...st,
              [fieldName]: value,
              LastUpdated: new Date().toLocaleTimeString(),
              LastUpdateOn: new Date().toISOString(),
          };
          return foundTask;
        }
        return st;
      });
      
      // Check if task needs to be saved (using updated task from the map)
      if (foundTask && !foundTask.isNew) {
        debouncedSave(subTaskId, fieldName, value, true);
      }
      
      return updated;
    });
  }, [debouncedSave]);

  // Ref map to store input field references and prevent remounting
  const inputRefsMap = useRef(new Map());
  
  // Controlled Input Component for subtasks - maintains its own state to prevent focus loss
  const ControlledSubTaskInput = memo(({ subTaskId, parentTaskId, field, initialValue, type = "text", placeholder = "", onFieldChange }) => {
    const inputKey = `${subTaskId}-${field}-${parentTaskId}`;
    const [localValue, setLocalValue] = useState(initialValue || "");
    const inputRef = useRef(null);
    const updateTimeoutRef = useRef(null);
    const isFocusedRef = useRef(false);
    const lastSyncedValueRef = useRef(initialValue || "");
    
    // Store ref in map
    useEffect(() => {
      if (inputRef.current) {
        inputRefsMap.current.set(inputKey, inputRef.current);
      }
      return () => {
        inputRefsMap.current.delete(inputKey);
      };
    }, [inputKey]);
    
    // Update local value when initialValue changes from parent (but only if not focused and value actually changed)
    useEffect(() => {
      if (!isFocusedRef.current && initialValue !== lastSyncedValueRef.current) {
        setLocalValue(initialValue || "");
        lastSyncedValueRef.current = initialValue || "";
      }
    }, [initialValue]);
    
    const handleChange = (e) => {
      const newValue = e.target.value;
      
      // Update local state immediately (this won't cause parent re-render)
      setLocalValue(newValue);
      
      // Clear any pending update
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      // DON'T update parent state while typing - only update on blur
      // This prevents DataTable re-render and focus loss
      // The parent state will be updated when user blurs the input
    };
    
    const handleFocus = (e) => {
      isFocusedRef.current = true;
    };
    
    const handleBlur = () => {
      isFocusedRef.current = false;
      
      // Clear any pending timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      // Update parent state ONLY when user blurs (finishes typing)
      // This prevents DataTable re-render while typing and maintains focus
      if (localValue !== lastSyncedValueRef.current) {
        onFieldChange(subTaskId, parentTaskId, field, localValue);
        lastSyncedValueRef.current = localValue;
      }
    };
    
    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        inputRefsMap.current.delete(inputKey);
      };
    }, [inputKey]);
      
    const inputProps = {
      ref: inputRef,
      value: localValue,
      onChange: handleChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      placeholder: placeholder,
      'data-subtask-input': inputKey,
    };
    
    if (type === "textarea") {
      return <Input {...inputProps} type="textarea" style={{ minWidth: "150px", resize: "vertical" }} rows={2} />;
    } else if (type === "date") {
      return <Input {...inputProps} type="date" style={{ minWidth: "150px" }} />;
    } else if (type === "number") {
      return <Input {...inputProps} type="number" style={{ minWidth: "100px" }} />;
    } else {
      return <Input {...inputProps} type="text" style={{ minWidth: "150px" }} />;
    }
  }, (prevProps, nextProps) => {
    // Custom comparison function - prevent re-render if:
    // 1. All key props are the same
    // 2. initialValue hasn't changed OR component is currently focused (we'll update it internally)
    const keyPropsMatch = 
      prevProps.subTaskId === nextProps.subTaskId &&
      prevProps.parentTaskId === nextProps.parentTaskId &&
      prevProps.field === nextProps.field &&
      prevProps.type === nextProps.type &&
      prevProps.placeholder === nextProps.placeholder;
    
    if (!keyPropsMatch) {
      return false; // Allow re-render if key props changed
    }
    
    // If initialValue changed but component might be focused, still prevent re-render
    // (component will sync internally via useEffect)
    const valueChanged = prevProps.initialValue !== nextProps.initialValue;
    if (valueChanged) {
      // Check if this input is currently focused
      const inputKey = `${nextProps.subTaskId}-${nextProps.field}-${nextProps.parentTaskId}`;
      const storedInput = inputRefsMap.current.get(inputKey);
      const isFocused = storedInput && document.activeElement === storedInput;
      
      // Don't re-render if focused (component will sync internally)
      if (isFocused) {
        return true; // Prevent re-render
      }
    }
    
    // Default: only re-render if props actually changed
    return prevProps.initialValue === nextProps.initialValue && 
           prevProps.onFieldChange === nextProps.onFieldChange;
  });
  
  ControlledSubTaskInput.displayName = "ControlledSubTaskInput";

  // Component registry to store component instances and prevent remounting
  const componentRegistryRef = useRef(new Map());

  // Expandable component for subtasks
  const ExpandedComponent = ({ data }) => {
    const subTasks = subTaskLists[data.Id] || [];
    
    // Memoize render functions to prevent recreation
    const renderSubTaskInputOrSpan = useCallback((subTaskId, field, value, type = "text", placeholder = "") => {
      // StartDate is editable only for admin
      const isStartDateField = field === "StartDate";
      
      if (isAdmin) {
        // Use controlled component for all input types to prevent focus loss
        // Key is stable based on subTaskId and field, so React won't remount
          return (
          <ControlledSubTaskInput
            key={`${subTaskId}-${field}-${data.Id}`}
            subTaskId={subTaskId}
            parentTaskId={data.Id}
            field={field}
            initialValue={value}
            type={type}
              placeholder={placeholder}
            onFieldChange={handleSubTaskFieldChange}
            />
          );
        } else {
        // For non-admin users, show read-only display
        if (type === "date") {
          const formattedDate = value ? new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "-";
          return <span className="data-display">{formattedDate !== "-" ? formattedDate : <span className="text-muted">-</span>}</span>;
        }
        return <span className="data-display">{value || <span className="text-muted">-</span>}</span>;
      }
    }, [isAdmin, data.Id, handleSubTaskFieldChange]);

    const renderSubTaskDropdown = useCallback((subTaskId, field, array, value) => {
      const safeArray = Array.isArray(array) ? array : [];
      const isStatusField = field === "F_StatusMaster";
      const isPriorityField = field === "F_PriorityMaster";
      const selectedItem = safeArray.find((item) => item.Id == value);
      
      const colorStyle = selectedItem 
        ? (isStatusField ? getStatusColor(selectedItem.Name) : isPriorityField ? getPriorityColor(selectedItem.Name) : null)
        : null;

      // Status field is editable for all users (admin and employees can change status)
      // Priority and other fields are editable only for admin
      const isEditable = isStatusField ? true : isAdmin;

      if (isEditable) {
        return (
          <Input
            key={`${subTaskId}-${field}`}
            type="select"
            value={value || ""}
            onChange={(e) => handleSubTaskFieldChange(subTaskId, data.Id, field, e.target.value)}
            style={{
              minWidth: "120px",
              padding: "0.375rem 0.75rem",
              backgroundColor: colorStyle?.backgroundColor || "#fff",
              color: colorStyle?.color || "#212529",
              borderColor: colorStyle?.borderColor || "rgba(0,0,0,0.15)",
              fontWeight: colorStyle ? 500 : 400,
              borderRadius: "0.25rem",
              border: `1px solid ${colorStyle?.borderColor || "rgba(0,0,0,0.15)"}`,
              transition: "all 0.2s ease"
            }}
          >
            <option value="">Select {field === "F_StatusMaster" ? "Status" : field === "F_PriorityMaster" ? "Priority" : ""}</option>
            {safeArray.map((item) => (
              <option key={item.Id} value={item.Id}>
                {item.Name}
              </option>
            ))}
          </Input>
        );
      } else {
        const displayText = selectedItem ? selectedItem.Name : "-";
        const colorStyle = selectedItem 
          ? (isStatusField ? getStatusColor(selectedItem.Name) : isPriorityField ? getPriorityColor(selectedItem.Name) : null)
          : null;
        
        if (colorStyle) {
          return (
            <span 
              className="data-display" 
              style={{
                padding: "0.25rem 0.5rem",
                borderRadius: "0.25rem",
                backgroundColor: colorStyle.backgroundColor,
                color: colorStyle.color,
                fontWeight: 500,
                display: "inline-block"
              }}
            >
              {displayText}
            </span>
          );
        }
        return <span className="data-display">{displayText}</span>;
      }
    }, [isAdmin, data.Id, state.FillArray2, state.FillArray3, handleSubTaskFieldChange]);

    const renderSubTaskMultiSelect = useCallback((subTaskId, field, array, stringValue) => {
      const safeArray = Array.isArray(array) ? array : [];
      const displayValues = getDisplayValues(stringValue, safeArray);

      if (isAdmin) {
        const dropdownKey = `${subTaskId}-${field}`;
        const isOpen = openDropdowns[dropdownKey] || false;

        const handleSelect = (item) => {
          const currentIdsArray = handleIdsArray(stringValue);
          const isSelected = currentIdsArray.some((idObj) => idObj.Id === item.Id);

          let updatedArray;
          if (isSelected) {
            updatedArray = currentIdsArray.filter((idObj) => idObj.Id !== item.Id);
          } else {
            updatedArray = [...currentIdsArray, { Id: item.Id }];
          }

          const updatedString = arrayToString(updatedArray);
          handleSubTaskFieldChange(subTaskId, data.Id, field, updatedString);
        };

        const getButtonText = () => {
          if (displayValues.length === 0) {
            return `Select ${field === "OwnerIds" ? "Owners" : "Employees"}`;
          } else if (displayValues.length === 1) {
            return displayValues[0].Name;
          } else {
            const remainingCount = displayValues.length - 1;
            return `${displayValues[0].Name} +${remainingCount}`;
          }
        };

        return (
          <div style={{ minWidth: "250px", maxWidth: "300px", position: "relative", zIndex: isOpen ? 1050 : "auto" }}>
            <Dropdown
              isOpen={isOpen}
              toggle={() => toggleDropdown(subTaskId, field)}
              direction="down"
            >
              <DropdownToggle
                caret
                tag="button"
                type="button"
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "0.375rem 0.75rem",
                  backgroundColor: "#fff",
                  border: "1px solid rgba(0,0,0,0.15)",
                  color: "#212529",
                  fontSize: "0.875rem",
                  boxShadow: "none",
                }}
                className="btn btn-light"
              >
                {getButtonText()}
              </DropdownToggle>
              <DropdownMenu
                style={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  minWidth: "250px",
                  backgroundColor: "#fff",
                  border: "1px solid rgba(0,0,0,0.15)",
                  borderRadius: "0.25rem",
                  boxShadow: "0 0.5rem 1rem rgba(0,0,0,0.15)",
                  marginTop: "0.125rem",
                  zIndex: 9999,
                }}
                container="body"
              >
                {safeArray.length === 0 ? (
                  <DropdownItem disabled>
                    <span className="text-muted">No options available</span>
                  </DropdownItem>
                ) : (
                  safeArray.map((item) => {
                    const isSelected = displayValues.some((dv) => dv.Id === item.Id);
                    return (
                      <DropdownItem
                        key={item.Id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSelect(item);
                        }}
                        style={{
                          backgroundColor: isSelected ? "rgba(92, 97, 242, 0.1)" : "#fff",
                          color: "#212529",
                          cursor: "pointer",
                          padding: "0.5rem 1rem",
                          borderBottom: "1px solid #f0f0f0",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.target.style.backgroundColor = "#f8f9fa";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.target.style.backgroundColor = "#fff";
                          } else {
                            e.target.style.backgroundColor = "rgba(92, 97, 242, 0.1)";
                          }
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between">
                          <span style={{ fontWeight: isSelected ? 500 : 400 }}>{item.Name}</span>
                          {isSelected && (
                            <i className="fa fa-check text-primary ms-2"></i>
                          )}
                        </div>
                      </DropdownItem>
                    );
                  })
                )}
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      } else {
        return (
          <div style={{ minWidth: "180px" }}>
            {displayValues.length > 0 ? (
              <div className="d-flex flex-wrap gap-1">
                {displayValues.map((item) => (
                  <Badge key={item.Id} color="primary" pill style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}>
                    {item.Name}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted">-</span>
            )}
          </div>
        );
      }
    }, [isAdmin, data.Id, state.FillArray, state.FillArray1, openDropdowns, handleSubTaskFieldChange, toggleDropdown, handleIdsArray, arrayToString]);
    
    const subTaskColumns = useMemo(() => [
      {
        name: "Sub Task",
        cell: (row) => renderSubTaskInputOrSpan(row.Id, "Name", row.Name, "text", "Enter subtask name"),
        sortable: true,
        wrap: true,
        width: "200px",
        minWidth: "180px",
      },
      {
        name: "Owner",
        cell: (row) => renderSubTaskMultiSelect(row.Id, "OwnerIds", state.FillArray, row.OwnerIds),
        sortable: false,
        width: "320px",
        minWidth: "300px",
      },
      {
        name: "Employee",
        cell: (row) => renderSubTaskMultiSelect(row.Id, "EmployeeIds", state.FillArray1, row.EmployeeIds),
        sortable: false,
        width: "320px",
        minWidth: "300px",
      },
      {
        name: "Status",
        cell: (row) => renderSubTaskDropdown(row.Id, "F_StatusMaster", state.FillArray2, row.F_StatusMaster),
        sortable: true,
        width: "180px",
        minWidth: "160px",
      },
      {
        name: "Start Date",
        cell: (row) => renderSubTaskInputOrSpan(row.Id, "StartDate", row.StartDate, "date"),
        sortable: true,
        width: "180px",
        minWidth: "170px",
      },
      {
        name: "End Date",
        cell: (row) => renderSubTaskInputOrSpan(row.Id, "EndDate", row.EndDate, "date"),
        sortable: true,
        width: "180px",
        minWidth: "170px",
      },
      {
        name: "Priority",
        cell: (row) => renderSubTaskDropdown(row.Id, "F_PriorityMaster", state.FillArray3, row.F_PriorityMaster),
        sortable: true,
        width: "180px",
        minWidth: "160px",
      },
      {
        name: "Notes",
        cell: (row) => renderSubTaskInputOrSpan(row.Id, "Note", row.Note, "textarea", "Enter notes"),
        sortable: true,
        wrap: true,
        width: "250px",
        minWidth: "220px",
      },
      {
        name: "File",
        cell: (row) => renderFileField(row),
        sortable: false,
        wrap: true,
        width: "280px",
        minWidth: "250px",
      },
      {
        name: "Budget",
        cell: (row) => renderSubTaskInputOrSpan(row.Id, "Budget", row.Budget, "number", "₹"),
        sortable: true,
        width: "150px",
        minWidth: "130px",
      },
      {
        name: "Actions",
        cell: (row) => (
          <div className="d-flex gap-2 align-items-center">
            {row.isNew ? (
              <button
                className="btn btn-sm btn-success"
                onClick={() => handleSaveNewSubTask(row.Id, data.Id)}
                title="Save SubTask"
                style={{ padding: "0.25rem 0.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}
              >
                <Save size={16} />
                <span>Save</span>
              </button>
            ) : (
              <>
                {isAdmin && (
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this subtask?")) {
                        deleteSubTask(row.Id, data.Id);
                      }
                    }}
                    title="Delete SubTask"
                    style={{ padding: "0.25rem 0.5rem", display: "flex", alignItems: "center", justifyContent: "center", minWidth: "36px", minHeight: "36px" }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </>
            )}
          </div>
        ),
        sortable: false,
        width: "120px",
        minWidth: "110px",
      },
    ], [renderSubTaskInputOrSpan, renderSubTaskDropdown, renderSubTaskMultiSelect, isAdmin, state.FillArray, state.FillArray1, state.FillArray2, state.FillArray3, openDropdowns, data.Id]);

    return (
      <div style={{ padding: "1rem", backgroundColor: "#f8f9fa" }}>
        <div className="d-flex justify-content-start align-items-center mb-3">
          <h6 style={{ margin: 0, marginRight: "1rem" }}>Sub Tasks</h6>
          {isAdmin && (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => createNewSubTask(data.Id)}
              style={{ padding: "0.25rem 0.75rem" }}
            >
              <i className="fa fa-plus me-1"></i>Add Sub Task
            </button>
          )}
        </div>
        <div className="task-management-table">
          <DataTable
            key={`subtasks-${data.Id}`}
            data={subTasks}
            columns={subTaskColumns}
            striped
            highlightOnHover
            noDataComponent="No subtasks found"
            persistTableHead
            customStyles={{
              table: {
                style: {
                  backgroundColor: "#fff",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                },
              },
              headRow: {
                style: {
                  borderTop: "1px solid rgba(0,0,0,0.12)",
                },
              },
              headCells: {
                style: {
                  borderRight: "1px solid rgba(0,0,0,0.12)",
                  borderBottom: "1px solid rgba(0,0,0,0.12)",
                  paddingLeft: "12px",
                  paddingRight: "12px",
                  "&:last-of-type": {
                    borderRight: "none",
                  },
                },
              },
              cells: {
                style: {
                  borderRight: "1px solid rgba(0,0,0,0.12)",
                  paddingLeft: "12px",
                  paddingRight: "12px",
                  "&:last-of-type": {
                    borderRight: "none",
                  },
                },
              },
              rows: {
                style: {
                  borderBottom: "1px solid rgba(0,0,0,0.12)",
                },
              },
            }}
          />
        </div>
      </div>
    );
  };
  
  // Memoize ExpandedComponent to prevent unnecessary re-renders
  const MemoizedExpandedComponent = memo(ExpandedComponent);

  const createNewSubTask = async (parentTaskId) => {
    try {
      const obj = JSON.parse(localStorage.getItem("authUser"));
      const newSubTaskId = await getSubTaskId(parentTaskId);

      const newSubTask = {
        Id: newSubTaskId,
        Name: "",
        Chat: "",
        OwnerIds: "",
        EmployeeIds: "",
        F_StatusMaster: "",
        StartDate: new Date().toISOString().split("T")[0],
        EndDate: new Date().toISOString().split("T")[0],
        F_PriorityMaster: "",
        Note: "",
        Budget: "",
        File: "",
        Timeline: "",
        F_TaskMaster: parentTaskId,
        DateOfCreation: new Date().toISOString(),
        LastUpdateOn: new Date().toISOString(),
        UserId: obj.Id,
        isNew: true,
      };

      setSubTaskLists((prev) => ({
        ...prev,
        [parentTaskId]: [...(prev[parentTaskId] || []), newSubTask],
      }));
    } catch (error) {
      console.error("Error creating new subtask:", error);
      alert("Failed to create new subtask. Please try again.");
    }
  };

  const handleSaveNewSubTask = async (subTaskId, parentTaskId) => {
    const subTasks = subTaskLists[parentTaskId] || [];
    const subTask = subTasks.find((st) => st.Id === subTaskId);
    if (!subTask || !subTask.isNew) return;

    if (!subTask.Name || subTask.Name.trim() === "") {
      alert("Please enter a subtask name");
      return;
    }

    try {
      const obj = JSON.parse(localStorage.getItem("authUser"));
      const formData = new FormData();
      formData.append("Name", subTask.Name || "");
      formData.append("Chat", subTask.Chat || "");
      formData.append("OwnerIds", subTask.OwnerIds || "");
      formData.append("EmployeeIds", subTask.EmployeeIds || "");
      formData.append("F_StatusMaster", subTask.F_StatusMaster || "");
      formData.append("StartDate", subTask.StartDate || "");
      formData.append("EndDate", subTask.EndDate || "");
      formData.append("F_PriorityMaster", subTask.F_PriorityMaster || "");
      formData.append("Note", subTask.Note || "");
      formData.append("Budget", subTask.Budget || "");
      const pendingFile = pendingFiles[subTaskId];
      if (pendingFile) {
        formData.append("File", pendingFile);
      } else {
      formData.append("File", subTask.File || "");
      }
      formData.append("F_TaskMaster", parentTaskId);
      formData.append("UserId", obj.Id);

      await Fn_AddEditData(
        dispatch,
        setState,
        { arguList: { id: 0, formData: formData } },
        "NewSubTaskCreate/0/token",
        true,
        "memberid",
        null,
        null
      );

      const updatedSubTask = { ...subTask, isNew: false };
      setSubTaskLists((prev) => ({
        ...prev,
        [parentTaskId]: (prev[parentTaskId] || []).map((st) =>
          st.Id === subTaskId ? updatedSubTask : st
        ),
      }));

      // Remove pending file after save
      setPendingFiles((prev) => {
        const updated = { ...prev };
        delete updated[subTaskId];
        return updated;
      });

      // Reload subtasks
      const refreshedSubTasks = await getSubTasks(parentTaskId);
      setSubTaskLists((prev) => ({
        ...prev,
        [parentTaskId]: refreshedSubTasks || [],
      }));
    } catch (error) {
      console.error("Error saving new subtask:", error);
      alert("Failed to save subtask. Please try again.");
    }
  };

  const deleteSubTask = async (subTaskId, parentTaskId) => {
    try {
      // Optimistically remove from UI
      setSubTaskLists((prev) => ({
        ...prev,
        [parentTaskId]: (prev[parentTaskId] || []).filter((st) => st.Id !== subTaskId),
      }));

      await Fn_DeleteData(dispatch, setState, subTaskId, API_WEB_URLS.MASTER + "/0/token/DeleteSubTask", true);

      // Reload subtasks
      const refreshedSubTasks = await getSubTasks(parentTaskId);
      setSubTaskLists((prev) => ({
        ...prev,
        [parentTaskId]: refreshedSubTasks || [],
      }));
    } catch (error) {
      console.error("Error deleting subtask:", error);
      // Reload on error
      const refreshedSubTasks = await getSubTasks(parentTaskId);
      setSubTaskLists((prev) => ({
        ...prev,
        [parentTaskId]: refreshedSubTasks || [],
      }));
    }
  };

  const handleChatClick = useCallback((row) => {
    const newChatTask = { Id: row.Id, Name: row.Name };
    
    // If clicking on the same task that's already open, just close it
    if (openChatTask && openChatTask.Id === row.Id) {
      setOpenChatTask(null);
      return;
    }
    
    // If a chat is already open, close it first, then open the new one
    if (openChatTask) {
      setOpenChatTask(null);
      // Wait for closing animation to complete (400ms - transition is 350ms)
      setTimeout(() => {
        setOpenChatTask(newChatTask);
      }, 400);
    } else {
      // No chat open, just open the new one
      setOpenChatTask(newChatTask);
    }
  }, [openChatTask]);

  // Define table columns
  const columns = useMemo(
    () => [
      {
        name: "Tasks",
        cell: (row) => renderInputOrSpan(row.Id, "Name", row.Name, "text", "Enter task name"),
        sortable: true,
        wrap: true,
        width: "200px",
        minWidth: "180px",
      },
      {
        name: "Chat",
        cell: (row) => (
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={() => handleChatClick(row)}
            title={row.Name ? `Open chat for ${row.Name}` : "Open chat"}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: "36px", minHeight: "36px", padding: "0.25rem 0.5rem" }}
          >
            <MessageCircle size={16} className="text-primary" />
          </button>
        ),
        sortable: false,
        width: "100px",
        grow: 0,
      },
      {
        name: "Owner",
        cell: (row) => renderMultiSelect(row.Id, "OwnerIds", state.FillArray, row.OwnerIds),
        sortable: false,
        width: "320px",
        minWidth: "300px",
      },
      {
        name: "Employee",
        cell: (row) => renderMultiSelect(row.Id, "EmployeeIds", state.FillArray1, row.EmployeeIds),
        sortable: false,
        width: "320px",
        minWidth: "300px",
      },
      {
        name: "Status",
        cell: (row) => renderDropdown(row.Id, "F_StatusMaster", state.FillArray2, row.F_StatusMaster),
        sortable: true,
        width: "180px",
        minWidth: "160px",
      },
      {
        name: "Start Date",
        cell: (row) => renderInputOrSpan(row.Id, "StartDate", row.StartDate, "date"),
        sortable: true,
        width: "180px",
        minWidth: "170px",
      },
      {
        name: "End Date",
        cell: (row) => renderInputOrSpan(row.Id, "EndDate", row.EndDate, "date"),
        sortable: true,
        width: "180px",
        minWidth: "170px",
      },
      {
        name: "Priority",
        cell: (row) => renderDropdown(row.Id, "F_PriorityMaster", state.FillArray3, row.F_PriorityMaster),
        sortable: true,
        width: "180px",
        minWidth: "160px",
      },
      {
        name: "Notes",
        cell: (row) => renderInputOrSpan(row.Id, "Note", row.Note, "textarea", "Enter notes"),
        sortable: true,
        wrap: true,
        width: "250px",
        minWidth: "220px",
      },
      {
        name: "File",
        cell: (row) => renderFileField(row),
        sortable: false,
        wrap: true,
        width: "280px",
        minWidth: "250px",
      },
      {
        name: "Budget",
        cell: (row) => renderInputOrSpan(row.Id, "Budget", row.Budget, "number", "₹"),
        sortable: true,
        width: "150px",
        minWidth: "130px",
      },
      {
        name: "Actions",
        cell: (row) => (
          <div className="d-flex gap-2 align-items-center">
            {row.isNew ? (
              <button
                className="btn btn-sm btn-success"
                onClick={() => handleSaveNewTask(row.Id)}
                title="Save Task"
                style={{ padding: "0.25rem 0.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}
              >
                <Save size={16} />
                <span>Save</span>
              </button>
            ) : (
              <>
                {isAdmin && (
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this task?")) {
                        deleteTask(row.Id);
                      }
                    }}
                    title="Delete Task"
                    style={{ padding: "0.25rem 0.5rem", display: "flex", alignItems: "center", justifyContent: "center", minWidth: "36px", minHeight: "36px" }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </>
            )}
          </div>
        ),
        sortable: false,
        width: "120px",
        minWidth: "110px",
      },
    ],
    [taskList, state.FillArray, state.FillArray1, state.FillArray2, state.FillArray3, isAdmin, openDropdowns]
  );

  const subHeaderComponentMemo = useMemo(() => {
    return (
      <div id="task-management_filter" className="dataTables_filter d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <Label className="me-1" style={{ fontWeight: 500 }}>Search:</Label>
          <Input
            onChange={(e) => setFilterText(e.target.value)}
            type="search"
            value={filterText}
            placeholder="Search tasks..."
            style={{ width: "300px", marginLeft: "10px" }}
          />
        </div>
        {isAdmin && (
          <button
            className="btn btn-primary"
            onClick={createNewTask}
            title="Add New Task"
            style={{ padding: "0.5rem 1rem" }}
          >
            <i className="fa fa-plus me-2"></i>Add New Task
          </button>
        )}
      </div>
    );
  }, [filterText, isAdmin]);

  return (
    <div className="page-body">
      <Breadcrumbs mainTitle="Task Management" parent="Tasks" />
      <Container flId>
        <Row>
          <Col sm="12">
            <Card>
              <CardHeaderCommon
                title="Task Management"
                span={[{ text: "Manage your tasks efficiently" }]}
                headClass="pb-0 card-no-border"
              />
              <CardBody>
                <div className="table-responsive task-management-table">
                  <DataTable
                    data={filteredItems}
                    columns={columns}
                    striped
                    highlightOnHover
                    pagination
                    subHeader
                    subHeaderComponent={subHeaderComponentMemo}
                    progressPending={state.isProgress}
                    noDataComponent="No tasks found"
                    expandableRows
                    expandableRowsComponent={MemoizedExpandedComponent}
                    expandableRowExpanded={(row) => expandedRows[row.Id] || false}
                    onRowExpandToggled={(expanded, row) => {
                      if (expanded) {
                        handleExpandRow(row);
                      } else {
                        setExpandedRows((prev) => {
                          const newExpanded = { ...prev };
                          delete newExpanded[row.Id];
                          return newExpanded;
                        });
                      }
                    }}
                    customStyles={{
                      table: {
                        style: {
                          borderCollapse: "separate",
                          borderSpacing: 0,
                        },
                      },
                      headRow: {
                        style: {
                          borderTop: "1px solid rgba(0,0,0,0.12)",
                        },
                      },
                      headCells: {
                        style: {
                          borderRight: "1px solid rgba(0,0,0,0.12)",
                          borderBottom: "1px solid rgba(0,0,0,0.12)",
                          paddingLeft: "12px",
                          paddingRight: "12px",
                          "&:last-of-type": {
                            borderRight: "none",
                          },
                        },
                      },
                      cells: {
                        style: {
                          borderRight: "1px solid rgba(0,0,0,0.12)",
                          paddingLeft: "12px",
                          paddingRight: "12px",
                          "&:last-of-type": {
                            borderRight: "none",
                          },
                        },
                      },
                      rows: {
                        style: {
                          borderBottom: "1px solid rgba(0,0,0,0.12)",
                        },
                      },
                    }}
                  />
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
      {openChatTask && (
        <SidebarChat
          key={openChatTask.Id}
          openSidebar={Boolean(openChatTask)}
          setOpenSidebar={setOpenChatTask}
          taskName={openChatTask?.Name || ""}
          taskId={openChatTask?.Id || 0}
        />
      )}
    </div>
  );
};

export default TaskManagement;
