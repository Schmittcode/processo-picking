export const metadata = {
  title: 'Kyly Picking',
  description: 'Sistema de Picking - Grupo Kyly',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#00c3ff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Kyly Picking" />
        <link rel="manifest" href="/manifest.json" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { 
            width: 100%; 
            height: 100%; 
            overflow: hidden;
            background-color: #00c3ff;
          }
          #__next { height: 100%; }
        `}</style>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
