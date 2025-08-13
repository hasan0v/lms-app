'use client'

import DashboardLayout from '@/components/DashboardLayout'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/components/ui/NotificationSystem'
import { supabase } from '@/lib/supabase'
import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RealtimeChannel } from '@supabase/supabase-js'
import { MessageCircle, Users } from 'lucide-react'

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
}

interface OnlineUser {
  id: string
  full_name: string
  profile_image_url: string | null
  last_seen: string
}

export default function ChatPage() {
  const { user } = useAuth()
  const { showError } = useNotifications()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connectionMode, setConnectionMode] = useState<'realtime' | 'polling' | 'disconnected'>('disconnected')
  const [newMessage, setNewMessage] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'reconnecting' | 'failed'>('disconnected')
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [networkOnline, setNetworkOnline] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  // Single controller interval for polling/presence refresh
  const controllerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastHeartbeatRef = useRef<number>(Date.now())
  // Avoid early hook dependency on functions by using a ref indirection
  const reconnectChatFnRef = useRef<null | (() => void | Promise<void>)>(null)

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setNetworkOnline(true)
      console.log('Network connection restored')
      if (connectionStatus === 'disconnected') {
        reconnectChatFnRef.current?.()
      }
    }
    
    const handleOffline = () => {
      setNetworkOnline(false)
      setConnectionStatus('disconnected')
      console.log('Network connection lost')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [connectionStatus])

  // Optimize scroll performance
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Enhanced presence update with connection status and retry logic
  const updateUserPresence = useCallback(async (retryCount = 0) => {
    if (!user || !networkOnline) return

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', user.id)

      if (!error) {
        lastHeartbeatRef.current = Date.now()
        if (connectionStatus !== 'connected') {
          setConnectionStatus('connected')
        }
        setReconnectAttempts(0)
      } else {
        throw error
      }
    } catch (error) {
      console.error('Error updating presence:', error)
      
      if (retryCount < 3) {
        console.log(`Retrying presence update (${retryCount + 1}/3)`)
        setTimeout(() => updateUserPresence(retryCount + 1), 2000 * (retryCount + 1))
      } else {
        setConnectionStatus('disconnected')
        setReconnectAttempts(prev => prev + 1)
      }
    }
  }, [user, networkOnline, connectionStatus])

  // Connection health monitoring
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current)
    heartbeatIntervalRef.current = setInterval(() => {
      const now = Date.now()
      const timeSinceLastHeartbeat = now - lastHeartbeatRef.current
      if (timeSinceLastHeartbeat > 60000 && connectionStatus === 'connected') {
        console.warn('Connection health check failed, attempting reconnection')
        setConnectionStatus('connecting')
        reconnectChatFnRef.current?.()
      }
    }, 30000)
  }, [connectionStatus])

  // Fetch messages with optimized error handling - defined first to avoid hoisting issues
  const fetchMessages = useCallback(async () => {
    try {
      // Use a simpler query approach that's more reliable
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          content,
          created_at,
          user_id,
          user_profiles (
            id,
            full_name,
            profile_image_url
          )
        `)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) {
        console.error('Supabase error details:', error)
        throw error
      }
      
      // Transform data to handle the relationship
      const transformedMessages: ChatMessage[] = (data || []).map(msg => {
        // Handle both array and object responses from Supabase
        let userProfile: { id: string; full_name: string; profile_image_url: string | null } | null = null
        
        if (msg.user_profiles) {
          if (Array.isArray(msg.user_profiles)) {
            userProfile = msg.user_profiles[0] || null
          } else {
            userProfile = msg.user_profiles
          }
        }
        
        return {
          id: msg.id,
          content: msg.content,
          created_at: msg.created_at,
          user_id: msg.user_id,
          user_profiles: userProfile || {
            id: msg.user_id,
            full_name: 'Unknown User',
            profile_image_url: null
          }
        }
      })
      
      setMessages(transformedMessages)
      console.log('Messages fetched successfully:', transformedMessages.length)
    } catch (error) {
      console.error('Error fetching messages:', error)
      
      // Fallback: fetch messages without profile join first
      try {
        console.log('Trying fallback query...')
        const { data: basicData, error: basicError } = await supabase
          .from('chat_messages')
          .select('id, content, created_at, user_id')
          .order('created_at', { ascending: true })
          .limit(100)

        if (basicError) {
          console.error('Basic query also failed:', basicError)
          throw basicError
        }

        console.log('Basic messages fetched:', basicData?.length || 0)

        // Then fetch user profiles separately
        const messagesWithProfiles: ChatMessage[] = await Promise.all(
          (basicData || []).map(async (msg): Promise<ChatMessage> => {
            try {
              const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('id, full_name, profile_image_url')
                .eq('id', msg.user_id)
                .single()

              if (profileError) {
                console.warn('Profile not found for user:', msg.user_id, profileError)
              }

              return {
                id: msg.id,
                content: msg.content,
                created_at: msg.created_at,
                user_id: msg.user_id,
                user_profiles: profile || {
                  id: msg.user_id,
                  full_name: 'Unknown User',
                  profile_image_url: null
                }
              }
            } catch (profileError) {
              console.warn('Error fetching profile for user:', msg.user_id, profileError)
              return {
                id: msg.id,
                content: msg.content,
                created_at: msg.created_at,
                user_id: msg.user_id,
                user_profiles: {
                  id: msg.user_id,
                  full_name: 'Unknown User',
                  profile_image_url: null
                }
              }
            }
          })
        )

        setMessages(messagesWithProfiles)
        console.log('Messages with profiles set:', messagesWithProfiles.length)
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError)
        setMessages([])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch online users with presence detection
  const fetchOnlineUsers = useCallback(async () => {
    try {
      // Show users active within last 3 minutes for more dynamic presence
      const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString()
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, profile_image_url, last_seen')
        .gte('last_seen', threeMinutesAgo)
        .order('last_seen', { ascending: false })

      if (error) throw error
      setOnlineUsers(data || [])
    } catch (error) {
      console.error('Error fetching online users:', error)
    }
  }, [])

  // Robust reconnection logic - defined after fetch functions
  const reconnectChat = useCallback(async () => {
    if (!user || !networkOnline) return
    if (connectionStatus === 'connecting') return

    console.log(`Attempting to reconnect... (attempt ${reconnectAttempts + 1})`)
    
    // Cleanup existing connections
    if (realtimeChannelRef.current) {
      try {
        await realtimeChannelRef.current.unsubscribe()
      } catch (cleanupError) {
        console.warn('Error during reconnect cleanup:', cleanupError)
      }
      realtimeChannelRef.current = null
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    // Progressive backoff: 2s, 4s, 8s, 16s, then 30s max
    const delay = Math.min(2000 * Math.pow(2, reconnectAttempts), 30000)
    
  reconnectTimeoutRef.current = setTimeout(async () => {
      try {
        // Call initializeChat directly here to avoid circular dependency
    if (user && networkOnline) {
          setConnectionStatus('connecting')
          
          // Initialize chat connection with retry logic
          const fetchPromises = [
            fetchMessages(),
            fetchOnlineUsers(),
            updateUserPresence()
          ]

          await Promise.allSettled(fetchPromises)

          // Set up real-time subscriptions
          const channel = supabase
            .channel(`chat_room_${user.id}_${Date.now()}`, {
              config: {
                broadcast: { self: true },
                presence: { key: user.id }
              }
            })
            .on('postgres_changes', 
              { event: 'INSERT', schema: 'public', table: 'chat_messages' },
              (payload) => {
                console.log('New message received:', payload.new)
                fetchMessages()
              }
            )
            .on('postgres_changes',
              { event: '*', schema: 'public', table: 'user_profiles' },
              () => {
                fetchOnlineUsers()
              }
            )
            .on('broadcast', { event: 'typing_start' }, ({ payload }) => {
              if (payload.user_id !== user.id) {
                setTypingUsers(prev => [...prev.filter(id => id !== payload.user_id), payload.user_id])
              }
            })
            .on('broadcast', { event: 'typing_stop' }, ({ payload }) => {
              setTypingUsers(prev => prev.filter(id => id !== payload.user_id))
            })
            .on('presence', { event: 'sync' }, () => {
              fetchOnlineUsers()
            })

          let subscriptionActive = true
          
          const subscriptionPromise = new Promise((resolve) => {
            channel.subscribe(async (status, err) => {
              console.log('Reconnect subscription status:', status, err)
              
              if (!subscriptionActive) {
                console.log('Ignoring status change for inactive subscription:', status)
                return
              }
              
              if (status === 'SUBSCRIBED') {
                setConnectionStatus('connected')
                setReconnectAttempts(0)
                lastHeartbeatRef.current = Date.now()
                startHeartbeat()
                console.log('Chat reconnection successful')
                resolve(status)
              } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.error('Chat reconnection error:', status, err)
                setConnectionStatus('disconnected')
                
              } else if (status === 'CLOSED') {
                if (subscriptionActive && realtimeChannelRef.current === channel) {
                  console.warn('Unexpected channel closure during reconnect')
                  setConnectionStatus('disconnected')
                  
                } else {
                  console.log('Channel closed during reconnect cleanup (expected)')
                }
              }
            })
          })

          realtimeChannelRef.current = channel

          try {
            await Promise.race([
              subscriptionPromise,
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Reconnection timeout')), 15000)
              )
            ])
          } catch (subscriptionError) {
            console.error('Reconnection subscription failed:', subscriptionError)
            subscriptionActive = false
            
            if (realtimeChannelRef.current === channel) {
              realtimeChannelRef.current = null
              try {
                await channel.unsubscribe()
              } catch (unsubError) {
                console.warn('Error unsubscribing failed reconnect channel:', unsubError)
              }
            }
            
            setReconnectAttempts(prev => prev + 1)
      if (reconnectAttempts < 10) {
              reconnectChat()
            }
          }
        }
      } catch (error) {
        console.error('Reconnection failed:', error)
        setReconnectAttempts(prev => prev + 1)
    if (reconnectAttempts < 10) {
          reconnectChat()
        }
      }
    }, delay)
  }, [user, networkOnline, reconnectAttempts, fetchMessages, fetchOnlineUsers, updateUserPresence, startHeartbeat, connectionStatus])

  // Enhanced typing indicators with better error handling
  const handleTypingStart = useCallback(async () => {
    if (!user || isTyping || connectionStatus !== 'connected') return
    
    setIsTyping(true)
    try {
      if (realtimeChannelRef.current) {
        await realtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'typing_start',
          payload: { user_id: user.id, user_name: user.email }
        })
      }
    } catch (error) {
      console.warn('Failed to send typing indicator:', error)
    }
  }, [user, isTyping, connectionStatus])

  const handleTypingStop = useCallback(async () => {
    if (!user || !isTyping) return
    
    setIsTyping(false)
    try {
      if (realtimeChannelRef.current) {
        await realtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'typing_stop', 
          payload: { user_id: user.id }
        })
      }
    } catch (error) {
      console.warn('Failed to send typing stop indicator:', error)
    }
  }, [user, isTyping])

  // Robust chat initialization with error handling
  const initializeChat = useCallback(async () => {
    if (!user || !networkOnline) {
      console.log('Cannot initialize chat: user or network not available')
      return
    }
    if (connectionStatus === 'connecting' || connectionStatus === 'connected') {
      console.log('Chat already initializing/connected; skipping initializeChat')
      return
    }

    try {
  setConnectionStatus('connecting')
      console.log('Initializing chat connection...')
      
      // Cleanup any existing connection safely
      if (realtimeChannelRef.current) {
        try {
          const currentChannel = realtimeChannelRef.current
          realtimeChannelRef.current = null // Set to null first to prevent race conditions
          await currentChannel.unsubscribe()
          console.log('Previous channel cleaned up successfully')
        } catch (cleanupError) {
          console.warn('Error during channel cleanup:', cleanupError)
          // Continue with initialization even if cleanup fails
        }
      }

      // Initial data fetch with retries
      const fetchPromises = [
        fetchMessages(),
        fetchOnlineUsers(),
        updateUserPresence()
      ]

  await Promise.allSettled(fetchPromises)

      // Set up enhanced real-time subscriptions with better error handling
      console.log('Setting up real-time channel for user:', user.id)
      const channel = supabase
        .channel(`chat_room_${user.id}_${Date.now()}`, { // Add timestamp for uniqueness
          config: {
            broadcast: { self: true },
            presence: { key: user.id }
          }
        })
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'chat_messages' },
          (payload) => {
            console.log('New message received:', payload.new)
            fetchMessages() // Refetch to get user profile data
          }
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'user_profiles' },
          () => {
            fetchOnlineUsers()
          }
        )
        .on('broadcast', { event: 'typing_start' }, ({ payload }) => {
          if (payload.user_id !== user.id) {
            setTypingUsers(prev => [...prev.filter(id => id !== payload.user_id), payload.user_id])
          }
        })
        .on('broadcast', { event: 'typing_stop' }, ({ payload }) => {
          setTypingUsers(prev => prev.filter(id => id !== payload.user_id))
        })
        .on('presence', { event: 'sync' }, () => {
          fetchOnlineUsers()
        })

      // Enhanced subscription handling with better error management
      let subscriptionActive = true
      
  const subscriptionPromise = new Promise((resolve) => {
        console.log('Starting channel subscription...')
        channel.subscribe(async (status, err) => {
          console.log('Subscription status changed:', status, err)
          
          // Only handle status changes if subscription is still active
          if (!subscriptionActive) {
            console.log('Ignoring status change for inactive subscription:', status)
            return
          }
          
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected')
            setReconnectAttempts(0)
            lastHeartbeatRef.current = Date.now()
            startHeartbeat()
            console.log('Chat connection established successfully')
            setConnectionMode('realtime')
            resolve(status)
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('Real-time subscription failed, enabling polling mode:', status, err)
            
            // Instead of rejecting, resolve with polling mode
            setConnectionStatus('connected') // Still connected, just using polling
            setConnectionMode('polling')
            setReconnectAttempts(0)
            
            // Set up unified polling controller as fallback (ticks every 2s)
            if (controllerIntervalRef.current) clearInterval(controllerIntervalRef.current)
            let tick = 0
            controllerIntervalRef.current = setInterval(() => {
              tick++
              // messages ~ every 2s
              fetchMessages()
              // presence ~ every 10s
              if (tick % 5 === 0) updateUserPresence()
              // users ~ every 30s
              if (tick % 15 === 0) fetchOnlineUsers()
            }, 2000)
            
            // Clean up the failed real-time channel
            if (realtimeChannelRef.current === channel) {
              realtimeChannelRef.current = null
              try {
                await channel.unsubscribe()
              } catch (unsubError) {
                console.warn('Error cleaning up failed channel:', unsubError)
              }
            }
            
            // Return polling cleanup function
            const cleanup = () => {
              if (controllerIntervalRef.current) {
                clearInterval(controllerIntervalRef.current)
                controllerIntervalRef.current = null
              }
              
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
              }
              if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
              }
              if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current)
              }
            }
            
            console.log('Chat initialized in polling mode (real-time failed)')
            resolve({ mode: 'polling', cleanup })
            return
          } else if (status === 'CLOSED') {
            // CLOSED is normal during cleanup, only handle if unexpected
            if (subscriptionActive && realtimeChannelRef.current === channel) {
              console.warn('Unexpected channel closure, will attempt reconnection')
              setConnectionStatus('disconnected')
              setTimeout(() => {
                if (reconnectAttempts < 10) {
                  reconnectChatFnRef.current?.()
                }
              }, 5000)
            } else {
              console.log('Channel closed during cleanup (expected)')
            }
          }
        })
      })

      // Set the channel reference only after successful setup
      realtimeChannelRef.current = channel

      // Wait for subscription to establish or timeout
  try {
        console.log('Waiting for subscription to establish...')
        const result = await Promise.race([
          subscriptionPromise,
          new Promise((resolve) => 
            setTimeout(() => {
              console.warn('Real-time subscription timeout after 30 seconds, enabling polling mode')
              
              // Clean up the channel attempt
              subscriptionActive = false
              if (realtimeChannelRef.current === channel) {
                realtimeChannelRef.current = null
                channel.unsubscribe().catch(err => {
                  console.warn('Error cleaning up timed out channel:', err)
                })
              }
              
              // Set up polling mode
              setConnectionStatus('connected')
              setConnectionMode('polling')
              setReconnectAttempts(0)
              
              if (controllerIntervalRef.current) clearInterval(controllerIntervalRef.current)
              let tick = 0
              controllerIntervalRef.current = setInterval(() => {
                tick++
                fetchMessages()
                if (tick % 5 === 0) updateUserPresence()
                if (tick % 15 === 0) fetchOnlineUsers()
              }, 2000)
              
              const cleanup = () => {
                if (controllerIntervalRef.current) {
                  clearInterval(controllerIntervalRef.current)
                  controllerIntervalRef.current = null
                }
                
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current)
                }
                if (reconnectTimeoutRef.current) {
                  clearTimeout(reconnectTimeoutRef.current)
                }
                if (heartbeatIntervalRef.current) {
                  clearInterval(heartbeatIntervalRef.current)
                }
              }
              
              console.log('Chat initialized in polling mode (timeout fallback)')
              resolve({ mode: 'polling', cleanup })
            }, 10000) // Reduced timeout to 10 seconds for faster fallback
          )
        ])
        
        // Check if we got a polling mode result
  if (result && typeof result === 'object' && 'mode' in result && (result as { mode: string; cleanup: () => void }).mode === 'polling') {
          console.log('Chat initialized in polling mode due to real-time failure')
          return (result as { mode: string; cleanup: () => void }).cleanup
        }
        
        console.log('Real-time subscription established successfully')
      } catch (subscriptionError) {
        console.error('Subscription failed:', subscriptionError)
        subscriptionActive = false
        
        // Clean up failed channel
        if (realtimeChannelRef.current === channel) {
          realtimeChannelRef.current = null
          try {
            await channel.unsubscribe()
          } catch (unsubError) {
            console.warn('Error unsubscribing failed channel:', unsubError)
          }
        }
        
        // Check if this is a network issue
        if (!navigator.onLine) {
          console.log('Network is offline, waiting for connection...')
          setConnectionStatus('disconnected')
          return
        }
        
        // Retry initialization with exponential backoff
        if (reconnectAttempts < 3) { // Reduce max attempts for initialization
          const delay = 2000 * Math.pow(2, reconnectAttempts)
          console.log(`Retrying initialization in ${delay}ms (attempt ${reconnectAttempts + 1})`)
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1)
            initializeChat()
          }, delay)
        } else {
          console.error('Max initialization attempts reached, falling back to polling mode')
          setConnectionStatus('connected') // Mark as connected but use polling
          
          // Set up polling fallback for messages
          if (controllerIntervalRef.current) clearInterval(controllerIntervalRef.current)
          let tick = 0
          controllerIntervalRef.current = setInterval(() => {
            tick++
            fetchMessages()
            if (tick % 3 === 0) fetchOnlineUsers()
            if (tick % 2 === 0) updateUserPresence()
          }, 2000)
          
          // Store polling interval for cleanup
          const cleanup = () => {
            if (controllerIntervalRef.current) {
              clearInterval(controllerIntervalRef.current)
              controllerIntervalRef.current = null
            }
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current)
            }
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current)
            }
            if (heartbeatIntervalRef.current) {
              clearInterval(heartbeatIntervalRef.current)
            }
          }
          
          console.log('Chat initialized in polling mode (fallback)')
          return cleanup
        }
        return
      }

      // Enhanced presence updates every 20 seconds with health check
  if (controllerIntervalRef.current) clearInterval(controllerIntervalRef.current)
      let tick = 0
      controllerIntervalRef.current = setInterval(() => {
        tick++
        // presence ~ every 20s (10 ticks)
        if (tick % 10 === 0) updateUserPresence()
        // users ~ every 45s (23 ticks)
        if (tick % 23 === 0) fetchOnlineUsers()
      }, 2000)

      // Store intervals for cleanup
  const cleanup = () => {
        subscriptionActive = false // Set this first to prevent race conditions
        
        if (channel && realtimeChannelRef.current === channel) {
          realtimeChannelRef.current = null
          // Use setTimeout to allow status handler to see subscriptionActive = false
          setTimeout(() => {
            channel.unsubscribe().catch(err => {
              console.warn('Error during cleanup unsubscribe:', err)
            })
          }, 100)
        }
        
        if (controllerIntervalRef.current) {
          clearInterval(controllerIntervalRef.current)
          controllerIntervalRef.current = null
        }
        
  if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
        }
      }

      return cleanup
      
    } catch (error) {
      console.error('Failed to initialize chat:', error)
      setConnectionStatus('disconnected')
      
      // Retry initialization
      if (reconnectAttempts < 5) {
        setTimeout(() => {
          setReconnectAttempts(prev => prev + 1)
          initializeChat()
        }, 3000 * (reconnectAttempts + 1))
      }
    }
  }, [user, networkOnline, reconnectAttempts, fetchMessages, fetchOnlineUsers, updateUserPresence, startHeartbeat, connectionStatus])

  // Store reconnectChat in a ref to avoid circular dependency in useEffect
  reconnectChatFnRef.current = reconnectChat

  useEffect(() => {
    if (!user) return

    let cleanupFunction: (() => void) | null = null

    initializeChat().then(cleanup => {
      if (typeof cleanup === 'function') {
        cleanupFunction = cleanup
      }
    })
    
    return () => {
      if (cleanupFunction) {
        cleanupFunction()
      }
    }
  }, [user, initializeChat])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const sendMessage = async (e: React.FormEvent, retryCount = 0) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !user) return

    // Check connection status before sending
    if (connectionStatus !== 'connected' && retryCount === 0) {
      console.warn('Cannot send message: not connected')
      
      // Try to reconnect first
      if (networkOnline) {
        setConnectionStatus('connecting')
        await reconnectChat()
        
        // Wait a bit and retry
        setTimeout(() => {
          sendMessage(e, 0)
        }, 2000)
      }
      return
    }

    setSending(true)
    
    // Stop typing indicator when sending
    if (isTyping) {
      handleTypingStop()
    }

    const messageContent = newMessage.trim()
    const tempMessageId = `temp_${Date.now()}`

    try {
      // Optimistic UI update - add message immediately
      const tempMessage: ChatMessage = {
        id: tempMessageId,
        content: messageContent,
        created_at: new Date().toISOString(),
        user_id: user.id,
        user_profiles: {
          id: user.id,
          full_name: user.email || 'You',
          profile_image_url: null
        }
      }

      setMessages(prev => [...prev, tempMessage])
      setNewMessage('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }

      // Send to database with timeout
      const insertPromise = supabase
        .from('chat_messages')
        .insert({
          content: messageContent,
          user_id: user.id
        })
        .select()

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Message send timeout')), 10000)
      )

      const result = await Promise.race([insertPromise, timeoutPromise])
      const { data, error } = result as { data: unknown; error: unknown }

      if (error) {
        throw error
      }

      // Replace temp message with real one
      if (data && Array.isArray(data) && data[0]) {
        const realMessage = data[0] as ChatMessage
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessageId 
              ? { ...realMessage, user_profiles: tempMessage.user_profiles }
              : msg
          )
        )
      }

      console.log('Message sent successfully:', data)
      
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId))
      
      // Restore message text
      setNewMessage(messageContent)
      
      // Retry logic
      if (retryCount < 3) {
        console.log(`Retrying message send (${retryCount + 1}/3)`)
        
        // Progressive delay: 1s, 2s, 4s
        const delay = 1000 * Math.pow(2, retryCount)
        
        setTimeout(async () => {
          // Check if we need to reconnect
          if (connectionStatus !== 'connected') {
            await reconnectChat()
            // Wait for connection to establish
            setTimeout(() => {
              sendMessage(e, retryCount + 1)
            }, 2000)
          } else {
            sendMessage(e, retryCount + 1)
          }
        }, delay)
        
        // Show user that we're retrying
        console.log(`Message failed, retrying in ${delay/1000}s...`)
      } else {
        // Final failure - show error to user
        showError(
          'Message Failed', 
          `Failed to send message after ${retryCount + 1} attempts. Please check your connection and try again.`,
          8000
        )
        
        // Try to reconnect for future messages
        if (connectionStatus !== 'connected') {
          reconnectChat()
        }
      }
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    
    // Enhanced typing indicators
    if (e.target.value.trim() && !isTyping) {
      handleTypingStart()
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop()
    }, 2000)
    
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-6rem)] flex bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Modern Chat Header */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg m-4 mb-2 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white shadow-lg ring-2 ring-blue-100/50">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    {/* Connection Status Indicator */}
                    <div className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md ${
                      connectionStatus === 'connected' ? 'bg-green-400' : 
                      connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 
                      'bg-red-400'
                    }`} />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                      Live Course Chat 💬
                    </h1>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center space-x-1.5 text-xs text-gray-600 bg-white/60 px-2.5 py-1 rounded-full backdrop-blur-sm">
                        <Users className="h-3.5 w-3.5" />
                        <span>{onlineUsers.length} user{onlineUsers.length !== 1 ? 's' : ''} online</span>
                      </div>
                      {typingUsers.length > 0 && (
                        <div className="flex items-center space-x-1.5 text-xs text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded-full backdrop-blur-sm">
                          <div className="flex space-x-0.5">
                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" />
                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                          <span>{typingUsers.length} typing...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1.5 backdrop-blur-sm shadow-md ${
                    connectionStatus === 'connected' ? 'bg-green-100/80 text-green-700 border border-green-200/50' :
                    connectionStatus === 'connecting' ? 'bg-yellow-100/80 text-yellow-700 border border-yellow-200/50' :
                    'bg-red-100/80 text-red-700 border border-red-200/50'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
                      connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                      'bg-red-400'
                    }`} />
                    <span>
                      {connectionStatus === 'connected' ? 
                        (connectionMode === 'realtime' ? 'Live' : 'Polling') : 
                       connectionStatus === 'connecting' ? 'Connecting...' : 
                       'Disconnected'}
                    </span>
                    {connectionMode === 'polling' && connectionStatus === 'connected' && (
                      <span className="text-xs text-gray-500" title="Real-time connection unavailable, using polling mode">
                        (Fallback Mode)
                      </span>
                    )}
                    {!networkOnline && (
                      <span className="text-xs">(No Internet)</span>
                    )}
                    {reconnectAttempts > 0 && connectionStatus !== 'connected' && (
                      <span className="text-xs">({reconnectAttempts} attempts)</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setReconnectAttempts(0)
                      initializeChat()
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-full transition-all duration-200 backdrop-blur-sm shadow-md"
                    title="Reconnect chat"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => {
                const isOwn = message.user_id === user?.id
                const showAvatar = index === 0 || messages[index - 1].user_id !== message.user_id
                const isConsecutive = index > 0 && messages[index - 1].user_id === message.user_id

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
                      isConsecutive ? 'mt-1' : 'mt-4'
                    }`}
                  >
                    <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-xs lg:max-w-md`}>
                      {/* Avatar */}
                      <div className={`flex-shrink-0 ${isOwn ? 'ml-2' : 'mr-2'}`}>
                        {showAvatar ? (
                          <div className="w-8 h-8 rounded-full overflow-hidden">
                            {message.user_profiles?.profile_image_url ? (
                              <Image
                                src={message.user_profiles.profile_image_url}
                                alt={message.user_profiles.full_name || 'User'}
                                width={32}
                                height={32}
                                unoptimized
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                                {getInitials(message.user_profiles?.full_name || 'Unknown User')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-8 h-8" />
                        )}
                      </div>

                      {/* Message */}
                      <div className={`${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                        {showAvatar && !isOwn && (
                          <div className="text-xs font-medium text-gray-600 mb-1 px-1">
                            {message.user_profiles?.full_name || 'Unknown User'}
                          </div>
                        )}
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isOwn
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-900'
                          } shadow-sm`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>
                        <div className={`text-xs text-gray-500 mt-1 px-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                          {formatTime(message.created_at)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <form onSubmit={sendMessage} className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={handleTextareaChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                  disabled={sending}
                />
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Online Users Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="px-4 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
              Live Users ({onlineUsers.length})
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Users active in the last 3 minutes
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {onlineUsers.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">No users online</p>
                <p className="text-xs text-gray-400 mt-1">Be the first to start chatting!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {onlineUsers.map((onlineUser) => {
                  const isCurrentUser = onlineUser.id === user?.id
                  const lastSeenMinutes = Math.floor((Date.now() - new Date(onlineUser.last_seen).getTime()) / 60000)
                  
                  return (
                    <motion.div
                      key={onlineUser.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                        isCurrentUser 
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200' 
                          : 'hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden">
                          {onlineUser.profile_image_url ? (
                            <Image
                              src={onlineUser.profile_image_url}
                              alt={onlineUser.full_name}
                              width={48}
                              height={48}
                              unoptimized
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center text-white text-sm font-medium ${
                              isCurrentUser 
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                                : 'bg-gradient-to-br from-green-400 to-blue-500'
                            }`}>
                              {getInitials(onlineUser.full_name)}
                            </div>
                          )}
                        </div>
                        {/* Enhanced online indicator */}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                          lastSeenMinutes === 0 ? 'bg-green-400 animate-pulse' : 
                          lastSeenMinutes < 1 ? 'bg-green-400' : 
                          'bg-yellow-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className={`text-sm font-medium truncate ${
                            isCurrentUser ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {onlineUser.full_name}
                          </p>
                          {isCurrentUser && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <p className={`text-xs truncate ${
                          isCurrentUser ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {lastSeenMinutes === 0 ? '🟢 Active now' : 
                           lastSeenMinutes < 1 ? '🟡 Just now' : 
                           `⚪ ${lastSeenMinutes}m ago`}
                        </p>
                      </div>
                      {!isCurrentUser && (
                        <button 
                          className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                          title="Send direct message (coming soon)"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </button>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="border-t border-gray-200 p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-600">{messages.length}</div>
                <div className="text-xs text-blue-500">Messages</div>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-600">{onlineUsers.length}</div>
                <div className="text-xs text-green-500">Online</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
