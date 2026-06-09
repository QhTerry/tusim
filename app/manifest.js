export default function manifest() {
  return {
    name: "tusi'm — фото с мероприятия",
    short_name: "tusi'm",
    description: 'Краудсорсинг фото на твоём мероприятии: QR, общий альбом, голосование.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0d',
    theme_color: '#0a0a0d',
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
    ],
  }
}
