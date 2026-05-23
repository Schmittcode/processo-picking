export const metadata = {
  title: 'Kyly Picking',
  description: 'Sistema de Picking - Grupo Kyly',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#1a1a1a' }}>
        {children}
      </body>
    </html>
  );
}
