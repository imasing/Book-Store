import React from 'react';
import { Navbar, Nav, Container, Badge } from 'react-bootstrap';
import { BookOpen, ShoppingBag } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import './index.css';

function Header() {
  return (
    <Navbar expand="lg" className="store-header sticky-top">
      <Container fluid>
        <Navbar.Brand as={Link} to="/" className="store-brand">
          <span className="brand-mark"><BookOpen size={19} strokeWidth={2.2} /></span>
          <span>Mộc Bản<span className="brand-period">.</span></span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="store-navigation" />
        <Navbar.Collapse id="store-navigation" className="justify-content-end">
          <Nav className="align-items-lg-center gap-lg-3">
            <Nav.Link as={NavLink} to="/" end>Khám phá</Nav.Link>
            <Nav.Link as={NavLink} to="/orders">Đơn hàng</Nav.Link>
            <Nav.Link as={NavLink} to="/admin/books">Quản trị</Nav.Link>
            <Nav.Link as={NavLink} to="/cart" className="cart-nav-link">
              <ShoppingBag size={17} /> Giỏ hàng <Badge bg="light" text="dark">2</Badge>
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;
