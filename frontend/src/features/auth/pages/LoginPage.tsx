import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout, MatchillLogo } from "../components/AuthLayout";
import { login } from "../api/authApi";
import { loginAs } from "../store/authStore";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

const SPORT_IMAGE =
  "https://images.unsplash.com/photo-1762695003191-b5c6edd02484?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZW5uaXMlMjBwbGF5ZXIlMjBjb3VydCUyMGFjdGlvbiUyMHNwb3J0fGVufDF8fHx8MTc3ODI2MjQyN3ww&ixlib=rb-4.1.0&q=80&w=1080";

const schema = z.object({
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type FormData = z.infer<typeof schema>;

// ─── Demo role cards (match Figma design) ────────────────────────────────────
const DEMO_ROLES = [
  {
    email: "player@demo.com",
    role: "player" as const,
    label: "Người chơi",
    desc: "Tìm đội, đặt sân, xem Feed",
    emoji: "🏸",
    badgeBg: "#d0f5ee",
    badgeColor: "#00785e",
    cardBorder: "#7de0cc",
    cardBg: "#f0fdf9",
    btnBg: "#00785e",
    btnHover: "#00604b",
    redirectTo: "/discover",
  },
  {
    email: "owner@demo.com",
    role: "owner" as const,
    label: "Chủ sân",
    desc: "Quản lý sân, Dashboard doanh thu",
    emoji: "🏟️",
    badgeBg: "#ddeeff",
    badgeColor: "#1a5fb4",
    cardBorder: "#90bef5",
    cardBg: "#f4f8ff",
    btnBg: "#1a5fb4",
    btnHover: "#144a8f",
    redirectTo: "/owner/venues",
  },
  {
    email: "admin@demo.com",
    role: "admin" as const,
    label: "Admin",
    desc: "Quản lý users, báo cáo, hệ thống",
    emoji: "🛡️",
    badgeBg: "#ffd6d6",
    badgeColor: "#c0392b",
    cardBorder: "#f5a0a0",
    cardBg: "#fff5f5",
    btnBg: "#c0392b",
    btnHover: "#962d22",
    redirectTo: "/discover",
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const result = await login({ email: data.email, password: data.password });
    if (result.success) {
      toast.success(result.message);
      navigate("/");
    } else {
      toast.error(result.message);
    }
  };

  const handleDemoLogin = async (demo: (typeof DEMO_ROLES)[0]) => {
    setDemoLoading(demo.email);
    await new Promise((r) => setTimeout(r, 600));
    loginAs(demo.email);
    toast.success(`Đăng nhập thành công với vai trò ${demo.label}!`);
    setDemoLoading(null);
    navigate(demo.redirectTo);
  };

  return (
    <AuthLayout
      imageUrl={SPORT_IMAGE}
      imageAlt="Tennis player on court"
      quote="The fastest way to get on the court."
      quoteAuthor="Trusted by 10k+ players"
    >
      <MatchillLogo />

      <div className="mb-6 text-center">
        <h1
          className="text-[#241914] mb-2"
          style={{
            fontFamily: "Lexend, sans-serif",
            fontSize: "26px",
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          Sẵn Sàng Sân Chơi?
        </h1>
        <p
          className="text-[#584238]"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", lineHeight: 1.6 }}
        >
          Log in to book courts, find matches, and connect with the community.
        </p>
      </div>

      {/* ─── Demo Role Cards ─────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-px bg-[#dfc0b3]" />
          <span
            className="text-[#8b7266] px-2 py-0.5 rounded-md"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              fontWeight: 600,
              background: "#fff1eb",
              border: "1px solid #dfc0b3",
            }}
          >
            ⚡ Demo nhanh
          </span>
          <div className="flex-1 h-px bg-[#dfc0b3]" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {DEMO_ROLES.map((demo) => (
            <div
              key={demo.email}
              className="rounded-2xl p-3.5 flex flex-col gap-2.5"
              style={{
                background: demo.cardBg,
                border: `1.5px solid ${demo.cardBorder}`,
              }}
            >
              {/* Icon */}
              <div className="text-3xl leading-none">{demo.emoji}</div>

              {/* Badge */}
              <span
                className="self-start px-2 py-0.5 rounded-full"
                style={{
                  background: demo.badgeBg,
                  color: demo.badgeColor,
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {demo.label}
              </span>

              {/* Description */}
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  color: "#584238",
                  lineHeight: 1.4,
                  flex: 1,
                }}
              >
                {demo.desc}
              </p>

              {/* CTA Button */}
              <button
                onClick={() => handleDemoLogin(demo)}
                disabled={demoLoading !== null}
                className="w-full h-9 rounded-xl flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-70"
                style={{
                  background: demo.btnBg,
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#fff",
                  border: "none",
                }}
              >
                {demoLoading === demo.email ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    Vào ngay
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Divider ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-[#dfc0b3]" />
        <span
          className="text-[#8b7266]"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}
        >
          hoặc đăng nhập thủ công
        </span>
        <div className="flex-1 h-px bg-[#dfc0b3]" />
      </div>

      {/* ─── Form ────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <Label
            htmlFor="email"
            className="text-[#241914]"
            style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600 }}
          >
            Email or Username
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7266]" size={16} />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="pl-9 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20 h-11"
              style={{ fontFamily: "Inter, sans-serif" }}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p
              className="text-[#ba1a1a]"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}
            >
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="password"
              className="text-[#241914]"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600 }}
            >
              Password
            </Label>
            <Link
              to="/auth/forgot-password"
              className="text-[#a04100] hover:text-[#ff7e36] transition-colors"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 500 }}
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7266]" size={16} />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="pl-9 pr-10 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20 h-11"
              style={{ fontFamily: "Inter, sans-serif" }}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7266] hover:text-[#241914] transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p
              className="text-[#ba1a1a]"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}
            >
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 gap-2 mt-2 rounded-lg uppercase tracking-widest border-0"
          style={{
            fontFamily: "Lexend, sans-serif",
            fontSize: "14px",
            fontWeight: 700,
            background: "linear-gradient(90deg, #a04100 0%, #ff7e36 100%)",
            color: "#fff",
            letterSpacing: "0.12em",
          }}
        >
          {isSubmitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              Đăng Nhập
              <ArrowRight size={18} />
            </>
          )}
        </Button>
      </form>

      {/* Social */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[#dfc0b3]" />
        <span
          className="text-[#8b7266]"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}
        >
          or continue with
        </span>
        <div className="flex-1 h-px bg-[#dfc0b3]" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => toast.info("Google login coming soon")}
          className="flex items-center justify-center gap-2 h-11 rounded-lg border border-[#dfc0b3] bg-white hover:bg-[#fff1eb] transition-colors"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            color: "#241914",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </button>
        <button
          type="button"
          onClick={() => toast.info("Facebook login coming soon")}
          className="flex items-center justify-center gap-2 h-11 rounded-lg border border-[#dfc0b3] bg-white hover:bg-[#fff1eb] transition-colors"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            color: "#241914",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook
        </button>
      </div>

      <p
        className="text-center mt-6 text-[#584238]"
        style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}
      >
        Don't have an account?{" "}
        <Link
          to="/auth/register"
          className="text-[#a04100] hover:text-[#ff7e36] transition-colors"
          style={{ fontWeight: 600 }}
        >
          Sign Up
        </Link>
      </p>
    </AuthLayout>
  );
}
