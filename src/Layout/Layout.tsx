/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "../ReduxToolkit/Hooks"
import { setToggleSidebar } from "../ReduxToolkit/Reducers/LayoutSlice"
import { setLayout } from "../ReduxToolkit/Reducers/ThemeCustomizerSlice"
import Footer from "./Footer/Footer"
import Header from "./Header/Header"
import Loader from "./Loader/Loader"
import Sidebar from "./Sidebar/Sidebar"
import TapTop from "./TapTop/TapTop"
import ThemeCustomizer from "./ThemeCustomizer/ThemeCustomizer"
import { Outlet } from "react-router-dom"

const Layout = () => {
  const {layout} = useAppSelector((state)=>state.themeCustomizer)
  const {toggleSidebar,scroll} = useAppSelector((state)=>state.layout)
  const dispatch = useAppDispatch()
  const compactSidebar = () => {
    let windowWidth = window.innerWidth;
    if (layout === "compact-wrapper") {
      if (windowWidth < 1200 ) {
        dispatch(setToggleSidebar(true))
      } 
      else {
        // Keep sidebar closed by default on desktop for hover behavior
        dispatch(setToggleSidebar(true))
      }
    }else if(layout === "horizontal-wrapper") {
      if (windowWidth < 992 ) {
        dispatch(setToggleSidebar(true))
        dispatch(setLayout("compact-wrapper"))
      } 
      else {
        dispatch(setToggleSidebar(false))
        dispatch(setLayout(localStorage.getItem("layout")))
      }
    }
  }; 
  useEffect(() => {
    compactSidebar();
    window.addEventListener("resize", () => {
      compactSidebar();
    });
  }, [layout]);
  return (
    <>
      <Loader />
      <TapTop />
      <div className={`page-wrapper ${layout}`}>
        <div className={`page-header ${toggleSidebar ? "close_icon" : ""}`} style={{display: scroll ? "none" : ""}}>
          <Header />
        </div>
        <div className={`page-body-wrapper ${scroll ? "scorlled" : ""}`}>
          <Sidebar />
          <Outlet />
          <Footer />
        </div>
      </div>
      <ThemeCustomizer />
    </>
  )
}

export default Layout