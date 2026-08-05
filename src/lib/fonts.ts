import localFont from 'next/font/local';
import { Manrope } from 'next/font/google';

export const baticaSans = localFont({
  src: '../../public/fonts/BaticaSans-Regular.ttf',
  weight: '400',
  style: 'normal',
  variable: '--font-batica-sans',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});

export const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-portal',
  display: 'swap',
});
