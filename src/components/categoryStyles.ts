import type { KnowledgeCategory } from '../types';

type CategoryStyle = { label: string; tab: string; badgeBg: string; badgeText: string };

export const CATEGORY_STYLES: Record<KnowledgeCategory, CategoryStyle> = {
  HAZARD: { label: 'Hazard', tab: '#c2540a', badgeBg: '#fbe8db', badgeText: '#8a3c07' },
  GATE_CODE: { label: 'Gate Code', tab: '#1e3a5f', badgeBg: '#dfe7ef', badgeText: '#1e3a5f' },
  PARKING: { label: 'Parking', tab: '#5c7a5e', badgeBg: '#e3ebe3', badgeText: '#425c44' },
  CONTACT: { label: 'Contact', tab: '#6b5b95', badgeBg: '#e8e4f0', badgeText: '#4d4169' },
  ACCESS: { label: 'Access', tab: '#a8763e', badgeBg: '#f0e5d5', badgeText: '#785527' },
  OTHER: { label: 'Other', tab: '#6b6558', badgeBg: '#ebe8e0', badgeText: '#524d42' },
};
