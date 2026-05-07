import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegister } from "@/features/auth/hooks/useRegister";
import { registerSchema, type RegisterFormValues } from "@/features/auth/utils/validateLogin";

export function RegisterForm() {
  const { register: registerUser, isLoading, error } = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  return (
    <form onSubmit={handleSubmit(registerUser)} className="flex flex-col gap-4">
      <div>
        <input
          {...register("name")}
          placeholder="Họ và tên"
          className="w-full rounded border px-3 py-2"
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
      </div>

      <div>
        <input
          {...register("email")}
          type="email"
          placeholder="Email"
          className="w-full rounded border px-3 py-2"
        />
        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
      </div>

      <div>
        <input
          {...register("password")}
          type="password"
          placeholder="Mật khẩu"
          className="w-full rounded border px-3 py-2"
        />
        {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
      </div>

      <div>
        <input
          {...register("confirmPassword")}
          type="password"
          placeholder="Xác nhận mật khẩu"
          className="w-full rounded border px-3 py-2"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? "Đang đăng ký..." : "Đăng ký"}
      </button>
    </form>
  );
}
