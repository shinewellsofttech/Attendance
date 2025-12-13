// functions.js
// Note: Using react-toastify instead of toastr
import { toast } from "react-toastify";

import {
  callAdd_Data_Multipart,
  callEdit_Data,
  callEdit_Data_Multipart,
  callFill_GridData,
  callGet_Data,
  callDelete_Data,
} from "./common-actions"

export const Fn_FillListData = (
  dispatch,
  setState,
  gridName,
  apiURL,
  setKey,
  setSearchKeyArray
) => {
  return new Promise((resolve, reject) => {
    const request = {
      apiURL: apiURL,
      callback: response => {
        if (response && response.status === 200 && response.data) {
          const dataList = response.data.dataList
          if (gridName == "gridDataSearch") {
            const firstObject = response.data.dataList[0]
            const keysArray = Object.keys(firstObject).filter(
              item => item !== "Id"
            )
            setSearchKeyArray(keysArray)
            setState(response.data.dataList)
            setKey(keysArray[0])
            resolve(response.data.dataList)
          } else if (
            gridName === "productData" ||
            gridName === "OtherDataScore"
          ) {
            setState(prevState => ({
              ...prevState,
              [gridName]: dataList,
              rows: [Object.keys(dataList[0])],
              isProgress: false,
            }))
            resolve(dataList)
          } else if (gridName == "gridData") {
            setState(dataList)
            resolve(dataList)
          } else if (gridName == "FileNo") {
            setState(prevState => ({
              ...prevState,
              ["FileNo"]: response.data.dataList[0].FileNo,
            }))
            resolve(response.data.dataList[0].FileNo)
          } else {
            setState(prevState => ({
              ...prevState,
              [gridName]: dataList,
              isProgress: false,
            }))
            resolve(dataList)
          }
          showToastWithCloseButton("success", "Data loaded successfully")
        } else {
          showToastWithCloseButton("error", "Error loading data")
          reject(new Error("Error loading data"))
        }
      },
    }
    dispatch(callFill_GridData(request))
  })
}

export const Fn_DisplayData = (dispatch, setState, id, apiURL, gridname) => {
  const request = {
    id: id,
    apiURL: apiURL,
    callback: response => {
      if (response && response.status === 200 && response.data) {
        setState(prevState => ({
          ...prevState,
          formData: response.data.dataList[0],
        }))
        showToastWithCloseButton("success", "Data displayed successfully")
      } else {
        showToastWithCloseButton("error", "Error displaying data")
      }
    },
  }
  dispatch(callGet_Data(request))
}

export const Fn_AddEditData = (
  dispatch,
  setState,
  data,
  apiURL,
  isMultiPart = false,
  getid,
  navigate,
  forward
) => {
  console.log("in function")
  return new Promise((resolve, reject) => {
    const { arguList } = data
    const request = {
      arguList: arguList,
      apiURL: apiURL,
      callback: response => {
        if (response && response.status === 200) {
          console.log("arguList", arguList)

          if (getid === "certificate") {
            if (response.data.response[0].Id > 0) {
              setState(response.data.response[0].RegNo)
              showToastWithCloseButton(
                "success",
                "File downloaded successfully"
              )
            } else {
              showToastWithCloseButton("error", "Duplicate mobile number")
            }
          } else if (
            response.data.response &&
            response.data.response[0].Id > 0
          ) {
            setState(true)
            localStorage.setItem(
              "YesBank",
              JSON.stringify(response.data.response[0])
            )
          } else if (getid === "TenderH") {
            setState(prevState => ({
              ...prevState,
              F_TenderFileMasterH: response.data.data.id,
            }))
          }

          if (arguList.id === 0) {
            showToastWithCloseButton("success", "Data added successfully")
            resolve(response) // ✅ return full response
            navigate(forward, { state: { Id: 0 } })
          } else {
            showToastWithCloseButton("success", "Data updated successfully")
            resolve(response) // ✅ return full response
            navigate(forward, { state: { Id: 0 } })
          }
        } else {
          if (arguList.id === 0) {
            showToastWithCloseButton("error", "Error adding data")
            reject("Some error occurred while adding data")
          } else {
            showToastWithCloseButton("error", "Error updating data")
            reject("Some error occurred while updating data")
          }
        }
      },
    }

    if (arguList.id === 0) {
      if (isMultiPart) dispatch(callAdd_Data_Multipart(request))
    } else {
      if (isMultiPart) dispatch(callEdit_Data_Multipart(request))
    }
  })
}

