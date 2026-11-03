import { Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import Badge from 'react-bootstrap/Badge';

function SideBar() {
  const [calls, setCalls] = useState([]);

  useEffect(() => {
    fetch('http://localhost:9999/staffCalls')
      .then(response => response.json())
      .then(setCalls)
      .catch(err => {
        console.error("Failed to fetch staff calls:", err);
      });
  }, []);

  const getTableCheckoutRequests = (calls) => {
    const checkoutCalls = calls.filter(call => call.status === 'check-out');
    const tableIds = checkoutCalls.map(call => call.tableId);
    return [...new Set(tableIds)];
  };

  const checkoutTables = getTableCheckoutRequests(calls);

  return (
    <div
      className="d-flex flex-column text-white"
      style={{
        backgroundColor: '#1a1a1a',
        color: 'white',
        height: '100vh',
        paddingTop: '56px',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '16.6666%'
      }}
    >
      <Nav className="flex-column flex-grow-1 px-2">
        <div className="px-2 text-uppercase text-white">Manage Staff Bar</div>
        <Nav.Link as={Link} to="all" className="text-white">All Tables</Nav.Link>
        <Nav.Link as={Link} to="active" className="text-white">Active Tables</Nav.Link>
        <Nav.Link as={Link} to="checkout" className="text-white">
          Checkout Requests{" "}
          <Badge bg="warning" text="dark">
            {checkoutTables.length > 0 ? <b>{checkoutTables.length}</b> : "0"}
          </Badge>
        </Nav.Link>
      </Nav>
    </div>
  );
}

export default SideBar;
