/**
 * Tests for POST /api/webhook/tool-execution
 */

import { POST } from '@/app/api/webhook/tool-execution/route';
import { NextRequest } from 'next/server';

// Mock global fetch
global.fetch = jest.fn();

describe('POST /api/webhook/tool-execution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ELEVENLABS_API_KEY = 'test-api-key';
  });

  it('should return 400 for missing tool_name', async () => {
    const payload = {
      parameters: {},
    };

    const request = new NextRequest('http://localhost:3000/api/webhook/tool-execution', {
      method: 'POST',
      headers: { 'x-api-key': 'test-api-key' },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should return 400 for unknown tool', async () => {
    const payload = {
      tool_name: 'unknown_tool',
      parameters: {},
    };

    const request = new NextRequest('http://localhost:3000/api/webhook/tool-execution', {
      method: 'POST',
      headers: { 'x-api-key': 'test-api-key' },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should route rtrvr_search to rtrvr.ai API', async () => {
    process.env.RTRVR_API_KEY = 'rtrvr-key';
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          { title: 'Result 1', summary: 'Summary 1', url: 'https://example.com' },
        ],
      }),
    });

    const payload = {
      tool_name: 'rtrvr_search',
      parameters: { query: 'latest AI research' },
    };

    const request = new NextRequest('http://localhost:3000/api/webhook/tool-execution', {
      method: 'POST',
      headers: { 'x-api-key': 'test-api-key' },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.result).toHaveProperty('results');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.rtrvr.ai/v1/search',
      expect.any(Object)
    );
  });

  it('should return mock response when RTRVR_API_KEY not configured', async () => {
    delete process.env.RTRVR_API_KEY;

    const payload = {
      tool_name: 'rtrvr_search',
      parameters: { query: 'test query' },
    };

    const request = new NextRequest('http://localhost:3000/api/webhook/tool-execution', {
      method: 'POST',
      headers: { 'x-api-key': 'test-api-key' },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.result.source).toBe('mock');
  });

  it('should route toolhouse_reminder to Toolhouse API', async () => {
    process.env.TOOLHOUSE_API_KEY = 'toolhouse-key';
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'reminder-123',
        content: 'Study physics',
      }),
    });

    const payload = {
      tool_name: 'toolhouse_reminder',
      parameters: { content: 'Study physics', time: 'tomorrow' },
    };

    const request = new NextRequest('http://localhost:3000/api/webhook/tool-execution', {
      method: 'POST',
      headers: { 'x-api-key': 'test-api-key' },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.result.success).toBe(true);
  });

  it('should return mock response when TOOLHOUSE_API_KEY not configured', async () => {
    delete process.env.TOOLHOUSE_API_KEY;

    const payload = {
      tool_name: 'toolhouse_reminder',
      parameters: { content: 'Test reminder' },
    };

    const request = new NextRequest('http://localhost:3000/api/webhook/tool-execution', {
      method: 'POST',
      headers: { 'x-api-key': 'test-api-key' },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.result.source).toBe('mock');
  });

  it('should route toolhouse_calendar to Toolhouse API', async () => {
    process.env.TOOLHOUSE_API_KEY = 'toolhouse-key';
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        events: [
          { title: 'Meeting', time: '10:00 AM' },
        ],
      }),
    });

    const payload = {
      tool_name: 'toolhouse_calendar',
      parameters: { date: 'today' },
    };

    const request = new NextRequest('http://localhost:3000/api/webhook/tool-execution', {
      method: 'POST',
      headers: { 'x-api-key': 'test-api-key' },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.result.success).toBe(true);
  });

  it('should handle web_search alias for rtrvr_search', async () => {
    delete process.env.RTRVR_API_KEY;

    const payload = {
      tool_name: 'web_search',
      parameters: { query: 'test' },
    };

    const request = new NextRequest('http://localhost:3000/api/webhook/tool-execution', {
      method: 'POST',
      headers: { 'x-api-key': 'test-api-key' },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.result).toHaveProperty('results');
  });

  it('should handle set_reminder alias for toolhouse_reminder', async () => {
    delete process.env.TOOLHOUSE_API_KEY;

    const payload = {
      tool_name: 'set_reminder',
      parameters: { content: 'Test' },
    };

    const request = new NextRequest('http://localhost:3000/api/webhook/tool-execution', {
      method: 'POST',
      headers: { 'x-api-key': 'test-api-key' },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.result).toHaveProperty('reminder');
  });
});
