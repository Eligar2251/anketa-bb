import './globals.css';

export const metadata = {
  title: 'Досье Персонажа',
  description: 'Интерактивная анкета персонажа',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}