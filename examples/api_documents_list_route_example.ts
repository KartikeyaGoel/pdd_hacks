/**
 * Client-side usage example for the Documents API Route.
 * 
 * This example demonstrates how to fetch data from the GET /api/documents endpoint
 * using the fetch API within a React component. It handles query parameters for
 * filtering, sorting, and pagination.
 * 
 * Assumptions:
 * - The route handler code is located at `app/api/documents/route.ts`
 * - This component is used within a Next.js application where the user is authenticated.
 */

import React, { useState, useEffect } from 'react';

interface Document {
  id: string;
  name: string;
  category: string;
  uploadedAt: string;
  fileSize: number;
  mimeType: string;
}

interface DocumentsResponse {
  documents: Document[];
  total: number;
  limit: number;
  offset: number;
}

export default function DocumentList() {
  const [data, setData] = useState<DocumentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and Sort State
  const [category, setCategory] = useState<string>('');
  const [sort, setSort] = useState<string>('date');
  const [order, setOrder] = useState<string>('desc');
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      setError(null);

      try {
        // Construct query parameters
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        params.append('sort', sort);
        params.append('order', order);
        params.append('limit', limit.toString());
        params.append('offset', ((page - 1) * limit).toString());

        // Call the API route
        const response = await fetch(`/api/documents?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("You must be logged in to view documents.");
          }
          throw new Error(`Error: ${response.statusText}`);
        }

        const result: DocumentsResponse = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [category, sort, order, page]); // Re-fetch when these dependencies change

  if (loading) return <div>Loading documents...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">My Documents</h1>

      {/* Controls */}
      <div className="flex gap-4 mb-6 p-4 bg-gray-100 rounded">
        <select 
          value={category} 
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="p-2 border rounded"
        >
          <option value="">All Categories</option>
          <option value="invoices">Invoices</option>
          <option value="contracts">Contracts</option>
          <option value="reports">Reports</option>
        </select>

        <select 
          value={sort} 
          onChange={(e) => setSort(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="date">Sort by Date</option>
          <option value="name">Sort by Name</option>
          <option value="size">Sort by Size</option>
        </select>

        <button 
          onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
          className="p-2 border rounded bg-white"
        >
          {order === 'asc' ? '↑ Ascending' : '↓ Descending'}
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {data?.documents.length === 0 ? (
          <p>No documents found.</p>
        ) : (
          data?.documents.map((doc) => (
            <div key={doc.id} className="border p-4 rounded shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{doc.name}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(doc.uploadedAt).toLocaleDateString()} • {(doc.fileSize / 1024).toFixed(2)} KB
                </p>
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                  {doc.category}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-between items-center">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Previous
        </button>
        <span>Page {page} of {Math.ceil((data?.total || 0) / limit)}</span>
        <button
          disabled={!data || (page * limit) >= data.total}
          onClick={() => setPage(p => p + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Next
        </button>
      </div>
    </div>
  );
}