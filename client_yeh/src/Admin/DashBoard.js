import { Container } from 'react-bootstrap';
import './DashBoard.css';

export default function DashBoard() {
  return (
    <>
      <div className="background-image"></div>
      <Container className="dashboard-content">
        <h1 className="text-black">Welcome!</h1>
      </Container>
    </>
  );
}
