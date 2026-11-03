import { useEffect, useState } from "react";
import { Container, Row, Col, Table, Form, Button } from "react-bootstrap";
import axios from "axios";

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [menu, setMenu] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    axios.get("http://localhost:9999/orders").then((res) => setOrders(res.data));
    axios.get("http://localhost:9999/tables").then((res) => setTables(res.data));
    axios.get("http://localhost:9999/menu").then((res) => setMenu(res.data));
  }, []);

  const getTableName = (tableId) =>
    tables.find((t) => Number(t.id) === Number(tableId))?.name || "Unknown";

  const getMenuName = (menuId) =>
    menu.find((m) => Number(m.id) === Number(menuId))?.name || "Unknown";

  return (
    <>
      <Container>
        <h3 className="my-3">Order Manager</h3>
        <Row>
          <Col xs={6}>
            <Form className="mb-3">
              <Form.Group>
                <Form.Control
                  type="text"
                  placeholder="Search by table name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Form.Group>
            </Form>

            <Table bordered hover striped>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Table</th>
                  <th>Status</th>
                  <th>Order Time</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {orders
                  .filter((o) =>
                    getTableName(o.tableId)
                      .toLowerCase()
                      .includes(search.toLowerCase())
                  )
                  .map((o) => (
                    <tr
                      key={o.id}
                      style={{
                        backgroundColor:
                          selectedOrder?.id === o.id ? "#f0f8ff" : "transparent",
                        fontWeight:
                          selectedOrder?.id === o.id ? "bold" : "normal",
                        cursor: "pointer"
                      }}
                    >
                      <td>{o.id}</td>
                      <td>{getTableName(o.tableId)}</td>
                      <td>
                        {o.status === "ordered" ? (
                          <span className="badge bg-warning">Ordered</span>
                        ) : (
                          <span className="badge bg-success">Checked</span>
                        )}
                        </td>
                      <td>{new Date(o.orderTime).toLocaleString()}</td>
                      <td>
                        <Button
                          className="btn btn-secondary"
                          onClick={() => setSelectedOrder(o)}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          </Col>

          <Col xs={6}>
            <h6>Order Details</h6>
            {selectedOrder ? (
              <Table bordered hover>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Remaining (min)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{getMenuName(item.menuId)}</td>
                      <td>{item.quantity}</td>
                      <td>{item.status}</td>
                      <td>{item.remainingMinutes}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <p>Please select an order to see details.</p>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
}
