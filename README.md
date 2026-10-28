# Book Store

Nền tảng web fullstack cho doanh nghiệp phân phối sách, gồm storefront cho khách hàng và khu vực quản trị cho chủ cửa hàng. MVP hỗ trợ catalog, giỏ hàng, đặt hàng và xử lý đơn; khách hàng cần đăng nhập trước khi đặt hàng. Thanh toán hỗ trợ lựa chọn COD và trả trước, còn provider trả trước sẽ được chọn ở giai đoạn sau.

## Tech stack

- Frontend: ReactJS
- Backend: ExpressJS (Node.js)
- Database: MongoDB
- Deployment: dự kiến triển khai sau khi hoàn thiện hệ thống lõi

## Mục tiêu dự án

- Xây dựng hệ thống quản lý sách và danh mục.
- Hỗ trợ khách hàng khám phá, tìm kiếm và đặt mua sách.
- Hỗ trợ admin/chủ cửa hàng quản lý catalog và xử lý đơn hàng.
- Tạo nền tảng có thể mở rộng thanh toán, tồn kho và giao vận sau này.

MVP chưa quản lý tồn kho tự động. Admin xác nhận khả năng cung ứng thủ công khi xử lý đơn.

## Quy trình phát triển

1. Brainstorm bài toán kinh doanh và xác định các actor, workflow chính.
2. Hoàn thiện [SystemDesign.md](SystemDesign.md) theo từng miền nghiệp vụ.
3. Thiết kế API, model dữ liệu và luồng xác thực.
4. Xây dựng backend và frontend theo từng module.
5. Chuẩn bị môi trường deployment và cấu hình production.

## Actor trong MVP

- Guest: duyệt catalog.
- Customer: đăng ký/đăng nhập, quản lý thông tin giao hàng, đặt và theo dõi đơn hàng.
- Admin/chủ cửa hàng: quản lý sách/danh mục và cập nhật trạng thái đơn hàng.

Chưa tách role nhân viên; đơn vị vận chuyển chưa có tài khoản hoặc tích hợp trực tiếp.

## Cấu trúc dự kiến

```text
.
├── FE/                     # Frontend design and, later, ReactJS source
├── BE/                     # Backend design and, later, ExpressJS source
├── README.md
├── SystemDesign.md
└── ...                     # Domain/API/security/deployment documents
```

Cấu trúc thư mục thực tế có thể thay đổi sau khi xác định quy mô và công cụ phát triển.

## Trạng thái hiện tại

Đây là giai đoạn thiết kế trước khi khởi tạo ứng dụng. Các tài liệu bên dưới là baseline cần được rà soát trước khi triển khai và mở bán thật.

## Tài liệu

- [System Design](SystemDesign.md): phạm vi MVP, kiến trúc và quyết định nghiệp vụ.
- [Frontend Design](FE/FrontendDesign.md): routes, modules, data flow và trạng thái UI.
- [Figma UI/UX handoff](FE/FigmaDesign.md): design system, screens và prototype flows.
- [Backend Design](BE/BackendDesign.md): module boundaries, request pipeline và quy tắc domain.
- [Domain Model](DomainModel.md): MongoDB collections, schema và index.
- [API Contract](APIContract.md): endpoints, payload và error model.
- [Authentication](Authentication.md): session, bảo mật và phân quyền.
- [Order Lifecycle](OrderLifecycle.md): state machine fulfillment/payment.
- [Inventory Design](InventoryDesign.md): phạm vi chưa làm trong MVP và hướng mở rộng.
- [Payment Integration](PaymentIntegration.md): COD/prepaid và ranh giới provider.
- [Deployment & Observability](DeploymentObservability.md): môi trường deploy, logging, metrics và backup.
