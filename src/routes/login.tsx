import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useUser } from "@/lib/UserContext";
import landingBg from "../../dora_landing_page.png";
import mascot from "../../mascot.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — Dora AI" },
      { name: "description", content: "Sign in to Dora AI with your name and email." },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const { setUsername } = useUser();
  const navigate = useNavigate();
  const [username, setUsernameInput] = useState("");
  const [email, setEmail] = useState("");
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUsername || !trimmedEmail) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setUsername(trimmedUsername);
    navigate({ to: "/" });
  };

  return (
    <div
      className="surface relative min-h-screen overflow-hidden bg-center bg-cover bg-no-repeat login-bg-desktop"
      style={{ "--login-bg-img": `url(${landingBg})` } as React.CSSProperties}
    >
      <div className="absolute inset-0 bg-[rgba(250,245,238,0.08)]" />

      {/* Desktop Mascot: shown only on large screens (width >= 1525px && height >= 1330px) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-12px] top-12 h-60 w-60 opacity-90 lg:right-38 lg:top-20 lg:h-[21rem] lg:w-[21rem] login-mascot-desktop"
      >
        <img
          src={mascot}
          alt=""
          className="h-full w-full object-contain"
          style={{
            transform: "scaleX(-1)",
            animation: "mascotFloat 5s ease-in-out infinite",
            filter: "drop-shadow(0 10px 22px rgba(76,42,99,0.18))",
          }}
        />
      </div>

      <div className="relative min-h-screen px-6 py-8 sm:px-10 lg:px-14 flex flex-col justify-center sm:justify-start">
        <div className="max-w-[380px] w-full mx-auto sm:mx-0 animate-[fadeSlideIn_0.6s_ease] sm:translate-x-4 sm:translate-y-12 lg:translate-x-6 lg:translate-y-16">
          {/* Mobile Mascot: shown only on smaller screens (width < 1525px || height < 1330px) */}
          <div className="login-mascot-mobile mb-6 flex justify-center">
            <img
              src={mascot}
              alt="Mascot"
              className="h-32 w-32 object-contain"
              style={{
                transform: "scaleX(-1)",
                animation: "mascotFloat 5s ease-in-out infinite",
                filter: "drop-shadow(0 8px 16px rgba(76,42,99,0.15))",
              }}
            />
          </div>

          <p className="font-serif text-5xl sm:text-6xl leading-none text-[#4f2a63] text-center sm:text-left">Sign In</p>

          <form
            onSubmit={handleSubmit}
            className={`mt-6 space-y-4 ${shake ? "animate-[shake_0.4s_ease-in-out]" : ""}`}
          >
            <label htmlFor="signin-username" className="block">
              <span className="mb-2 block text-[17px] font-medium text-[#292223]">Username</span>
              <input
                id="signin-username"
                type="text"
                value={username}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Username"
                autoFocus
                className="w-full rounded-xl border border-[#d2cbc2] bg-white px-4 py-3 text-base text-ink shadow-[0_2px_7px_rgba(0,0,0,0.06)] outline-none transition focus:border-[#b58db0] focus:ring-2 focus:ring-[#b58db0]/25"
              />
            </label>

            <label htmlFor="signin-email" className="block">
              <span className="mb-2 block text-[17px] font-medium text-[#292223]">Email</span>
              <input
                id="signin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-xl border border-[#d2cbc2] bg-white px-4 py-3 text-base text-ink shadow-[0_2px_7px_rgba(0,0,0,0.06)] outline-none transition focus:border-[#b58db0] focus:ring-2 focus:ring-[#b58db0]/25"
              />
            </label>

            <div className="flex justify-center sm:justify-start">
              <button
                id="login-submit-btn"
                type="submit"
                className="inline-flex rounded-full bg-[#6b316f] px-8 py-3.5 text-[15px] font-medium text-white shadow-[0_10px_20px_rgba(107,49,111,0.24)] transition hover:-translate-y-0.5 hover:bg-[#5a295e] cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
