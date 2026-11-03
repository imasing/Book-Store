Folio — Free Bootstrap 5 Bookstore Website Template by uiCookies
https://uicookies.com/

Folio is a free website template for independent bookshops, built on Bootstrap 5
with vanilla JavaScript. It ships three pages for the fictional Folio & Fern
Booksellers: a home page with a staff pick and book club hero, a scrolling
new-releases shelf, genre tiles, handwritten-style staff-pick notes, author events
with seat reservations, the book club, a newsletter sign-up and opening hours; a
shop with filters, sort, search and a basket drawer; and a book detail page. Every
book cover is designed in HTML and CSS and generated from the catalogue in
js/main.js, so there are no cover images to license or replace.
Free for personal and commercial use. Attribution is optional but always welcome — https://uicookies.com/license/

WHAT'S INSIDE
  index.html            Home page: hero, services, new releases shelf, genres,
                        staff picks, events, book club, newsletter, visit + map
  shop.html             Catalogue of 30 books: genre, format, price and stock
                        filters, staff-pick toggle, sort, search, result count
  book.html             Book detail: formats and prices, quantity, add to basket,
                        synopsis, details table, reviews, "you might also like"
                        (open book.html?id=<book-id> for any title)
  css/vendor/           Bootstrap 5.3.8 (minified, self-hosted)
  css/style.css         Design layer: palette and type as custom properties,
                        components and the generated book cover layouts
  js/vendor/            Bootstrap 5.3.8 bundle (includes Popper)
  js/main.js            Catalogue data and all behaviour, vanilla JavaScript
  img/                  Demo photos (public domain)
  CREDITS.txt           Where each demo photo comes from

NOTES
  - Built on Bootstrap 5.3.8. No jQuery and no other JavaScript libraries.
  - The catalogue is the BOOKS array at the top of js/main.js. Each cover is drawn
    from the book's `cover` settings (layout, colours and title type); the list of
    layouts is in the comment above the data. Adding a book needs no image file.
  - The basket drawer saves to the visitor's browser (localStorage) and stays in
    sync across open tabs. Checkout is not connected: point the Checkout button
    at your shop platform or payment provider to take orders.
  - The newsletter and seat-reservation forms validate in the browser and then
    show a success message. Connect them to a form service or your own backend
    to make them live.
  - Colours and fonts are CSS custom properties in :root at the top of
    css/style.css. Fonts are Playfair Display and Instrument Sans from Google Fonts.
  - All content is visible without JavaScript; scroll animations respect the
    prefers-reduced-motion setting.
  - Replace the photos in img/ with your own before launch.
