import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }: { children: React.ReactElement }) => {
  try {
    const storedUser = localStorage.getItem("authUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const userType = parsedUser?.F_UserType;
      // Only allow access if userType === 8
      if (userType === 8) {
        return children;
      }
    }
  } catch (error) {
    console.error("Error parsing authUser from localStorage:", error);
  }
  // Redirect to reports page if not admin
  return <Navigate to={`${process.env.PUBLIC_URL}/reports`} replace />;
};

export default AdminRoute;
