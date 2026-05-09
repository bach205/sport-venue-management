import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { CheckCircle, Mail, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { MatchillLogo } from "../components/AuthLayout";
import { verifyEmail, resendVerification } from "../api/authApi";
import { Button } from "@/shared/components/ui/button";

const CODE_LENGTH = 6;

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    const newCode = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((c, i) => {
      newCode[i] = c;
    });
    setCode(newCode);
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length < CODE_LENGTH) {
      toast.error("Vui lòng nhập đủ 6 chữ số");
      return;
    }
    setIsVerifying(true);
    const result = await verifyEmail({ email, code: fullCode });
    setIsVerifying(false);
    if (result.success) {
      setVerified(true);
      toast.success(result.message);
    } else {
      toast.error(result.message);
      setCode(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    const result = await resendVerification(email);
    setIsResending(false);
    if (result.success) {
      toast.success(result.message);
      setResendCooldown(60);
    } else {
      toast.error(result.message);
    }
  };

  if (verified) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "linear-gradient(135deg, #fff8f6 0%, #ffeae1 50%, #e0f7f5 100%)" }}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md text-center"
          style={{ boxShadow: "0 8px 40px rgba(36,25,20,0.15)" }}
        >
          <MatchillLogo />
          <div className="flex justify-center mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "#e6f9f5" }}
            >
              <CheckCircle size={32} color="#006a65" />
            </div>
          </div>
          <h2
            className="text-[#241914] mb-2"
            style={{ fontFamily: "Lexend, sans-serif", fontSize: "22px", fontWeight: 700 }}
          >
            Xác thực thành công!
          </h2>
          <p
            className="text-[#584238] mb-7"
            style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", lineHeight: 1.6 }}
          >
            Email của bạn đã được xác thực. Giờ bạn có thể đăng nhập và bắt đầu tìm trận.
          </p>
          <Button
            onClick={() => navigate("/auth/login")}
            className="w-full h-12 rounded-lg border-0"
            style={{
              fontFamily: "Lexend, sans-serif",
              fontSize: "14px",
              fontWeight: 700,
              background: "linear-gradient(90deg, #a04100 0%, #ff7e36 100%)",
              color: "#fff",
            }}
          >
            Đăng Nhập Ngay
          </Button>
        </div>
      </div>
    );
  }

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

        {/* Mail icon */}
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
            Xác Thực Email
          </h2>
          <p
            className="text-[#584238]"
            style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", lineHeight: 1.6 }}
          >
            Chúng tôi đã gửi mã xác thực 6 chữ số đến
          </p>
          {email && (
            <p
              className="text-[#a04100] mt-1"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 600 }}
            >
              {email}
            </p>
          )}
        </div>

        {/* OTP inputs */}
        <div className="flex gap-3 justify-center mb-6">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center rounded-xl border-2 outline-none transition-all"
              style={{
                fontFamily: "Lexend, sans-serif",
                fontSize: "22px",
                fontWeight: 700,
                color: "#241914",
                borderColor: digit ? "#ff7e36" : "#dfc0b3",
                background: digit ? "#fff8f6" : "#fff",
                boxShadow: digit ? "0 0 0 3px rgba(255,126,54,0.15)" : "none",
              }}
            />
          ))}
        </div>

        {/* Hint */}
        <p
          className="text-center text-[#8b7266] mb-6"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}
        >
          💡 Dùng mã <strong>123456</strong> để test
        </p>

        {/* Verify button */}
        <Button
          onClick={handleVerify}
          disabled={isVerifying || code.join("").length < CODE_LENGTH}
          className="w-full h-12 rounded-lg border-0 mb-4"
          style={{
            fontFamily: "Lexend, sans-serif",
            fontSize: "14px",
            fontWeight: 700,
            background: "linear-gradient(90deg, #a04100 0%, #ff7e36 100%)",
            color: "#fff",
          }}
        >
          {isVerifying ? <Loader2 size={18} className="animate-spin" /> : "Xác Thực"}
        </Button>

        {/* Resend */}
        <div className="text-center">
          <p
            className="text-[#584238] mb-2"
            style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}
          >
            Không nhận được email?
          </p>
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
            className="flex items-center gap-1.5 mx-auto text-[#a04100] hover:text-[#ff7e36] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 600 }}
          >
            {isResending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {resendCooldown > 0 ? `Gửi lại (${resendCooldown}s)` : "Gửi lại email"}
          </button>
        </div>

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
