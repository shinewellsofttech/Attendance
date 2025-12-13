import { Fragment, useState, useMemo } from 'react'
import { useAppSelector } from '../../ReduxToolkit/Hooks';
import { getMenuList } from '../../Data/LayoutData/SidebarData';
import Menulist from './Menulist';
import { MenuItem } from '../../Types/Layout/SidebarType';
import { H6, LI } from '../../AbstractElements';
import { useTranslation } from 'react-i18next';

const  SidebarMenuList = () => {
    const [activeMenu, setActiveMenu] = useState<string[]>([]);
    const { pinedMenu } = useAppSelector((state) => state.layout);
    const { t } = useTranslation();
    const shouldHideMenu = (mainMenu: MenuItem) => {return mainMenu?.Items?.map((data) => data.title).every((titles) =>pinedMenu.includes(titles || ""));};
  
    // Get menu list based on user type
    const filteredMenuList = useMemo(() => {
      return getMenuList();
    }, []);
  
    return (
      <>
        {filteredMenuList &&
          filteredMenuList.map((mainMenu: MenuItem, index) => (
            <Fragment key={index}>
              <LI className={`sidebar-main-title ${shouldHideMenu(mainMenu) ? "d-none" : ""}`}>
                <div>
                  <H6 className={mainMenu.lanClass && mainMenu.lanClass}>{t(mainMenu.title)}</H6>
                </div>
              </LI>
              <Menulist menu={mainMenu.Items} activeMenu={activeMenu} setActiveMenu={setActiveMenu}  level={0}/>
            </Fragment>
          ))}
      </>
    );
}

export default SidebarMenuList