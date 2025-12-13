# API Parameters Documentation
## Attendance Management System - Backend Developer Reference

This document contains all API parameters for Masters and Global Options components.

---

## Table of Contents
1. [Company Master](#1-company-master)
2. [Shift Master](#2-shift-master)
3. [Holiday Master](#3-holiday-master)
4. [Employee Master](#4-employee-master)
5. [Employee Shift Edit Master](#5-employee-shift-edit-master)
6. [Machine Type Master](#6-machine-type-master)
7. [Global Options](#7-global-options)

---

## 1. Company Master

### API Endpoints
- **Save/Update**: `CompanyMaster/0/token`
- **Get by ID**: `{MASTER_URL}/0/token/CompanyMaster/Id`
- **Get List**: `{MASTER_URL}/0/token/CompanyMaster/Id/0`

### Form Parameters (FormData)
| Parameter Name | Type | Required | Description |
|---------------|------|----------|-------------|
| `CompanyName` | string | Yes | Company name |
| `UserName` | string | Yes | Username for company |
| `UserPassword` | string | Yes | Password (min 6 characters) |
| `UserId` | number | Yes | Current user ID (from localStorage.user.uid) |
| `id` | number | Yes | Record ID (0 for new, >0 for update) |

### Notes
- Password must be at least 6 characters
- UserId comes from `localStorage.getItem("user")` → `obj.uid`

---

## 2. Shift Master

### API Endpoints
- **Save/Update**: `ShiftMaster/0/token`
- **Get by ID**: `{MASTER_URL}/0/token/ShiftMaster/Id`
- **Get List**: `{MASTER_URL}/0/token/ShiftMaster/Id/0`

### Form Parameters (FormData)
| Parameter Name | Type | Required | Description |
|---------------|------|----------|-------------|
| `Name` | string | Yes | Shift name |
| `InTime` | string (time) | Yes | In time (HH:mm format, 24-hour, always sent to API) |
| `OutTime` | string (time) | Yes | Out time (HH:mm format, 24-hour, always sent to API) |
| `LunchInTime` | string (time) | Yes | Lunch in time (HH:mm format, 24-hour, always sent to API) |
| `LunchOutTime` | string (time) | Yes | Lunch out time (HH:mm format, 24-hour, always sent to API) |
| `MaxWorkingHoursFullDay` | string (decimal) | Yes | Max working hours for full day (auto-calculated from InTime/OutTime) |
| `MinWorkingHoursFullDay` | string (decimal) | Yes | Min working hours for full day |
| `MaxWorkingHoursHalfDay` | string (decimal) | Yes | Max working hours for half day |
| `MinWorkingHoursHalfDay` | string (decimal) | Yes | Min working hours for half day |
| `OverTimeApplicable` | string ("true"/"false") | Yes | Whether overtime is applicable |
| `GracePeriodMinsOverTime` | string (number) | Yes | Grace period in minutes for overtime |
| `UserId` | number | Yes | Current user ID (from localStorage.user.uid) |
| `id` | number | Yes | Record ID (0 for new, >0 for update) |

### Notes
- MaxWorkingHoursFullDay is auto-calculated from InTime and OutTime
- OverTimeApplicable is sent as string "true" or "false"
- Time fields follow Railway Time setting from Global Options:
  - If Railway Time = true: Display in 24-hour format (HH:mm)
  - If Railway Time = false: Display in 12-hour format (HH:MM AM/PM)
  - API always receives 24-hour format (HH:mm) regardless of display format

---

## 3. Holiday Master

### API Endpoints
- **Save/Update**: `HolidayMaster/0/token`
- **Get by ID**: `{MASTER_URL}/0/token/HolidayMaster/Id`
- **Get List**: `{MASTER_URL}/0/token/HolidayMaster/Id/0`

### Form Parameters (FormData)
| Parameter Name | Type | Required | Description |
|---------------|------|----------|-------------|
| `Name` | string | Yes | Holiday name |
| `StartingFrom` | string (date) | Yes | Start date (YYYY-MM-DD format) |
| `EndTo` | string (date) | Yes | End date (YYYY-MM-DD format) |
| `UserId` | number | Yes | Current user ID (from localStorage.user.uid) |
| `id` | number | Yes | Record ID (0 for new, >0 for update) |

### Notes
- EndTo must be greater than or equal to StartingFrom
- Dates are sent to API in YYYY-MM-DD format
- Dates are displayed in DD-MM-YYYY format in tables/lists
- Date inputs use YYYY-MM-DD format (HTML5 requirement)

---

## 4. Employee Master

### API Endpoints
- **Save/Update**: `EmployeeMaster/0/token`
- **Get by ID**: `{MASTER_URL}/0/token/EmployeeMaster/Id`
- **Get List**: `{MASTER_URL}/0/token/EmployeeMaster/Id/0`

### Form Parameters (FormData)

#### Tab 1: Personal Information
| Parameter Name | Type | Required | Description |
|---------------|------|----------|-------------|
| `Name` | string | Yes | Employee name |
| `FatherName` | string | Yes | Father's name |
| `MachineEnrollmentNo` | string | Yes | Machine enrollment number |
| `DateOfBirth` | string (date) | Yes | Date of birth (YYYY-MM-DD format for API, DD-MM-YYYY for display) |
| `Age` | string (number) | Yes | Age (auto-calculated from DOB) |
| `DateOfJoining` | string (date) | Yes | Date of joining (YYYY-MM-DD format for API, DD-MM-YYYY for display) |
| `Gender` | string | Yes | Gender (dropdown: M/F) |
| `MobileNo` | string | Yes | Mobile number |
| `Address` | string | Yes | Address |
| `WorkingStatus` | string | Yes | Working status (dropdown: Active/Inactive/On Leave/Terminated) |
| `F_ShiftMaster` | number | Yes | Shift ID (foreign key to ShiftMaster) |

#### Tab 2: Working Hours & Settings
| Parameter Name | Type | Required | Description |
|---------------|------|----------|-------------|
| `InTime` | string (time) | Yes | In time (HH:mm format, 24-hour, always sent to API) |
| `OutTime` | string (time) | Yes | Out time (HH:mm format, 24-hour, always sent to API) |
| `MaxWorkingHoursFullDay` | string (decimal) | Yes | Max working hours for full day |
| `MinWorkingHoursFullDay` | string (decimal) | Yes | Min working hours for full day |
| `MaxWorkingHoursHalfDay` | string (decimal) | Yes | Max working hours for half day |
| `MinWorkingHoursHalfDay` | string (decimal) | Yes | Min working hours for half day |
| `OverTimeApplicable` | string ("true"/"false") | Yes | Whether overtime is applicable |
| `GracePeriodMinsOverTime` | string (number) | Yes | Grace period in minutes for overtime |
| `WeeklyHoliday` | string | Yes | Weekly holiday (dropdown: Sunday/Monday/etc.) |
| `MaxAllowedLeavesPerMonth` | string (number) | Yes | Maximum allowed leaves per month |

#### Tab 3: Family, Qualification & Documents
| Parameter Name | Type | Required | Description |
|---------------|------|----------|-------------|
| `FathersName` | string | No | Father's name |
| `FathersDateOfBirth` | string (date) | No | Father's date of birth (YYYY-MM-DD for API, DD-MM-YYYY for display) |
| `MothersName` | string | No | Mother's name |
| `MothersDateOfBirth` | string (date) | No | Mother's date of birth (YYYY-MM-DD for API, DD-MM-YYYY for display) |
| `WifesName` | string | No | Wife's name |
| `WifesDateOfBirth` | string (date) | No | Wife's date of birth (YYYY-MM-DD for API, DD-MM-YYYY for display) |
| `Child{index}Name` | string | No | Child name (dynamic, index starts from 1) |
| `Child{index}DateOfBirth` | string (date) | No | Child date of birth (YYYY-MM-DD for API, DD-MM-YYYY for display, dynamic) |
| `Child{index}Gender` | string | No | Child gender M/F (dynamic) |
| `Qualification` | string | No | Qualification |
| `Document1Type` | string | No | Document 1 type |
| `Document1No` | string | No | Document 1 number |
| `Document2Type` | string | No | Document 2 type |
| `Document2No` | string | No | Document 2 number |
| `DocumentId1` | File | No | Document 1 file upload |
| `DocumentId2` | File | No | Document 2 file upload |
| `EmployeePhoto` | File | No | Employee photo file upload |
| `EmployeeSignature` | File | No | Employee signature file upload |
| `UserId` | number | Yes | Current user ID (from localStorage.user.uid) |
| `id` | number | Yes | Record ID (0 for new, >0 for update) |

### Notes
- `F_ShiftMaster` is the foreign key parameter (uses F_ prefix for dropdown/foreign key)
- Child details are dynamic: `Child1Name`, `Child1DateOfBirth`, `Child1Gender`, `Child2Name`, etc.
- File uploads are optional
- Age is auto-calculated from DateOfBirth
- All date fields: Display in DD-MM-YYYY format, API receives YYYY-MM-DD format
- Time fields (InTime, OutTime) follow Railway Time setting from Global Options:
  - If Railway Time = true: Display in 24-hour format (HH:mm)
  - If Railway Time = false: Display in 12-hour format (HH:MM AM/PM)
  - API always receives 24-hour format (HH:mm) regardless of display format

---

## 5. Employee Shift Edit Master

### API Endpoints
- **Save/Update**: `EmpShiftEditMaster/0/token`
- **Get by ID**: `{MASTER_URL}/0/token/EmpShiftEditMaster/Id`
- **Get List**: `{MASTER_URL}/0/token/EmpShiftEditMaster/Id/0`

### Form Parameters (FormData)
| Parameter Name | Type | Required | Description |
|---------------|------|----------|-------------|
| `F_EmployeeMaster` | number | Yes | Employee ID (foreign key to EmployeeMaster) |
| `ShiftAssignments[{index}].F_ShiftMaster` | number | Yes | Shift ID (foreign key to ShiftMaster, dynamic array) |
| `UserId` | number | Yes | Current user ID (from localStorage.user.uid) |
| `id` | number | Yes | Record ID (0 for new, >0 for update) |

### Notes
- `F_EmployeeMaster` is the foreign key for Employee
- `ShiftAssignments` is a dynamic array of shift assignments
- Each shift assignment uses `F_ShiftMaster` as the foreign key
- Format: `ShiftAssignments[0].F_ShiftMaster`, `ShiftAssignments[1].F_ShiftMaster`, etc.

---

## 6. Machine Type Master

### API Endpoints
- **Save/Update**: `MachineTypeMaster/0/token`
- **Get by ID**: `{MASTER_URL}/0/token/MachineTypeMaster/Id`
- **Get List**: `{MASTER_URL}/0/token/MachineTypeMaster/Id/0`

### Form Parameters (FormData)
| Parameter Name | Type | Required | Description |
|---------------|------|----------|-------------|
| `MachineType` | string | Yes | Machine type name |
| `MachineName` | string | Yes | Machine name |
| `UserId` | number | Yes | Current user ID (from localStorage.user.uid) |
| `id` | number | Yes | Record ID (0 for new, >0 for update) |

---

## 7. Global Options

### API Endpoints
- **Save/Update**: `GlobalOptions/0/token`
- **Get by ID**: `{MASTER_URL}/0/token/GlobalOptions/Id/1` (ID is always 1 for global settings)

### Form Parameters (FormData)
| Parameter Name | Type | Required | Description |
|---------------|------|----------|-------------|
| `Holidays` | string | Yes | Weekly holiday (single selection: Sunday/Monday/etc.) |
| `InTime` | string (time) | Yes | Default in time (HH:mm format, 24-hour, always sent to API) |
| `OutTime` | string (time) | Yes | Default out time (HH:mm format, 24-hour, always sent to API) |
| `MinWorkingHoursFullDay` | string (decimal) | Yes | Min working hours for full day |
| `MaxWorkingHoursFullDay` | string (decimal) | Yes | Max working hours for full day (auto-calculated from InTime/OutTime) |
| `MinWorkingHoursHalfDay` | string (decimal) | Yes | Min working hours for half day |
| `MaxWorkingHoursHalfDay` | string (decimal) | Yes | Max working hours for half day |
| `RailwayTime` | string ("true"/"false") | Yes | Railway time checkbox |
| `OverTimeApply` | string ("true"/"false") | Yes | Overtime apply checkbox |
| `CountNextDayIn` | string ("true"/"false") | Yes | Count next day in checkbox |
| `CountNextDayInHours` | string (number) | Yes | Hours for count next day in |
| `F_MachineTypeMaster` | number | Yes | Machine Type ID (foreign key to MachineTypeMaster) |
| `MachineName` | string | Yes | Machine name (auto-filled from MachineType selection) |
| `MachineNo` | string | Yes | Machine number |
| `IPAddress` | string | Yes | IP address |
| `PortNo` | string | Yes | Port number |
| `UserId` | number | Yes | Current user ID (from localStorage.user.uid) |
| `id` | number | Yes | Record ID (always 1 for global settings) |

### Notes
- Global Options always uses ID = 1
- `F_MachineTypeMaster` is the foreign key for Machine Type dropdown
- MachineName is auto-filled when MachineType is selected
- MaxWorkingHoursFullDay is auto-calculated from InTime and OutTime
- Checkboxes are sent as string "true" or "false"
- **Railway Time Setting**: This checkbox controls time format across ALL master forms:
  - Railway Time = true: All time fields display in 24-hour format (HH:mm)
  - Railway Time = false: All time fields display in 12-hour format (HH:MM AM/PM)
  - API always receives 24-hour format (HH:mm) regardless of Railway Time setting
  - When Railway Time is changed, all time inputs in Shift Master, Employee Master, and Global Options automatically switch format

---

## Common Patterns

### Foreign Key Parameters (F_ Prefix)
All dropdown/foreign key fields use the `F_` prefix:
- `F_ShiftMaster` - Foreign key to ShiftMaster
- `F_EmployeeMaster` - Foreign key to EmployeeMaster
- `F_MachineTypeMaster` - Foreign key to MachineTypeMaster

### UserId Format
- Source: `localStorage.getItem("user")`
- Property: `obj.uid`
- Format: `obj === null || obj === undefined ? 0 : obj.uid`

### Date Format
- **Input (HTML5 date inputs)**: YYYY-MM-DD (required format for date input fields)
- **Display (Tables/Lists)**: DD-MM-YYYY (DDMMYYYY format for user display)
- **API Submission**: YYYY-MM-DD (always sent to backend in this format)
- **Examples**: 
  - Input/API: "2024-01-15"
  - Display: "15-01-2024"

### Time Format
- **Railway Time Setting**: Time format depends on Global Options → Railway Time checkbox
  - **Railway Time = true**: 24-hour format (HH:mm)
    - Example: "09:00", "18:30", "23:59"
    - Uses HTML5 `type="time"` input
  - **Railway Time = false**: 12-hour format (HH:MM AM/PM)
    - Example: "09:00 AM", "06:30 PM", "11:59 PM"
    - Uses text input with pattern validation
- **API Submission**: Always 24-hour format (HH:mm) regardless of Railway Time setting
  - Frontend automatically converts 12-hour format to 24-hour before API submission
  - Example: "06:30 PM" → "18:30" (for API)
- **Note**: Railway Time setting from Global Options applies to ALL time fields across ALL master forms

### Boolean/Checkbox Format
- Sent as string: "true" or "false"
- Not sent as boolean true/false

### File Uploads
- Sent as File objects in FormData
- Optional fields
- Examples: DocumentId1, DocumentId2, EmployeePhoto, EmployeeSignature

### Dynamic Arrays
- Child details: `Child{index}Name`, `Child{index}DateOfBirth`, `Child{index}Gender`
- Shift assignments: `ShiftAssignments[{index}].F_ShiftMaster`

---




### Error Response
- Status code: Not 200
- Error message in response data

---

## Notes for Backend Developer

1. **All API calls use FormData** (multipart/form-data), not JSON
2. **Foreign keys use F_ prefix** (e.g., F_ShiftMaster, F_EmployeeMaster)
3. **UserId is always required** and comes from localStorage.user.uid
4. **id parameter**: 0 for new records, >0 for updates
5. **Checkboxes/Booleans** are sent as strings "true"/"false"
6. **Dates**:
   - **API receives**: Always YYYY-MM-DD format (e.g., "2024-01-15")
   - **Frontend displays**: DD-MM-YYYY format (e.g., "15-01-2024") in tables/lists
   - **Date inputs**: Use YYYY-MM-DD format (HTML5 requirement)
7. **Times**:
   - **API receives**: Always HH:mm format (24-hour, e.g., "09:00", "18:30")
   - **Frontend display**: Depends on Railway Time setting from Global Options
     - Railway Time = true: 24-hour format (HH:mm)
     - Railway Time = false: 12-hour format (HH:MM AM/PM, e.g., "09:00 AM", "06:30 PM")
   - Frontend automatically converts 12-hour format to 24-hour before API submission
   - Railway Time setting applies to ALL time fields across ALL master forms
8. **File uploads** are optional and sent as File objects
9. **Dynamic arrays** use indexed parameter names (e.g., Child1Name, Child2Name)
10. **Global Options** always uses ID = 1
11. **Railway Time**: This Global Options setting controls time format display across the entire application

---

## Contact
For any questions or clarifications, please refer to the frontend codebase or contact the frontend development team.

