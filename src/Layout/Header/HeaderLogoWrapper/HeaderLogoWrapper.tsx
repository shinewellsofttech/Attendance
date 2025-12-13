import { Link } from "react-router-dom";
import Image from "../../../CommonElements/Media";
import { dynamicImage } from "../../../Service";

const HeaderLogoWrapper = () => {
  return (
    <div className="header-logo-wrapper col-auto p-0">
      <div className="logo-wrapper">
        <Link to={"/"}>
          <Image className="img-fluid" src={dynamicImage("logo/logo.png")} alt="CrocsLogo" />
        </Link>
      </div>
    </div>
  );
};

export default HeaderLogoWrapper;
