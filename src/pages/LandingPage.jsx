import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  FileSignature, Shield, Clock, Users, ArrowRight, CheckCircle,
  ChevronRight, Star, Lock, Zap, Layers, Menu, X, Database, Fingerprint
} from 'lucide-react';

const stats = [
  { label: 'Documents Signed', value: '50K+', suffix: '' },
  { label: 'Active Users', value: '10K+', suffix: '' },
  { label: 'Avg. Signing Time', value: '< 2', suffix: 'min' },
  { label: 'Uptime', value: '99.9', suffix: '%' },
];

const features = [
  { icon: FileSignature, title: 'Easy Signing', desc: 'Draw, type, or upload your signature. Our intuitive interface makes signing documents effortless on any device.' },
  { icon: Layers, title: 'Multi-Party Workflows', desc: 'Send to multiple signers with sequential or bulk signing. Track progress in real-time.' },
  { icon: Shield, title: 'Bank-Grade Security', desc: '256-bit AES encryption, audit trails, and OTP verification ensure your documents stay protected.' },
  { icon: Clock, title: 'Real-Time Tracking', desc: 'Know exactly when your document is viewed, signed, or declined with live status updates.' },
  { icon: Users, title: 'Team Management', desc: 'Manage contacts, companies, and signing roles from a centralized dashboard.' },
  { icon: Database, title: 'Secure Storage', desc: 'All signed documents are stored securely with encrypted cloud backup and easy retrieval.' },
];

const steps = [
  { number: '01', title: 'Upload Your Document', desc: 'Upload a PDF or Word document. Our system converts it and prepares it for signing.' },
  { number: '02', title: 'Add Signers & Fields', desc: 'Drag and drop signature fields onto the document. Assign signers in sequential or bulk order.' },
  { number: '03', title: 'Send & Track', desc: 'Send with one click. Signers receive an email, sign digitally, and you get notified instantly.' },
];

const testimonials = [
  { name: 'Sarah Chen', role: 'CEO, TechVentures', content: 'SignFlow has reduced our contract turnaround time from days to minutes. The audit trail gives us peace of mind for compliance.', rating: 5 },
  { name: 'Marcus Johnson', role: 'Legal Counsel, Axiom Law', content: 'The sequential signing workflow is exactly what we needed for multi-party agreements. Clean, professional, and reliable.', rating: 5 },
  { name: 'Priya Patel', role: 'Operations Director, CloudBase', content: 'We evaluated a dozen e-signature platforms. SignFlow won on ease of use, security features, and pricing. Highly recommended.', rating: 5 },
];

const faqs = [
  { q: 'Is SignFlow legally compliant?', a: 'Yes. SignFlow complies with ESIGN Act, UETA, and eIDAS regulations. All signed documents include a tamper-evident audit trail.' },
  { q: 'Can I use SignFlow on mobile?', a: 'Absolutely. Our signing interface is fully responsive and works seamlessly on smartphones and tablets.' },
  { q: 'How secure is my data?', a: 'We use 256-bit AES encryption at rest and TLS 1.3 in transit. Documents are stored in SOC 2-compliant data centers.' },
  { q: 'What file formats are supported?', a: 'We support PDF, DOCX, and image files. Documents are automatically converted to PDF for signing.' },
];

function useScrollTop() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return scrolled;
}

function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

function StarRating({ rating }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: rating }, (_, i) => (
        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

function Navbar() {
  const scrolled = useScrollTop();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md lg:backdrop-blur-lg shadow-sm border-b border-gray-100' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-black text-lg leading-none">S</span>
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tight">Signflow</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#security" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Security</a>
            <a href="#faq" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="px-5 py-3 lg:py-2.5 text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-colors">Sign In</Link>
            <Link to="/register" className="inline-flex items-center gap-2 px-5 py-3 lg:py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200 active:scale-[0.98]">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-3 text-gray-600 hover:text-indigo-600">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl animate-fade-in">
          <div className="px-4 py-4 space-y-3">
            <a href="#features" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">Features</a>
            <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">How It Works</a>
            <a href="#security" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">Security</a>
            <a href="#faq" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">FAQ</a>
            <hr className="border-gray-100" />
            <div className="space-y-2 pt-1">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block w-full text-center px-4 py-3 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">Sign In</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="block w-full text-center px-4 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all">Get Started</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-[80px] md:blur-[150px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-[80px] md:blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-400/5 rounded-full blur-[100px] md:blur-[200px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/10 mb-8 reveal">
            <Zap className="w-4 h-4 text-indigo-300" />
            <span className="text-sm font-medium text-indigo-200">Trusted by 10,000+ professionals</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight tracking-tight mb-6 reveal">
            Digital Signatures{' '}
            <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">Made Simple</span>
          </h1>

          <p className="text-lg sm:text-xl text-indigo-200/80 max-w-2xl mx-auto mb-10 leading-relaxed reveal">
            Send, sign, and manage documents securely from anywhere. No printing, no scanning, no hassle.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 reveal">
            <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-indigo-900 text-base font-bold rounded-2xl hover:bg-indigo-50 transition-all shadow-2xl shadow-indigo-500/25 active:scale-[0.98]">
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 backdrop-blur-sm text-white text-base font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-all active:scale-[0.98]">
              Sign In <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-indigo-300/70 reveal">
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-indigo-400" /> No credit card</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-indigo-400" /> Free forever plan</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-indigo-400" /> 14-day free trial</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </section>
  );
}

