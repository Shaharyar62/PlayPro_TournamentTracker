import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Dumbbell,
  Menu,
  Trophy,
  Users,
  X,
} from "lucide-react";
import "../assets/css/about-new.css";

const EASE = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const FEATURES = [
  {
    title: "Home of the #1 Padel Courts",
    copy: "Indoor and outdoor courts kept match-ready, with lighting built for evening play.",
    icon: Trophy,
  },
  {
    title: "Premier Academy Programs",
    copy: "Coaching paths for first-timers, competitors, and juniors who want a real ladder.",
    icon: Users,
  },
  {
    title: "Community & Tournaments",
    copy: "Weekly socials, ladders, and club nights that keep the calendar full.",
    icon: Trophy,
  },
  {
    title: "Club Membership",
    copy: "Priority booking, guest passes, and a membership that actually gets used.",
    icon: Dumbbell,
    dark: true,
  },
];

const REASONS = [
  {
    title: "Professional coaching",
    copy: "Certified coaches on court, not just a booking app and a locked gate.",
  },
  {
    title: "World-class courts",
    copy: "Consistent glass, turf, and bounce so practice actually transfers to match day.",
  },
  {
    title: "Tournaments that matter",
    copy: "Club cups, box leagues, and nights that feel like an event, not a timeslot.",
  },
  {
    title: "Modern club facilities",
    copy: "Lounge, recovery space, and a pro shop that knows what players actually need.",
  },
];

const QUOTES = [
  {
    quote:
      "I joined for the courts and stayed for the people. Every week there is a match at my level.",
    name: "Amina Rahman",
    role: "Member since 2023",
    photo:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
  },
  {
    quote:
      "The academy tightened my game in a month. Coaching here is direct, calm, and specific.",
    name: "Daniel Ortega",
    role: "Competitive player",
    photo:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  },
  {
    quote:
      "It feels like a club, not a facility. The socials are the reason I book the extra hour.",
    name: "Leila Hassan",
    role: "Social member",
    photo:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  },
];

const COACHES = [
  {
    name: "Mateo Alvarez",
    role: "Head Coach",
    photo:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Sofia Berg",
    role: "Performance Coach",
    photo:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Lucas Ferreira",
    role: "Junior Academy",
    photo:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Elena Voss",
    role: "Strength Coach",
    photo:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80",
  },
];

const PARTNERS = ["VIX", "CREVOX", "MARKON", "BRANDEX", "NEX"];

function CountUp({ value, suffix = "" }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    let frame = 0;
    let started = false;

    const run = () => {
      const duration = 1100;
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - (1 - progress) ** 3;
        setDisplay(Math.round(value * eased));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started) return;
        started = true;
        run();
        observer.disconnect();
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <strong ref={ref}>
      {display}
      {suffix}
    </strong>
  );
}

