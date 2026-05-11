import React, { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { MatchillLogo } from "../components/AuthLayout";
import { forgotPassword } from "../api/authApi";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";

const schema = z.object({
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const result = await forgotPassword({ email: data.email });
    if (result.success) {
      setSubmittedEmail(data.email);
      setSubmitted(true);
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #fff8f6 0%, #ffeae1 50%, #e0f7f5 100%)" }}
    >
      {/* Background blobs */}
      <div
        className="absolute top-0 left-0 w-80 h-80 rounded-full opacity-30 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #ffb693 0%, transparent 70%)",
          transform: "translate(-30%, -30%)",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-20 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #6ef4ea 0%, transparent 70%)",
          transform: "translate(30%, 30%)",
        }}
      />

      <div
        className="relative bg-white rounded-2xl shadow-2xl p-8 md:p-10 w-full max-w-md"
        style={{ boxShadow: "0 8px 40px rgba(36,25,20,0.15)" }}
      >
        <MatchillLogo />

        {!submitted ? (
          <>
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "#fff1eb" }}
              >
                <Mail size={30} color="#ff7e36" />
              </div>
            </div>

            <div className="text-center mb-7">
              <h2
                className="text-[#241914] mb-2"
                style={{ fontFamily: "Lexend, sans-serif", fontSize: "22px", fontWeight: 700 }}
              >
                Quên Mật Khẩu?
              </h2>
              <p
                className="text-[#584238]"
                style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", lineHeight: 1.6 }}
              >
                Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-[#241914]"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600 }}
                >
                  Email
                </Label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7266]"
                    size={16}
                  />
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

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 gap-2 rounded-lg border-0"
                style={{
                  fontFamily: "Lexend, sans-serif",
                  fontSize: "14px",
                  fontWeight: 700,
                  background: "linear-gradient(90deg, #a04100 0%, #ff7e36 100%)",
                  color: "#fff",
                }}
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Gửi Link Đặt Lại
                    <ArrowRight size={18} />
                  </>
                )}
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "#e6f9f5" }}
              >
                <CheckCircle size={30} color="#006a65" />
              </div>
            </div>
            <div className="text-center mb-7">
              <h2
                className="text-[#241914] mb-2"
                style={{ fontFamily: "Lexend, sans-serif", fontSize: "22px", fontWeight: 700 }}
              >
                Kiểm Tra Email
              </h2>
              <p
                className="text-[#584238] mb-2"
                style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", lineHeight: 1.6 }}
              >
                Chúng tôi đã gửi link đặt lại mật khẩu đến
              </p>
              <p
                className="text-[#a04100]"
                style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 600 }}
              >
                {submittedEmail}
              </p>
              <p
                className="text-[#584238] mt-3"
                style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", lineHeight: 1.6 }}
              >
                Link có hiệu lực trong 15 phút. Kiểm tra cả hộp thư spam nếu không thấy.
              </p>
            </div>
            <Button
              onClick={() => setSubmitted(false)}
              variant="outline"
              className="w-full h-11 rounded-lg border-[#dfc0b3] text-[#584238] hover:bg-[#fff1eb]"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}
            >
              Gửi lại email khác
            </Button>
          </>
        )}

        <div className="text-center mt-6">
          <Link
            to="/auth/login"
            className="text-[#8b7266] hover:text-[#a04100] transition-colors"
            style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}
          >
            ← Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
