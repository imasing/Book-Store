import React from 'react';
import { Navbar, Nav, Container, Badge, NavDropdown } from 'react-bootstrap';
import { BookOpen, LogIn, ShoppingBag, UserRound } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import './index.css';

function Header() {
  const { user, isAdmin, isCustomer, logout } = useAuth();
  const { cart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    showToast('Đã đăng xuất.', 'info');
    navigate('/');
  };

  return (
    <Navbar expand="lg" className="store-header sticky-top" collapseOnSelect>
      <Container fluid>
        <Navbar.Brand as={Link} to="/" className="store-brand">
          <span className="brand-mark"><BookOpen size={19} strokeWidth={2.2} /></span>
          <span>Mộc Bản<span className="brand-period">.</span></span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="store-navigation" />
        <Navbar.Collapse id="store-navigation" className="justify-content-end">
          <Nav className="align-items-lg-center gap-lg-3">
            <Nav.Link as={NavLink} to="/" end>Khám phá</Nav.Link>
            {!isAdmin && <Nav.Link as={NavLink} to="/orders">Đơn hàng</Nav.Link>}
            {isAdmin && <Nav.Link as={NavLink} to="/admin/books">Quản trị</Nav.Link>}
            {!isAdmin && (
              <Nav.Link as={NavLink} to="/cart" className="cart-nav-link">
                <ShoppingBag size={17} /> Giỏ hàng
                {isCustomer && <Badge bg="light" text="dark">{cart.itemCount}</Badge>}
              </Nav.Link>
            )}
            {user ? (
              <NavDropdown
                align="end"
                id="account-menu"
                title={<span className="account-toggle"><UserRound size={16} /> {user.fullName}</span>}
              >
                <NavDropdown.ItemText className="account-email">{user.email}</NavDropdown.ItemText>
                <NavDropdown.Divider />
                {isCustomer && <NavDropdown.Item as={Link} to="/orders">Đơn hàng của tôi</NavDropdown.Item>}
                {isAdmin && <NavDropdown.Item as={Link} to="/admin/orders">Xử lý đơn hàng</NavDropdown.Item>}
                <NavDropdown.Item onClick={handleLogout}>Đăng xuất</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav.Link as={NavLink} to="/login"><LogIn size={16} /> Đăng nhập</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;
