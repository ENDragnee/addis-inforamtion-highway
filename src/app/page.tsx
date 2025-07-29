import FinSearch from "@/components/FinSearch";

export default function HomePage() {
  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      padding: '2rem',
      backgroundColor: '#f0f2f5',
    }}>
      <div style={{
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>eSignet Data Fetch</h1>
        <FinSearch />
      </div>
    </main>
  );
}
