import React from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { getPostDetail } from "../api/socialApi";
import { PostCard } from "../components/PostCard";
import type { ApiPost } from "../types/feed.types";

export default function FeedPostDetailPage() {
  const { postId } = useParams();
  const [post, setPost] = React.useState<ApiPost | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!postId) return;
    setLoading(true);
    getPostDetail(postId).then((result) => {
      if (result.success && result.data) {
        setPost(result.data);
      } else {
        toast.error(result.message);
      }
      setLoading(false);
    });
  }, [postId]);

  return (
    <div className="min-h-screen bg-brand-surface">
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
        <Link
          to="/feed"
          className="inline-flex items-center gap-2 text-sm text-brand-body hover:text-brand-teal transition-colors"
        >
          <ArrowLeft size={16} />
          Quay lại feed
        </Link>

        {loading ? (
          <div className="py-16 flex items-center justify-center text-brand-muted text-sm gap-2">
            <Loader2 size={16} className="animate-spin" />
            Đang tải bài viết...
          </div>
        ) : !post ? (
          <div className="rounded-xl bg-white border border-brand-border p-5 text-sm text-brand-muted">
            Không tìm thấy bài viết.
          </div>
        ) : (
          <PostCard
            post={post}
            onUpdated={(updated) => setPost(updated)}
            onDeleted={() => {
              setPost(null);
              toast.success("Bài viết đã bị xóa.");
            }}
          />
        )}
      </div>
    </div>
  );
}
