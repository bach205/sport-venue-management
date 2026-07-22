import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Loader2,
  MousePointerClick,
  QrCode,
  RefreshCw,
  Search,
  Share2,
  ShoppingBag,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { createAxiosInstance } from "@/shared/api/axiosBase";
import { API_BASE_URL } from "@/shared/constants/api";

type AdminPlatformStats = {
  feed: {
    communityPosts: number;
    marketplacePosts: number;
    totalPosts: number;
  };
  matching: {
    discoverPosts: number;
    matchRequests: number;
    matches: number;
  };
  users: {
    registered: number;
  };
};

const api = createAxiosInstance(API_BASE_URL);

const trafficSourceMetrics = [
  {
    title: "Lượt truy cập từ facebook",
    value: 2421,
    icon: <Share2 size={21} />,
    accent: "#cf1422",
  },
  {
    title: "Lượt truy cập từ tiktok",
    value: 112,
    icon: <Share2 size={21} />,
    accent: "#cf1422",
  },
  {
    title: "Lượt truy cập trực tiếp/tìm kiếm",
    value: 900,
    icon: <Search size={21} />,
    accent: "#cf1422",
  },
  {
    title: "QR",
    value: 120,
    icon: <QrCode size={21} />,
    accent: "#cf1422",
  },
  {
    title: "Lượt truy cập từ các nơi khác",
    value: 47,
    icon: <MousePointerClick size={21} />,
    accent: "#cf1422",
  },
];

async function fetchAdminPlatformStats() {
  const res = await api.get<{ message: string; data: AdminPlatformStats }>("/admin/stats");
  return res.data.data;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function MetricCard({
  title,
  value,
  detail,
  icon,
  accent,
}: {
  title: string;
  value: number;
  detail?: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <article className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-brand-muted">{title}</p>
          <h2 className="mt-2 font-heading text-3xl font-extrabold text-brand-dark">
            {formatNumber(value)}
          </h2>
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: accent }}
        >
          {icon}
        </div>
      </div>
      {detail ? <p className="mt-4 text-sm leading-6 text-brand-body">{detail}</p> : null}
    </article>
  );
}

export default function AdminStatisticsPage() {
  const [data, setData] = useState<AdminPlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      setData(await fetchAdminPlatformStats());
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể tải thống kê hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const matchRate = useMemo(() => {
    if (!data?.matching.matchRequests) {
      return 0;
    }

    return Math.round((data.matching.matches / data.matching.matchRequests) * 100);
  }, [data]);

  return (
    <div className="min-h-screen bg-brand-surface px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-surface-orange px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-brand-red">
                <BarChart3 size={14} />
                Thống kê hệ thống
              </div>
              <h1 className="font-heading text-3xl font-extrabold text-brand-dark">
                Tổng quan hoạt động Matchill
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-body">
                Theo dõi nhanh số bài đăng cộng đồng, tin chợ, nhu cầu tìm đồng đội,
                lượt matching và tổng tài khoản đã đăng ký.
              </p>
            </div>
            <button
              type="button"
              onClick={loadStats}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-brand-border px-4 text-sm font-bold text-brand-body transition hover:bg-brand-surface-orange disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Tải lại
            </button>
          </div>
        </section>

        {loading && !data ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-brand-border bg-white">
            <Loader2 className="mr-2 animate-spin text-brand-red" size={22} />
            <span className="text-sm font-medium text-brand-muted">Đang tải thống kê...</span>
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Bài đăng feed cộng đồng - chợ"
              value={data?.feed.totalPosts || 0}
              detail={`${formatNumber(data?.feed.communityPosts || 0)} bài cộng đồng, ${formatNumber(data?.feed.marketplacePosts || 0)} tin chợ`}
              icon={<ShoppingBag size={21} />}
              accent="#ba1a1a"
            />
            <MetricCard
              title="Lượt đăng bài Discover"
              value={data?.matching.discoverPosts || 0}
              detail="Tổng số bài discover tìm đồng đội và đối thủ."
              icon={<Users size={21} />}
              accent="#006a65"
            />
            <MetricCard
              title="Số lượt matching"
              value={data?.matching.matches || 0}
              detail={`${formatNumber(data?.matching.matchRequests || 0)} lượt gửi yêu cầu matching, tỉ lệ match ${matchRate}%`}
              icon={<Activity size={21} />}
              accent="#a04100"
            />
            <MetricCard
              title="Tài khoản đã đăng ký"
              value={data?.users.registered || 0}
              detail="Tổng số tài khoản hiện có trong collection users."
              icon={<Users size={21} />}
              accent="#1a5fb4"
            />
            {trafficSourceMetrics.map((metric) => (
              <MetricCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                icon={metric.icon}
                accent={metric.accent}
              />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
