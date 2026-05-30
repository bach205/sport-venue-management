import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout, MatchillLogo } from "../components/AuthLayout";
import { register as registerApi } from "../api/authApi";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

const SPORT_IMAGE =
  "https://images.unsplash.com/photo-1729564621788-f5658ad291b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWRtaW50b24lMjBiYXNrZXRiYWxsJTIwc3BvcnQlMjBwbGF5ZXIlMjBhY3Rpb258ZW58MXx8fHwxNzc4MjYyNzE4fDA&ixlib=rb-4.1.0&q=80&w=1080";

const schema = z
  .object({
    email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const result = await registerApi({ email: data.email, password: data.password });
    if (result.success) {
      toast.success(result.message);
      navigate("/verify-email");
    } else {
      toast.error(result.message);
    }
  };

  return (
    <AuthLayout
      imageUrl={SPORT_IMAGE}
      imageAlt="Sport player action"
      quote="Join thousands of players finding matches every day."
      quoteAuthor="Matchill Players"
    >
      <MatchillLogo />

      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-bold text-brand-dark mb-2 leading-tight">
          Tạo Tài Khoản
        </h1>
        <p className="text-sm text-brand-body leading-relaxed">
          Đăng ký để bắt đầu tìm trận và đặt sân ngay hôm nay.
        </p>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl mb-5 bg-brand-surface-teal border border-brand-teal/20">
        <Info size={15} className="text-brand-teal shrink-0 mt-0.5" />
        <p className="text-[13px] text-brand-teal leading-relaxed">
          Sau khi đăng ký, bạn sẽ nhận email xác thực. Vui lòng kiểm tra hộp thư để kích hoạt tài
          khoản trước khi đăng nhập.
        </p>
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
              placeholder="Nhập email của bạn"
              className="pl-9 border-brand-border focus-visible:border-brand-teal focus-visible:ring-brand-teal/20 h-11"
              {...register("email")}
            />
          </div>
          {errors.email && <p className="text-[#ba1a1a] text-xs">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-brand-dark text-[13px] font-semibold">
            Mật Khẩu
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Tối thiểu 6 ký tự"
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

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-brand-dark text-[13px] font-semibold">
            Xác Nhận Mật Khẩu
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Nhập lại mật khẩu"
              className="pl-9 pr-10 border-brand-border focus-visible:border-brand-teal focus-visible:ring-brand-teal/20 h-11"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark transition-colors"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-[#ba1a1a] text-xs">{errors.confirmPassword.message}</p>
          )}
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
              <span>Đăng Ký</span>
              <ArrowRight size={18} />
            </>
          )}
        </Button>
      </form>

      <p className="text-center mt-5 text-brand-body text-sm">
        Đã có tài khoản?{" "}
        <Link
          to="/login"
          className="text-brand-orange hover:text-brand-orange-light transition-colors font-semibold"
        >
          Đăng Nhập
        </Link>
      </p>
    </AuthLayout>
  );
}
