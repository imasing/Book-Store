# Book Store

Nền tảng web fullstack để quản lý mua bán sách, tập trung vào quy trình vận hành bán sách và đặt hàng trên nền tảng web. Phạm vi ban đầu chưa tích hợp hệ thống thanh toán bên ngoài; các thành phần thanh toán sẽ được bổ sung trong giai đoạn brainstorm và thiết kế tiếp theo.

## Tech stack

- Frontend: ReactJS
- Backend: ExpressJS (Node.js)
- Database: MongoDB
- Deployment: dự kiến triển khai sau khi hoàn thiện hệ thống lõi

## Mục tiêu dự án

- Xây dựng hệ thống quản lý sách, danh mục và thông tin tồn kho.
- Hỗ trợ khách hàng khám phá, tìm kiếm và đặt mua sách.
- Hỗ trợ quản trị viên quản lý sản phẩm, đơn hàng và hoạt động kinh doanh.
- Tạo kiến trúc đủ rõ ràng để mở rộng chức năng thanh toán, giao vận và các hệ thống ngoài sau này.

## Quy trình phát triển

1. Brainstorm bài toán kinh doanh và xác định các actor, workflow chính.
2. Hoàn thiện [SystemDesign.md](SystemDesign.md) theo từng miền nghiệp vụ.
3. Thiết kế API, model dữ liệu và luồng xác thực.
4. Xây dựng backend và frontend theo từng module.
5. Chuẩn bị môi trường deployment và cấu hình production.

## Actor dự kiến

Các actor cụ thể cần được xác nhận thêm trong giai đoạn brainstorm, nhưng có thể bắt đầu với:

- Khách hàng: xem và mua sách, quản lý tài khoản và đơn hàng của mình.
- Quản trị viên: quản lý danh mục sách, tồn kho, đơn hàng và dữ liệu vận hành.
- Nhân viên vận hành: xử lý đơn hàng và cập nhật trạng thái giao hàng khi nghiệp vụ được xác định.

Thanh toán bên ngoài, cổng thanh toán và các bên liên quan không thuộc phạm vi thiết kế chi tiết ở phiên bản hiện tại.

## Cấu trúc dự kiến

```text
.
├── client/                 # ReactJS application
├── server/                 # ExpressJS API
├── README.md
└── SystemDesign.md
```

Cấu trúc thư mục thực tế có thể thay đổi sau khi xác định quy mô và công cụ phát triển.

## Trạng thái hiện tại

Đây là giai đoạn định hình phạm vi dự án. Các quyết định về domain model, vai trò, API, quy trình đơn hàng và thanh toán sẽ được bổ sung vào tài liệu thiết kế hệ thống trước khi triển khai.

## Tài liệu thiết kế

Xem [SystemDesign.md](SystemDesign.md) để tham khảo khung kiến trúc tạm thời và các điểm cần brainstorm tiếp.
