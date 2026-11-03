import React from 'react';

function SideBar({ categories = [], totalCount = 0, selectedId = 'all', onSelect = () => {} }) {
  const rows = [{ id: 'all', name: 'Tất cả sách', bookCount: totalCount }, ...categories];

  return (
    <aside className="catalog-sidebar">
      <p className="eyebrow mb-3">Danh mục</p>
      <div className="category-list">
        {rows.map(category => (
          <button
            type="button"
            className={`category-row${selectedId === category.id ? ' active' : ''}`}
            key={category.id}
            onClick={() => onSelect(category.id)}
            aria-pressed={selectedId === category.id}
          >
            <span>{category.name}</span>
            <span className="category-count">{category.bookCount}</span>
          </button>
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
