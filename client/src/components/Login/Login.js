import { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Image } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './index.css'

export default function Login({ setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.get("http://localhost:9999/users");
      const users = res.data;

      const user = users.find(
        (u) => u.username === username && u.password === password
      );

      if (!user) {
        alert("Sai thông tin đăng nhập!");
        return;
      }

      sessionStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      switch (user.roleId) {
        case 1: // Customer
          navigate("/");
          break;
        case 2: // Staff
          navigate("/staff");
          break;
        case 3: // Admin
          navigate("/admin");
          break;
        default:
          alert("Vai trò không hợp lệ!");
      }
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi khi đăng nhập.");
    }
  };

  return (
    <Container className="my-5">
      <Card className="shadow">
        <Row className="g-0">
          {/* Image */}
          <Col md={6}>
            <Image
              src="https://www.tastingtable.com/img/gallery/14-facts-you-need-to-know-about-hot-pot/intro-1681931538.webp"
              alt="login form"
              className="w-100 h-100"
              style={{ objectFit: "cover", borderRadius: "0.375rem 0 0 0.375rem" }}
            />
          </Col>

          {/* Form */}
          <Col md={6}>
            <Card.Body className="d-flex flex-column justify-content-center px-5 py-4">
              <div className="d-flex align-items-center mb-3">
                <h2 className="fw-bold ms-2 mb-0">HotPot Restaurant</h2>
              </div>

              <h5 className="fw-normal mb-4" style={{ letterSpacing: "1px" }}>
                Đăng nhập vào tài khoản
              </h5>

              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-4">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Button variant="dark" type="submit" className="w-100">
                  Login
                </Button>
              </Form>
            </Card.Body>
          </Col>
        </Row>
      </Card>
    </Container>
  );
}
