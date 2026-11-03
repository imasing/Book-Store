import { Routes, Route, Navigate } from "react-router-dom";
import StoreLayout from "./components/StoreLayout";
import RequireAuth from "./components/RequireAuth";
import BookDetail from "./Customer/BookDetail";
import CartPage from "./Customer/CartPage";
import CheckoutPage from "./Customer/CheckoutPage";
import OrderHistory from "./Customer/OrderHistory";
import AuthPage from "./Customer/AuthPage";
import AdminDashboard from "./Admin/AdminLayout";
import BookManager from "./Admin/BookManager";
import CategoryManager from "./Admin/CategoryManager";
import BookOrderManager from "./Admin/BookOrderManager";
import Home from "./Customer/Home";

export default function App() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/books/:bookId" element={<BookDetail />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route element={<RequireAuth role="CUSTOMER" />}>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrderHistory />} />
        </Route>
      </Route>
      <Route path="/admin" element={<RequireAuth role="ADMIN"><AdminDashboard /></RequireAuth>}>
        <Route index element={<Navigate to="books" replace />} />
        <Route path="books" element={<BookManager />} />
        <Route path="categories" element={<CategoryManager />} />
        <Route path="orders" element={<BookOrderManager />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
