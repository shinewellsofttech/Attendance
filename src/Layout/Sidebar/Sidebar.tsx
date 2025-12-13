import { Link } from 'react-router-dom'
import { H6, Image, LI, UL } from '../../AbstractElements'
import { useAppDispatch, useAppSelector } from '../../ReduxToolkit/Hooks'
import LogoWrapper from './LogoWrapper';
import SimpleBar from 'simplebar-react';
import { Back, Pinned } from '../../utils/Constant';
import { dynamicImage } from '../../Service';
import { ArrowLeft, ArrowRight } from 'react-feather';
import SidebarMenuList from './SidebarMenuList';
import { scrollToLeft, scrollToRight, setToggleSidebar } from '../../ReduxToolkit/Reducers/LayoutSlice';
import { useEffect, useState } from 'react';

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const { layout } = useAppSelector((state) => state.themeCustomizer);
  const { toggleSidebar, margin } = useAppSelector((state) => state.layout);
  const { pinedMenu } = useAppSelector((state) => state.layout);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1200);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1200;
      setIsDesktop(desktop);
      // If mobile, don't apply hover behavior
      if (!desktop) {
        return;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseEnter = () => {
    // Only apply hover on desktop screens
    if (isDesktop && layout === "compact-wrapper") {
      dispatch(setToggleSidebar(false));
    }
  };

  const handleMouseLeave = () => {
    // Only apply hover on desktop screens
    if (isDesktop && layout === "compact-wrapper") {
      dispatch(setToggleSidebar(true));
    }
  };

  return (
    <div 
      className={`sidebar-wrapper ${toggleSidebar ? "close_icon" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div>
        <LogoWrapper />
        <nav className="sidebar-main">
          <div className={`left-arrow ${margin === 0 ? "disabled" : ""}`} onClick={()=>dispatch(scrollToLeft())}><ArrowLeft /></div>
          <div id="sidebar-menu" style={{ marginLeft : layout === "horizontal-wrapper" ? `${margin}px` : "0px"}}>
            <UL className="sidebar-links" id="simple-bar" >
              <SimpleBar style={{ margin: "0px"}}>
                <LI className="back-btn">
                  <Link to={`${process.env.PUBLIC_URL}/reports`}>
                    <Image className="img-fluid" src={dynamicImage("logo/logo-icon.png")} alt="logo" />
                  </Link>
                  <div className="mobile-back text-end ">
                    <span>{Back}</span>
                    <i className="fa fa-angle-right ps-2" aria-hidden="true"></i>
                  </div>
                </LI>
                <LI className={`pin-title sidebar-main-title ${pinedMenu.length > 1 ? "show" : ""} `}>
                  <div>
                    <H6>{Pinned}</H6>
                  </div>
                </LI>
              <SidebarMenuList />
              </SimpleBar>
            </UL> 
          </div>
          <div className={`right-arrow ${margin === -3500 ? "disabled" : ""}`} onClick={()=>dispatch(scrollToRight())}><ArrowRight /></div>
        </nav>
      </div>
    </div>
  )
}

export default Sidebar