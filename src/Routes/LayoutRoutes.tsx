import { Route, Routes } from "react-router-dom";
import Layout from "../Layout/Layout";
import { routes } from "./Route";

const LayoutRoutes = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        {routes.map(({ path, Component }, i) => {
          // Remove leading slash and process.env.PUBLIC_URL prefix for nested route matching
          let routePath = path;
          const basePath = process.env.PUBLIC_URL || "";
          if (basePath && routePath.startsWith(basePath)) {
            routePath = routePath.substring(basePath.length);
          }
          // Remove leading slash for relative path matching under catch-all
          routePath = routePath.startsWith('/') ? routePath.substring(1) : routePath;
          
          return <Route path={routePath} element={Component} key={i} />;
        })}
      </Route>
    </Routes>
  );
};

export default LayoutRoutes;
