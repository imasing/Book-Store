import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { ArrowLeft } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { createOrder } from '../services/api/orderApi';
import { ADDRESS_LABELS, emptyAddress, validateAddress } from '../services/api/userApi';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '../constants/order';
import { formatCurrency } from '../utils/format';

const ADDRESS_FIELD_ORDER = ['recipientName', 'phone', 'street', 'ward', 'district', 'city'];

export default function CheckoutPage() {
  const { user, refreshUser } = useAuth();
  const { cart, loading: cartLoading, refresh: refreshCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const placedRef = useRef(false);
  // Một key cho mỗi lần vào trang checkout: gửi lại (mạng chập chờn, bấm 2 lần) không tạo trùng đơn.
  const idempotencyKeyRef = useRef(
    window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  const [address, setAddress] = useState(() => ({
    ...emptyAddress(),
    recipientName: user?.fullName || '',
    phone: user?.phone || '',
    ...(user?.defaultShippingAddress || {}),
  }));
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.COD);
  const [note, setNote] = useState('');
  const [saveAsDefault, setSaveAsDefault] = useState(!user?.defaultShippingAddress);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [cartReady, setCartReady] = useState(false);

  // Luôn lấy giỏ mới nhất từ server khi vào checkout.
  useEffect(() => {
    let cancelled = false;
    refreshCart().finally(() => { if (!cancelled) setCartReady(true); });
    return () => { cancelled = true; };
  }, [refreshCart]);

  if (!cartReady) {
    return <Container className="store-page py-5"><Spinner animation="border" size="sm" /> Đang tải giỏ hàng...</Container>;
  }
  if (cart.items.length === 0 && !placedRef.current) {
    return <Navigate to="/cart" replace />;
  }

  const updateField = (field, value) => {
    setAddress(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (submitting) return; // chống double-submit
    const validation = validateAddress(address);
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const order = await createOrder(
        { shippingAddress: address, paymentMethod, note, saveAsDefaultAddress: saveAsDefault },
        { idempotencyKey: idempotencyKeyRef.current },
      );
      placedRef.current = true;
      await Promise.all([refreshCart(), saveAsDefault ? refreshUser() : null]);
      showToast(`Đặt hàng thành công! Mã đơn ${order.id}.`);
      navigate('/orders', { replace: true, state: { placedOrderId: order.id } });
    } catch (error) {
      if (error.details && error.code === 'VALIDATION_ERROR') setErrors(error.details);
      setSubmitError(error.message);
      if (error.code === 'BOOK_UNAVAILABLE' || error.code === 'CART_EMPTY') refreshCart();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="store-page py-4 py-lg-5">
      <Link to="/cart" className="back-link"><ArrowLeft size={16} /> Quay lại giỏ hàng</Link>
      <p className="eyebrow mt-3">XÁC NHẬN ĐƠN HÀNG</p>
      <h1 className="page-title">Giao sách tới đâu?</h1>
      <Form noValidate onSubmit={handleSubmit}>
        <Row className="gx-lg-5 gy-4 mt-1">
          <Col lg={8}>
            <section className="checkout-section">
              <h2>Địa chỉ giao hàng</h2>
              <div className="admin-form-grid">
                {ADDRESS_FIELD_ORDER.map(field => (
                  <Form.Group key={field} className={field === 'street' ? 'wide-field' : undefined}>
                    <Form.Label htmlFor={`address-${field}`}>{ADDRESS_LABELS[field]}</Form.Label>
                    <Form.Control
                      id={`address-${field}`}
                      value={address[field]}
                      isInvalid={Boolean(errors[field])}
                      onChange={event => updateField(field, event.target.value)}
                      inputMode={field === 'phone' ? 'tel' : undefined}
                    />
                    <Form.Control.Feedback type="invalid">{errors[field]}</Form.Control.Feedback>
                  </Form.Group>
                ))}
              </div>
              <Form.Check
                className="mt-3"
                id="save-default-address"
                type="checkbox"
                label="Lưu làm địa chỉ mặc định cho lần sau"
                checked={saveAsDefault}
                onChange={event => setSaveAsDefault(event.target.checked)}
              />
            </section>

            <section className="checkout-section">
              <h2>Phương thức thanh toán</h2>
              {Object.values(PAYMENT_METHODS).map(method => (
                <Form.Check
                  key={method}
                  id={`payment-${method}`}
                  type="radio"
                  name="paymentMethod"
                  className="payment-option"
                  label={PAYMENT_METHOD_LABELS[method]}
                  checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method)}
                />
              ))}
              {paymentMethod === PAYMENT_METHODS.PREPAID && (
                <Alert variant="info" className="small mt-3 mb-0">
                  Cổng thanh toán trực tuyến đang được tích hợp. Cửa hàng sẽ liên hệ để hướng dẫn chuyển khoản và xác nhận thanh toán.
                </Alert>
              )}
            </section>

            <section className="checkout-section">
              <h2>Ghi chú</h2>
              <Form.Control
                as="textarea"
                rows={3}
                maxLength={500}
                placeholder="Ví dụ: giao giờ hành chính"
                value={note}
                onChange={event => setNote(event.target.value)}
              />
            </section>
          </Col>

          <Col lg={4}>
            <aside className="summary-panel">
              <h2>Tóm tắt đơn hàng</h2>
              <div className="checkout-items">
                {cart.items.map(item => (
                  <div key={item.bookId}>
                    <span>{item.book?.title} <small>x {item.quantity}</small></span>
                    <strong>{formatCurrency(item.lineTotal)}</strong>
                  </div>
                ))}
              </div>
              <div className="summary-line"><span>Tạm tính</span><strong>{formatCurrency(cart.subtotal)}</strong></div>
              <div className="summary-line"><span>Phí vận chuyển</span><span>Miễn phí (tạm tính)</span></div>
              <div className="summary-total"><span>Tổng cộng</span><strong>{formatCurrency(cart.subtotal)}</strong></div>
              {submitError && <Alert variant="danger" className="small mt-3 mb-0">{submitError}</Alert>}
              <Button
                type="submit"
                variant="success"
                className="w-100 summary-checkout"
                disabled={submitting || cartLoading || cart.hasUnavailableItems}
              >
                {submitting ? <><Spinner animation="border" size="sm" /> Đang đặt hàng...</> : 'Đặt hàng'}
              </Button>
              <p className="summary-note">Tổng tiền cuối cùng do hệ thống tính theo giá hiện tại khi đặt đơn. Đơn được tiếp nhận chưa đồng nghĩa cửa hàng đã xác nhận còn hàng.</p>
            </aside>
          </Col>
        </Row>
      </Form>
    </Container>
  );
}