function TrustBar() {
  useReveal();
  return (
    <section className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={stat.label} className={`text-center reveal`} style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="text-3xl sm:text-4xl font-black text-gray-900">{stat.value}<span className="text-indigo-600">{stat.suffix}</span></div>
              <div className="text-sm text-gray-500 font-medium mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  useReveal();
  return (
    <section id="features" className="bg-gray-50/50 py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 reveal">
          <span className="inline-block px-3 py-1 text-xs font-semibold tracking-widest uppercase text-indigo-600 bg-indigo-50 rounded-full mb-4">Features</span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Everything you need to sign documents</h2>
          <p className="mt-4 text-gray-500 text-lg">Powerful features that make document signing fast, secure, and painless.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, i) => (
            <div key={feature.title} className="group bg-white rounded-2xl p-6 lg:p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 reveal" style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  useReveal();
  return (
    <section id="how-it-works" className="bg-white py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 reveal">
          <span className="inline-block px-3 py-1 text-xs font-semibold tracking-widest uppercase text-indigo-600 bg-indigo-50 rounded-full mb-4">How It Works</span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Three simple steps</h2>
          <p className="mt-4 text-gray-500 text-lg">Get started in minutes. No technical skills required.</p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-24 left-[calc(16.66%+24px)] right-[calc(16.66%+24px)] h-0.5 bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-200" />
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, i) => (
              <div key={step.number} className="relative text-center reveal" style={{ transitionDelay: `${i * 150}ms` }}>
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200 relative z-10">
                  <span className="text-white font-black text-lg">{step.number}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SecuritySection() {
  useReveal();
  return (
    <section id="security" className="bg-gray-50/50 py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="reveal">
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-widest uppercase text-indigo-600 bg-indigo-50 rounded-full mb-4">Security</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Enterprise-grade security, built-in</h2>
            <p className="mt-4 text-gray-500 text-lg leading-relaxed">Every document is protected with bank-level encryption and a complete, tamper-evident audit trail.</p>

            <div className="mt-8 space-y-4">
              {[
                { icon: Lock, title: '256-bit AES Encryption', desc: 'Documents encrypted at rest and in transit with industry-standard encryption protocols.' },
                { icon: Fingerprint, title: 'OTP Signature Verification', desc: 'Two-factor verification via email OTP ensures every signature is authenticated.' },
                { icon: Database, title: 'Tamper-Evident Audit Trail', desc: 'Every view, sign, and action is logged with timestamps and IP addresses.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
                    <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 lg:p-10 shadow-2xl shadow-indigo-500/20">
              <Shield className="w-12 h-12 text-white/90 mb-6" />
              <h3 className="text-2xl font-bold text-white mb-3">SOC 2 Compliant</h3>
              <p className="text-indigo-100 leading-relaxed mb-6">Our infrastructure meets the highest standards for security, availability, and confidentiality. Regular third-party audits ensure ongoing compliance.</p>
              <div className="flex flex-wrap gap-3">
                {['AES-256', 'TLS 1.3', 'SOC 2', 'eIDAS', 'ESIGN'].map((badge) => (
                  <span key={badge} className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-lg text-xs font-semibold text-white/90 border border-white/10">{badge}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  useReveal();
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 reveal">
          <span className="inline-block px-3 py-1 text-xs font-semibold tracking-widest uppercase text-indigo-600 bg-indigo-50 rounded-full mb-4">Testimonials</span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Loved by professionals</h2>
          <p className="mt-4 text-gray-500 text-lg">Hear from teams that trust SignFlow every day.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((t, i) => (
            <div key={t.name} className="bg-gray-50/50 rounded-2xl p-6 lg:p-8 border border-gray-100 reveal" style={{ transitionDelay: `${i * 100}ms` }}>
              <StarRating rating={t.rating} />
              <p className="mt-4 text-gray-600 text-sm leading-relaxed">&ldquo;{t.content}&rdquo;</p>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                <div className="text-gray-400 text-xs">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  useReveal();
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faq" className="bg-gray-50/50 py-20 lg:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 reveal">
          <span className="inline-block px-3 py-1 text-xs font-semibold tracking-widest uppercase text-indigo-600 bg-indigo-50 rounded-full mb-4">FAQ</span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Frequently asked questions</h2>
        </div>

        <div className="space-y-3 reveal">
          {faqs.map((faq, i) => (
            <div key={faq.q} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50/50 transition-colors"
              >
                {faq.q}
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${openIndex === i ? 'rotate-90' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openIndex === i ? 'max-h-48' : 'max-h-0'}`}>
                <p className="px-6 pb-4 text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 py-20 lg:py-28">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center reveal">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-6">
          Ready to simplify your document workflow?
        </h2>
        <p className="text-lg text-indigo-200/80 mb-10 max-w-xl mx-auto">
          Join thousands of professionals who trust SignFlow for secure, hassle-free digital signing.
        </p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-indigo-900 text-base font-bold rounded-2xl hover:bg-indigo-50 transition-all shadow-2xl shadow-indigo-500/25 active:scale-[0.98]">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        <p className="mt-4 text-sm text-indigo-300/60">No credit card required. Start your free trial today.</p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm leading-none">S</span>
              </div>
              <span className="text-lg font-black text-white tracking-tight">Signflow</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">Secure digital document signing for modern teams.</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-4">Product</h4>
            <ul className="space-y-2.5">
              {['Features', 'Security', 'Integrations', 'Pricing'].map((item) => (
                <li key={item}><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors inline-block py-2">{item}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-4">Company</h4>
            <ul className="space-y-2.5">
              {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                <li key={item}><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors inline-block py-2">{item}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Compliance'].map((item) => (
                <li key={item}><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors inline-block py-2">{item}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} Signflow Technologies. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>Made with care, built for trust.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-white">
      <Navbar />
      <Hero />
      <TrustBar />
      <FeaturesSection />
      <HowItWorks />
      <SecuritySection />
      <TestimonialsSection />
      <FAQSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
