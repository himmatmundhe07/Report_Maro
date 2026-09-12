import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useSocketConnection } from '../hooks/useSocket.js';
import { NotificationBell } from './NotificationBell.js';

export function Layout() {
  useSocketConnection();
  const { user, clearSession } = useAuthStore();
  const location = useLocation();
  const isUniversity = location.pathname.startsWith('/university');
  const [fontScale, setFontScale] = useState<number>(1);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginMenuOpen, setLoginMenuOpen] = useState(false);
  const [registerMenuOpen, setRegisterMenuOpen] = useState(false);
  const [univDropdownOpen, setUnivDropdownOpen] = useState(false);

  // Close all open menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setLoginMenuOpen(false);
    setRegisterMenuOpen(false);
    setUnivDropdownOpen(false);
  }, [location.pathname]);

  // Global click outside listener to reliably close dropdowns
  useEffect(() => {
    const handleGlobalClick = () => {
      setLoginMenuOpen(false);
      setRegisterMenuOpen(false);
      setUnivDropdownOpen(false);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Handle font size scaling accessibility toggle
  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', fontScale.toString());
  }, [fontScale]);

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-turmeric selection:text-ink">
      {/* ============================================================ */}
      {/* HEADER: THREE-BAND GOVERNMENT STRUCTURE                      */}
      {/* ============================================================ */}
      <header className="w-full border-b border-border bg-paper z-30">
        {/* BAND 1: UTILITY BAR */}
        <div className="w-full bg-navy text-white py-1 px-3 sm:px-4 text-xs font-sans border-b border-navy-deep">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-1 gap-x-3">
            {/* Helpline and email */}
            <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
              <span>
                <strong className="font-semibold text-turmeric">Helpline:</strong> 1800-345-6570
              </span>
              <span className="opacity-40 hidden sm:inline">|</span>
              <span className="hidden md:inline">
                <strong className="font-semibold text-turmeric">Support:</strong>{' '}
                support.samadhansetu@jharkhand.gov.in
              </span>
            </div>

            {/* Accessibility & Language Toggles */}
            <div className="flex items-center gap-2 sm:gap-2.5 text-[11px] sm:text-xs">
              {/* Font scaling buttons */}
              <div className="flex items-center gap-1 border-r border-white/20 pr-2">
                <button
                  type="button"
                  onClick={() => setFontScale(0.9)}
                  className={`px-1 py-0.2 hover:text-turmeric transition-colors ${fontScale === 0.9 ? 'text-turmeric font-bold' : ''}`}
                  title="Decrease text size"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setFontScale(1)}
                  className={`px-1 py-0.2 hover:text-turmeric transition-colors ${fontScale === 1 ? 'text-turmeric font-bold' : ''}`}
                  title="Default text size"
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setFontScale(1.15)}
                  className={`px-1 py-0.2 hover:text-turmeric transition-colors ${fontScale === 1.15 ? 'text-turmeric font-bold' : ''}`}
                  title="Increase text size"
                >
                  A+
                </button>
              </div>

              {/* Language toggle */}
              <button
                type="button"
                onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
                className="hover:text-turmeric transition-colors font-medium text-[10px] sm:text-xs"
              >
                {lang === 'en' ? 'English / हिन्दी' : 'हिन्दी / English'}
              </button>

              <span className="opacity-40 hidden sm:inline">|</span>
              <a href="#main-content" className="hover:underline hidden lg:inline">
                Skip to Content
              </a>

              {user ? (
                <>
                  <span className="opacity-40">|</span>
                  <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-[10px] sm:text-[11px] text-turmeric">
                    <span className="max-w-[120px] sm:max-w-none truncate">
                      {user.full_name} ({user.role.toUpperCase()})
                    </span>
                    <button
                      type="button"
                      onClick={clearSession}
                      className="text-white hover:text-urgent underline ml-1 font-sans"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="opacity-40">|</span>
                  <Link to="/login" className="hover:text-turmeric underline font-medium">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* BAND 2: IDENTITY BAR */}
        <div className="w-full bg-paper border-b border-border py-2.5 sm:py-3 px-3 sm:px-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
            {/* State Emblem & Platform Title */}
            <Link to="/" className="flex items-center gap-3 group text-center md:text-left">
              {/* Circular Emblem Crest */}
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-Saiq8B8HfuJ4idwInA2z4XrnYcglrpW8bRdUTgZg5iXUb0e_TnzlHMlZlopZXeOXOYukXp0nesbHgwQK9l_Pp6se0AyCWFS4ziY870E-CQTJo0b-fdaP6NMuLbhSJhhIfCUG3J0PozKv_wHL5tAjIKPlKHqNcOUsRQUtWG5OtawQ9TbeJ5cDnjxkvJBcVVnYl8-hn2TGt2btwhJDFSmub6fzbIavbHEUR98gdp5KmsOH-CpBr8k"
                alt="Emblem of Jharkhand"
                className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full border border-border object-cover bg-white"
              />

              {/* Stacked Bilingual Authority Title */}
              <div>
                <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-forest leading-tight">
                  झारखंड सरकार · उच्च एवं तकनीकी शिक्षा विभाग
                </div>
                <div className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-ink-muted">
                  GOVERNMENT OF JHARKHAND · DEPT. OF HIGHER &amp; TECHNICAL EDUCATION
                </div>
                <div className="font-display text-lg sm:text-2xl text-navy font-bold tracking-tight mt-0.5 leading-none">
                  समाधान सेतु{' '}
                  <span className="text-ink-muted font-normal text-base sm:text-lg">
                    / SAMADHAN SETU
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-ink-muted hidden sm:block">
                  A Digital Platform to Crowdsource Societal Challenges &amp; Drive
                  University-Industry R&amp;D (PS 26043)
                </div>
              </div>
            </Link>

            {/* Right: SIH / Digital India Badges & Portal Login */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col text-right font-mono text-[11px] text-ink-muted border-r border-border pr-4 leading-snug">
                <span className="font-bold text-navy">SMART INDIA HACKATHON 2026</span>
                <span>Problem Statement: PS 26043</span>
                <span className="text-forest font-semibold">
                  National Education Policy (NEP 2020)
                </span>
              </div>

              {user ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <NotificationBell />
                  <Link
                    to={
                      user.role === 'admin'
                        ? '/admin'
                        : user.role === 'university'
                          ? '/university'
                          : user.role === 'industry'
                            ? '/industry'
                            : '/problems'
                    }
                    className={`px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-[2px] border transition-colors uppercase tracking-wide flex items-center gap-1.5 ${
                      user.role === 'university'
                        ? 'bg-turmeric text-ink border-turmeric-deep hover:bg-turmeric-deep'
                        : 'bg-navy text-white border-navy hover:bg-navy-deep'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {user.role === 'university' && <span className="material-symbols-outlined text-sm">school</span>}
                      {user.role === 'admin' && <span className="material-symbols-outlined text-sm">settings</span>}
                      {user.role === 'industry' && <span className="material-symbols-outlined text-sm">corporate_fare</span>}
                      {user.role === 'government' && <span className="material-symbols-outlined text-sm">account_balance</span>}
                      {user.role === 'citizen' && <span className="material-symbols-outlined text-sm">format_list_bulleted</span>}
                      <span>
                        {user.role === 'university'
                          ? 'University Dashboard'
                          : user.role === 'admin'
                            ? 'Admin Dashboard'
                            : user.role === 'industry'
                              ? 'Industry Portal'
                              : user.role === 'government'
                                ? 'Government Dashboard'
                                : 'My Grievances'}
                      </span>
                    </span>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2 relative">
                  {/* PORTAL LOGIN DROPDOWN */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRegisterMenuOpen(false);
                        setUnivDropdownOpen(false);
                        setLoginMenuOpen((v) => !v);
                      }}
                      className={`px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-[2px] border transition-all uppercase tracking-wide flex items-center gap-1.5 shadow-sm cursor-pointer select-none ${
                        loginMenuOpen
                          ? 'bg-navy text-white border-navy ring-2 ring-navy/20'
                          : 'bg-white text-navy border-navy hover:bg-paper'
                      }`}
                      aria-expanded={loginMenuOpen}
                    >
                      <span>PORTAL LOGIN</span>
                      <span className={`text-[9px] transition-transform duration-200 inline-block ${loginMenuOpen ? 'rotate-180' : ''}`}>▼</span>
                    </button>

                    {loginMenuOpen && (
                      <div
                        className="absolute right-0 top-full mt-1.5 w-64 bg-white border-2 border-navy rounded-[2px] shadow-2xl z-50 py-1 font-sans"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-3 py-1 bg-navy text-white text-[10px] font-bold uppercase tracking-wider font-mono">
                          Official Role-Based Login
                        </div>
                        <Link
                          to="/login?role=government"
                          className="flex items-start gap-2.5 px-3 py-2 hover:bg-paper text-ink transition-colors border-b border-border/50"
                          onClick={() => setLoginMenuOpen(false)}
                        >
                          <span className="material-symbols-outlined text-base mt-0.5 text-navy">account_balance</span>
                          <div>
                            <div className="text-xs font-bold text-navy">Government / State Admin</div>
                            <div className="text-[10px] text-ink-muted">AI queue &amp; grievance triage</div>
                          </div>
                        </Link>
                        <Link
                          to="/login?role=citizen"
                          className="flex items-start gap-2.5 px-3 py-2 hover:bg-paper text-ink transition-colors border-b border-border/50"
                          onClick={() => setLoginMenuOpen(false)}
                        >
                          <span className="material-symbols-outlined text-base mt-0.5 text-navy">groups</span>
                          <div>
                            <div className="text-xs font-bold text-navy">Citizen Grievance Portal</div>
                            <div className="text-[10px] text-ink-muted">Track complaints &amp; local issues</div>
                          </div>
                        </Link>
                        <div className="bg-paper-dark/70 px-3 py-1 text-[10px] font-bold text-forest uppercase tracking-wider font-mono border-b border-border/40 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">school</span>
                          <span>University Ecosystem</span>
                        </div>
                        <Link
                          to="/login?role=university&type=student"
                          className="flex items-start gap-2 px-3 py-1.5 hover:bg-paper text-ink transition-colors pl-5 border-b border-border/30"
                          onClick={() => setLoginMenuOpen(false)}
                        >
                          <span className="material-symbols-outlined text-sm mt-0.5 text-forest">school</span>
                          <div>
                            <div className="text-xs font-bold text-navy">Student Innovator Desk</div>
                            <div className="text-[10px] text-ink-muted">Deliverables, GPS photos &amp; telemetry</div>
                          </div>
                        </Link>
                        <Link
                          to="/login?role=university&type=mentor"
                          className="flex items-start gap-2 px-3 py-1.5 hover:bg-paper text-ink transition-colors pl-5 border-b border-border/30"
                          onClick={() => setLoginMenuOpen(false)}
                        >
                          <span className="material-symbols-outlined text-sm mt-0.5 text-forest">supervisor_account</span>
                          <div>
                            <div className="text-xs font-bold text-navy">Faculty Mentor Workspace</div>
                            <div className="text-[10px] text-ink-muted">Project review &amp; student messaging</div>
                          </div>
                        </Link>
                        <Link
                          to="/login?role=university&type=dean"
                          className="flex items-start gap-2 px-3 py-1.5 hover:bg-paper text-ink transition-colors pl-5 border-b border-border/50"
                          onClick={() => setLoginMenuOpen(false)}
                        >
                          <span className="material-symbols-outlined text-sm mt-0.5 text-navy">account_balance</span>
                          <div>
                            <div className="text-xs font-bold text-navy">Dean R&amp;D / Institutional Admin</div>
                            <div className="text-[10px] text-ink-muted">Proposal approvals &amp; fund allocations</div>
                          </div>
                        </Link>
                        <Link
                          to="/login?role=industry"
                          className="flex items-start gap-2.5 px-3 py-2 hover:bg-paper text-ink transition-colors"
                          onClick={() => setLoginMenuOpen(false)}
                        >
                          <span className="material-symbols-outlined text-base mt-0.5 text-navy">corporate_fare</span>
                          <div>
                            <div className="text-xs font-bold text-navy">Industry / CSR Partner</div>
                            <div className="text-[10px] text-ink-muted">Corporate sponsorship &amp; co-funding</div>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* REGISTER DROPDOWN */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLoginMenuOpen(false);
                        setUnivDropdownOpen(false);
                        setRegisterMenuOpen((v) => !v);
                      }}
                      className={`px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-[2px] border transition-all uppercase tracking-wide flex items-center gap-1.5 shadow-sm cursor-pointer select-none ${
                        registerMenuOpen
                          ? 'bg-turmeric-deep text-ink border-turmeric-deep ring-2 ring-turmeric/30'
                          : 'bg-turmeric text-ink border-turmeric-deep hover:bg-turmeric-deep'
                      }`}
                      aria-expanded={registerMenuOpen}
                    >
                      <span>REGISTER</span>
                      <span className={`text-[9px] transition-transform duration-200 inline-block ${registerMenuOpen ? 'rotate-180' : ''}`}>▼</span>
                    </button>

                    {registerMenuOpen && (
                      <div
                        className="absolute right-0 top-full mt-1.5 w-64 bg-white border-2 border-turmeric-deep rounded-[2px] shadow-2xl z-50 py-1 font-sans"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-3 py-1 bg-turmeric text-ink text-[10px] font-bold uppercase tracking-wider font-mono">
                          New User Registration
                        </div>
                        <Link
                          to="/register?role=citizen"
                          className="flex items-start gap-2.5 px-3 py-2 hover:bg-paper text-ink transition-colors border-b border-border/50"
                          onClick={() => setRegisterMenuOpen(false)}
                        >
                          <span className="material-symbols-outlined text-base mt-0.5 text-navy">groups</span>
                          <div>
                            <div className="text-xs font-bold text-navy">Citizen Account</div>
                            <div className="text-[10px] text-ink-muted">LGD &amp; Pincode-integrated reporting</div>
                          </div>
                        </Link>
                        <Link
                          to="/register?role=government"
                          className="flex items-start gap-2.5 px-3 py-2 hover:bg-paper text-ink transition-colors border-b border-border/50"
                          onClick={() => setRegisterMenuOpen(false)}
                        >
                          <span className="material-symbols-outlined text-base mt-0.5 text-navy">account_balance</span>
                          <div>
                            <div className="text-xs font-bold text-navy">Government / State Admin</div>
                            <div className="text-[10px] text-ink-muted">State, District, or Department Official</div>
                          </div>
                        </Link>
                        <div className="bg-paper-dark/70 px-3 py-1 text-[10px] font-bold text-forest uppercase tracking-wider font-mono border-b border-border/40 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">school</span>
                          <span>University Onboarding</span>
                        </div>
                        <Link
                          to="/register?role=university&type=student"
                          className="flex items-start gap-2 px-3 py-1.5 hover:bg-paper text-ink transition-colors pl-5 border-b border-border/30"
                          onClick={() => setRegisterMenuOpen(false)}
                        >
                          <span className="material-symbols-outlined text-sm mt-0.5 text-forest">school</span>
                          <div>
                            <div className="text-xs font-bold text-navy">Student Researcher</div>
                            <div className="text-[10px] text-ink-muted">Join innovation team with Roll No / APAAR</div>
                          </div>
                        </Link>
                        <Link
                          to="/register?role=university&type=mentor"
                          className="flex items-start gap-2 px-3 py-1.5 hover:bg-paper text-ink transition-colors pl-5 border-b border-border/30"
                          onClick={() => setRegisterMenuOpen(false)}
                        >
                          <span className="material-symbols-outlined text-sm mt-0.5 text-forest">supervisor_account</span>
                          <div>
                            <div className="text-xs font-bold text-navy">Faculty Mentor / PI</div>
                            <div className="text-[10px] text-ink-muted">Guide students with Vidwan / Faculty ID</div>
                          </div>
                        </Link>
                        <Link
                          to="/register?role=university&type=institution"
                          className="flex items-start gap-2 px-3 py-1.5 hover:bg-paper text-ink transition-colors pl-5 border-b border-border/50"
                          onClick={() => setRegisterMenuOpen(false)}
                        >
                          <span className="material-symbols-outlined text-sm mt-0.5 text-navy">account_balance</span>
                          <div>
                            <div className="text-xs font-bold text-navy">University / Institution Node</div>
                            <div className="text-[10px] text-ink-muted">Register university with AISHE code</div>
                          </div>
                        </Link>
                        <Link
                          to="/register?role=industry"
                          className="flex items-start gap-2.5 px-3 py-2 hover:bg-paper text-ink transition-colors"
                          onClick={() => setRegisterMenuOpen(false)}
                        >
                          <span className="material-symbols-outlined text-base mt-0.5 text-navy">corporate_fare</span>
                          <div>
                            <div className="text-xs font-bold text-navy">Industry / CSR Partner</div>
                            <div className="text-[10px] text-ink-muted">Corporate sponsorship &amp; co-funding</div>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BAND 3: PRIMARY NAVIGATION (NAVY BAND - Public & Citizen Pages Only) */}
        {!isUniversity && (
          <div className="w-full bg-navy text-white relative z-30">
            <div className="max-w-7xl mx-auto px-3 sm:px-4">
              {/* Mobile Nav Header */}
              <div className="flex md:hidden items-center justify-between py-2 border-b border-navy-deep">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-navy-deep text-white border border-white/20 rounded-[2px] text-xs font-bold tracking-wider uppercase"
                  aria-label="Toggle Navigation Menu"
                >
                  <span className="material-symbols-outlined text-base">
                    {mobileMenuOpen ? 'close' : 'menu'}
                  </span>
                  <span>{mobileMenuOpen ? 'Close Menu' : 'Portal Menu'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <Link
                    to={user ? "/submit" : "/login?role=citizen&for=submit"}
                    className="px-2.5 py-1 bg-turmeric text-ink font-bold text-[11px] uppercase tracking-wider rounded-[2px] border border-turmeric-deep"
                  >
                    SUBMIT ISSUE
                  </Link>
                  <Link
                    to="/problems"
                    className="px-2.5 py-1 bg-transparent text-white font-medium text-[11px] uppercase tracking-wider rounded-[2px] border border-white/50"
                  >
                    TRACK
                  </Link>
                </div>
              </div>

            {/* Desktop Navigation Links - Single Row with Strict Alignment */}
            <div className="hidden md:flex flex-row items-center justify-between min-h-[42px]">
              <nav className="flex items-center space-x-0.5 lg:space-x-1 text-[11px] lg:text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                <Link
                  to="/"
                  className={`px-2.5 lg:px-3 py-2.5 transition-colors whitespace-nowrap ${
                    location.pathname === '/'
                      ? 'bg-navy-deep text-turmeric border-b-2 border-turmeric'
                      : 'hover:bg-navy-deep text-white'
                  }`}
                >
                  Home
                </Link>

                <a
                  href="/#about-scheme"
                  className="px-2.5 lg:px-3 py-2.5 hover:bg-navy-deep text-white transition-colors whitespace-nowrap"
                >
                  About Scheme
                </a>

                {user?.role === 'citizen' && (
                  <Link
                    to="/dashboard"
                    className={`px-2.5 lg:px-3 py-2.5 transition-colors whitespace-nowrap ${
                      location.pathname === '/dashboard'
                        ? 'bg-navy-deep text-turmeric border-b-2 border-turmeric'
                        : 'hover:bg-navy-deep text-white'
                    }`}
                  >
                    Citizen Dashboard
                  </Link>
                )}

                <Link
                  to="/problems"
                  className={`px-2.5 lg:px-3 py-2.5 transition-colors whitespace-nowrap ${
                    location.pathname === '/problems'
                      ? 'bg-navy-deep text-turmeric border-b-2 border-turmeric'
                      : 'hover:bg-navy-deep text-white'
                  }`}
                >
                  Track Problems
                </Link>

                {/* UNIVERSITY PORTAL DROPDOWN IN BAND 3 NAVIGATION */}
                <div className="relative whitespace-nowrap">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLoginMenuOpen(false);
                      setRegisterMenuOpen(false);
                      setUnivDropdownOpen((v) => !v);
                    }}
                    className={`px-2.5 lg:px-3 py-2.5 transition-colors flex items-center gap-1 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none ${
                      location.pathname.startsWith('/university') || location.pathname === '/student'
                        ? 'bg-navy-deep text-turmeric border-b-2 border-turmeric'
                        : 'hover:bg-navy-deep text-white'
                    }`}
                    aria-expanded={univDropdownOpen}
                  >
                    <span>University Portal</span>
                    <span className={`text-[9px] transition-transform duration-200 inline-block ${univDropdownOpen ? 'rotate-180' : 'opacity-80'}`}>▼</span>
                  </button>

                  {univDropdownOpen && (
                    <div
                      className="absolute left-0 top-full mt-0 w-72 bg-navy-deep border-2 border-turmeric text-white shadow-2xl z-50 py-1.5 normal-case font-normal"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-3 py-1 text-[10px] font-mono uppercase font-bold text-turmeric border-b border-white/10 tracking-wider">
                        Higher Education &amp; Research Desks
                      </div>
                      <Link
                        to="/university"
                        onClick={() => setUnivDropdownOpen(false)}
                        className="flex items-start gap-2.5 px-3 py-2 hover:bg-navy text-white transition-colors border-b border-white/10"
                      >
                        <span className="material-symbols-outlined text-base mt-0.5 text-turmeric">account_balance</span>
                        <div>
                          <div className="text-xs font-bold text-turmeric">Dean R&amp;D Desk</div>
                          <div className="text-[10px] text-white/70">Institutional proposals, MoUs &amp; approvals</div>
                        </div>
                      </Link>
                      <Link
                        to="/university/mentor"
                        onClick={() => setUnivDropdownOpen(false)}
                        className="flex items-start gap-2.5 px-3 py-2 hover:bg-navy text-white transition-colors border-b border-white/10"
                      >
                        <span className="material-symbols-outlined text-base mt-0.5 text-turmeric">supervisor_account</span>
                        <div>
                          <div className="text-xs font-bold text-turmeric">Faculty Mentor Workspace</div>
                          <div className="text-[10px] text-white/70">Guide student projects, telemetry &amp; live chat</div>
                        </div>
                      </Link>
                      <Link
                        to="/student"
                        onClick={() => setUnivDropdownOpen(false)}
                        className="flex items-start gap-2.5 px-3 py-2 hover:bg-navy text-white transition-colors border-b border-white/10"
                      >
                        <span className="material-symbols-outlined text-base mt-0.5 text-turmeric">school</span>
                        <div>
                          <div className="text-xs font-bold text-turmeric">Student Innovator Dashboard</div>
                          <div className="text-[10px] text-white/70">Proof of work, GPS photos &amp; live deliverables</div>
                        </div>
                      </Link>
                      <div className="px-3 pt-2 pb-1 text-[10px] font-mono uppercase font-bold text-white/50 tracking-wider">
                        University Authentication
                      </div>
                      <div className="grid grid-cols-2 gap-1 px-2 pb-1">
                        <Link
                          to="/login?role=university"
                          onClick={() => setUnivDropdownOpen(false)}
                          className="px-2 py-1.5 bg-white/10 hover:bg-white/20 text-center rounded-[2px] text-[11px] font-bold text-white uppercase tracking-wider flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">login</span>
                          <span>Sign In</span>
                        </Link>
                        <Link
                          to="/register?role=university"
                          onClick={() => setUnivDropdownOpen(false)}
                          className="px-2 py-1.5 bg-turmeric text-ink hover:bg-turmeric-deep text-center rounded-[2px] text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">person_add</span>
                          <span>Register</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  to={user?.role === 'industry' ? '/industry' : '/login?role=industry'}
                  className={`px-2.5 lg:px-3 py-2.5 transition-colors whitespace-nowrap ${
                    location.pathname.startsWith('/industry') || (location.pathname === '/login' && location.search.includes('role=industry'))
                      ? 'bg-navy-deep text-turmeric border-b-2 border-turmeric'
                      : 'hover:bg-navy-deep text-white'
                  }`}
                >
                  Industry &amp; CSR
                </Link>

                <Link
                  to="/analytics"
                  className={`px-2.5 lg:px-3 py-2.5 transition-colors whitespace-nowrap ${
                    location.pathname === '/analytics' || location.pathname === '/ai-analytics'
                      ? 'bg-navy-deep text-turmeric border-b-2 border-turmeric'
                      : 'hover:bg-navy-deep text-white'
                  }`}
                >
                  AI Analytics
                </Link>
                <Link
                  to="/government"
                  className={`px-3 py-3 transition-colors ${
                    location.pathname.startsWith('/government')
                      ? 'bg-navy-deep text-turmeric border-b-2 border-turmeric'
                      : 'hover:bg-navy-deep text-white'
                  }`}
                >
                  Govt Dashboard
                </Link>
                <a
                  href="/#notices"
                  className="px-2.5 lg:px-3 py-2.5 hover:bg-navy-deep text-white transition-colors whitespace-nowrap"
                >
                  Notices
                </a>
              </nav>

              {/* Single Right CTA Button */}
              <div className="flex items-center shrink-0 ml-3 py-1.5">
                <Link
                  to={user ? "/submit" : "/login?role=citizen&for=submit"}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-turmeric text-ink font-bold text-xs uppercase tracking-wider rounded-[2px] border border-turmeric-deep hover:bg-turmeric-deep transition-all shadow-sm whitespace-nowrap"
                >
                  <span className="text-sm font-black leading-none">+</span>
                  <span>SUBMIT A PROBLEM</span>
                </Link>
              </div>
            </div>

            {/* Mobile Expanded Menu Drawer */}
            {mobileMenuOpen && (
              <nav className="md:hidden flex flex-col divide-y divide-navy-deep bg-navy border-t border-navy-deep py-2 text-xs font-semibold uppercase tracking-wider">
                <Link to="/" className="px-3 py-2.5 hover:bg-navy-deep text-white">
                  ● Home
                </Link>
                <a href="/#about-scheme" className="px-3 py-2.5 hover:bg-navy-deep text-white">
                  ● About the Scheme
                </a>
                <Link to={user ? "/submit" : "/login?role=citizen&for=submit"} className="px-3 py-2.5 hover:bg-navy-deep text-turmeric font-bold">
                  ● Submit a Problem
                </Link>
                {user?.role === 'citizen' && (
                  <Link to="/dashboard" className="px-3 py-2.5 hover:bg-navy-deep text-turmeric font-bold">
                    ● Citizen Dashboard
                  </Link>
                )}
                <Link to="/problems" className="px-3 py-2.5 hover:bg-navy-deep text-white">
                  ● Track Problems
                </Link>

                {/* University Section in Mobile Drawer */}
                <div className="bg-navy-deep/80 px-3 py-2">
                  <div className="text-[10px] font-mono text-turmeric font-bold mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">school</span>
                    <span>UNIVERSITY ECOSYSTEM</span>
                  </div>
                  <div className="flex flex-col gap-1 pl-2 font-normal normal-case">
                    <Link to="/university" className="py-1 text-xs text-white hover:text-turmeric flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">account_balance</span>
                      <span>Dean R&amp;D Desk</span>
                    </Link>
                    <Link to="/university/mentor" className="py-1 text-xs text-white hover:text-turmeric flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">supervisor_account</span>
                      <span>Faculty Mentor Workspace</span>
                    </Link>
                    <Link to="/student" className="py-1 text-xs text-white hover:text-turmeric flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">school</span>
                      <span>Student Innovator Dashboard</span>
                    </Link>
                    <div className="flex items-center gap-2 pt-1 mt-1 border-t border-white/10">
                      <Link to="/login?role=university" className="text-[11px] font-bold text-turmeric underline">
                        University Sign In
                      </Link>
                      <span className="text-white/40">|</span>
                      <Link to="/register?role=university" className="text-[11px] font-bold text-turmeric underline">
                        Register
                      </Link>
                    </div>
                  </div>
                </div>

                <Link
                  to={user?.role === 'industry' ? '/industry' : '/login?role=industry'}
                  className="px-3 py-2.5 hover:bg-navy-deep text-white"
                >
                  ● Industry &amp; CSR
                </Link>
                <Link to="/analytics" className="px-3 py-2.5 hover:bg-navy-deep text-white">
                  ● AI Analytics
                </Link>
                <Link to="/government" className="px-3 py-2.5 hover:bg-navy-deep text-white">
                  ● Govt Dashboard
                </Link>
                <a href="/#notices" className="px-3 py-2.5 hover:bg-navy-deep text-white">
                  ● Circulars &amp; Notices
                </a>

                {/* Quick Role-based Access Links for Mobile */}
                {!user && (
                  <div className="p-3 bg-navy-deep/40 flex flex-col gap-2">
                    <div className="text-[10px] font-mono text-ink-muted uppercase font-bold text-white/70">
                      QUICK ROLE LOGIN &amp; REGISTER
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to="/login"
                        className="py-1.5 text-center bg-white text-navy font-bold text-[11px] rounded-[2px]"
                      >
                        Sign In Portal
                      </Link>
                      <Link
                        to="/register"
                        className="py-1.5 text-center bg-turmeric text-ink font-bold text-[11px] rounded-[2px]"
                      >
                        Register Account
                      </Link>
                    </div>
                  </div>
                )}
              </nav>
            )}
            </div>
          </div>
        )}
      </header>

      {/* ============================================================ */}
      {/* PERSISTENT FLOATING ACTION ELEMENT (RIGHT EDGE TAB)         */}
      {/* ============================================================ */}
      {!isUniversity && (
        <>
          <Link
            to={user ? "/submit" : "/login?role=citizen&for=submit"}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-40 hidden md:flex items-center bg-turmeric text-ink border-l-2 border-t-2 border-b-2 border-turmeric-deep px-2 py-4 shadow-sm hover:bg-turmeric-deep transition-all group"
            title="Quickly Submit a Civic Problem"
          >
            <span
              className="font-bold text-xs uppercase tracking-widest text-ink"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              ● SUBMIT A PROBLEM
            </span>
          </Link>

          {/* Mobile Floating Action Button */}
          <Link
            to={user ? "/submit" : "/login?role=citizen&for=submit"}
            className="md:hidden fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-turmeric text-ink font-bold flex items-center justify-center border-2 border-turmeric-deep shadow-lg active:scale-95"
            title="Submit a Problem"
          >
            <span className="material-symbols-outlined text-2xl font-bold">add</span>
          </Link>
        </>
      )}

      {/* ============================================================ */}
      {/* MAIN CONTENT OUTLET                                          */}
      {/* ============================================================ */}
      <main id="main-content" className="flex-1 w-full">
        <Outlet />
      </main>

      {/* ============================================================ */}
      {/* FOOTER: GOVERNMENT INSTITUTIONAL FOOTER                     */}
      {/* ============================================================ */}
      <footer className="w-full border-t border-border bg-paper mt-auto text-ink">
        {/* Top Footnote Strip */}
        <div className="w-full py-4 border-b border-border bg-[#F5F2E9]">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-xs text-ink-muted gap-2 text-center md:text-left">
            <div className="font-mono">
              Developed for <strong>Smart India Hackathon 2026</strong> · PS 26043
            </div>
            <div className="font-semibold text-navy">
              Department of Higher &amp; Technical Education, Government of Jharkhand
            </div>
            <div className="font-mono text-[11px]">
              Version 1.0 (NIC Standard) | Best viewed in Chrome, Edge, Firefox
            </div>
          </div>
        </div>

        {/* Bottom Full-Width Navy Banner */}
        <div className="w-full bg-navy text-white py-6">
          <div className="max-w-7xl mx-auto px-4 text-center space-y-3">
            <p className="text-xs opacity-90 leading-relaxed">
              © 2026 Government of Jharkhand. All Rights Reserved. Content Owned, Maintained and
              Updated by Department of Higher &amp; Technical Education.
            </p>
            <div className="flex flex-wrap justify-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs text-white/70">
              <a href="#about-scheme" className="hover:text-turmeric hover:underline">
                About Samadhan Setu
              </a>
              <span>|</span>
              <a href="#accessibility" className="hover:text-turmeric hover:underline">
                Accessibility Statement
              </a>
              <span>|</span>
              <a href="#privacy" className="hover:text-turmeric hover:underline">
                Privacy Policy
              </a>
              <span>|</span>
              <a href="#terms" className="hover:text-turmeric hover:underline">
                Terms of Use
              </a>
              <span>|</span>
              <a href="#hyperlinking" className="hover:text-turmeric hover:underline">
                Hyperlinking Policy
              </a>
              <span>|</span>
              <a href="#sitemap" className="hover:text-turmeric hover:underline">
                Sitemap
              </a>
              <span>|</span>
              <a href="#help" className="hover:text-turmeric hover:underline">
                Helpdesk &amp; FAQs
              </a>
            </div>
            <div className="pt-2 text-[10px] sm:text-[11px] font-mono text-white/50">
              National Informatics Centre (NIC) Server Node: JH-RANCHI-01 · Last Updated: 10
              September 2026
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
