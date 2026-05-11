import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout, MatchillLogo } from "../components/AuthLayout";
import { login } from "../api/authApi";
import { loginAs, loginWithApiData } from "../store/authStore";
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

const DEMO_ROLES = [
  {
    email: "player@demo.com",
    role: "player" as const,
    label: "Người chơi",
    desc: "Tìm đội, đặt sân, xem Feed",
    emoji: "🏸",
    border: "border-[#7de0cc]",
    bg: "bg-[#f0fdf9]",
    badge: "bg-[#d0f5ee] text-[#00785e]",
    btn: "bg-[#00785e]",
    redirectTo: "/discover",
  },
  {
    email: "owner@demo.com",
    role: "owner" as const,
    label: "Chủ sân",
    desc: "Quản lý sân, Dashboard doanh thu",
    emoji: "🏟️",
    border: "border-[#90bef5]",
    bg: "bg-[#f4f8ff]",
    badge: "bg-[#ddeeff] text-brand-navy",
    btn: "bg-brand-navy",
    redirectTo: "/owner/venues",
  },
  {
    email: "admin@demo.com",
    role: "admin" as const,
    label: "Admin",
    desc: "Quản lý users, báo cáo, hệ thống",
    emoji: "🛡️",
    border: "border-[#f5a0a0]",
    bg: "bg-[#fff5f5]",
    badge: "bg-[#ffd6d6] text-brand-red",
    btn: "bg-brand-red",
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
    if (result.success && result.data) {
      loginWithApiData(result.data.token, result.data.user, result.data.profile);
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
        <h1 className="font-heading text-[26px] font-bold text-brand-dark mb-2 leading-tight">
          Sẵn Sàng Sân Chơi?
        </h1>
        <p className="text-sm text-brand-body leading-relaxed">
          Log in to book courts, find matches, and connect with the community.
        </p>
      </div>

      {/* Demo Role Cards */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-px bg-brand-border" />
          <span className="text-brand-muted px-2 py-0.5 rounded-md text-xs font-semibold bg-brand-surface-orange border border-brand-border">
            ⚡ Demo nhanh
          </span>
          <div className="flex-1 h-px bg-brand-border" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {DEMO_ROLES.map((demo) => (
            <div
              key={demo.email}
              className={`rounded-2xl p-3.5 flex flex-col gap-2.5 border-[1.5px] ${demo.border} ${demo.bg}`}
            >
              <div className="text-3xl leading-none">{demo.emoji}</div>
              <span
                className={`self-start px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${demo.badge}`}
              >
                {demo.label}
              </span>
              <p className="text-xs text-brand-body leading-snug flex-1">{demo.desc}</p>
              <button
                onClick={() => handleDemoLogin(demo)}
                disabled={demoLoading !== null}
                className={`w-full h-9 rounded-xl flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-70 text-white text-[13px] font-bold ${demo.btn}`}
              >
                {demoLoading === demo.email ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    Vào ngay <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-brand-border" />
        <span className="text-brand-muted text-[13px]">hoặc đăng nhập thủ công</span>
        <div className="flex-1 h-px bg-brand-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-brand-dark text-[13px] font-semibold">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="pl-9 border-brand-border focus-visible:border-brand-teal focus-visible:ring-brand-teal/20 h-11"
              {...register("email")}
            />
          </div>
          {errors.email && <p className="text-[#ba1a1a] text-xs">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-brand-dark text-[13px] font-semibold">
              Password
            </Label>
            <Link
              to="/forgot-password"
              className="text-brand-orange hover:text-brand-orange-light transition-colors text-[13px] font-medium"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="pl-9 pr-10 border-brand-border focus-visible:border-brand-teal focus-visible:ring-brand-teal/20 h-11"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-[#ba1a1a] text-xs">{errors.password.message}</p>}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 gap-2 mt-2 rounded-lg uppercase tracking-widest border-0 gradient-orange font-heading text-sm font-bold text-white"
        >
          {isSubmitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <span>Đăng Nhập</span>
              <ArrowRight size={18} />
            </>
          )}
        </Button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-brand-border" />
        <span className="text-brand-muted text-[13px]">or continue with</span>
        <div className="flex-1 h-px bg-brand-border" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => toast.info("Google login coming soon")}
          className="flex items-center justify-center gap-2 h-11 rounded-lg border border-brand-border bg-white hover:bg-brand-surface-orange transition-colors text-sm font-medium text-brand-dark"
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
          onClick={() => toast.info("Facebook login coming soon")}
          className="flex items-center justify-center gap-2 h-11 rounded-lg border border-brand-border bg-white hover:bg-brand-surface-orange transition-colors text-sm font-medium text-brand-dark"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook
        </button>
      </div>

      <p className="text-center mt-6 text-brand-body text-sm">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="text-brand-orange hover:text-brand-orange-light transition-colors font-semibold"
        >
          Sign Up
        </Link>
      </p>
    </AuthLayout>
  );
}
