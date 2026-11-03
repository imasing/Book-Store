import React from 'react';
import { CATEGORIES } from '../../data/bookstoreData';

function SideBar() {
  return (
    <aside className="catalog-sidebar">
      <p className="eyebrow mb-3">Danh mục</p>
      <div className="category-list">
        {CATEGORIES.map(category => (
          <div className="category-row" key={category.id}>
            <span>{category.name}</span>
            <span className="category-count">{category.bookCount}</span>
          </div>
        ))}
      </div>
      <div className="sidebar-note">
        <span className="note-dot" />
        <span>Sách chọn lọc, đọc lâu bền.</span>
      </div>
    </aside>
  );
}

export default SideBar;
