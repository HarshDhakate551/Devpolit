import { useEffect, useState } from "react";
import { ArrowRight, FolderGit2, MessageSquareCode, Sparkles } from "lucide-react";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type Variants,
} from "motion/react";

import { DevPilotIcon } from "../icons/devpilot-icon";
import { BrandMark } from "../layouts/app-shell";
import { ModeToggle } from "../ui/mode-toggle";
import { buttonVariants } from "../ui/button";

import { cn } from "../../lib/utils";
import { getGithubLoginUrl } from "../../lib/api";
import { Link } from "react-router-dom";

const EASE = [0.22, 1, 0.36, 1] as const;
const INTRO_KEY = "devpilot_intro_seen";
const INTRO_MS = 2600;

/* ───────────── Variants ───────────── */

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: EASE },
  },
};

const cardItem: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: EASE },
  },
};

/* ───────────── Intro: logo first, then "DevPilot" comes out of it ───────────── */

function Intro() {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-background"
      initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
      exit={{
        clipPath: "inset(0% 0% 100% 0%)",
        transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] },
      }}
    >
      {/* The text is the centered element; the logo is positioned relative to it */}
      <div className="relative">
        <motion.span
          className="block whitespace-nowrap py-1 font-heading text-4xl font-semibold tracking-tight sm:text-5xl"
          initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
          animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
          transition={{ delay: 1.0, duration: 0.9, ease: EASE }}
        >
          DevPilot
        </motion.span>

        {/* Logo: starts at the exact center, then glides to the left of the text */}
        <motion.div
          className="absolute top-1/2 z-10"
          style={{ x: "-50%", y: "-50%" }}
          initial={{ left: "50%" }}
          animate={{ left: "-44px" }}
          transition={{ delay: 1.0, duration: 0.9, ease: EASE }}
        >
          <motion.div
            initial={{ scale: 0.3, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.1 }}
          >
            <DevPilotIcon className="size-14 rounded-2xl" />
          </motion.div>
        </motion.div>
      </div>

      {/* loading bar */}
      <div className="h-px w-44 overflow-hidden bg-border">
        <motion.div
          className="h-full origin-left bg-foreground/60"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2.1, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}

/* ───────────── Title with a purple glow sweeping across ───────────── */

const SWEEP =
  "bg-[linear-gradient(100deg,transparent_38%,#a78bfa_46%,#8b5cf6_50%,#a78bfa_54%,transparent_62%)] bg-[length:250%_100%] bg-clip-text text-transparent";

function GlowTitle({ ready }: { ready: boolean }) {
  const sweep = ready
    ? { backgroundPosition: ["100% 0%", "0% 0%"] }
    : { backgroundPosition: "100% 0%" };

  const sweepTransition = {
    duration: 3,
    ease: "easeInOut" as const,
    repeat: Infinity,
    repeatDelay: 1.2,
    delay: 1,
  };

  return (
    <motion.h1
      variants={heroItem}
      className="relative block w-full text-center font-heading text-4xl font-semibold tracking-tight sm:text-5xl"
    >
      DevPilot
      {/* blurred copy = soft purple glow */}
      {/* <motion.span
        aria-hidden
        className={cn("pointer-events-none absolute inset-0 select-none blur-md text-center", SWEEP)}
        animate={sweep}
        transition={sweepTransition}
      >
        DevPilot
      </motion.span>
      sharp copy = bright purple highlight on the letters
      <motion.span
        aria-hidden
        className={cn("pointer-events-none absolute inset-0 select-none", SWEEP)}
        animate={sweep}
        transition={sweepTransition}
      >
        DevPilot
      </motion.span> */}
    </motion.h1>
  );
}

/* ───────────── Feature card (grey spotlight + subtle 3D tilt) ───────────── */

type Feature = { title: string; body: string; icon: typeof FolderGit2 };

function FeatureCard({ feature }: { feature: Feature }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
  const ry = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });

  const glow = useMotionTemplate`radial-gradient(260px circle at ${mx}px ${my}px, oklch(from var(--foreground) l c h / 0.08), transparent 70%)`;

  return (
    <motion.div
      variants={cardItem}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      whileHover={{ y: -6 }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - r.left;
        const py = e.clientY - r.top;
        mx.set(px);
        my.set(py);
        ry.set((px / r.width - 0.5) * 8);
        rx.set(-(py / r.height - 0.5) * 8);
      }}
      onMouseLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      className="group relative overflow-hidden rounded-2xl border bg-card/80 p-5 shadow-xs backdrop-blur transition-[box-shadow,border-color] duration-300 hover:border-foreground/20 hover:shadow-xl hover:shadow-foreground/10"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: glow }}
      />
      <div className="relative">
        <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-muted transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-110 group-hover:bg-foreground group-hover:shadow-lg group-hover:shadow-foreground/20">
          <feature.icon className="size-5 transition-all duration-50 group-hover:-rotate-12 group-hover:scale-110 group-hover:text-background" />
        </div>
        <h2 className="font-medium">{feature.title}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{feature.body}</p>
      </div>
    </motion.div>
  );
}

