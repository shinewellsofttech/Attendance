import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import LayoutRoutes from "./LayoutRoutes";
import Login from "../Component/Authentication/Login";

const RouterData = () => {
  const storedUser = localStorage.getItem("authUser");
  let isAuthenticated = false;
  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);
      isAuthenticated = Number(parsedUser?.Id) > 0;
    } catch (error) {
      console.error("Invalid authUser in localStorage", error);
      isAuthenticated = false;
    }
  }
  
  const normalizePath = (path: string): string => {
    const basePath = process.env.PUBLIC_URL || "";
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    if (basePath) {
      return `${basePath}${cleanPath}`;
    }
    return cleanPath;
  };

  const defaultRoute = normalizePath("/reports");

  return (
    <BrowserRouter basename={"/"}>
      <Routes>
        <Route
          path={normalizePath("/")}
          element={
            isAuthenticated ? (
              <Navigate to={defaultRoute} replace />
            ) : (
              <Navigate to={normalizePath("/login")} replace />
            )
          }
        />
        <Route
          path={normalizePath("/login")}
          element={
            isAuthenticated ? <Navigate to={defaultRoute} replace /> : <Login />
          }
        />
        <Route path="/*" element={<PrivateRoute />}>
          <Route path="*" element={<LayoutRoutes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default RouterData;
