import React, { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { CheckCircle2, XCircle, Loader2, Mail, ArrowRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { MatchillLogo } from "../components/AuthLayout";
import { verifyEmail } from "../api/authApi";
import { Button } from "@/shared/components/ui/button";
import { useTranslation } from "react-i18next";

type State = "idle" | "loading" | "success" | "error";

const ERROR_HINTS: Record<string, string> = {
  "Verification token is invalid.": "verify.errors.invalid",
  "Verification token has already been used.": "verify.errors.used",
  "Verification token has expired.": "verify.errors.expired",
  "User not found.": "verify.errors.userNotFound",
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
  const { t } = useTranslation("auth");
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
        <h2 className="font-heading text-[22px] font-bold text-brand-dark mb-3">{t("verify.title")}</h2>
        <p className="text-sm text-brand-body leading-relaxed mb-6">
          {t("verify.sentDescription")}
        </p>
        <div className="p-4 rounded-xl mb-6 text-left bg-brand-surface-teal border border-brand-teal/20">
          <p className="text-[13px] text-brand-teal leading-relaxed">
            💡 <strong>{t("verify.note")}:</strong> {t("verify.expiryNotice")}
          </p>
        </div>
        <Link
          to="/login"
          className="text-brand-muted hover:text-brand-orange transition-colors text-[13px]"
        >
          ← {t("verify.backToLogin")}
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
          {t("verify.loading")}
        </h2>
        <p className="text-sm text-brand-body">{t("verify.wait")}</p>
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
          {t("verify.successTitle")}
        </h2>
        <p className="text-sm text-brand-body leading-relaxed mb-7">
          {t("verify.successDescription")}
        </p>
        <Button
          onClick={() => navigate("/login")}
          className="w-full h-12 rounded-lg border-0 gap-2 gradient-orange font-heading text-sm font-bold text-white"
        >
          {t("verify.loginNow")} <ArrowRight size={16} />
        </Button>
      </Card>
    );

  // Error
  const hint = t(ERROR_HINTS[errorMsg] ?? "verify.errors.default");
  const isExpired = errorMsg.includes("expired");
  const isUsed = errorMsg.includes("already been used");
  return (
    <Card>
      <div className="flex justify-center mb-5">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#ffd6d6]">
          <XCircle size={32} className="text-brand-red" />
        </div>
      </div>
      <h2 className="font-heading text-[22px] font-bold text-brand-dark mb-3">{t("verify.failedTitle")}</h2>
      <p className="text-sm text-brand-body font-semibold mb-2">{errorMsg}</p>
      <p className="text-[13px] text-brand-muted leading-relaxed mb-7">{hint}</p>
      <div className="flex flex-col gap-3">
        {isUsed && (
          <Button
            onClick={() => navigate("/login")}
            className="w-full h-11 rounded-lg border-0 gap-2 gradient-orange font-heading text-sm font-bold text-white"
          >
            {t("verify.loginNow")} <ArrowRight size={15} />
          </Button>
        )}
        {(isExpired || !isUsed) && (
          <Button
            onClick={() => navigate("/register")}
            className="w-full h-11 rounded-lg border-0 gap-2 gradient-orange font-heading text-sm font-bold text-white"
          >
            <RefreshCw size={15} /> {t("verify.registerAgain")}
          </Button>
        )}
        <Link
          to="/login"
          className="text-brand-muted hover:text-brand-orange transition-colors text-[13px]"
        >
          ← {t("verify.backToLogin")}
        </Link>
      </div>
    </Card>
  );
}
