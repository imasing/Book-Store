import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Container, Row, Col } from "react-bootstrap";

export default function SalesStatistics() {
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [statistics, setStatistics] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:9999/orders").then((res) => setOrders(res.data));
    axios.get("http://localhost:9999/menu").then((res) => setMenu(res.data));
  }, []);

  useEffect(() => {
    const paidOrders = orders.filter((o) => o.status == "checked");

    const productSales = {};

    paidOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!productSales[item.menuId]) {
          productSales[item.menuId] = {
            quantity: 0,
          };
        }
        productSales[item.menuId].quantity += item.quantity;
      });
    });

    // Tạo mảng thống kê với thông tin từ menu
    const stats = Object.entries(productSales).map(([menuId, data]) => {
      const product = menu.find((m) => m.id == parseInt(menuId));
      return {
        id: menuId,
        name: product?.name || "Unknown",
        price: product?.price || 0,
        quantity: data.quantity,
        total: data.quantity * (product?.price || 0),
      };
    });

    setStatistics(stats);
  }, [orders, menu]);

  const totalRevenue = statistics.reduce((sum, item) => sum + item.total, 0);

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <h4 className="mb-3">Sales Statistics</h4>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Menu ID</th>
                <th>Product Name</th>
                <th>Unit Price</th>
                <th>Quantity Sold</th>
                <th>Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {statistics.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>${item.price}</td>
                  <td>{item.quantity}</td>
                  <td>${item.total}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={4} className="text-end fw-bold">
                  Total Revenue:
                </td>
                <td className="fw-bold">${totalRevenue}</td>
              </tr>
            </tbody>
          </Table>
        </Col>
      </Row>
    </Container>
  );
}
