import React, { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { CheckCircle2, XCircle, Loader2, Mail, ArrowRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { MatchillLogo } from "../components/AuthLayout";
import { verifyEmail } from "../api/authApi";
import { Button } from "@/shared/components/ui/button";

type State = "idle" | "loading" | "success" | "error";

const ERROR_HINTS: Record<string, string> = {
  "Verification token is invalid.":
    "Link xác thực không hợp lệ. Vui lòng đăng ký lại hoặc liên hệ hỗ trợ.",
  "Verification token has already been used.": "Link này đã được sử dụng rồi. Vui lòng đăng nhập.",
  "Verification token has expired.": "Link đã hết hạn. Vui lòng đăng ký lại để nhận link mới.",
  "User not found.": "Tài khoản không tồn tại. Vui lòng đăng ký.",
};

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex items-center justify-center p-4 gradient-auth-bg relative">
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
      className="relative bg-white rounded-2xl p-10 w-full max-w-md text-center"
      style={{ boxShadow: "0 8px 40px rgba(36,25,20,0.15)" }}
    >
      <MatchillLogo />
      {children}
    </div>
  </div>
);

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (token) handleVerify(token);
  }, []);

  const handleVerify = async (rawToken: string) => {
    setState("loading");
    const result = await verifyEmail({ token: rawToken });
    if (result.success) {
      setState("success");
      toast.success(result.message);
    } else {
      setState("error");
      setErrorMsg(result.message);
    }
  };

  if (!token && state === "idle")
    return (
      <Card>
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-brand-surface-orange">
            <Mail size={30} className="text-brand-orange-light" />
          </div>
        </div>
        <h2 className="font-heading text-[22px] font-bold text-brand-dark mb-3">Xác Thực Email</h2>
        <p className="text-sm text-brand-body leading-relaxed mb-6">
          Chúng tôi đã gửi link xác thực đến email của bạn. Vui lòng mở email và nhấp vào link để
          kích hoạt tài khoản.
        </p>
        <div className="p-4 rounded-xl mb-6 text-left bg-brand-surface-teal border border-brand-teal/20">
          <p className="text-[13px] text-brand-teal leading-relaxed">
            💡 <strong>Lưu ý:</strong> Link xác thực chỉ có hiệu lực trong một thời gian giới hạn.
          </p>
        </div>
        <Link
          to="/auth/login"
          className="text-brand-muted hover:text-brand-orange transition-colors text-[13px]"
        >
          ← Quay lại đăng nhập
        </Link>
      </Card>
    );

  if (state === "loading")
    return (
      <Card>
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-brand-surface-orange">
            <Loader2 size={30} className="text-brand-orange-light animate-spin" />
          </div>
        </div>
        <h2 className="font-heading text-[22px] font-bold text-brand-dark mb-2">
          Đang xác thực...
        </h2>
        <p className="text-sm text-brand-body">Vui lòng đợi trong giây lát.</p>
      </Card>
    );

  if (state === "success")
    return (
      <Card>
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-brand-surface-teal">
            <CheckCircle2 size={32} className="text-brand-teal" />
          </div>
        </div>
        <h2 className="font-heading text-[22px] font-bold text-brand-dark mb-3">
          Xác thực thành công!
        </h2>
        <p className="text-sm text-brand-body leading-relaxed mb-7">
          Email của bạn đã được xác thực. Bây giờ bạn có thể đăng nhập và bắt đầu tìm trận.
        </p>
        <Button
          onClick={() => navigate("/auth/login")}
          className="w-full h-12 rounded-lg border-0 gap-2 gradient-orange font-heading text-sm font-bold text-white"
        >
          Đăng Nhập Ngay <ArrowRight size={16} />
        </Button>
      </Card>
    );

  // Error
  const hint = ERROR_HINTS[errorMsg] ?? "Đã xảy ra lỗi. Vui lòng thử lại hoặc liên hệ hỗ trợ.";
  const isExpired = errorMsg.includes("expired");
  const isUsed = errorMsg.includes("already been used");
  return (
    <Card>
      <div className="flex justify-center mb-5">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#ffd6d6]">
          <XCircle size={32} className="text-brand-red" />
        </div>
      </div>
      <h2 className="font-heading text-[22px] font-bold text-brand-dark mb-3">Xác thực thất bại</h2>
      <p className="text-sm text-brand-body font-semibold mb-2">{errorMsg}</p>
      <p className="text-[13px] text-brand-muted leading-relaxed mb-7">{hint}</p>
      <div className="flex flex-col gap-3">
        {isUsed && (
          <Button
            onClick={() => navigate("/auth/login")}
            className="w-full h-11 rounded-lg border-0 gap-2 gradient-orange font-heading text-sm font-bold text-white"
          >
            Đăng Nhập Ngay <ArrowRight size={15} />
          </Button>
        )}
        {(isExpired || !isUsed) && (
          <Button
            onClick={() => navigate("/auth/register")}
            className="w-full h-11 rounded-lg border-0 gap-2 gradient-orange font-heading text-sm font-bold text-white"
          >
            <RefreshCw size={15} /> Đăng Ký Lại
          </Button>
        )}
        <Link
          to="/auth/login"
          className="text-brand-muted hover:text-brand-orange transition-colors text-[13px]"
        >
          ← Quay lại đăng nhập
        </Link>
      </div>
    </Card>
  );
}
