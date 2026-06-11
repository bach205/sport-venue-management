import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout, MatchillLogo } from "../components/AuthLayout";
import { login } from "../api/authApi";
import { loginSuccess } from "../store/authSlice";
import type { AuthUser } from "../store/authSlice";
import type { ApiUser, ApiProfile } from "../types/auth.types";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useAppDispatch } from "@/app/hooks";
import { useTranslation } from "react-i18next";

const SPORT_IMAGE =
  'https://images.unsplash.com/photo-1762695003191-b5c6edd02484?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZW5uaXMlMjBwbGF5ZXIlMjBjb3VydCUyMGFjdGlvbiUyMHNwb3J0fGVufDF8fHx8MTc3ODI2MjQyN3ww&ixlib=rb-4.1.0&q=80&w=1080';

type FormData = { email: string; password: string };

function buildAuthUser(user: ApiUser, profile: ApiProfile): AuthUser {
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
  const { t } = useTranslation("auth");
  const schema = useMemo(() => z.object({
    email: z.string().min(1, t("validation.emailRequired")).email(t("validation.emailInvalid")),
    password: z.string().min(1, t("validation.passwordRequired")),
  }), [t]);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);

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
    <AuthLayout imageUrl={SPORT_IMAGE} imageAlt={t("login.imageAlt")}
      quote={t("login.quote")} quoteAuthor={t("login.quoteAuthor")}>
      <MatchillLogo />

      <div className="mb-6 text-center">
        <h1 className="font-heading text-[26px] font-bold text-brand-dark mb-2 leading-tight">
          {t("login.heading")}
        </h1>
        <p className="text-sm text-brand-body leading-relaxed">
          {t("login.subtitle")}
        </p>
      </div>

    

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-brand-border" />
        <span className="text-brand-muted text-[13px]">{t("login.manualDivider")}</span>
        <div className="flex-1 h-px bg-brand-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-brand-dark text-[13px] font-semibold">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
            <Input id="email" type="email" placeholder={t("login.emailPlaceholder")}
              className="pl-9 border-brand-border focus-visible:border-brand-teal focus-visible:ring-brand-teal/20 h-11"
              {...register('email')} />
          </div>
          {errors.email && <p className="text-[#ba1a1a] text-xs">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-brand-dark text-[13px] font-semibold">{t("login.password")}</Label>
            <Link to="/forgot-password" className="text-brand-orange hover:text-brand-orange-light transition-colors text-[13px] font-medium">
              {t("login.forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
            <Input id="password" type={showPassword ? 'text' : 'password'} placeholder={t("login.passwordPlaceholder")}
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
            : <><span>{t("login.submit")}</span><ArrowRight size={18} /></>}
        </Button>
      </form>

      <p className="text-center mt-6 text-brand-body text-sm">
        {t("login.noAccount")}{' '}
        <Link to="/register" className="text-brand-orange hover:text-brand-orange-light transition-colors font-semibold">
          {t("login.registerLink")}
        </Link>
      </p>
    </AuthLayout>
  );
}
