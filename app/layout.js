export const metadata = {
  title: 'Kyly Picking',
  description: 'Sistema de Picking - Grupo Kyly',
  manifest: '/manifest.json',
  themeColor: '#00c3ff',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kyly Picking',
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00c3ff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Kyly Picking" />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#1a1a1a' }}>
        {children}
      </body>
    </html>
  );
}
