import { useEffect, useState } from "react";
import { Image, LI, P } from "../../../../AbstractElements";
import { dynamicImage } from "../../../../Service";
import ProfileBox from "./ProfileBox";

const UserProfile = () => {
  const [userName, setUserName] = useState("User");
  const [userDesignation, setUserDesignation] = useState("");

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("authUser");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const name = parsedUser?.Name || parsedUser?.name || "User";
        const userType = parsedUser?.F_UserType;
        
        // Set designation based on user type
        let designation = "";
        if (userType === 8) {
          designation = "Administrator";
        } else if (userType === 9) {
          designation = "Employee";
        } else {
          designation = "User";
        }
        
        setUserName(name);
        setUserDesignation(designation);
      }
    } catch (error) {
      console.error("Error parsing authUser from localStorage:", error);
    }
  }, []);

  return (
    <LI className="profile-nav onhover-dropdown p-0">
      <div className="d-flex profile-media align-items-center">
        <Image className="b-r-10 img-40" src={dynamicImage("dashboard/profile.png")} alt="user" />
        <div className="flex-grow-1">
          <span>{userName}</span>
          <P className="mb-0">{userDesignation}</P>
        </div>
      </div>
      <ProfileBox />
    </LI>
  );
};

export default UserProfile;
