import api from './api';

const CLOUDFLARE_ACCOUNT_ID = '5e1681032cba41a5c9c346162669f996';
const CLOUDFLARE_API_TOKEN = 'LUPQxSWOGCT-fO4sQoTHzYvDkbg1p_ONVtrl8Jjp';

export const subtitleService = {
  uploadSubtitle: async (videoUid, file, languageTag) => {
    if (!videoUid) throw new Error('Video UID is required');
    if (!file) throw new Error('Subtitle file is required');
    if (!languageTag) throw new Error('Language tag is required');

    const formData = new FormData();
    formData.append('file', file);

    const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${videoUid}/captions/${languageTag}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'Failed to upload subtitle');
    }

    return data.result;
  },

  generateSubtitle: async (videoUid, languageTag) => {
    if (!videoUid) throw new Error('Video UID is required');
    if (!languageTag) throw new Error('Language tag is required');

    const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${videoUid}/captions/${languageTag}/generate`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'Failed to generate subtitle');
    }

    return data.result;
  },

  getSubtitles: async (videoUid) => {
    if (!videoUid) throw new Error('Video UID is required');

    const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${videoUid}/captions`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'Failed to get subtitles');
    }

    return data.result || [];
  },

  getSubtitleFile: async (videoUid, languageTag) => {
    if (!videoUid) throw new Error('Video UID is required');
    if (!languageTag) throw new Error('Language tag is required');

    const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${videoUid}/captions/${languageTag}/vtt`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get subtitle file');
    }

    return await response.text();
  },

  deleteSubtitle: async (videoUid, languageTag) => {
    if (!videoUid) throw new Error('Video UID is required');
    if (!languageTag) throw new Error('Language tag is required');

    const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${videoUid}/captions/${languageTag}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'Failed to delete subtitle');
    }

    return data.result;
  },

  getSubtitleUrl: (videoUid, languageTag) => {
    return `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${videoUid}/captions/${languageTag}/vtt`;
  },
};

export const LANGUAGE_CODES = {
  'vi': 'Tiếng Việt',
  'en': 'English',
  'zh': 'Chinese',
  'hi': 'Hindi',
  'es': 'Spanish',
  'ar': 'Arabic',
  'pt': 'Portuguese',
  'bn': 'Bengali',
  'ru': 'Russian',
  'ja': 'Japanese',
  'de': 'German',
  'ko': 'Korean',
  'fr': 'French',
  'it': 'Italian',
  'tr': 'Turkish',
  'th': 'Thai',
  'pl': 'Polish',
  'uk': 'Ukrainian',
  'cs': 'Czech',
  'nl': 'Dutch',
};

export const AI_SUPPORTED_LANGUAGES = [
  'cs', 'nl', 'en', 'fr', 'de', 'it', 'ja', 'ko', 'pl', 'pt', 'ru', 'es'
];
