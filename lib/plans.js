// Единый источник правды по тарифам tusi'm. Используется и на клиенте (лендинг,
// создание события), и на сервере (create-event, enforce лимитов/фич).
// Числа зафиксированы с основателем.

export const PLANS = [
  {
    id: 'free', name: 'Пробный', price: 0,
    guests: 3, photos: 1, durationHours: 3, storageDays: 7,
    watermark: true,
    features: { zip:false, leaderboard:false, stats:false, moderation:false, live:false, cover:false },
    blurb: ['Галерея события', 'С watermark tusi\'m'],
  },
  {
    id: 'mini', name: 'Тусовка', price: 299,
    guests: 5, photos: 5, durationHours: 6, storageDays: 30,
    watermark: false,
    features: { zip:true, leaderboard:true, stats:false, moderation:false, live:false, cover:false },
    blurb: ['Без watermark', 'Скачать ZIP', 'Фото вечера'],
  },
  {
    id: 'standard', name: 'Стандарт', price: 690, popular: true,
    guests: 15, photos: 10, durationHours: 12, storageDays: 60,
    watermark: false,
    features: { zip:true, leaderboard:true, stats:true, moderation:true, live:false, cover:false },
    blurb: ['Всё из «Тусовки»', 'Статистика', 'Модерация'],
  },
  {
    id: 'max', name: 'Вечеринка', price: 1790,
    guests: 30, photos: 15, durationHours: 24, storageDays: 90,
    watermark: false,
    features: { zip:true, leaderboard:true, stats:true, moderation:true, live:true, cover:true },
    blurb: ['Всё из «Стандарта»', 'Слайдшоу на экран', 'Обложка события'],
  },
  {
    id: 'ultra', name: 'Свадьба / Корп', price: 6990,
    guests: 250, photos: 20, durationHours: 48, storageDays: 180,
    watermark: false,
    features: { zip:true, leaderboard:true, stats:true, moderation:true, live:true, cover:true },
    blurb: ['Всё включено', 'До 250 гостей', 'Хранение 180 дней'],
  },
]

export const PLAN_MAP = Object.fromEntries(PLANS.map(p => [p.id, p]))

export function getPlan(id) { return PLAN_MAP[id] || PLAN_MAP.free }
export function planHas(id, feature) { return !!getPlan(id).features[feature] }

// «Сборный» тариф — авто-цена по настройкам. Прозрачная формула, минимум 490 ₽.
// Гости/фото/часы дают базу, премиум-фичи добавляют сверху. zip и лидерборд включены.
export const CUSTOM_LIMITS = { guests:[3,300], photos:[1,50], hours:[1,72] }
export function computeCustomPrice({ guests=3, photos=1, hours=3, features={} }) {
  let p = guests * 15 + photos * 12 + hours * 8
  if (features.stats)      p += 200
  if (features.moderation) p += 300
  if (features.live)       p += 600
  if (features.cover)      p += 400
  return Math.max(490, Math.round(p / 10) * 10)
}
