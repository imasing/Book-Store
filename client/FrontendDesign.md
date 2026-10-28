# Frontend Design

Thiết kế frontend ReactJS cho hai trải nghiệm trong cùng sản phẩm: storefront cho customer và khu vực quản trị cho admin. Công nghệ cụ thể ngoài ReactJS (router, state/query library, component system, build tool) chưa được chọn.

Đặc tả màn hình, design system và prototype flow nằm trong [FigmaDesign.md](FigmaDesign.md).

## Route map

| Route | Access | Mục đích |
|---|---|---|
| `/` | Public | Catalog storefront |
| `/books/:bookId` | Public | Chi tiết sách |
| `/login` | Public | Đăng nhập |
| `/register` | Public | Đăng ký customer |
| `/cart` | Customer | Giỏ hàng |
| `/checkout` | Customer | Địa chỉ và phương thức thanh toán |
| `/account` | Customer | Thông tin liên hệ/địa chỉ mặc định |
| `/orders` | Customer | Lịch sử đơn |
| `/orders/:orderId` | Owner | Chi tiết và timeline đơn |
| `/admin/books` | Admin | Quản lý catalog |
| `/admin/categories` | Admin | Quản lý danh mục |
| `/admin/orders` | Admin | Danh sách/xử lý đơn |
| `/admin/orders/:orderId` | Admin | Chi tiết và cập nhật trạng thái |

Guest có thể duyệt catalog nhưng phải đăng nhập trước checkout. Khi redirect sang login, giữ return path an toàn để quay lại checkout sau login.

## Feature boundaries

- `catalog`: danh sách, chi tiết, lọc trên tập dữ liệu đã tải.
- `auth`: form, session bootstrap, sign-in/sign-out.
- `cart`: cart server-side, quantity, subtotal hiển thị.
- `checkout`: địa chỉ snapshot, COD/PREPAID selection, review order.
- `orders`: lịch sử customer, timeline fulfillment và payment riêng.
- `admin-catalog`: create/edit/publish sách và danh mục.
- `admin-orders`: queue, chi tiết và thao tác chuyển trạng thái được phép.

Mỗi feature sở hữu UI và API calls của miền đó; tránh component gọi endpoint tùy ý ở nhiều nơi.

## Data flow

- Server là nguồn sự thật cho user, cart, book price, order và statuses.
- Sau khi app khởi động, gọi `/auth/me` để xác định session; trạng thái loading không được nhầm thành guest.
- Dùng API client tập trung để thêm credentials, parse error envelope và xử lý 401.
- Sau mutation cart/order/admin, cập nhật hoặc refetch dữ liệu liên quan để tránh UI hiển thị stale price/status.
- Không lưu password, session ID hoặc order totals như dữ liệu authoritative trong browser storage.

## Search/filter MVP

Catalog nhỏ: tải trang sách phù hợp, giữ query/filter trong UI, dùng `onChange` để filter title/author/publisher/category không phân biệt hoa thường. Có thể debounce nhẹ nếu đo thấy cần; tránh gửi request cho mỗi ký tự khi filtering tại client.

API có phân trang để tránh response không giới hạn. Vì thế client-side filtering chỉ bao quát sách đã tải; khi catalog lớn lên, chuyển query/filter sang API và giữ URL query params để deep-link được.

## State và UI requirements

Mọi data view cần state riêng cho loading, empty, error, success; mutation cần pending/disabled và thông báo kết quả. Checkout phải hiển thị giá lấy từ server và cho customer xác nhận lại khi giá đổi; không giả định cart price đã khóa.

Admin action cập nhật order status cần confirmation phù hợp, trạng thái đích hợp lệ và hiển thị lỗi `409` nếu dữ liệu đã đổi. Không render chức năng admin cho customer nhưng vẫn phải dựa vào backend authorization.

## Accessibility và responsive

- Form có label, lỗi gắn với field, keyboard navigation và focus state.
- Button dùng semantic button; link dùng anchor/router link.
- Status không chỉ phân biệt bằng màu; có text label.
- Tables admin chuyển sang layout phù hợp màn hình nhỏ hoặc có horizontal overflow được kiểm soát.
- Ảnh bìa có alt text; ảnh lỗi có fallback.

## Chưa chốt

Router, thư viện gọi API/cache, form validation, UI component system, upload ảnh, SEO/SSR và chiến lược pagination cần quyết định khi khởi tạo app và theo giới hạn catalog thực tế.
