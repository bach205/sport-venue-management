import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout, MatchillLogo } from "../components/AuthLayout";
import { login } from "../api/authApi";
import { loginSuccess } from "../store/authSlice";
import { DEMO_ACCOUNTS } from "../store/authStore";
import type { AuthUser } from "../store/authSlice";
import type { ApiUser, ApiProfile, UserRole } from "../types/auth.types";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useAppDispatch } from "@/app/hooks";

const SPORT_IMAGE =
  'https://images.unsplash.com/photo-1762695003191-b5c6edd02484?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZW5uaXMlMjBwbGF5ZXIlMjBjb3VydCUyMGFjdGlvbiUyMHNwb3J0fGVufDF8fHx8MTc3ODI2MjQyN3ww&ixlib=rb-4.1.0&q=80&w=1080';

const schema = z.object({
  email:    z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});
type FormData = z.infer<typeof schema>;

const DEMO_ROLES = [
  { email: 'player@demo.com', role: 'user' as UserRole,  label: 'Người chơi', desc: 'Tìm đội, đặt sân, xem Feed',             emoji: '🏸',
    border: 'border-[#7de0cc]', bg: 'bg-[#f0fdf9]', badge: 'bg-[#d0f5ee] text-[#00785e]', btn: 'bg-[#00785e]', redirectTo: '/discover' },
  { email: 'owner@demo.com',  role: 'owner' as UserRole, label: 'Chủ sân',    desc: 'Quản lý sân, Dashboard doanh thu',        emoji: '🏟️',
    border: 'border-[#90bef5]', bg: 'bg-[#f4f8ff]', badge: 'bg-[#ddeeff] text-brand-navy', btn: 'bg-brand-navy', redirectTo: '/owner/venues' },
  { email: 'admin@demo.com',  role: 'admin' as UserRole, label: 'Admin',      desc: 'Quản lý users, báo cáo, hệ thống',       emoji: '🛡️',
    border: 'border-[#f5a0a0]', bg: 'bg-[#fff5f5]', badge: 'bg-[#ffd6d6] text-brand-red',  btn: 'bg-brand-red',  redirectTo: '/admin' },
];

function buildAuthUser(user: ApiUser, profile: ApiProfile): AuthUser {
  // Map server role "user" to frontend role "player"
  let role: UserRole = "user";
  if (user.role === "admin") role = "admin";
  if (user.role === "owner") role = "owner";

  return {
    _id: user._id,
    email: user.email,
    status: user.status,
    is_verified: user.is_verified,
    name: profile.name,
    sport_preference: profile.sport_preference,
    reputation_score: profile.reputation_score,
    role: user.role ?? 'user',
    avatar: profile.avatar_url || `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(profile.name)}`,
    ownedVenueIds: [],
  };
}

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  // ── Real / mock email+password login ────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    const result = await login({ email: data.email, password: data.password });
    console.log(result)
    if (result.success && result.data) {
      const authUser = buildAuthUser(result.data.user, result.data.profile);
      dispatch(
        loginSuccess({
          token: result.data.token,
          user: authUser,
        })
      );
      toast.success(result.message);
      if (authUser.role === "owner") {
        navigate("/owner/venues");
      } else {
        navigate("/discover");
      }
    } else {
      toast.error(result.message);
    }
  };


  return (
    <AuthLayout imageUrl={SPORT_IMAGE} imageAlt="Người chơi tennis trên sân"
      quote="Cách nhanh nhất để ra sân." quoteAuthor="Được tin dùng bởi hơn 10k người chơi">
      <MatchillLogo />

      <div className="mb-6 text-center">
        <h1 className="font-heading text-[26px] font-bold text-brand-dark mb-2 leading-tight">
          Sẵn Sàng Sân Chơi?
        </h1>
        <p className="text-sm text-brand-body leading-relaxed">
          Log in to book courts, find matches, and message other players.
        </p>
      </div>

    

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-brand-border" />
        <span className="text-brand-muted text-[13px]">hoặc đăng nhập thủ công</span>
        <div className="flex-1 h-px bg-brand-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-brand-dark text-[13px] font-semibold">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
            <Input id="email" type="email" placeholder="Nhập email của bạn"
              className="pl-9 border-brand-border focus-visible:border-brand-teal focus-visible:ring-brand-teal/20 h-11"
              {...register('email')} />
          </div>
          {errors.email && <p className="text-[#ba1a1a] text-xs">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-brand-dark text-[13px] font-semibold">Mật Khẩu</Label>
            <Link to="/forgot-password" className="text-brand-orange hover:text-brand-orange-light transition-colors text-[13px] font-medium">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
            <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Nhập mật khẩu của bạn"
              className="pl-9 pr-10 border-brand-border focus-visible:border-brand-teal focus-visible:ring-brand-teal/20 h-11"
              {...register('password')} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark transition-colors">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-[#ba1a1a] text-xs">{errors.password.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting}
          className="w-full h-12 gap-2 mt-2 rounded-lg uppercase tracking-widest border-0 gradient-orange font-heading text-sm font-bold text-white">
          {isSubmitting
            ? <Loader2 size={18} className="animate-spin" />
            : <><span>Đăng Nhập</span><ArrowRight size={18} /></>}
        </Button>
      </form>

      {/* <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-brand-border" />
        <span className="text-brand-muted text-[13px]">hoặc tiếp tục với</span>
        <div className="flex-1 h-px bg-brand-border" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => toast.info('Tính năng đăng nhập bằng Google sắp ra mắt')}
          className="flex items-center justify-center gap-2 h-11 rounded-lg border border-brand-border bg-white hover:bg-brand-surface-orange transition-colors text-sm font-medium text-brand-dark">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>
        <button onClick={() => toast.info('Tính năng đăng nhập bằng Facebook sắp ra mắt')}
          className="flex items-center justify-center gap-2 h-11 rounded-lg border border-brand-border bg-white hover:bg-brand-surface-orange transition-colors text-sm font-medium text-brand-dark">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </button>
      </div> */}

      <p className="text-center mt-6 text-brand-body text-sm">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-brand-orange hover:text-brand-orange-light transition-colors font-semibold">
          Đăng ký
        </Link>
      </p>
    </AuthLayout>
  );
}
