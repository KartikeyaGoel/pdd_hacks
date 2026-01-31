import Sidebar from '@/components/Sidebar';
import VoiceInterface from '@/components/VoiceInterface';

/**
 * Main Page
 * 
 * The primary conversation interface where users interact
 * with the AI learning coach via voice or text.
 */
export default function HomePage() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 ml-20">
        <VoiceInterface />
      </main>
    </div>
  );
}
