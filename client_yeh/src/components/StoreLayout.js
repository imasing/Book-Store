import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header/Header';

export default function StoreLayout() {
  return (
    <>
      <Header />
      <main><Outlet /></main>
      <footer className="store-footer">
        <span>Mộc Bản</span>
        <span>Sách hay, dành cho những khoảng lặng.</span>
      </footer>
    </>
  );
}