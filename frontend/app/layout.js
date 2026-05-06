import './globals.css'
import { Sidebar } from '../components/Sidebar'

export const metadata = {
  title: 'WhatsApp Manager',
  description: 'Gérez vos groupes WhatsApp facilement',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ display: 'flex', minHeight: '100vh', background: '#0f1117' }}>
        <Sidebar />
        <main
          style={{
            marginLeft: 240,
            flex: 1,
            padding: '32px 36px',
            minHeight: '100vh',
            maxWidth: 'calc(100vw - 240px)',
            overflowX: 'hidden',
          }}
        >
          {children}
        </main>
      </body>
    </html>
  )
}
