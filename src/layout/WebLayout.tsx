import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { ShoppingCart, User, Bell, Menu, X, ArrowLeft, Trash2, ChevronRight } from 'lucide-react';
import { useVeetaa } from '../context/VeetaaContext';
import Footer from './Footer';
import logoImage from '../../logo.png';

const NAV_KEYS = ['home', 'stores', 'orders', 'favorites'] as const;

export default function WebLayout() {
  const { user, cart, t, notification, removeCartItem } = useVeetaa();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartHoverOpen, setCartHoverOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setHidden(true);
      } else if (currentScrollY < lastScrollY.current) {
        setHidden(false);
      }
      
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAuthPage = ['/login', '/signup', '/email-otp-verify', '/email-verified', '/permissions', '/password-reset'].some(
    (p) => location.pathname === p
  );
  const isWelcome = location.pathname === '/';
  const hideHeader = isAuthPage || isWelcome || location.pathname === '/blocked' || location.pathname === '/vpn-blocked' || location.pathname === '/confirmation';

  if (hideHeader) return <Outlet />;

  const cartCount = cart.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
  const cartTotal = cart.reduce((sum: number, item: any) => sum + (item.product?.price || 0) * (item.quantity || 0), 0);

  const navLinks = (
    <>
      {NAV_KEYS.map((key) => (
        <NavLink
          key={key}
          to={`/${key}`}
          end={key !== 'orders'}
          onClick={() => setMobileMenuOpen(false)}
          className={({ isActive }) =>
            `veetaa-nav-link ${isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`
          }
        >
          {t(key)}
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {notification && (
        <div className="veetaa-toast animate-premium">
          <div className="veetaa-toast-icon">
            <Bell size={18} />
          </div>
          <div>
            <p className="veetaa-toast-title font-black text-[10px] tracking-widest">{notification.title}</p>
            <p className="veetaa-toast-body text-sm font-bold">{notification.body}</p>
          </div>
        </div>
      )}

      <header className={`veetaa-header transition-all duration-300 ${scrolled ? 'h-16 py-0 shadow-lg' : 'h-24 py-2 shadow-none'} ${hidden ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        <div className="veetaa-container h-full">
          <div className="veetaa-header-inner h-full">
            <div className="flex items-center gap-6">
              <Link to="/home" className="veetaa-header-logo group transition-transform hover:scale-105 active:scale-95">
                <img src={logoImage} alt="Veetaa" className="h-14 w-auto object-contain" />
              </Link>
              
              <nav className="veetaa-nav-desktop">
                {navLinks}
              </nav>
            </div>

            <div className="veetaa-header-actions">
               <button 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800"
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
               </button>

               {/* CART WITH HOVER DROPDOWN */}
               <div 
                  className="relative h-full flex items-center"
                  onMouseEnter={() => setCartHoverOpen(true)}
                  onMouseLeave={() => setCartHoverOpen(false)}
                >
                 <button
                    onClick={() => (cartCount > 0 ? navigate('/checkout') : navigate('/orders'))}
                    className={`veetaa-header-cart group ${cartCount > 0 ? 'bg-orange-600 text-white' : 'bg-slate-50'}`}
                  >
                    <ShoppingCart size={22} className={cartCount > 0 ? 'scale-110' : ''} />
                    {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-slate-900 border-2 border-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg">{cartCount}</span>}
                 </button>

                 {/* Desktop luxury cart preview */}
                 {cartHoverOpen && cartCount > 0 && (
                   <div className="absolute top-full right-0 mt-2 w-80 bg-white shadow-2xl rounded-2xl border border-slate-50 animate-premium overflow-hidden z-[110]">
                      <div className="p-5 border-bottom border-slate-50 bg-slate-50/50">
                         <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Résumé du panier</p>
                         <div className="flex items-baseline justify-between">
                            <p className="text-xl font-black text-slate-900">{cartTotal} DH</p>
                            <p className="text-xs font-bold text-slate-500">{cartCount} articles</p>
                         </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto p-2">
                         {cart.map((item: any, idx: number) => (
                           <div key={idx} className="flex gap-3 p-2 hover:bg-slate-50 rounded-xl group transition-all">
                              <img src={item.product?.image} className="w-12 h-12 rounded-lg object-cover" alt="" />
                              <div className="flex-1 min-w-0">
                                 <p className="text-[11px] font-black text-slate-800 truncate">{item.product?.name}</p>
                                 <p className="text-[10px] text-slate-400 font-bold">{item.quantity} x {item.product?.price} DH</p>
                              </div>
                              <button onClick={() => removeCartItem(idx)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                 <Trash2 size={14} />
                              </button>
                           </div>
                         ))}
                      </div>
                      <div className="p-4 bg-white border-t border-slate-50">
                          <button onClick={() => navigate('/checkout')} className="w-full py-4 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors">
                             Commander <ChevronRight size={14} />
                          </button>
                      </div>
                   </div>
                 )}
               </div>

               {user ? (
                 <Link to="/settings" className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center overflow-hidden hover:bg-orange-600 transition-colors shadow-md hover:shadow-lg hover:-translate-y-0.5">
                   <User size={20} />
                 </Link>
               ) : (
                 <button onClick={() => navigate('/login')} className="veetaa-btn-login text-sm shadow-none md:shadow-lg border-2 border-slate-900 md:border-transparent">
                   {t('login')}
                 </button>
               )}
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white shadow-2xl animate-premium border-t border-slate-50 p-6 flex flex-col gap-3">
             {navLinks}
          </div>
        )}
      </header>

      <main className="veetaa-container flex-1 py-12">
        <Outlet />
      </main>

      {!location.pathname.startsWith('/tickets') && !location.pathname.startsWith('/store/') && location.pathname !== '/checkout' && !location.pathname.endsWith('/track') && <Footer />}

      {cartCount > 0 && !['/checkout', '/confirmation'].includes(location.pathname) && (
        <div className="fixed bottom-10 right-10 z-50">
          <button
            onClick={() => navigate(user ? '/checkout' : '/login')}
            className="w-16 h-16 rounded-3xl bg-orange-600 text-white shadow-2xl flex items-center justify-center group active:scale-95 transition-all hover:rotate-3"
          >
            <ShoppingCart size={28} />
            <span className="absolute -top-2 -left-2 bg-slate-900 border-4 border-white text-xs font-black w-8 h-8 rounded-full flex items-center justify-center shadow-lg">{cartCount}</span>
          </button>
        </div>
      )}
    </div>
  );
}
