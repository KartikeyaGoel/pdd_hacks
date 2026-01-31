import { NextRequest, NextResponse } from 'next/server';
import type { ToolExecutionRequest, ToolExecutionResponse } from '@/lib/types';

/**
 * POST /api/webhook/tool-execution
 * 
 * Proxies tool execution requests from ElevenLabs to external services:
 * - rtrvr.ai for web scraping
 * - Toolhouse.ai for calendar, reminders, etc.
 */
export async function POST(request: NextRequest) {
  try {
    // Validate webhook (in production, verify signature)
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.WEBHOOK_SECRET || process.env.ELEVENLABS_API_KEY;
    
    if (apiKey !== expectedKey) {
      console.warn('Invalid webhook signature');
      // In production, return 401. For development, continue.
    }

    // Parse request
    const body: ToolExecutionRequest = await request.json();
    const { tool_name, parameters } = body;

    if (!tool_name) {
      return NextResponse.json(
        { error: 'Missing tool_name' },
        { status: 400 }
      );
    }

    console.log(`Tool execution: ${tool_name}`, parameters);

    let result: Record<string, unknown>;

    // Route to appropriate service based on tool name
    switch (tool_name) {
      case 'rtrvr_search':
      case 'web_search':
        result = await executeRtrvrSearch(parameters as { query: string });
        break;

      case 'toolhouse_reminder':
      case 'set_reminder':
        result = await executeToolhouseReminder(parameters as { 
          content: string; 
          time?: string;
        });
        break;

      case 'toolhouse_calendar':
      case 'check_calendar':
        result = await executeToolhouseCalendar(parameters as {
          date?: string;
        });
        break;

      default:
        console.warn(`Unknown tool: ${tool_name}`);
        return NextResponse.json(
          { error: `Unknown tool: ${tool_name}` },
          { status: 400 }
        );
    }

    const response: ToolExecutionResponse = {
      result,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Tool execution error:', error);
    
    const response: ToolExecutionResponse = {
      result: {},
      error: error instanceof Error ? error.message : 'Tool execution failed',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * Execute rtrvr.ai web search
 */
async function executeRtrvrSearch(params: { query: string }): Promise<Record<string, unknown>> {
  const rtrvrApiKey = process.env.RTRVR_API_KEY;

  if (!rtrvrApiKey) {
    console.warn('RTRVR_API_KEY not configured, returning mock response');
    return {
      results: [
        {
          title: `Search results for: ${params.query}`,
          summary: 'This is a placeholder result. Configure RTRVR_API_KEY for real web search.',
          url: 'https://example.com',
        },
      ],
      source: 'mock',
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch('https://api.rtrvr.ai/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${rtrvrApiKey}`,
      },
      body: JSON.stringify({
        query: params.query,
        max_results: 5,
        include_content: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`rtrvr.ai error: ${response.status}`);
    }

    const data = await response.json();
    return {
      results: data.results || [],
      source: 'rtrvr',
    };
  } catch (error) {
    console.error('rtrvr.ai search error:', error);
    return {
      results: [],
      error: 'Web search failed',
      source: 'rtrvr',
    };
  }
}

/**
 * Execute Toolhouse reminder
 */
async function executeToolhouseReminder(params: {
  content: string;
  time?: string;
}): Promise<Record<string, unknown>> {
  const toolhouseApiKey = process.env.TOOLHOUSE_API_KEY;

  if (!toolhouseApiKey) {
    console.warn('TOOLHOUSE_API_KEY not configured, returning mock response');
    return {
      success: true,
      reminder: {
        content: params.content,
        time: params.time || 'tomorrow',
        id: `mock-${Date.now()}`,
      },
      message: 'Reminder set (mock - configure TOOLHOUSE_API_KEY for real reminders)',
      source: 'mock',
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('https://api.toolhouse.ai/v1/reminders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${toolhouseApiKey}`,
      },
      body: JSON.stringify({
        content: params.content,
        scheduled_time: params.time,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Toolhouse error: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      reminder: data,
      message: 'Reminder set successfully',
      source: 'toolhouse',
    };
  } catch (error) {
    console.error('Toolhouse reminder error:', error);
    return {
      success: false,
      error: 'Failed to set reminder',
      source: 'toolhouse',
    };
  }
}

/**
 * Execute Toolhouse calendar check
 */
async function executeToolhouseCalendar(params: {
  date?: string;
}): Promise<Record<string, unknown>> {
  const toolhouseApiKey = process.env.TOOLHOUSE_API_KEY;

  if (!toolhouseApiKey) {
    console.warn('TOOLHOUSE_API_KEY not configured, returning mock response');
    return {
      success: true,
      events: [
        {
          title: 'Sample Event',
          time: '10:00 AM',
          date: params.date || 'today',
        },
      ],
      message: 'Calendar checked (mock - configure TOOLHOUSE_API_KEY for real calendar)',
      source: 'mock',
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('https://api.toolhouse.ai/v1/calendar/events', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${toolhouseApiKey}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Toolhouse error: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      events: data.events || [],
      source: 'toolhouse',
    };
  } catch (error) {
    console.error('Toolhouse calendar error:', error);
    return {
      success: false,
      events: [],
      error: 'Failed to check calendar',
      source: 'toolhouse',
    };
  }
}