export const Fn_GetReport = (
  dispatch,
  setState,
  gridName,
  apiURL,
  data,
  isMultiPart = false
) => {
  return new Promise((resolve, reject) => {
    const { arguList } = data
    const request = {
      arguList: arguList,
      apiURL: apiURL,
      callback: response => {
        try {
          if (response && response.status === 200 && response.data) {
            const responseData = response.data.response
            if (
              gridName === "productData" ||
              gridName === "productDataAssest"
            ) {
              setState(prevState => ({
                ...prevState,
                [gridName]: responseData,
                rows: [Object.keys(responseData[0])],
                isProgress: false,
              }))
            } else if (gridName == "tenderData") {
              setState(responseData)
            } else {
              setState(prevState => ({
                ...prevState,
                [gridName]: responseData,
                isProgress: false,
              }))
            }

            showToastWithCloseButton("success", "Report generated successfully")
            resolve(responseData)
          } else {
            showToastWithCloseButton("warning", "Data not found")
            setState(prevState => ({ ...prevState, isProgress: false }))
            resolve(null)
          }
        } catch (error) {
          console.error("Error processing report data:", error)
          setState(prevState => ({ ...prevState, isProgress: false }))
          showToastWithCloseButton("error", "Failed to process report data")
          reject(error)
        }
      },
      errorCallback: error => {
        console.error("Error fetching report:", error)
        setState(prevState => ({ ...prevState, isProgress: false }))
        showToastWithCloseButton("error", "Failed to fetch report")
        reject(error)
      },
    }

    dispatch(callAdd_Data_Multipart(request))
  })
}

export const Fn_DeleteData = (
  dispatch,
  setState,
  id,
  apiURL,
  apiURL_Display
) => {
  console.log("Fn_DeleteData called with:", { id, apiURL, apiURL_Display });
  return new Promise((resolve, reject) => {
    const request = {
      id: id,
      apiURL: apiURL,
      callback: response => {
        console.log("Delete callback response:", response);
        // Check for success - API might return different response structures
        // Handle both direct status and nested data.status
        const isSuccess = response && (
          response.status === 200 || 
          response.statusCode === 200 ||
          (response.data && (
            response.data.status === 200 || 
            response.data.status === 'success' ||
            response.data.statusCode === 200 ||
            response.data.success === true ||
            response.data.response // Some APIs return data in response field
          )) ||
          (response.response && response.response.status === 200)
        );
        
        if (isSuccess) {
          setState(prevState => ({
            ...prevState,
            confirm_alert: false,
            success_dlg: true,
            dynamic_title: "Deleted",
            dynamic_description: "Selected data has been deleted.",
          }))
          showToastWithCloseButton("success", "Data deleted successfully")

          // If apiURL_Display is provided, refresh the list
          if (apiURL_Display) {
            // Fn_FillListData(dispatch, setState, "gridData", apiURL_Display);
            // Fn_FillListData(dispatch, setState, "Invoice", apiURL_Display);
            // window.location.reload()
          }

          resolve(response) // Resolve the Promise with the response
        } else {
          setState(prevState => ({
            ...prevState,
            confirm_alert: false,
            dynamic_title: "Error",
            dynamic_description: "Some error occurred while deleting data.",
          }))
          showToastWithCloseButton(
            "error",
            "Some error occurred while deleting data"
          )
          reject(new Error("Error deleting data")) // Reject the Promise with an error
        }
      },
      errorCallback: error => {
        console.error("Delete errorCallback:", error);
        setState(prevState => ({
          ...prevState,
          confirm_alert: false,
          dynamic_title: "Error",
          dynamic_description: "Some error occurred while deleting data.",
        }))
        showToastWithCloseButton(
          "error",
          "Some error occurred while deleting data"
        )
        reject(error) // Reject the Promise with an error
      },
    }

    // Dispatch the delete action
    dispatch(callDelete_Data(request))
  })
}

export function showToastWithCloseButton(toastType, message) {
  // Using react-toastify instead of toastr
  const { toast } = require("react-toastify");
  
  const toastOptions = {
    closeButton: true,
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  };

  if (toastType === "success") {
    toast.success(message, toastOptions);
  } else if (toastType === "error") {
    toast.error(message, toastOptions);
  } else if (toastType === "warning") {
    toast.warning(message, toastOptions);
  } else {
    toast.info(message, toastOptions);
  }
}
