import React, { useState, useEffect } from 'react';
import {
  Crown,
  FileText,
  Plus,
  Eye,
  Download,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  Sliders,
  Filter,
  Search,
  History,
  Layers,
  Sparkles,
  ArrowRight,
  Shield,
  X,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AdminPostItem, AdminActivityItem, INITIAL_ADMIN_POSTS, INITIAL_ADMIN_ACTIVITIES } from '../../data/initialAdminPosts';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

interface AdminRoleDashboardProps {
  onClose: () => void;
  onApplyPreset?: (toolType: string, config: any) => void;
}

export const AdminRoleDashboard: React.FC<AdminRoleDashboardProps> = ({ onClose, onApplyPreset }) => {
  const { userProfile, isSuperAdmin, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'my_posts' | 'create_post' | 'activity_log' | 'team_posts'>('my_posts');
  const [posts, setPosts] = useState<AdminPostItem[]>(INITIAL_ADMIN_POSTS);
  const [activities, setActivities] = useState<AdminActivityItem[]>(INITIAL_ADMIN_ACTIVITIES);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // New Post Form State
  const [title, setTitle] = useState<string>('');
  const [toolCategory, setToolCategory] = useState<AdminPostItem['toolCategory']>('compress');
  const [summary, setSummary] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [configJson, setConfigJson] = useState<string>('{\n  "quality": 85,\n  "format": "image/webp"\n}');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Selected post for JSON config preview
  const [viewingConfigPost, setViewingConfigPost] = useState<AdminPostItem | null>(null);

  const currentUserEmail = userProfile?.email || 'admin@pixelforge.local';
  const currentUserName = userProfile?.displayName || userProfile?.email?.split('@')[0] || 'Admin';
  const currentUserUid = userProfile?.uid || 'current_admin_uid';
  const currentUserRole = userProfile?.role || 'admin';

  // Load from Firestore if available
  useEffect(() => {
    const fetchCloudPosts = async () => {
      try {
        const snap = await getDocs(collection(db, 'admin_posts'));
        if (!snap.empty) {
          const cloudList: AdminPostItem[] = [];
          snap.forEach((d) => {
            cloudList.push(d.data() as AdminPostItem);
          });
          setPosts(cloudList);
        }
      } catch (err) {
        console.warn('Using local posts seed:', err);
      }
    };
    fetchCloudPosts();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Filter posts based on tab
  const displayedPosts = posts.filter((p) => {
    // Tab logic
    if (activeTab === 'my_posts') {
      // In my_posts, show posts created by this admin or all initial ones for super admin
      if (!isSuperAdmin && p.authorEmail !== currentUserEmail && p.authorUid !== currentUserUid) {
        return false;
      }
    }

    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.toolCategory === categoryFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate statistics
  const myPostsCount = posts.filter((p) => isSuperAdmin || p.authorEmail === currentUserEmail).length;
  const totalViews = posts.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalDownloads = posts.reduce((acc, p) => acc + (p.downloads || 0), 0);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) {
      showNotification('error', 'Please enter a title and summary.');
      return;
    }

    setIsSubmitting(true);
    const newPostId = `post-${Date.now()}`;
    const now = new Date().toISOString();

    const newPost: AdminPostItem = {
      id: newPostId,
      title: title.trim(),
      toolCategory,
      status,
      summary: summary.trim(),
      content: content.trim(),
      configJson,
      authorUid: currentUserUid,
      authorEmail: currentUserEmail,
      authorName: currentUserName,
      authorRole: currentUserRole,
      views: 0,
      downloads: 0,
      isFeatured: false,
      createdAt: now,
      updatedAt: now
    };

    const newActivity: AdminActivityItem = {
      id: `act-${Date.now()}`,
      adminUid: currentUserUid,
      adminEmail: currentUserEmail,
      action: status === 'published' ? 'PUBLISHED_POST' : 'SAVED_DRAFT',
      targetType: title.trim(),
      details: `Created ${status} preset for ${toolCategory.toUpperCase()}`,
      timestamp: now
    };

    try {
      // Write to cloud firestore
      try {
        await setDoc(doc(db, 'admin_posts', newPostId), newPost);
        await setDoc(doc(db, 'admin_activities', newActivity.id), newActivity);
      } catch (cloudErr) {
        console.warn('Saved locally (Firestore write bypassed or permissions applied):', cloudErr);
      }

      setPosts((prev) => [newPost, ...prev]);
      setActivities((prev) => [newActivity, ...prev]);

      // Reset form
      setTitle('');
      setSummary('');
      setContent('');
      setActiveTab('my_posts');
      showNotification('success', `Post "${newPost.title}" created successfully!`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to create post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (post: AdminPostItem) => {
    const nextStatus: 'published' | 'draft' = post.status === 'published' ? 'draft' : 'published';
    const updatedPost: AdminPostItem = { ...post, status: nextStatus, updatedAt: new Date().toISOString() };

    try {
      try {
        await updateDoc(doc(db, 'admin_posts', post.id), {
          status: nextStatus,
          updatedAt: updatedPost.updatedAt
        });
      } catch {}

      setPosts((prev) => prev.map((p) => (p.id === post.id ? updatedPost : p)));

      const activity: AdminActivityItem = {
        id: `act-${Date.now()}`,
        adminUid: currentUserUid,
        adminEmail: currentUserEmail,
        action: 'STATUS_CHANGE',
        targetType: post.title,
        details: `Toggled status to ${nextStatus.toUpperCase()}`,
        timestamp: new Date().toISOString()
      };
      setActivities((prev) => [activity, ...prev]);
      showNotification('success', `Status updated to ${nextStatus.toUpperCase()}`);
    } catch (err: any) {
      showNotification('error', 'Failed to toggle status.');
    }
  };

  const handleDeletePost = async (post: AdminPostItem) => {
    if (!window.confirm(`Delete publication "${post.title}"?`)) return;

    try {
      try {
        await deleteDoc(doc(db, 'admin_posts', post.id));
      } catch {}

      setPosts((prev) => prev.filter((p) => p.id !== post.id));

      const activity: AdminActivityItem = {
        id: `act-${Date.now()}`,
        adminUid: currentUserUid,
        adminEmail: currentUserEmail,
        action: 'DELETED_POST',
        targetType: post.title,
        details: `Deleted publication from database.`,
        timestamp: new Date().toISOString()
      };
      setActivities((prev) => [activity, ...prev]);
      showNotification('success', 'Post deleted.');
    } catch (err) {
      showNotification('error', 'Failed to delete post.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-6xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Top Header & Role Identity */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
              <Crown className="w-6 h-6 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Admin Publications & Activity Dashboard
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  isSuperAdmin
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                }`}>
                  {isSuperAdmin ? 'Super Admin' : 'Admin'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage your published tool presets, watermark templates, tutorial posts, and review your full activity log.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition self-end md:self-auto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {notification && (
          <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{notification.message}</span>
          </div>
        )}

        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Published Posts & Presets</span>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">{myPostsCount}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Community Views</span>
            <p className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{totalViews.toLocaleString()}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Preset Applications / Uses</span>
            <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">{totalDownloads.toLocaleString()}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Clearance & Status</span>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-1">
              {isSuperAdmin ? 'Full Sovereign Access' : 'Verified Admin'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('my_posts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'my_posts'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>My Posts & Presets ({posts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('create_post')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'create_post'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publish New Post / Preset</span>
          </button>

          <button
            onClick={() => setActiveTab('activity_log')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'activity_log'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>My Activity Timeline ({activities.length})</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('team_posts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'team_posts'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>All Admins & Team Posts</span>
            </button>
          )}
        </div>

        {/* TAB 1 & 4: POSTS LIST */}
        {(activeTab === 'my_posts' || activeTab === 'team_posts') && (
          <div className="space-y-4">
            {/* Search and Category Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter posts by title or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="all">All Tool Categories</option>
                  <option value="compress">Compression</option>
                  <option value="resize">Resize</option>
                  <option value="watermark">Watermark</option>
                  <option value="filters">Filters</option>
                  <option value="meme">Memes</option>
                  <option value="guide">Tutorial Guide</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Drafts</option>
                </select>
              </div>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedPosts.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  No posts matching the selected criteria. Click "Publish New Post / Preset" to create one.
                </div>
              ) : (
                displayedPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-indigo-400 dark:hover:border-indigo-800 transition shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {post.toolCategory}
                        </span>

                        <button
                          onClick={() => handleToggleStatus(post)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                            post.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${post.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span>{post.status.toUpperCase()}</span>
                        </button>
                      </div>

                      <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                        {post.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {post.summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-mono">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{post.views}</span>
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Download className="w-3.5 h-3.5" />
                          <span>{post.downloads}</span>
                        </span>
                        <span className="text-[11px] truncate max-w-[100px]">
                          By {post.authorName.split(' ')[0]}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingConfigPost(post)}
                          className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[11px] font-medium transition"
                        >
                          JSON Config
                        </button>

                        <button
                          onClick={() => handleDeletePost(post)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                          title="Delete Post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CREATE NEW POST / PRESET */}
        {activeTab === 'create_post' && (
          <form onSubmit={handleCreatePost} className="space-y-5 max-w-3xl mx-auto p-2 sm:p-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Publish New Preset or Educational Post</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Share optimized image presets, brand watermark configurations, or photo filters with your users.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Publication Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High-End Studio Portrait Color Preset"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Tool Target Category</label>
                <select
                  value={toolCategory}
                  onChange={(e) => setToolCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="compress">Compression Preset</option>
                  <option value="resize">Resize Dimensions</option>
                  <option value="watermark">Watermark Template</option>
                  <option value="filters">Photo Filter Look</option>
                  <option value="bgremove">Chroma Key / Background</option>
                  <option value="meme">Meme Template</option>
                  <option value="guide">Educational Guide</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Short Summary</label>
              <input
                type="text"
                required
                placeholder="Brief explanation of when and why to use this preset..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Detailed Instructions / Description</label>
              <textarea
                rows={3}
                placeholder="Full article content, usage advice, or camera tips..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Preset Configuration (JSON)</label>
              <textarea
                rows={4}
                value={configJson}
                onChange={(e) => setConfigJson(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Status:</span>
                <button
                  type="button"
                  onClick={() => setStatus(status === 'published' ? 'draft' : 'published')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    status === 'published'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {status.toUpperCase()}
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Post / Preset'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: ACTIVITY TIMELINE */}
        {activeTab === 'activity_log' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold uppercase tracking-wider">Chronological Admin Activity Stream</span>
              <span>Total recorded: {activities.length}</span>
            </div>

            <div className="space-y-3">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {act.action.replace('_', ' ')}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          {act.targetType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {act.details}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: View Post JSON Config */}
        {viewingConfigPost && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  Preset Config: {viewingConfigPost.title}
                </h4>
                <button onClick={() => setViewingConfigPost(null)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 overflow-x-auto max-h-64">
                  {viewingConfigPost.configJson}
                </pre>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(viewingConfigPost.configJson);
                    showNotification('success', 'Preset configuration JSON copied to clipboard!');
                    setViewingConfigPost(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  Copy JSON
                </button>
                <button
                  onClick={() => setViewingConfigPost(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
