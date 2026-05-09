import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
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
    fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
    email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
    password: z
      .string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .regex(/[A-Z]/, "Phải có ít nhất 1 chữ hoa")
      .regex(/[0-9]/, "Phải có ít nhất 1 chữ số"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
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
    const result = await registerApi({
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
    });
    if (result.success) {
      toast.success(result.message);
      navigate(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <AuthLayout
      imageUrl={SPORT_IMAGE}
      imageAlt="Sport player action"
      quote="Join thousands of players finding matches every day."
      quoteAuthor="Matchill Community"
    >
      <MatchillLogo />

      <div className="mb-6 text-center">
        <h1
          className="text-[#241914] mb-2"
          style={{
            fontFamily: "Lexend, sans-serif",
            fontSize: "24px",
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          Tạo Tài Khoản
        </h1>
        <p
          className="text-[#584238]"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", lineHeight: 1.6 }}
        >
          Đăng ký để bắt đầu tìm trận và đặt sân ngay hôm nay.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label
            htmlFor="fullName"
            className="text-[#241914]"
            style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600 }}
          >
            Họ và Tên
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7266]" size={16} />
            <Input
              id="fullName"
              type="text"
              placeholder="Nhập họ và tên"
              className="pl-9 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20 h-11"
              style={{ fontFamily: "Inter, sans-serif" }}
              {...register("fullName")}
            />
          </div>
          {errors.fullName && (
            <p
              className="text-[#ba1a1a]"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}
            >
              {errors.fullName.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label
            htmlFor="email"
            className="text-[#241914]"
            style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600 }}
          >
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7266]" size={16} />
            <Input
              id="email"
              type="email"
              placeholder="Nhập email của bạn"
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
          <Label
            htmlFor="password"
            className="text-[#241914]"
            style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600 }}
          >
            Mật Khẩu
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7266]" size={16} />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Tối thiểu 8 ký tự, 1 chữ hoa, 1 số"
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

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label
            htmlFor="confirmPassword"
            className="text-[#241914]"
            style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600 }}
          >
            Xác Nhận Mật Khẩu
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7266]" size={16} />
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Nhập lại mật khẩu"
              className="pl-9 pr-10 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20 h-11"
              style={{ fontFamily: "Inter, sans-serif" }}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7266] hover:text-[#241914] transition-colors"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p
              className="text-[#ba1a1a]"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}
            >
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit */}
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
              Đăng Ký
              <ArrowRight size={18} />
            </>
          )}
        </Button>
      </form>

      <p
        className="text-center mt-5 text-[#584238]"
        style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}
      >
        Đã có tài khoản?{" "}
        <Link
          to="/auth/login"
          className="text-[#a04100] hover:text-[#ff7e36] transition-colors"
          style={{ fontWeight: 600 }}
        >
          Đăng Nhập
        </Link>
      </p>
    </AuthLayout>
  );
}
