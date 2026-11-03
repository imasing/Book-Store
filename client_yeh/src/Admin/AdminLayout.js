import Header from '../components/Header/Header';
import AdminSidebar from '../components/SideBar/Admin_SideBar';
import { Row, Col, Container } from 'react-bootstrap';
import { Outlet } from 'react-router-dom';

export default function Admin_dashboard(){
    return (
        <>
            <Header />
            <Container fluid className="admin-shell px-0">
                <Row className="g-0">
                <Col lg={2} md={3}>
                    <AdminSidebar />
                </Col>
                <Col lg={10} md={9} className="admin-content">
                    <Outlet />
                </Col>
                </Row>
            </Container>
        </>  
    )
};