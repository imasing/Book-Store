export const CATEGORIES = [
  { id: 'cat-van-hoc', name: 'Văn học Việt Nam', bookCount: 2 },
  { id: 'cat-ky-nang', name: 'Kỹ năng sống', bookCount: 1 },
  { id: 'cat-thieu-nhi', name: 'Thiếu nhi', bookCount: 0 },
];

export const BOOKS = [
  {
    id: 'book-phia-sau-mua-gio',
    title: 'Phía Sau Mùa Gió',
    author: 'Lê Minh An',
    publisher: 'Mộc Bản',
    isbn: '9786043912345',
    description: 'Một cuốn tiểu thuyết về ký ức, gia đình và những hành trình trở về.',
    categoryId: 'cat-van-hoc',
    categoryName: 'Văn học Việt Nam',
    price: 156000,
    coverColor: '#bd684d',
    isPublished: true,
  },
  {
    id: 'book-nhung-ngay-xanh',
    title: 'Những Ngày Xanh',
    author: 'Thảo Nguyên',
    publisher: 'Mộc Bản',
    isbn: '9786043912346',
    description: 'Câu chuyện dịu dàng về tuổi trẻ, thiên nhiên và hành trình tìm lại chính mình.',
    categoryId: 'cat-van-hoc',
    categoryName: 'Văn học Việt Nam',
    price: 128000,
    coverColor: '#4c7865',
    isPublished: true,
  },
  {
    id: 'book-thoi-quen-nho',
    title: 'Bắt Đầu Từ Những Thói Quen Nhỏ',
    author: 'Nguyễn An Bình',
    publisher: 'Mộc Bản',
    isbn: '9786043912347',
    description: 'Gợi ý thực tế để xây dựng những thay đổi tích cực từ các việc nhỏ mỗi ngày.',
    categoryId: 'cat-ky-nang',
    categoryName: 'Kỹ năng sống',
    price: 142000,
    coverColor: '#54728a',
    isPublished: true,
  },
];

export const CART_ITEMS = [
  { bookId: 'book-phia-sau-mua-gio', quantity: 1 },
  { bookId: 'book-nhung-ngay-xanh', quantity: 1 },
];

export const CUSTOMER_ORDERS = [
  {
    id: 'order-2026-0018',
    createdAt: '2026-11-02T10:15:00.000Z',
    paymentMethod: 'COD',
    fulfillmentStatus: 'IN_TRANSIT',
    total: 284000,
    items: [
      { bookId: 'book-phia-sau-mua-gio', quantity: 1 },
      { bookId: 'book-nhung-ngay-xanh', quantity: 1 },
    ],
  },
  {
    id: 'order-2026-0012',
    createdAt: '2026-10-25T09:30:00.000Z',
    paymentMethod: 'PREPAID',
    fulfillmentStatus: 'DELIVERED',
    total: 142000,
    items: [{ bookId: 'book-thoi-quen-nho', quantity: 1 }],
  },
];