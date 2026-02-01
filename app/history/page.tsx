import Sidebar from '@/components/Sidebar';
import ConversationList from '@/components/ConversationList';

/**
 * History Page
 * 
 * Displays conversation history with ability to:
 * - View past conversation summaries
 * - Continue previous conversations
 * - Delete conversations
 */
export default function HistoryPage() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 ml-20 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Learning <span className="text-gradient">History</span>
            </h1>
            <p className="text-text-secondary">
              Review your past learning sessions and continue where you left off.
            </p>
          </div>

          {/* Conversation List */}
          <ConversationList />
        </div>
      </main>
    </div>
  );
}
