/*!
 * Folio Admin — hành vi giao diện (vanilla JS, không gọi API).
 * Mọi thao tác lưu/xóa/chuyển trạng thái chỉ hiện thông báo; khi nối server
 * thay các chỗ đánh dấu "API:" bằng lời gọi tương ứng trong APIContract.md.
 */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- năm ở footer ---------- */
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---------- toast ---------- */
  const toast = $('[data-toast]');
  const live = $('[data-live]');
  let toastTimer;
  function notify(title, kicker = 'Đã lưu') {
    if (live) live.textContent = `${kicker}: ${title}`;
    if (!toast) return;
    $('[data-toast-kicker]', toast).textContent = kicker;
    $('[data-toast-title]', toast).textContent = title;
    toast.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-shown'), 2600);
  }

  /* ---------- lọc bảng phía client ----------
     <form data-table-filter="#table-id">
       input[data-filter-text]        so với tr[data-search]
       select[data-filter-key="xyz"]  so với tr[data-xyz]  (camelCase -> data-kebab-case)
  */
  $$('[data-table-filter]').forEach(form => {
    const table = $(form.dataset.tableFilter);
    if (!table) return;
    const rows = $$('tr[data-row]', table);
    const empty = $('[data-empty]', table);
    const count = $('[data-result-count]', table.closest('.panel'));
    const noun = count ? count.textContent.replace(/^.*\d+\s*\/\s*\d+\s*/, '') : '';
    const text = $('[data-filter-text]', form);
    const selects = $$('[data-filter-key]', form);

    // Điền sẵn từ query string (?q=, ?category=, ?fulfillmentStatus= ...)
    const params = new URLSearchParams(location.search);
    if (text && params.get('q')) text.value = params.get('q');
    selects.forEach(s => { const v = params.get(s.dataset.filterKey); if (v) s.value = v; });

    function apply() {
      const q = (text ? text.value : '').trim().toLowerCase();
      let shown = 0;
      rows.forEach(tr => {
        const okText = !q || (tr.dataset.search || '').includes(q);
        const okSel = selects.every(s => !s.value || tr.dataset[s.dataset.filterKey] === s.value);
        tr.hidden = !(okText && okSel);
        if (!tr.hidden) shown++;
      });
      if (empty) empty.hidden = shown > 0;
      if (count) count.textContent = `Hiển thị ${shown} / ${rows.length} ${noun}`;
    }
    form.addEventListener('input', apply);
    form.addEventListener('submit', e => { e.preventDefault(); apply(); });
    apply();
  });

  /* ---------- ô tìm trên topbar: chuyển giá trị sang ô lọc trên cùng trang ---------- */
  const topSearch = $('.admin-topbar .nav-search');
  if (topSearch) {
    const target = new URL(topSearch.action, location.href).pathname.split('/').pop();
    const here = location.pathname.split('/').pop() || 'index.html';
    const local = $('[data-filter-text]');
    if (target === here && local) {
      topSearch.addEventListener('submit', e => {
        e.preventDefault();
        local.value = $('input', topSearch).value;
        local.dispatchEvent(new Event('input', { bubbles: true }));
        local.focus();
      });
    }
  }

  /* ---------- helpers cho form trong modal ---------- */
  function fillForm(form, data) {
    form.reset();
    $$('.form-error', form).forEach(el => { el.textContent = ''; });
    Object.entries(data || {}).forEach(([k, v]) => {
      const field = form.elements[k];
      if (!field) return;
      if (field.type === 'checkbox') field.checked = !!v; else field.value = v ?? '';
    });
  }
  function showErrors(form, errors) {
    $$('[data-error-for]', form).forEach(el => { el.textContent = errors[el.dataset.errorFor] || ''; });
    const first = Object.keys(errors)[0];
    if (first && form.elements[first]) form.elements[first].focus();
    return Object.keys(errors).length === 0;
  }
  const rowData = (btn, key) => {
    const tr = btn.closest('tr');
    try { return JSON.parse(tr.dataset[key]); } catch { return null; }
  };

  /* ---------- Sách (AB2 / AB3) ---------- */
  const bookModal = $('#book-modal');
  if (bookModal) {
    const form = $('[data-book-form]', bookModal);
    const title = $('[data-modal-title]', bookModal);
    bookModal.addEventListener('show.bs.modal', e => {
      const btn = e.relatedTarget;
      const data = btn && btn.hasAttribute('data-book-edit') ? rowData(btn, 'book') : null;
      title.textContent = data ? 'Sửa sách' : 'Thêm sách';
      fillForm(form, data || { isPublished: false });
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const f = form.elements;
      const errors = {};
      if (!f.title.value.trim()) errors.title = 'Nhập tên sách.';
      if (!f.author.value.trim()) errors.author = 'Nhập tác giả.';
      if (!f.categoryId.value) errors.categoryId = 'Chọn thể loại.';
      const price = Number(f.price.value);
      if (!Number.isInteger(price) || price <= 0) errors.price = 'Giá phải là số nguyên lớn hơn 0.';
      const isbn = f.isbn.value.replace(/-/g, '').trim();
      if (isbn && !/^(\d{9}[\dX]|\d{13})$/.test(isbn)) errors.isbn = 'ISBN gồm 10 hoặc 13 ký tự số.';
      if (!showErrors(form, errors)) return;
      // API: f.id.value ? PATCH /api/admin/books/:id : POST /api/admin/books
      bootstrap.Modal.getInstance(bookModal).hide();
      notify(f.title.value.trim(), f.id.value ? 'Đã cập nhật sách' : 'Đã thêm sách');
    });
  }
  $$('[data-toggle-publish]').forEach(sw => sw.addEventListener('change', () => {
    const tr = sw.closest('tr');
    const data = rowData(sw, 'book');
    tr.dataset.status = sw.checked ? 'published' : 'draft';
    // API: PATCH /api/admin/books/:id { ...book, isPublished }
    notify(data ? data.title : '', sw.checked ? 'Đã mở bán' : 'Đã chuyển về bản nháp');
  }));

  /* ---------- Thể loại (AC2 / AC3) ---------- */
  const slugify = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const catModal = $('#cat-modal');
  if (catModal) {
    const form = $('[data-cat-form]', catModal);
    const title = $('[data-modal-title]', catModal);
    const preview = $('[data-slug-preview]', catModal);
    const updateSlug = () => { preview.textContent = slugify(form.elements.name.value) || '—'; };
    form.elements.name.addEventListener('input', updateSlug);
    catModal.addEventListener('show.bs.modal', e => {
      const btn = e.relatedTarget;
      const data = btn && btn.hasAttribute('data-cat-edit') ? rowData(btn, 'category') : null;
      title.textContent = data ? 'Sửa thể loại' : 'Thêm thể loại';
      fillForm(form, data || { isActive: true });
      updateSlug();
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = form.elements.name.value.trim();
      const errors = {};
      if (!name) errors.name = 'Nhập tên thể loại.';
      else if (name.length > 80) errors.name = 'Tối đa 80 ký tự.';
      if (!showErrors(form, errors)) return;
      // API: id ? PATCH /api/admin/categories/:id : POST /api/admin/categories
      bootstrap.Modal.getInstance(catModal).hide();
      notify(name, form.elements.id.value ? 'Đã cập nhật thể loại' : 'Đã thêm thể loại');
    });
  }
  $$('[data-toggle-active]').forEach(sw => sw.addEventListener('change', () => {
    const tr = sw.closest('tr');
    const data = rowData(sw, 'category');
    tr.dataset.status = sw.checked ? 'active' : 'hidden';
    // API: PATCH /api/admin/categories/:id { ...category, isActive }
    notify(data ? data.name : '', sw.checked ? 'Đã hiện thể loại' : 'Đã ẩn thể loại');
  }));

  /* ---------- Xác nhận xóa (AB4 / AC4) ---------- */
  const delModal = $('#delete-modal');
  if (delModal) {
    let pending = null;
    delModal.addEventListener('show.bs.modal', e => {
      const btn = e.relatedTarget;
      pending = btn ? btn.closest('tr') : null;
      $('[data-delete-target]', delModal).textContent = btn ? btn.dataset.deleteName : '';
      $('[data-delete-note-target]', delModal).textContent = (btn && btn.dataset.deleteNote) || 'Thao tác này không thể hoàn tác.';
    });
    $('[data-delete-confirm]', delModal).addEventListener('click', () => {
      const name = $('[data-delete-target]', delModal).textContent;
      // API: DELETE /api/admin/books/:id  |  DELETE /api/admin/categories/:id
      if (pending) pending.remove();
      bootstrap.Modal.getInstance(delModal).hide();
      notify(name, 'Đã xóa');
    });
  }

  /* ---------- Đơn hàng (AO2 / AO3) ---------- */
  const orderModal = $('#order-modal');
  if (orderModal) {
    orderModal.addEventListener('show.bs.modal', e => {
      const id = e.relatedTarget && e.relatedTarget.dataset.orderId;
      // API: nội dung modal hiện là mẫu tĩnh; khi nối server render theo đơn `id` (lấy từ AO1).
      if (id) $('[data-order-title]', orderModal).textContent = id;
    });
    $$('[data-status]', orderModal).forEach(btn => {
      if (btn.dataset.status === 'CANCELLED') return; // mở ô nhập lý do
      btn.addEventListener('click', () => {
        // API: PATCH /api/admin/orders/:id/status { status }
        notify(btn.textContent.trim(), 'Đã chuyển trạng thái');
        bootstrap.Modal.getInstance(orderModal).hide();
      });
    });
    const cancelBtn = $('[data-cancel-confirm]', orderModal);
    if (cancelBtn) cancelBtn.addEventListener('click', () => {
      const reason = $('#cancel-text').value.trim();
      if (!reason) { $('#cancel-text').focus(); return; }
      // API: PATCH /api/admin/orders/:id/status { status: 'CANCELLED', reason }
      notify(reason, 'Đã hủy đơn');
      bootstrap.Modal.getInstance(orderModal).hide();
    });
    $$('[data-payment]', orderModal).forEach(btn => btn.addEventListener('click', () => {
      // API: PATCH /api/admin/orders/:id/payment-status { paymentStatus }
      notify(btn.textContent.trim(), 'Đã cập nhật thanh toán');
    }));
  }

  /* ---------- Đăng nhập (A2) ---------- */
  const login = $('[data-login-form]');
  if (login) {
    login.addEventListener('submit', e => {
      e.preventDefault();
      const f = login.elements;
      const errors = {};
      if (!/^\S+@\S+\.\S+$/.test(f.email.value.trim())) errors.email = 'Nhập email hợp lệ.';
      if (!f.password.value) errors.password = 'Nhập mật khẩu.';
      $('[data-login-alert]').classList.remove('is-shown');
      if (!showErrors(login, errors)) return;
      // API: POST /api/auth/login -> nếu user.role !== 'ADMIN' hiện [data-login-alert]
      location.href = login.getAttribute('action');
    });
  }
})();
