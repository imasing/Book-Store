import { Routes, Route, Navigate } from "react-router-dom";
import StoreLayout from "./components/StoreLayout";
import BookDetail from "./Customer/BookDetail";
import CartPage from "./Customer/CartPage";
import OrderHistory from "./Customer/OrderHistory";
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
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<OrderHistory />} />
      </Route>
      <Route path="/admin" element={<AdminDashboard />}>
        <Route index element={<Navigate to="books" replace />} />
        <Route path="books" element={<BookManager />} />
        <Route path="categories" element={<CategoryManager />} />
        <Route path="orders" element={<BookOrderManager />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
