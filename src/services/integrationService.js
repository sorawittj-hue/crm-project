// Service to handle secure server-side integration notifications
import { supabase } from '../utils/supabase';

/**
 * Dispatches an event notification to the Vercel serverless integration API proxy.
 * This runs securely on the server-side to prevent exposing API tokens to the client
 * and to avoid CORS blocks when calling third-party services.
 * 
 * @param {string} eventType - The type of event (e.g. 'DEAL_WON', 'DEAL_CREATED')
 * @param {object} data - Payload data for the event message
 */
export async function dispatchNotification(eventType, data) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/integrations', {
      method: 'POST',
      headers,
      body: JSON.stringify({ eventType, data }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to dispatch integration on server');
    }
    
    console.log(`[Integration] Successfully dispatched event ${eventType} to server API`);
  } catch (error) {
    console.error('[Integration] Server Dispatch Error:', error.message);
  }
}
