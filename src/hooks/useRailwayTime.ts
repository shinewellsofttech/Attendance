import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Fn_FillListData } from "../store/Functions";
import { API_WEB_URLS } from "../constants/constAPI";

/**
 * Hook to get Railway Time setting from Global Options
 * @returns boolean - true if Railway Time is enabled (24-hour format), false for 12-hour format
 */
export const useRailwayTime = (): boolean => {
  const [railwayTime, setRailwayTime] = useState<boolean>(false);
  const dispatch = useDispatch();

  useEffect(() => {
    // Try to get from localStorage cache first
    const cached = localStorage.getItem("globalOptions");
    if (cached) {
      try {
        const options = JSON.parse(cached);
        const isRailway = options.RailwayTime === true || options.RailwayTime === "true" || options.RailwayTime === 1;
        setRailwayTime(isRailway);
        // Still fetch from API in background to ensure we have latest value
      } catch (e) {
        // If parsing fails, fetch from API
      }
    }

    // Fetch from API to get latest value using Fn_FillListData
    const API_URL = API_WEB_URLS.MASTER + "/0/token/GlobalOptions/Id/1";
    const setState = (prevState: any) => {
      const newState = typeof prevState === "function" ? prevState({}) : prevState;
      // Fn_FillListData returns data in gridName array, get first item
      if (newState?.GlobalOptionsArray && Array.isArray(newState.GlobalOptionsArray) && newState.GlobalOptionsArray.length > 0) {
        const formData = newState.GlobalOptionsArray[0];
        const isRailway = formData.RailwayTime === true || 
                         formData.RailwayTime === "true" || 
                         formData.RailwayTime === 1 ||
                         formData.IsRailwayTime === true ||
                         formData.IsRailwayTime === "true" ||
                         formData.IsRailwayTime === 1;
        setRailwayTime(isRailway);
        
        // Cache in localStorage
        localStorage.setItem("globalOptions", JSON.stringify(formData));
      }
      return newState;
    };

    Fn_FillListData(dispatch, setState, "GlobalOptionsArray", API_URL);
  }, [dispatch]);

  return railwayTime;
};

