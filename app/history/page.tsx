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
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 ml-20 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Learning History
            </h1>
            <p className="text-gray-600">
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
