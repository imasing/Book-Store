import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function Admin_Header({ setUser }) {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user"));

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return (
    <Navbar expand="lg" variant="dark" fixed="top" style={{ backgroundColor: "#1a1a1a" }}>
      <Container>
        <Navbar.Brand onClick={() => navigate("/admin")} style={{ cursor: "pointer" }}>
          Admin Panel
        </Navbar.Brand>
        <Nav className="ms-auto">
          <Nav.Link disabled className="text-white me-3">
            {user?.username}
          </Nav.Link>
          <Button variant="outline-light" onClick={handleLogout}>
            Logout
          </Button>
        </Nav>
      </Container>
    </Navbar>
  );
}