export default function AboutNew() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const jump = (id) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="about-new">
      <header className={`about-nav ${scrolled ? "is-scrolled" : ""}`}>
        <a className="about-brand" href="#top" onClick={() => jump("top")}>
          <span className="about-mark">A</span>
          Adelux
        </a>
        <nav className="about-links">
          <a href="#story" onClick={(e) => { e.preventDefault(); jump("story"); }}>About</a>
          <a href="#club" onClick={(e) => { e.preventDefault(); jump("club"); }}>Club</a>
          <a href="#why" onClick={(e) => { e.preventDefault(); jump("why"); }}>Why Adelux</a>
          <a href="#members" onClick={(e) => { e.preventDefault(); jump("members"); }}>Members</a>
          <a href="#coaches" onClick={(e) => { e.preventDefault(); jump("coaches"); }}>Coaches</a>
        </nav>
        <a className="about-cta" href="#membership" onClick={(e) => { e.preventDefault(); jump("membership"); }}>
          Join the Club <ArrowUpRight size={16} />
        </a>
        <button className="about-menu-btn" type="button" aria-label="Menu" onClick={() => setOpen((v) => !v)}>
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>
      {open && (
        <div className="about-mobile">
          {["story", "club", "why", "members", "coaches"].map((id) => (
            <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); jump(id); }}>
              {id}
            </a>
          ))}
        </div>
      )}

      <section className="about-hero" id="top">
        <motion.img
          src="https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1800&q=80"
          alt="Players on an outdoor court"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.4, ease: EASE }}
        />
        <div className="about-hero__shade" />
        <div className="about-hero__copy">
          <motion.span className="about-kicker" initial="hidden" animate="show" variants={fadeUp}>
            Adelux story
          </motion.span>
          <motion.h1 initial="hidden" animate="show" variants={fadeUp}>
            About Us
          </motion.h1>
        </div>
      </section>

      <section className="about-section" id="story">
        <div className="about-split">
          <motion.h2 initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }} variants={fadeUp}>
            Where passion meets the court
          </motion.h2>
          <motion.p className="about-lead" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            Adelux is a padel home for people who want better matches, sharper coaching, and a club that still feels personal after the first month.
          </motion.p>
        </div>
        <div className="about-grid-4">
          {FEATURES.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.title}
                className={`about-feature ${item.dark ? "is-dark" : ""}`}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeUp}
                transition={{ delay: index * 0.08 }}
              >
                <span className="about-icon"><Icon size={18} /></span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      <div className="about-marquee" aria-hidden="true">
        <div className="about-marquee__track">
          {[...PARTNERS, ...PARTNERS, ...PARTNERS, ...PARTNERS].map((name, i) => (
            <span className="about-marquee__item" key={`${name}-${i}`}>{name}</span>
          ))}
        </div>
      </div>

      <section className="about-section" id="club">
        <div className="about-community">
          <motion.div className="about-photo" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <img
              src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1400&q=80"
              alt="Club players together after a session"
            />
          </motion.div>
          <div>
            <motion.span className="about-kicker" style={{ color: "#3d4a12", background: "#e7f7a8" }} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
              The club
            </motion.span>
            <motion.h2 style={{ margin: "14px 0 16px", maxWidth: "14ch" }} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
              More than a padel club. It is a community.
            </motion.h2>
            <motion.p className="about-lead" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
              From the first rally to the club final, Adelux is built so players stay. Courts, coaches, and a calendar that keeps both beginners and box-league regulars coming back.
            </motion.p>
            <div className="about-stats">
              <div className="about-stat">
                <CountUp value={2022} />
                <span>Club founded</span>
              </div>
              <div className="about-stat">
                <CountUp value={100} suffix="+" />
                <span>Active members</span>
              </div>
              <div className="about-stat">
                <CountUp value={25} suffix="+" />
                <span>Weekly sessions</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section" id="why" style={{ paddingTop: 10 }}>
        <div className="about-reasons">
          <motion.h2 initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            Why players choose Adelux
          </motion.h2>
          <div className="about-reason-grid">
            {REASONS.map((item, index) => (
              <motion.article
                key={item.title}
                className="about-reason"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.35 }}
                variants={fadeUp}
                transition={{ delay: index * 0.06 }}
              >
                <span className="about-icon"><ArrowUpRight size={16} /></span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-banner" id="membership">
        <div className="about-banner__copy">
          <span className="about-kicker">Membership</span>
          <h2>Become an Adelux member today</h2>
          <p>Book earlier, bring guests, and step into the ladder without starting from zero every week.</p>
          <a className="about-cta" href="#members" onClick={(e) => { e.preventDefault(); jump("members"); }} style={{ width: "fit-content" }}>
            See member stories <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="about-banner__visual">
          <img
            src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=80"
            alt="Player preparing to serve"
          />
        </div>
      </section>

      <section className="about-section" id="members">
        <motion.h2 initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
          What our members say
        </motion.h2>
        <div className="about-quotes">
          {QUOTES.map((item, index) => (
            <motion.article
              key={item.name}
              className="about-quote"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ delay: index * 0.08 }}
            >
              <p>“{item.quote}”</p>
              <div className="about-person">
                <img src={item.photo} alt="" />
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.role}</small>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="about-section" id="coaches" style={{ paddingTop: 10 }}>
        <div className="about-coaches">
          <div>
            <span className="about-kicker" style={{ color: "#3d4a12", background: "#e7f7a8" }}>Coaching</span>
            <h2 style={{ marginTop: 14 }}>Meet our coaching team</h2>
            <p className="about-lead" style={{ marginTop: 16 }}>
              A small staff with match experience. They coach the rally in front of them, then the habit that shows up next week.
            </p>
          </div>
          <div className="about-coach-grid">
            {COACHES.map((coach, index) => (
              <motion.article
                key={coach.name}
                className="about-coach"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={{ delay: index * 0.06 }}
              >
                <img className="cover" src={coach.photo} alt="" />
                <div className="about-coach__meta">
                  <strong>{coach.name}</strong>
                  <small>{coach.role}</small>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <footer className="about-footer">
        <div>
          <a className="about-brand" href="#top" onClick={(e) => { e.preventDefault(); jump("top"); }}>
            <span className="about-mark">A</span>
            Adelux
          </a>
          <p style={{ marginTop: 14 }}>A padel club for better matches, clearer coaching, and a week that has somewhere to go.</p>
        </div>
        <div>
          <h3>Visit</h3>
          <p>Court level, Adelux Club</p>
          <p>Open daily, 7:00 to 23:00</p>
        </div>
        <div>
          <h3>Club</h3>
          <a href="#story" onClick={(e) => { e.preventDefault(); jump("story"); }}>About</a>
          <a href="#why" onClick={(e) => { e.preventDefault(); jump("why"); }}>Why Adelux</a>
          <a href="#coaches" onClick={(e) => { e.preventDefault(); jump("coaches"); }}>Coaches</a>
        </div>
        <div>
          <h3>Membership</h3>
          <a href="#membership" onClick={(e) => { e.preventDefault(); jump("membership"); }}>Join the club</a>
          <a href="#members" onClick={(e) => { e.preventDefault(); jump("members"); }}>Member stories</a>
        </div>
        <div className="about-footer__bottom">Adelux. Built for people who stay after the last point.</div>
      </footer>
    </div>
  );
}
