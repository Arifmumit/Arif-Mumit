export interface AdminPostItem {
  id: string;
  title: string;
  toolCategory: 'compress' | 'resize' | 'watermark' | 'filters' | 'bgremove' | 'meme' | 'guide';
  status: 'published' | 'draft';
  summary: string;
  content: string;
  configJson: string;
  authorUid: string;
  authorEmail: string;
  authorName: string;
  authorRole: string;
  views: number;
  downloads: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminActivityItem {
  id: string;
  adminUid: string;
  adminEmail: string;
  action: string;
  targetType: string;
  details: string;
  timestamp: string;
}

export const INITIAL_ADMIN_POSTS: AdminPostItem[] = [
  {
    id: 'post-1',
    title: 'E-Commerce Ultra-WebP 80% Compression Preset',
    toolCategory: 'compress',
    status: 'published',
    summary: 'Optimized for high-speed online shopping storefronts. Yields average 72% file size reduction without perceptible JPEG artifacting.',
    content: 'Recommended baseline preset for product catalogs. Converts inputs to WebP format at 80% quality ratio with white background fallback.',
    configJson: JSON.stringify({ quality: 80, format: 'image/webp' }, null, 2),
    authorUid: 'super_admin_boot',
    authorEmail: 'arifmumit1987@gmail.com',
    authorName: 'Arif Mumit (Super Admin)',
    authorRole: 'super_admin',
    views: 1420,
    downloads: 388,
    isFeatured: true,
    createdAt: '2026-10-29T03:00:00.000Z',
    updatedAt: '2026-10-29T03:30:00.000Z'
  },
  {
    id: 'post-2',
    title: 'Official Corporate Copyright & Confidentiality Watermark',
    toolCategory: 'watermark',
    status: 'published',
    summary: 'Standardized 45° diagonal repeating tiled watermark for internal proprietary diagrams, confidential proofs, and contracts.',
    content: 'Uses high-legibility bold typography with 65% opacity and drop-shadow protection that cannot be easily cropped out.',
    configJson: JSON.stringify({
      type: 'text',
      text: 'CONFIDENTIAL © 2026 PIXELFORGE',
      fontFamily: 'Plus Jakarta Sans',
      fontSize: 32,
      color: '#ffffff',
      opacity: 0.65,
      rotation: -30,
      position: 'tiled'
    }, null, 2),
    authorUid: 'super_admin_boot',
    authorEmail: 'arifmumit1987@gmail.com',
    authorName: 'Arif Mumit (Super Admin)',
    authorRole: 'super_admin',
    views: 890,
    downloads: 215,
    isFeatured: true,
    createdAt: '2026-10-29T03:15:00.000Z',
    updatedAt: '2026-10-29T03:15:00.000Z'
  },
  {
    id: 'post-3',
    title: 'Cinematic Golden Hour & Contrast Color Preset',
    toolCategory: 'filters',
    status: 'published',
    summary: 'Warm amber tones, enhanced dynamic range, and slight micro-contrast boost for outdoor landscape and lifestyle photography.',
    content: 'Balances +15 warmth, +20 contrast, and +10 saturation for rich cinematic warmth without skin tone clipping.',
    configJson: JSON.stringify({
      brightness: 5,
      contrast: 20,
      saturation: 15,
      warmth: 25,
      blur: 0,
      preset: 'cinematic'
    }, null, 2),
    authorUid: 'super_admin_boot',
    authorEmail: 'arifmumit1987@gmail.com',
    authorName: 'Arif Mumit (Super Admin)',
    authorRole: 'super_admin',
    views: 654,
    downloads: 140,
    isFeatured: false,
    createdAt: '2026-10-29T03:40:00.000Z',
    updatedAt: '2026-10-29T03:40:00.000Z'
  },
  {
    id: 'post-4',
    title: 'Instagram & TikTok Full-Screen 9:16 Social Pack',
    toolCategory: 'resize',
    status: 'published',
    summary: 'Exact 1080x1920 dimension preset with smart center cover crop for Reels and Stories.',
    content: 'Crops and resizes any source orientation into vertical 9:16 aspect ratio while maintaining focal point clarity.',
    configJson: JSON.stringify({
      mode: 'preset',
      width: 1080,
      height: 1920,
      fit: 'cover',
      maintainAspectRatio: true
    }, null, 2),
    authorUid: 'super_admin_boot',
    authorEmail: 'arifmumit1987@gmail.com',
    authorName: 'Arif Mumit (Super Admin)',
    authorRole: 'super_admin',
    views: 1120,
    downloads: 412,
    isFeatured: true,
    createdAt: '2026-10-29T04:00:00.000Z',
    updatedAt: '2026-10-29T04:10:00.000Z'
  }
];

export const INITIAL_ADMIN_ACTIVITIES: AdminActivityItem[] = [
  {
    id: 'act-1',
    adminUid: 'super_admin_boot',
    adminEmail: 'arifmumit1987@gmail.com',
    action: 'PUBLISHED_POST',
    targetType: 'E-Commerce Ultra-WebP 80% Compression Preset',
    details: 'Created and published public compression preset with 80% quality target.',
    timestamp: '2026-10-29T03:30:00.000Z'
  },
  {
    id: 'act-2',
    adminUid: 'super_admin_boot',
    adminEmail: 'arifmumit1987@gmail.com',
    action: 'PUBLISHED_POST',
    targetType: 'Official Corporate Copyright Watermark',
    details: 'Configured tiled diagonal text watermark template.',
    timestamp: '2026-10-29T03:15:00.000Z'
  },
  {
    id: 'act-3',
    adminUid: 'super_admin_boot',
    adminEmail: 'arifmumit1987@gmail.com',
    action: 'SYSTEM_BACKUP',
    targetType: 'Full Codebase & Config Archive',
    details: 'Created date-stamped backup archive and Git checkpoint tag.',
    timestamp: '2026-10-29T03:45:00.000Z'
  }
];
