import localFont from 'next/font/local';

export const baticaSans = localFont({
  src: '../../public/fonts/BaticaSans-Regular.ttf',
  weight: '400',
  style: 'normal',
  variable: '--font-batica-sans',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});
