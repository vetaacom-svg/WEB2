import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVeetaa } from '../context/VeetaaContext';

import { TRANSLATIONS } from '../constants';
import { Language } from '../types';
import { 
  ShoppingBag, 
  MapPin, 
  ChevronRight, 
  Search, 
  Star, 
  Truck, 
  Store, 
  Smartphone, 
  UserPlus, 
  Handshake, 
  Briefcase,
  Instagram,
  Facebook,
  Twitter
} from 'lucide-react';

interface WelcomeProps {
  onStart: () => void;
  language: Language;
}

const LandingPage: React.FC<WelcomeProps> = ({ onStart, language }) => {
  const navigate = useNavigate();
  const { storesData } = useVeetaa();
  const [randomStores, setRandomStores] = useState<any[]>([]);
  const [scrolled, setScrolled] = useState(false);

  const t = (key: string) => TRANSLATIONS[language][key] || key;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (storesData && storesData.length > 0) {
      // Initial selection of 6 stores
      const shuffled = [...storesData].sort(() => 0.5 - Math.random());
      setRandomStores(shuffled.slice(0, 8));

      const interval = setInterval(() => {
        setRandomStores(current => {
          const next = [...current];
          if (next.length === 0) return next;

          // Pick a random slot to replace
          const slotToReplace = Math.floor(Math.random() * next.length);
          
          // Find a store that isn't currently displayed
          const pool = storesData.filter(s => !next.some(ns => ns.id === s.id));
          
          if (pool.length > 0) {
            const newStore = pool[Math.floor(Math.random() * pool.length)];
            next[slotToReplace] = newStore;
          } else if (storesData.length > next.length) {
            // Fallback if filter fails but pool should exist
            const fallback = storesData[Math.floor(Math.random() * storesData.length)];
            next[slotToReplace] = fallback;
          }
          return next;
        });
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [storesData]);



  const gold = "#D4AF37";
  const darkGold = "#B8860B";
  const black = "#000000";
  const white = "#FFFFFF";


  const categories = [
    t('food'), t('pharmacie'), t('boulangerie'), 
    t('pressing'), t('legumes'), t('market'), t('express')
  ];

  const features = [
    {
      title: "Les meilleurs restaurants de votre ville",
      desc: "Retrouvez vos plats préférés parmi un large choix de restaurants.",
      icon: <Star size={40} color={gold} />
    },
    {
      title: "Livraison rapide",
      desc: "Nous livrons tout ce que vous voulez, là où vous êtes, en un clin d'œil.",
      icon: <Truck size={40} color={gold} />
    },
    {
      title: "Vos courses et bien plus",
      desc: "Besoin de quelque chose d'un magasin local ? On s'en occupe.",
      icon: <ShoppingBag size={40} color={gold} />
    }
  ];

  return (
    <div style={{ backgroundColor: black, color: white, fontFamily: 'Outfit, sans-serif' }}>
      {/* Navbar */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        backgroundColor: scrolled ? 'rgba(0,0,0,0.8)' : 'transparent',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8%',
        zIndex: 1000,
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        borderBottom: scrolled ? `1px solid rgba(212, 175, 55, 0.2)` : 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src="/logo.png" alt="Veetaa" style={{ height: '54px', filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.2))' }} />
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <button 
            onClick={() => navigate('/login')}
            style={{
              backgroundColor: 'transparent',
              color: white,
              border: 'none',
              padding: '10px 20px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            {t('login')}
          </button>
          <button 
            onClick={() => navigate('/signup')}
            style={{
              backgroundColor: gold,
              color: black,
              border: 'none',
              padding: '12px 32px',
              borderRadius: '99px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: `0 10px 20px -5px ${gold}44`,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {t('signup')}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '120px 20px 60px',
        background: `radial-gradient(circle at 50% 50%, #151515 0%, ${black} 100%)`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ zIndex: 1, maxWidth: '1000px' }}>
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 10vw, 6rem)', 
            fontWeight: '950', 
            margin: '0 0 30px 0',
            lineHeight: '1',
            letterSpacing: '-0.04em',
            background: `linear-gradient(135deg, ${white} 0%, ${gold} 50%, ${darkGold} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))'
          }}>
            {t('welcome')}
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#aaaaaa', marginBottom: '40px', fontWeight: '500' }}>
            Découvrez les meilleurs restaurants et commerces de votre ville, livrés en un clin d'œil.
          </p>
          
          <button 
            onClick={onStart}
            style={{
              backgroundColor: gold,
              color: black,
              padding: '20px 60px',
              borderRadius: '40px',
              fontSize: '1.25rem',
              fontWeight: '900',
              border: 'none',
              cursor: 'pointer',
              boxShadow: `0 20px 40px -10px ${gold}66`,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px) scale(1.05)';
              e.currentTarget.style.boxShadow = `0 25px 50px -10px ${gold}88`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = `0 20px 40px -10px ${gold}66`;
            }}
          >
            {t('getStarted')}
          </button>
        </div>

        {/* Scroll Indicator */}
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          animation: 'bounce 2s infinite'
        }}>
          <ChevronRight size={30} color={gold} style={{ transform: 'rotate(90deg)' }} />
        </div>
      </section>

      {/* Restaurants Preview */}
      <section style={{ padding: '100px 5%', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '60px' }}>
          Meilleurs restaurants et plus
        </h2>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '40px',
          flexWrap: 'wrap',
          minHeight: '200px'
        }}>
          {(randomStores.length > 0 ? randomStores : [1, 2, 3, 4, 5, 6, 7, 8]).map((store, i) => (
            <div 
              key={typeof store === 'object' ? store.id : i} 
              className="store-item-fade"
              style={{ textAlign: 'center', width: '120px' }}
            >
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: '#111',
                border: `2px solid ${gold}33`,
                overflow: 'hidden',
                marginBottom: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: `0 10px 20px rgba(0,0,0,0.3)`
              }}
              onClick={() => typeof store === 'object' && onStart()}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = gold;
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${gold}33`;
                e.currentTarget.style.transform = 'scale(1)';
              }}
              >
                {typeof store === 'object' && store.image ? (
                  <img src={store.image} alt={store.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Store size={40} color={gold} opacity={0.5} />
                )}
              </div>
              <p style={{ fontWeight: '700', fontSize: '0.9rem', color: white, margin: 0, lineClamp: 1, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {typeof store === 'object' ? store.name : `Restaurant ${i + 1}`}
              </p>
            </div>
          ))}
        </div>


      </section>

      {/* Features Section */}
      <section style={{ padding: '100px 5%', backgroundColor: '#050505' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '40px'
        }}>
          {features.map((f, i) => (
            <div key={i} style={{
              padding: '40px',
              backgroundColor: '#111',
              borderRadius: '30px',
              border: `1px solid ${gold}11`,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = gold}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = `${gold}11`}
            >
              <div style={{ marginBottom: '20px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '15px', color: gold }}>{f.title}</h3>
              <p style={{ color: '#888', lineHeight: '1.6' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section style={{ padding: '100px 5%', textAlign: 'center', backgroundColor: '#050505' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '60px' }}>
          Catégories populaires
        </h2>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '15px',
          flexWrap: 'wrap'
        }}>
          {categories.map((cat, i) => (
            <button key={i} style={{
              padding: '12px 30px',
              backgroundColor: `${gold}11`,
              color: gold,
              border: `1px solid ${gold}33`,
              borderRadius: '30px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = gold;
              e.currentTarget.style.color = black;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `${gold}11`;
              e.currentTarget.style.color = gold;
            }}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Opportunities Section */}
      <section style={{ padding: '100px 5%' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px'
        }}>
          {[
            { title: "Devenir coursier", icon: <Truck size={32} />, color: "#4CAF50" },
            { title: "Devenir partenaire", icon: <Handshake size={32} />, color: "#2196F3" },
            { title: "Emploi", icon: <Briefcase size={32} />, color: "#FFC107" }
          ].map((op, i) => (
            <div key={i} style={{
              height: '240px',
              backgroundColor: '#111',
              borderRadius: '30px',
              padding: '40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              border: `1px solid ${gold}11`,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.borderColor = gold;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = `${gold}11`;
            }}
            >
              <div style={{ 
                width: '70px', 
                height: '70px', 
                borderRadius: '20px', 
                backgroundColor: `${gold}22`, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '20px',
                color: gold
              }}>
                {op.icon}
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{op.title}</h3>
              <p style={{ color: gold, marginTop: '10px', fontWeight: '700' }}>En savoir plus <ChevronRight size={16} inline-block /></p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '80px 5% 40px', borderTop: `1px solid ${gold}33`, backgroundColor: '#020202' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '60px',
          marginBottom: '80px'
        }}>
          <div>
            <img src="/logo.png" alt="Veetaa" style={{ height: '50px', marginBottom: '30px' }} />
            <div style={{ display: 'flex', gap: '15px' }}>
              <Instagram size={24} color={gold} />
              <Facebook size={24} color={gold} />
              <Twitter size={24} color={gold} />
            </div>
          </div>
          <div>
            <h4 style={{ color: gold, marginBottom: '25px', fontWeight: '800' }}>Entreprise</h4>
            <ul style={{ listStyle: 'none', padding: 0, color: '#888', lineHeight: '2' }}>
              <li>À propos</li>
              <li>Carrières</li>
              <li>Blog</li>
              <li>Contact</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: gold, marginBottom: '25px', fontWeight: '800' }}>Aide</h4>
            <ul style={{ listStyle: 'none', padding: 0, color: '#888', lineHeight: '2' }}>
              <li>Support</li>
              <li>FAQ</li>
              <li>Sécurité</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: gold, marginBottom: '25px', fontWeight: '800' }}>Légal</h4>
            <ul style={{ listStyle: 'none', padding: 0, color: '#888', lineHeight: '2' }}>
              <li>Conditions d'utilisation</li>
              <li>Confidentialité</li>
              <li>Cookies</li>
            </ul>
          </div>
        </div>
        <div style={{ textAlign: 'center', color: '#555', fontSize: '0.8rem', paddingTop: '40px', borderTop: '1px solid #111' }}>
          © {new Date().getFullYear()} Veetaa. Tous droits réservés.
        </div>
      </footer>

      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {transform: translateX(-50%) translateY(0);}
          40% {transform: translateX(-50%) translateY(-10px);}
          60% {transform: translateX(-50%) translateY(-5px);}
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .store-item-fade {
          animation: fadeInScale 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
      `}</style>

    </div>
  );
};

export default LandingPage;
