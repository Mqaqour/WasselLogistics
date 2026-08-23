import { StageConfig } from './types';

/**
 * Single source of truth for the cinematic scroll story.
 * Each stage owns its copy and a camera keyframe; `WasselScene` interpolates
 * continuously between consecutive keyframes as the user scrolls, and every
 * 3D object fades in/out around the stage index it "belongs" to (see
 * `useFadeGroup`). Edit copy, camera framing, or ordering here only — the
 * scene and overlay components read from this list and need no changes.
 */
export const STAGES: StageConfig[] = [
  {
    id: 'intro',
    index: 0,
    dotLabel: { en: 'Overview', ar: 'نظرة عامة' },
    title: { en: 'Delivering Without Limits', ar: 'توصيل بلا حدود' },
    subtitle: {
      en: 'From documents and parcels to pallets and full cargo shipments, Wassel connects cities, countries, and businesses.',
      ar: 'من المستندات والطرود إلى المنصات النقالة والشحنات الكاملة، واصل يربط المدن والدول والشركات.',
    },
    camera: { position: [0, 1.1, 7.2], lookAt: [0, 0.6, 0] },
  },
  {
    id: 'shipments',
    index: 1,
    dotLabel: { en: 'Shipments', ar: 'الشحنات' },
    title: { en: 'One Logistics Partner for Every Shipment', ar: 'شريك لوجستي واحد لكل شحنة' },
    subtitle: {
      en: 'Documents, parcels, pallets, cargo, and freight—all managed through one connected delivery network.',
      ar: 'مستندات وطرود ومنصات نقالة وبضائع وشحن جوي وبري—كلها تُدار عبر شبكة توصيل واحدة متكاملة.',
    },
    camera: { position: [4.6, 2.3, 8], lookAt: [1, -0.3, 1] },
  },
  {
    id: 'air',
    index: 2,
    dotLabel: { en: 'Air', ar: 'جوي' },
    eyebrow: { en: 'Fast • Global • Reliable', ar: 'سريع • عالمي • موثوق' },
    title: { en: 'International Air Freight', ar: 'الشحن الجوي الدولي' },
    subtitle: {
      en: 'Fast international delivery for urgent documents, parcels, commercial shipments, and air cargo.',
      ar: 'توصيل دولي سريع للمستندات العاجلة والطرود والشحنات التجارية والبضائع الجوية.',
    },
    camera: { position: [7.5, 4.2, 10], lookAt: [4.8, 3.3, 3] },
  },
  {
    id: 'sea',
    index: 3,
    dotLabel: { en: 'Sea', ar: 'بحري' },
    eyebrow: { en: 'Flexible • Scalable • Worldwide', ar: 'مرن • قابل للتوسع • عالمي' },
    title: { en: 'International Sea Freight', ar: 'الشحن البحري الدولي' },
    subtitle: {
      en: 'Cost-effective shipping for pallets, commercial goods, large shipments, and container cargo.',
      ar: 'شحن اقتصادي للمنصات النقالة والبضائع التجارية والشحنات الكبيرة وحاويات البضائع.',
    },
    camera: { position: [-4.6, 2.1, 11], lookAt: [-7, -0.4, 3.5] },
  },
  {
    id: 'cargo',
    index: 4,
    dotLabel: { en: 'Cargo', ar: 'البضائع' },
    title: { en: 'Pallet and Cargo Solutions', ar: 'حلول المنصات النقالة والبضائع' },
    subtitle: {
      en: 'Professional handling for heavy, oversized, commercial, and high-volume shipments.',
      ar: 'معالجة احترافية للشحنات الثقيلة والكبيرة الحجم والتجارية وعالية الكمية.',
    },
    camera: { position: [4.8, 3.2, -0.5], lookAt: [1.7, 0.1, -7] },
  },
  {
    id: 'trucking',
    index: 5,
    dotLabel: { en: 'Trucking', ar: 'النقل البري' },
    eyebrow: { en: 'Pickup • Transportation • Final Delivery', ar: 'استلام • نقل • توصيل نهائي' },
    title: { en: 'Freight and Trucking Services', ar: 'خدمات الشحن والنقل البري' },
    subtitle: {
      en: 'Reliable road transportation connecting warehouses, ports, airports, businesses, and final destinations.',
      ar: 'نقل بري موثوق يربط المستودعات والموانئ والمطارات والشركات ووجهات التسليم النهائية.',
    },
    camera: { position: [-1.5, 2.4, -3.4], lookAt: [-9, 0.2, -3.5] },
  },
  {
    id: 'domestic',
    index: 6,
    dotLabel: { en: 'Domestic', ar: 'محلي' },
    title: { en: 'Domestic Delivery Between Cities', ar: 'التوصيل المحلي بين المدن' },
    subtitle: {
      en: 'Fast and reliable delivery for documents, parcels, business orders, and local shipments.',
      ar: 'توصيل سريع وموثوق للمستندات والطرود وطلبات الأعمال والشحنات المحلية.',
    },
    journey: [
      { en: 'Pickup', ar: 'الاستلام' },
      { en: 'Sorting Hub', ar: 'مركز الفرز' },
      { en: 'Destination City', ar: 'مدينة الوجهة' },
      { en: 'Final Delivery', ar: 'التسليم النهائي' },
    ],
    camera: { position: [3.4, 6.6, 9.5], lookAt: [0, 0, 2.5] },
  },
  {
    id: 'network',
    index: 7,
    dotLabel: { en: 'Complete Network', ar: 'الشبكة الكاملة' },
    title: { en: 'Everything You Need to Move, Delivered by Wassel', ar: 'كل ما تحتاج لنقله، توصله واصل' },
    subtitle: {
      en: 'International shipping, domestic delivery, air freight, sea freight, trucking, parcels, pallets, documents, and cargo—all in one system.',
      ar: 'الشحن الدولي والتوصيل المحلي والشحن الجوي والبحري والنقل البري والطرود والمنصات النقالة والمستندات والبضائع—كلها في نظام واحد.',
    },
    camera: { position: [0, 7.4, 15.5], lookAt: [0, 0, 0] },
  },
];

export const STAGE_COUNT = STAGES.length;

/** Clamp + resolve the stage a given continuous scroll-progress (0..1) currently sits in. */
export function stageIndexForProgress(progress: number): number {
  const stageProgress = Math.min(Math.max(progress, 0), 1) * (STAGE_COUNT - 1);
  return Math.min(Math.round(stageProgress), STAGE_COUNT - 1);
}
