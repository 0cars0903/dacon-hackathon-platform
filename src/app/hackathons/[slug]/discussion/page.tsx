"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/features/AuthProvider";
import { Badge, Button, Card, CardContent, CardHeader, EmptyState } from "@/components/common";
import { cn, timeAgo } from "@/lib/utils";
import type { ForumPost, ForumComment } from "@/types";
import {
  getForumPosts,
  getForumComments,
  createForumPost,
  createForumComment,
  toggleForumPostLike,
  toggleForumCommentLike,
} from "@/lib/supabase/data";

type Category = "all" | "question" | "discussion" | "announcement" | "bug";
type SortBy = "latest" | "popular";

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  question: { label: "질문", color: "text-indigo-700 dark:text-indigo-300", bg: "bg-indigo-100 dark:bg-indigo-900" },
  discussion: { label: "자유토론", color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-100 dark:bg-purple-900" },
  announcement: { label: "공지", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-100 dark:bg-emerald-900" },
  bug: { label: "버그리포트", color: "text-red-700 dark:text-red-300", bg: "bg-red-100 dark:bg-red-900" },
};


export default function DiscussionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const hackathonSlug = params.slug as string;

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [sortBy, setSortBy] = useState<SortBy>("latest");
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState<"question" | "discussion" | "announcement" | "bug">("discussion");
  const [newCommentContent, setNewCommentContent] = useState("");
  const [loading, setLoading] = useState(true);

  // Initialize data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all forum posts for this hackathon
        const fetchedPosts = await getForumPosts(hackathonSlug);
        setPosts(fetchedPosts);

        // Load all comments for this hackathon
        const allComments: ForumComment[] = [];
        for (const post of fetchedPosts) {
          const postComments = await getForumComments(post.id);
          allComments.push(...postComments);
        }
        setComments(allComments);
      } catch (error) {
        console.error("Failed to load forum data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [hackathonSlug]);

  // Refresh posts from Supabase
  const refreshPosts = useCallback(async () => {
    try {
      const fetchedPosts = await getForumPosts(hackathonSlug);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Failed to refresh posts:", error);
    }
  }, [hackathonSlug]);

  // Refresh comments from Supabase
  const refreshComments = useCallback(async () => {
    try {
      const allComments: ForumComment[] = [];
      for (const post of posts) {
        const postComments = await getForumComments(post.id);
        allComments.push(...postComments);
      }
      setComments(allComments);
    } catch (error) {
      console.error("Failed to refresh comments:", error);
    }
  }, [posts]);

  const filteredPosts = posts.filter(
    (post) => selectedCategory === "all" || post.category === selectedCategory
  );

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === "latest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return b.likes.length - a.likes.length;
  });

  const postComments = selectedPost ? comments.filter((c) => c.postId === selectedPost.id) : [];

  const handleCreatePost = async () => {
    if (!user || !newPostTitle.trim() || !newPostContent.trim()) return;

    try {
      const post = {
        hackathonSlug,
        authorId: user.id,
        authorName: user.name,
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
        category: newPostCategory,
      };

      await createForumPost(post);

      setNewPostTitle("");
      setNewPostContent("");
      setNewPostCategory("discussion");
      setShowNewPostForm(false);

      // Refresh posts from Supabase
      await refreshPosts();

      // 활동 로그
      import("@/lib/supabase/data").then(({ logActivity }) => {
        logActivity({
          type: "forum_post",
          message: `${user.name}님이 토론 게시글을 작성했습니다: "${post.title}"`,
          timestamp: new Date().toISOString(),
          hackathonSlug,
        });
      });
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  const handleAddComment = async () => {
    if (!user || !selectedPost || !newCommentContent.trim()) return;

    try {
      const comment = {
        postId: selectedPost.id,
        authorId: user.id,
        authorName: user.name,
        content: newCommentContent.trim(),
      };

      await createForumComment(comment);
      setNewCommentContent("");

      // Refresh comments from Supabase
      await refreshComments();
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!user) return;

    try {
      await toggleForumPostLike(postId, user.id);

      // Refresh posts from Supabase
      await refreshPosts();
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  const handleToggleCommentLike = async (commentId: string) => {
    if (!user) return;

    try {
      await toggleForumCommentLike(commentId, user.id);

      // Refresh comments from Supabase
      await refreshComments();
    } catch (error) {
      console.error("Failed to toggle comment like:", error);
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-slate-500">로딩 중...</div>;
  }

  // Post detail view
  if (selectedPost) {
    return (
      <div>
        {/* Back button */}
        <button
          onClick={() => setSelectedPost(null)}
          className="mb-4 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
        >
          ← 목록으로 돌아가기
        </button>

        {/* Post content */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="info" className={cn(CATEGORY_CONFIG[selectedPost.category].bg, CATEGORY_CONFIG[selectedPost.category].color)}>
                    {CATEGORY_CONFIG[selectedPost.category].label}
                  </Badge>
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {selectedPost.title}
                </h1>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  <span className="font-medium">{selectedPost.authorNickname || selectedPost.authorName}</span>
                  <span className="mx-1">·</span>
                  <span>{timeAgo(selectedPost.createdAt)}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none mb-4">
              <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                {selectedPost.content}
              </p>
            </div>
            <div className="flex items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => handleToggleLike(selectedPost.id)}
                className={cn(
                  "flex items-center gap-1 text-sm font-medium transition-colors",
                  user && selectedPost.likes.includes(user.id)
                    ? "text-red-600 dark:text-red-400"
                    : "text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                )}
              >
                {user && selectedPost.likes.includes(user.id) ? "❤️" : "🤍"}
                {selectedPost.likes.length}
              </button>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                댓글 {postComments.length}개
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments section */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            댓글 {postComments.length}
          </h3>

          {postComments.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              첫 번째 댓글을 남겨보세요!
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {postComments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white text-sm">
                          {comment.authorNickname || comment.authorName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {timeAgo(comment.createdAt)}
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap mb-2">
                      {comment.content}
                    </p>
                    <button
                      onClick={() => handleToggleCommentLike(comment.id)}
                      className={cn(
                        "text-xs font-medium transition-colors",
                        user && comment.likes.includes(user.id)
                          ? "text-red-600 dark:text-red-400"
                          : "text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                      )}
                    >
                      {user && comment.likes.includes(user.id) ? "❤️" : "🤍"} {comment.likes.length}
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Add comment form */}
          {user ? (
            <Card>
              <CardContent className="pt-4">
                <textarea
                  value={newCommentContent}
                  onChange={(e) => setNewCommentContent(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setNewCommentContent("")}
                  >
                    취소
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    disabled={!newCommentContent.trim()}
                  >
                    댓글 추가
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-4 text-sm text-slate-500 dark:text-slate-400">
              댓글을 달려면 <button onClick={() => router.push("/auth/login")} className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">로그인</button>이 필요합니다.
            </div>
          )}
        </div>
      </div>
    );
  }

  // Post list view
  return (
    <div>
      {/* Header with new post button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">토론 포럼</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            해커톤 참가자들과 자유롭게 질문하고 의견을 나누세요
          </p>
        </div>
        {user ? (
          <Button
            onClick={() => setShowNewPostForm(true)}
            className="whitespace-nowrap"
          >
            ✏️ 글쓰기
          </Button>
        ) : (
          <Button
            onClick={() => router.push("/auth/login")}
            variant="secondary"
            className="whitespace-nowrap"
          >
            로그인하고 글쓰기
          </Button>
        )}
      </div>

      {/* New post form */}
      {showNewPostForm && user && (
        <Card className="mb-6 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950">
          <CardHeader>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">새 글 작성</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                카테고리
              </label>
              <select
                value={newPostCategory}
                onChange={(e) => setNewPostCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="question">질문</option>
                <option value="discussion">자유토론</option>
                <option value="announcement">공지</option>
                <option value="bug">버그리포트</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                제목
              </label>
              <input
                type="text"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                placeholder="글의 제목을 입력하세요"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                내용
              </label>
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="글의 내용을 입력하세요. 마크다운 형식을 지원합니다."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={6}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowNewPostForm(false);
                  setNewPostTitle("");
                  setNewPostContent("");
                  setNewPostCategory("discussion");
                }}
              >
                취소
              </Button>
              <Button
                onClick={handleCreatePost}
                disabled={!newPostTitle.trim() || !newPostContent.trim()}
              >
                게시하기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {[
          { key: "all" as Category, label: "전체" },
          { key: "question" as Category, label: "질문" },
          { key: "discussion" as Category, label: "자유토론" },
          { key: "announcement" as Category, label: "공지" },
          { key: "bug" as Category, label: "버그리포트" },
        ].map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={cn(
              "px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors",
              selectedCategory === cat.key
                ? "bg-indigo-600 text-white dark:bg-indigo-500"
                : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Sort options */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setSortBy("latest")}
          className={cn(
            "px-3 py-1 text-sm rounded-lg transition-colors",
            sortBy === "latest"
              ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          최신순
        </button>
        <button
          onClick={() => setSortBy("popular")}
          className={cn(
            "px-3 py-1 text-sm rounded-lg transition-colors",
            sortBy === "popular"
              ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          인기순
        </button>
      </div>

      {/* Posts list */}
      {sortedPosts.length === 0 ? (
        <EmptyState
          emoji="💭"
          title="글이 없습니다"
          description={selectedCategory === "all" ? "첫 번째 글을 작성해보세요!" : `${CATEGORY_CONFIG[selectedCategory].label} 카테고리에 글이 없습니다.`}
          actionLabel={user ? "글쓰기" : "로그인하기"}
          onAction={() => (user ? setShowNewPostForm(true) : router.push("/auth/login"))}
        />
      ) : (
        <div className="space-y-3">
          {sortedPosts.map((post) => (
            <div
              key={post.id}
              className="cursor-pointer"
              onClick={() => setSelectedPost(post)}
            >
            <Card
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge
                        variant="info"
                        className={cn(CATEGORY_CONFIG[post.category].bg, CATEGORY_CONFIG[post.category].color)}
                      >
                        {CATEGORY_CONFIG[post.category].label}
                      </Badge>
                      {post.category === "announcement" && (
                        <Badge variant="success">📢</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2 text-sm sm:text-base">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex-wrap">
                      <span className="font-medium">{post.authorNickname || post.authorName}</span>
                      <span className="text-slate-400 dark:text-slate-600">·</span>
                      <span>{timeAgo(post.createdAt)}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="text-base">🤍</span>
                      <span>{post.likes.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-base">💬</span>
                      <span>{postComments.filter((c) => c.postId === post.id).length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
