'use client'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/components/ui/NotificationSystem'
import { useState, useEffect, useCallback } from 'react'

interface ChatMessage {
  id: string
  content: string
  created_at: string
  user_id: string
  user_profiles: {
    id: string
    full_name: string
    profile_image_url: string | null
  } | null
  [key: string]: unknown
}

interface RawChatMessage {
  id: string
  content: string
  created_at: string
  user_id: string
  user_profiles: Array<{
    id: string
    full_name: string
    profile_image_url: string | null
  }> | {
    id: string
    full_name: string
    profile_image_url: string | null
  } | null
}

export default function TestChatPage() {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotifications()
  const [testMessage, setTestMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTestData = useCallback(async () => {
    setLoading(true)
    try {
      console.log('Testing database connection...')
      
      // Test 1: Check if user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      console.log('User profile:', profile, 'Error:', profileError)

      // Test 2: Fetch chat messages
      const { data: chatData, error: chatError } = await supabase
        .from('chat_messages')
        .select('*')
        .limit(5)

      console.log('Chat messages:', chatData, 'Error:', chatError)

      // Test 3: Try join query
      const { data: joinData, error: joinError } = await supabase
        .from('chat_messages')
        .select(`
          id,
          content,
          created_at,
          user_id,
          user_profiles!inner (
            id,
            full_name,
            profile_image_url
          )
        `)
        .limit(5)

      console.log('Join query result:', joinData, 'Error:', joinError)

      // Transform the data to match our interface
      const transformedMessages = (joinData || []).map((msg: RawChatMessage) => ({
        ...msg,
        user_profiles: Array.isArray(msg.user_profiles) 
          ? msg.user_profiles[0] || null 
          : msg.user_profiles
      }))

      setMessages(transformedMessages)

    } catch (error) {
      console.error('Test error:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user) {
      fetchTestData()
    }
  }, [user, fetchTestData])

  const sendTestMessage = async () => {
    if (!testMessage.trim() || !user) return

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          content: testMessage,
          user_id: user.id
        })
        .select()

      if (error) {
        console.error('Error sending message:', error)
        showError('Send Failed', 'Error: ' + JSON.stringify(error))
      } else {
        console.log('Message sent successfully:', data)
        showSuccess('Message Sent', 'Message sent successfully')
        setTestMessage('')
        fetchTestData() // Refresh
      }
    } catch (error) {
      console.error('Send error:', error)
      showError('Send Failed', 'Error: ' + error)
    }
  }

  if (!user) {
    return <div className="p-8">Please log in to test chat</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Chat System Test</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Send Test Message</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter test message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={sendTestMessage}
            disabled={!testMessage.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Messages</h2>
          <button
            onClick={fetchTestData}
            disabled={loading}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        {messages.length === 0 ? (
          <p className="text-gray-500">No messages found</p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium">
                  {msg.user_profiles?.full_name || 'Unknown User'} 
                  <span className="text-sm text-gray-500 ml-2">
                    ({msg.user_id})
                  </span>
                </div>
                <div className="mt-2">{msg.content}</div>
                <div className="text-xs text-gray-400 mt-2">
                  {new Date(msg.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Debug Info</h3>
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>User Email:</strong> {user.email}</p>
        <p><strong>Messages Count:</strong> {messages.length}</p>
      </div>
    </div>
  )
}
