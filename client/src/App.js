import { Routes, Route, Navigate } from "react-router-dom";
import StoreLayout from "./components/StoreLayout";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import BookDetail from "./pages/BookDetail";

// Routing theo template Folio (src/README.txt):
//   index.html            -> /                  Home: hero, new releases, genres, staff picks,
//                                               events, book club, newsletter, visit (dùng #anchor)
//   shop.html             -> /shop              Catalogue + filter/sort/search
//                                               (query: ?genre=&picks=1&stock=1&sort=newest&q=)
//   book.html?id=<id>     -> /books/:bookId     Book detail
// Basket drawer không phải page -> nằm trong StoreLayout.
export default function App() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="books/:bookId" element={<BookDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
