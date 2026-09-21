import "./MainLayout.css";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";

const MainLayout = ({ children }) => {
  return (
    <div className="layout-root">
      <Navbar />
      <div className="layout-body">
        <Sidebar />
        <main className="layout-content">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;