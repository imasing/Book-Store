import { Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import "./Admin_SideBar.css";
import { BookOpen, ClipboardList, Layers3 } from "lucide-react";

export default function Admin_SideBar() {
  return (
    <div className="admin-sidebar">
      <p className="admin-sidebar-label">CỬA HÀNG</p>
      <Nav className="flex-column px-3">
        <Nav.Link
          as={NavLink}
          to="/admin/books"
          className="sidebar-link"
        >
          <BookOpen size={17} /> Sách
        </Nav.Link>
        <Nav.Link
          as={NavLink}
          to="/admin/categories"
          className="sidebar-link"
        >
          <Layers3 size={17} /> Thể loại
        </Nav.Link>
        <Nav.Link
          as={NavLink}
          to="/admin/orders"
          className="sidebar-link"
        >
          <ClipboardList size={17} /> Đơn hàng
        </Nav.Link>
      </Nav>
    </div>
  );
}
