import React from 'react';
import { Badge, Table } from 'react-bootstrap';

const orders = [
  { id: 'order-2026-0018', customer: 'Nguyễn Minh Anh', date: '02/11/2026', count: 2, total: 284000, status: 'IN_TRANSIT' },
  { id: 'order-2026-0017', customer: 'Trần Hoàng Nam', date: '01/11/2026', count: 1, total: 142000, status: 'RECEIVED' },
  { id: 'order-2026-0012', customer: 'Nguyễn Minh Anh', date: '25/10/2026', count: 1, total: 142000, status: 'DELIVERED' },
];

const statusLabels = { RECEIVED: 'Mới nhận', CONFIRMED: 'Đã xác nhận', IN_TRANSIT: 'Đang giao', DELIVERED: 'Đã giao' };

export default function BookOrderManager() {
  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div><p className="eyebrow">VẬN HÀNH CỬA HÀNG</p><h1>Đơn hàng</h1></div>
        <span className="admin-count">03 đơn gần đây</span>
      </div>
      <div className="admin-toolbar order-toolbar">
        <input className="form-control" placeholder="Tìm mã đơn hoặc khách hàng" />
        <select className="form-select" aria-label="Lọc trạng thái" defaultValue="all"><option value="all">Tất cả trạng thái</option><option>Mới nhận</option><option>Đang giao</option><option>Đã giao</option></select>
        <select className="form-select" aria-label="Lọc thanh toán" defaultValue="all"><option value="all">Tất cả thanh toán</option><option>COD</option><option>Trả trước</option></select>
      </div>
      <div className="admin-table-wrap">
        <Table responsive hover className="admin-table align-middle">
          <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Ngày đặt</th><th>Số sách</th><th>Tổng tiền</th><th>Trạng thái</th><th>Cập nhật</th></tr></thead>
          <tbody>{orders.map(order => (
            <tr key={order.id}>
              <td><strong>{order.id}</strong></td><td>{order.customer}</td><td>{order.date}</td><td>{order.count}</td>
              <td>{order.total.toLocaleString('vi-VN')}₫</td>
              <td><Badge bg={order.status === 'DELIVERED' ? 'success' : 'warning'} text={order.status === 'DELIVERED' ? undefined : 'dark'}>{statusLabels[order.status]}</Badge></td>
              <td><select className="form-select" aria-label={`Trạng thái ${order.id}`} defaultValue={order.status}><option value="RECEIVED">Mới nhận</option><option value="CONFIRMED">Đã xác nhận</option><option value="IN_TRANSIT">Đang giao</option><option value="DELIVERED">Đã giao</option></select></td>
            </tr>
          ))}</tbody>
        </Table>
      </div>
    </section>
  );
}