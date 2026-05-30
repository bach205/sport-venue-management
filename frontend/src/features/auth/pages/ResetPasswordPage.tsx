import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, ArrowRight, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { MatchillLogo } from "../components/AuthLayout";
import { resetPassword } from "../api/authApi";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useTranslation } from "react-i18next";

type FormData = { newPassword: string; confirmPassword: string };

// Password strength checker
function getPasswordStrength(password: string): { level: number; key: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, key: "weak", color: "#ba1a1a" };
  if (score <= 2) return { level: 2, key: "medium", color: "#ff7e36" };
  if (score <= 3) return { level: 3, key: "good", color: "#f5a623" };
  return { level: 4, key: "strong", color: "#006a65" };
}

export default function ResetPasswordPage() {
  const { t } = useTranslation("auth");
  const schema = useMemo(() => z
    .object({
      newPassword: z
        .string()
        .min(8, t("validation.passwordMin8"))
        .regex(/[A-Z]/, t("validation.passwordUppercase"))
        .regex(/[0-9]/, t("validation.passwordNumber")),
      confirmPassword: z.string().min(1, t("validation.confirmPasswordRequired")),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("validation.confirmPasswordMismatch"),
      path: ["confirmPassword"],
    }), [t]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "mock_reset_token";

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const watchPassword = watch("newPassword", "");
  const strength = getPasswordStrength(watchPassword || "");

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error(t("reset.invalidLinkToast"));
      return;
    }
    const result = await resetPassword({
      token,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
    });
    if (result.success) {
      setSuccess(true);
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  if (!token) {
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
              style={{ background: "#ffdad6" }}
            >
              <AlertCircle size={30} color="#ba1a1a" />
            </div>
          </div>
          <h2
            className="text-[#241914] mb-2"
            style={{ fontFamily: "Lexend, sans-serif", fontSize: "20px", fontWeight: 700 }}
          >
            {t("reset.invalidLink")}
          </h2>
          <p
            className="text-[#584238] mb-6"
            style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}
          >
            {t("reset.invalidLinkDescription")}
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center justify-center w-full h-11 rounded-lg gap-2 text-white"
            style={{
              fontFamily: "Lexend, sans-serif",
              fontSize: "14px",
              fontWeight: 700,
              background: "linear-gradient(90deg, #a04100 0%, #ff7e36 100%)",
            }}
          >
            {t("reset.requestNewLink")}
          </Link>
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

        {!success ? (
          <>
            <div className="flex justify-center mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "#fff1eb" }}
              >
                <Lock size={30} color="#ff7e36" />
              </div>
            </div>

            <div className="text-center mb-7">
              <h2
                className="text-[#241914] mb-2"
                style={{ fontFamily: "Lexend, sans-serif", fontSize: "22px", fontWeight: 700 }}
              >
                {t("reset.title")}
              </h2>
              <p
                className="text-[#584238]"
                style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", lineHeight: 1.6 }}
              >
                {t("reset.subtitle")}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* New Password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="newPassword"
                  className="text-[#241914]"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600 }}
                >
                  {t("reset.newPassword")}
                </Label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7266]"
                    size={16}
                  />
                  <Input
                    id="newPassword"
                    type={showNew ? "text" : "password"}
                    placeholder={t("reset.newPasswordPlaceholder")}
                    className="pl-9 pr-10 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20 h-11"
                    style={{ fontFamily: "Inter, sans-serif" }}
                    {...register("newPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7266] hover:text-[#241914] transition-colors"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p
                    className="text-[#ba1a1a]"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}
                  >
                    {errors.newPassword.message}
                  </p>
                )}

                {/* Password strength bar */}
                {watchPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-1.5 flex-1 rounded-full transition-all duration-300"
                          style={{ background: i <= strength.level ? strength.color : "#f4ded5" }}
                        />
                      ))}
                    </div>
                    <p
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "11px",
                        color: strength.color,
                      }}
                    >
                      {t("reset.strength")}: {t(`reset.strengthLevels.${strength.key}`)}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="confirmPassword"
                  className="text-[#241914]"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600 }}
                >
                  {t("reset.confirmPassword")}
                </Label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7266]"
                    size={16}
                  />
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder={t("reset.confirmPasswordPlaceholder")}
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
                    {t("reset.submit")}
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
                {t("reset.successTitle")}
              </h2>
              <p
                className="text-[#584238]"
                style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", lineHeight: 1.6 }}
              >
                {t("reset.successDescription")}
              </p>
            </div>
            <Button
              onClick={() => navigate("/login")}
              className="w-full h-12 rounded-lg border-0"
              style={{
                fontFamily: "Lexend, sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                background: "linear-gradient(90deg, #a04100 0%, #ff7e36 100%)",
                color: "#fff",
              }}
            >
              {t("reset.loginNow")}
            </Button>
          </>
        )}

        {!success && (
          <div className="text-center mt-6">
            <Link
              to="/login"
              className="text-[#8b7266] hover:text-[#a04100] transition-colors"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}
            >
              ← {t("reset.backToLogin")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