const features: Feature[] = [
  {
    title: "Connect GitHub",
    body: "OAuth with repo scope for public and private repositories.",
    icon: FolderGit2,
  },
  {
    title: "Index with RAG",
    body: "Chunk and embed your code into Postgres + pgvector.",
    icon: Sparkles,
  },
  {
    title: "Ask anything",
    body: "Get grounded answers with clickable source citations.",
    icon: MessageSquareCode,
  },
];

/* ───────────── Page ───────────── */

export default function HomePage() {
  const reduce = useReducedMotion();

  const [intro, setIntro] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(INTRO_KEY) !== "1";
    } catch {
      return true;
    }
  });
  const showIntro = intro && !reduce;
  const ready = !showIntro;

  useEffect(() => {
    if (!showIntro) return;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => {
      try {
        sessionStorage.setItem(INTRO_KEY, "1");
      } catch {
        /* ignore */
      }
      setIntro(false);
    }, INTRO_MS);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
    };
  }, [showIntro]);

  // page-wide cursor spotlight (grey)
  const px = useMotionValue(-600);
  const py = useMotionValue(-600);
  const spotlight = useMotionTemplate`radial-gradient(520px circle at ${px}px ${py}px, oklch(from var(--foreground) l c h / 0.05), transparent 60%)`;

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>{showIntro && <Intro key="intro" />}</AnimatePresence>

      <div
        className="relative min-h-svh overflow-hidden"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          px.set(e.clientX - r.left);
          py.set(e.clientY - r.top);
        }}
      >
        {/* top glow, now grey */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(from_var(--foreground)_l_c_h/0.07),transparent_55%)]" />

        {/* drifting grey haze */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -left-24 top-10 size-96 rounded-full bg-foreground/[0.06] blur-3xl"
            animate={{ x: [0, 120, -30, 0], y: [0, 60, 120, 0], scale: [1, 1.2, 0.9, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -right-24 top-40 size-[28rem] rounded-full bg-foreground/[0.05] blur-3xl"
            animate={{ x: [0, -140, 40, 0], y: [0, 80, -40, 0], scale: [1, 0.85, 1.15, 1] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* faint grid that fades out toward the edges */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_50%_30%,black,transparent_70%)]"
        />

        {/* cursor spotlight */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: spotlight }}
        />

        <motion.header
          className="relative z-10 mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4"
          initial={{ opacity: 0, y: -16 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
        >
          <BrandMark />
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Link
              to="/login"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Sign in
            </Link>
          </div>
        </motion.header>

        <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-16 px-4">
          <motion.section
            className="mx-auto max-w-2xl space-y-6 text-center"
            variants={container}
            initial="hidden"
            animate={ready ? "show" : "hidden"}
          >
            {/* Logo with a soft grey halo */}
            <motion.div
              variants={heroItem}
              className="relative mx-auto flex size-14 items-center justify-center rounded-2xl shadow-sm"
            >
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-foreground/25 blur-2xl"
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.15, 0.5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* <DevPilotIcon className="size-14 rounded-2xl" /> */}
            </motion.div>

            <motion.div variants={{ hidden: {}, show: {} }} className="space-y-3">
              <GlowTitle ready={ready} />

              <motion.p
                variants={heroItem}
                className="text-lg text-muted-foreground text-balance"
              >
                Connect GitHub, index any repository, and chat with your codebase
                using retrieval-augmented answers and citations.
              </motion.p>
            </motion.div>

            <motion.div
              variants={heroItem}
              className="flex flex-wrap items-center justify-center gap-3"
            >
              {/* Primary: stays in place, light streak sweeps across on hover */}
              <a
                href={getGithubLoginUrl()}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "group relative inline-flex items-center gap-1.5 overflow-hidden"
                )}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[400%]"
                />
                <FolderGit2 className="relative size-4" />
                <span className="relative">Continue with GitHub</span>
                <ArrowRight className="relative size-4" />
              </a>

              {/* Secondary: background fills in from the left on hover */}
              <Link
                to="/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "group relative overflow-hidden"
                )}
              >
                <span
                  aria-hidden
                  className="absolute inset-0 origin-left scale-x-0 bg-foreground transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
                />
                <span className="relative z-10 transition-colors duration-300 group-hover:text-background">
                  See how it works
                </span>
              </Link>
            </motion.div>
          </motion.section>

          <motion.section
            className="grid gap-4 [perspective:1200px] md:grid-cols-3"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            {features.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </motion.section>
        </main>
      </div>
    </MotionConfig>
  );
}