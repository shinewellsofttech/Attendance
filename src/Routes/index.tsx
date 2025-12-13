import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import LayoutRoutes from "./LayoutRoutes";
import Login from "../Component/Authentication/Login";

const RouterData = () => {
  const storedUser = localStorage.getItem("authUser");
  let isAuthenticated = false;
  let userType: number | null = null;
  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);
      isAuthenticated = Number(parsedUser?.Id) > 0;
      userType = parsedUser?.F_UserType || null;
    } catch (error) {
      console.error("Invalid authUser in localStorage", error);
      isAuthenticated = false;
    }
  }
  
  // Determine default route based on user type
  const getDefaultRoute = (): string => {
    if (userType === 8) {
      return `${process.env.PUBLIC_URL}/reports`; // Admin
    } else {
      return `${process.env.PUBLIC_URL}/employeeReports`; // Employee
    }
  };
  
  const defaultRoute = getDefaultRoute();
  
  return (
    <BrowserRouter basename={"/"}>
      <Routes>
        <Route
          path={`${process.env.PUBLIC_URL}` || "/"}
          element={
            isAuthenticated ? (
              <Navigate to={defaultRoute} />
            ) : (
              <Navigate to={`${process.env.PUBLIC_URL}/login`} />
            )
          }
        />
        <Route path={"/"} element={<PrivateRoute />}>
          <Route path={`/*`} element={<LayoutRoutes />} />
        </Route>
        <Route
          path={`${process.env.PUBLIC_URL}/login`}
          element={
            isAuthenticated ? <Navigate to={defaultRoute} /> : <Login />
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default RouterData;
