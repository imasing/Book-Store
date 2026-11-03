import { useEffect } from "react";
import { preconnect } from "react-dom";
import { Link } from "react-router-dom";
// Bootstrap JS (kèm Popper) — thay cho <script src="js/vendor/bootstrap.bundle.min.js">.
// Cần để các nút data-bs-toggle="collapse" / "offcanvas" hoạt động.
import bootstrap from "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./css/style.css";
document.documentElement.classList.add("js");

const FAVICON =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 44'%3E%3Crect width='44' height='44' rx='12' fill='%237b1e2c'/%3E%3Cpath d='M8 26.5c4.6-2 9.3-1.8 14 .8 4.7-2.6 9.4-2.8 14-.8v7c-4.6-2-9.3-1.8-14 .8-4.7-2.6-9.4-2.8-14-.8Z M22 26.6c-.2-6.2 1-11.6 4-16.4' fill='none' stroke='%23f5eee1' stroke-width='2'/%3E%3C/svg%3E";

const FONTS_URL =
    "https://fonts.googleapis.com/css2?family=Instrument+Sans:wdth,wght@75..100,400..700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap";

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const Header = () => {
    preconnect("https://fonts.googleapis.com");
    preconnect("https://fonts.gstatic.com", { crossOrigin: "anonymous" });

    /* ---------- main.js: initHeader() ----------
       Thêm .is-scrolled cho [data-header] khi trang cuộn quá 8px,
       và đóng menu mobile (#main-nav) sau khi bấm một a.nav-link. */
    //chuyển js từ main.js sang
    useEffect(() => {
        const header = document.querySelector("[data-header]");
        if (!header) return;

        const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });

        // Đóng menu mobile sau khi bấm link (giống main.js, dùng bootstrap.Collapse)
        const menu = document.getElementById("main-nav");
        const onMenuClick = (e) => {
            if (!e.target.closest("a.nav-link") || !menu.classList.contains("show")) return;
            bootstrap.Collapse.getOrCreateInstance(menu).hide();
        };
        if (menu) menu.addEventListener("click", onMenuClick);

        return () => {
            window.removeEventListener("scroll", onScroll);
            if (menu) menu.removeEventListener("click", onMenuClick);
        };
    }, []);

    /* ---------- main.js: initAnchors() ----------
       Link tới #section trên cùng trang: cuộn mượt (CSS smooth scrolling đang tắt)
       và chuyển focus vào section đó. */
    useEffect(() => {
        const onClick = (e) => {
            const a = e.target.closest('a[href*="#"]');
            if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
            const url = new URL(a.href, window.location.href);
            if (url.pathname !== window.location.pathname || url.hash.length < 2) return;
            const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
            if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
            target.focus({ preventScroll: true });
            try { window.history.pushState(null, "", url.hash); } catch (err) { /* file:// */ }
        };
        document.addEventListener("click", onClick);
        return () => document.removeEventListener("click", onClick);
    }, []);

    return (
        <>
            <meta name="theme-color" content="#f5eee1" />
            <link rel="icon" href={FAVICON} />
            <link rel="stylesheet" href={FONTS_URL} precedence="default" />
            <a className="skip-link" href="#main">Skip to main content</a>

            {/* <!-- ============================ HEADER ============================ --> */}
            <header className="site-header" data-header>
                <nav className="navbar navbar-expand-lg" aria-label="Main">
                    <div className="container">
                        <Link className="brand" to="/" aria-label="Folio &amp; Fern Booksellers, home">
                            <svg className="brand-mark" viewBox="0 0 44 44" aria-hidden="true">
                                <rect width="44" height="44" rx="12" fill="#7b1e2c" />
                                <g fill="none" stroke="#f5eee1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M8 26.5c4.6-2 9.3-1.8 14 .8 4.7-2.6 9.4-2.8 14-.8v7c-4.6-2-9.3-1.8-14 .8-4.7-2.6-9.4-2.8-14-.8Z" />
                                    <path d="M22 27.3v7" />
                                    <path d="M22 26.6c-.2-6.2 1-11.6 4-16.4" />
                                </g>
                                <g fill="#a9bb9c">
                                    <ellipse cx="19.1" cy="21.6" rx="3.1" ry="1.25" transform="rotate(-28 19.1 21.6)" />
                                    <ellipse cx="25.6" cy="20.2" rx="3.1" ry="1.25" transform="rotate(22 25.6 20.2)" />
                                    <ellipse cx="20.4" cy="16.9" rx="2.7" ry="1.1" transform="rotate(-34 20.4 16.9)" />
                                    <ellipse cx="26.4" cy="15.4" rx="2.5" ry="1.05" transform="rotate(18 26.4 15.4)" />
                                    <ellipse cx="22.6" cy="12.6" rx="2.1" ry=".95" transform="rotate(-40 22.6 12.6)" />
                                </g>
                            </svg>
                            <span>
                                <span className="brand-name">Mani<em>&amp;</em>ac</span>
                                <span className="brand-sub">Booksellers</span>
                            </span>
                        </Link>

                        <div className="header-actions order-lg-last">
                            <button className="cart-btn" type="button" data-bs-toggle="offcanvas" data-bs-target="#cart" aria-controls="cart" aria-label="Open basket, 0 items" data-cart-button>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
                                <span className="cart-count is-empty" data-cart-count aria-hidden="true">0</span>
                            </button>
                            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#main-nav" aria-controls="main-nav" aria-expanded="false" aria-label="Toggle navigation">
                                <span className="toggler-bar"></span>
                                <span className="toggler-bar"></span>
                                <span className="toggler-bar"></span>
                            </button>
                        </div>

                        <div className="collapse navbar-collapse" id="main-nav">
                            <ul className="navbar-nav mx-lg-auto">
                                <li className="nav-item"><Link className="nav-link" to="/shop">Shop</Link></li>
                                <li className="nav-item"><a className="nav-link" href="/#visit">Visit</a></li>
                            </ul>
                            <form className="nav-search" action="/shop" method="get" role="search">
                                <label className="visually-hidden" htmlFor="nav-q">Search books</label>
                                <input id="nav-q" name="q" type="search" placeholder="Title or author" autoComplete="off" />
                                <button type="submit" aria-label="Search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg></button>
                            </form>
                        </div>
                    </div>
                </nav>
            </header>

            {/* <!-- ============================ BASKET DRAWER ============================ --> */}
            <div className="offcanvas offcanvas-end cart-drawer" tabIndex="-1" id="cart" aria-labelledby="cart-title">
                <div className="offcanvas-header">
                    <h2 className="offcanvas-title" id="cart-title" tabIndex="-1">Your basket <span data-cart-heading-count></span></h2>
                    <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close basket"></button>
                </div>
    
                <div className="offcanvas-body">
                    <ul className="cart-lines" data-cart-items aria-label="Books in your basket"></ul>
                    <div className="cart-empty" data-cart-empty>
                        <svg viewBox="0 0 120 110" aria-hidden="true">
                            <path d="M22 38h76l-6 62H28Z" fill="#ede3d0" stroke="#6b5d52" strokeWidth="2" strokeLinejoin="round" />
                            <path d="M44 38V28a16 16 0 0 1 32 0v10" fill="none" stroke="#6b5d52" strokeWidth="2" strokeLinecap="round" />
                            <path d="M60 58c-.3 9 1.2 17 5 24" fill="none" stroke="#4e6245" strokeWidth="2" strokeLinecap="round" />
                            <g fill="#93a687"><ellipse cx="56" cy="66" rx="5" ry="2" transform="rotate(-30 56 66)" /><ellipse cx="66" cy="63" rx="5" ry="2" transform="rotate(25 66 63)" /><ellipse cx="57" cy="74" rx="4.6" ry="1.9" transform="rotate(-25 57 74)" /><ellipse cx="67.5" cy="72" rx="4.4" ry="1.8" transform="rotate(30 67.5 72)" /></g>
                        </svg>
                        <h3>Your basket is empty</h3>
                        <p>Staff picks are a good place to start.</p>
                        <Link className="btn btn-primary" to="/shop?picks=1">Browse staff picks</Link>
                    </div>
                </div>
                <div className="cart-footer" data-cart-footer hidden>
                    <dl className="cart-total"><dt>Subtotal</dt><dd data-cart-subtotal>$0.00</dd></dl>
                    <p className="small mb-3">Delivery and tax are worked out at checkout. Collecting from Wren Street is always free.</p>
                    <button type="button" className="btn btn-primary btn-lg w-100" data-checkout>Checkout</button>
                    <p className="cart-note" data-checkout-note hidden role="status">Checkout is not connected in this template. Link this button to your shop platform or payment provider to take orders.</p>
                </div>
            </div>
        </>
    );
};

export default Header;
