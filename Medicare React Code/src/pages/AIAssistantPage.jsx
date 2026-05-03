import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase/supabaseClient'
import DashboardSidebar from '../components/layout/DashboardSidebar'
import AIAssistantConsentModal from '../components/AIAssistantConsentModal'

function AIAssistantPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [aiAssistantEnabled, setAiAssistantEnabled] = useState(null)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [consentLoading, setConsentLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return

      const { data } = await supabase
        .from('profiles')
        .select('full_name, ai_assistant')
        .eq('id', user.id)
        .single()

      if (data?.full_name) {
        setFullName(data.full_name)
      }

      if (data?.ai_assistant === false) {
        setShowConsentModal(true)
        setAiAssistantEnabled(false)
      } else {
        setAiAssistantEnabled(true)
      }
    }

    fetchUserProfile()
  }, [user?.id])

  const handleConsentOptIn = async () => {
    setConsentLoading(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ai_assistant: true })
        .eq('id', user.id)

      if (error) {
        console.error('Error enabling AI Assistant:', error)
        setConsentLoading(false)
        return
      }

      setAiAssistantEnabled(true)
      setShowConsentModal(false)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setConsentLoading(false)
    }
  }

  const handleConsentOptOut = () => {
    setShowConsentModal(false)
    navigate('/dashboard')
  }

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!user?.id) return

      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('id, role, message, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching chat history:', error)
        return
      }

      if (data) {
        const formattedMessages = data.map((msg) => ({
          id: msg.id,
          type: msg.role === 'assistant' ? 'ai' : 'user',
          content: msg.message,
          timestamp: new Date(msg.created_at),
        }))

        setMessages(formattedMessages)
      }
    }

    fetchChatHistory()
  }, [user?.id])

  const initials = useMemo(() => {
    const parts = fullName.trim().split(' ').filter(Boolean)
    if (!parts.length) return 'MU'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }, [fullName])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setIsLoading(true)

    let userMsgId
    try {
      const { data: userMsg, error: userMsgError } = await supabase
        .from('ai_chat_history')
        .insert([
          {
            user_id: user.id,
            role: 'user',
            message: userMessage,
          },
        ])
        .select('id, created_at')
        .single()
      if (userMsgError) {
        throw userMsgError
      }
      userMsgId = userMsg.id
    } catch (err) {
      console.error('Failed to save user message:', err)
      setIsLoading(false)
      return
    }

    setMessages(prev => [
      ...prev,
      {
        id: userMsgId,
        type: 'user',
        content: userMessage,
        timestamp: new Date(),
      },
    ])

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, date_of_birth, gender, known_conditions, allergies, blood_type, organ_donor, weight_kg, height_cm, patient_id')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        setIsLoading(false)
        return
      }

      const { data: medicationsData, error: medicationsError } = await supabase
        .from('medications')
        .select('name, form, dosage_unit, dosage_amount, frequency, consumption_unit, amount_per_time')
        .eq('user_id', user.id)

      if (medicationsError) {
        console.error('Error fetching medications:', medicationsError)
        setIsLoading(false)
        return
      }

      const webhookData = {
        message: userMessage,
        patient_id: profileData?.patient_id || '',
        profile: {
          full_name: profileData?.full_name || '',
          date_of_birth: profileData?.date_of_birth || '',
          gender: profileData?.gender || '',
          known_conditions: profileData?.known_conditions || '',
          allergies: profileData?.allergies || '',
          blood_type: profileData?.blood_type || '',
          organ_donor: profileData?.organ_donor || false,
          weight_kg: profileData?.weight_kg || '',
          height_cm: profileData?.height_cm || '',
        },
        medications: medicationsData?.map(med => ({
          name: med.name || '',
          form: med.form || '',
          dosage_unit: med.dosage_unit || '',
          dosage_amount: med.dosage_amount || '',
          frequency: med.frequency || '',
          consumption_unit: med.consumption_unit || '',
          amount_per_time: med.amount_per_time || '',
        })) || [],
      }

      const response = await fetch('https://farankhan123456789.app.n8n.cloud/webhook/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      })

      let aiContent = 'I received your message and will assist you shortly.'
      if (response.ok) {
        const aiResponse = await response.json()
        aiContent = aiResponse.answer || aiResponse.message || aiResponse.response || aiContent
      } else {
        console.error('Webhook error:', response.status, response.statusText)
        aiContent = 'Sorry, I encountered an error processing your message. Please try again.'
      }

      let aiMsgId
      try {
        const { data: aiMsg, error: aiMsgError } = await supabase
          .from('ai_chat_history')
          .insert([
            {
              user_id: user.id,
              role: 'assistant',
              message: aiContent,
            },
          ])
          .select('id, created_at')
          .single()
        if (aiMsgError) {
          throw aiMsgError
        }
        aiMsgId = aiMsg.id
      } catch (err) {
        console.error('Failed to save AI message:', err)
        setIsLoading(false)
        return
      }

      setMessages(prev => [
        ...prev,
        {
          id: aiMsgId,
          type: 'ai',
          content: aiContent,
          timestamp: new Date(),
        },
      ])
    } catch (error) {
      console.error('Error sending message:', error)
      let errMsgId
      const errorContent = 'Sorry, I encountered an error processing your message. Please try again.'
      try {
        const { data: errMsg, error: errMsgError } = await supabase
          .from('ai_chat_history')
          .insert([
            {
              user_id: user.id,
              role: 'assistant',
              message: errorContent,
            },
          ])
          .select('id, created_at')
          .single()
        if (!errMsgError) {
          errMsgId = errMsg.id
        }
      } catch {}
      setMessages(prev => [
        ...prev,
        {
          id: errMsgId || Date.now() + 1,
          type: 'ai',
          content: errorContent,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  return (
    <div className="flex min-h-screen bg-surface font-body text-on-surface">
      <DashboardSidebar activeItem="ai-assistant" />

      <main className="ml-64 flex h-screen flex-1 flex-col overflow-hidden bg-surface">
        <div className="flex items-center justify-center gap-3 bg-tertiary-fixed px-8 py-2 text-on-tertiary-fixed">
          <span className="material-symbols-outlined text-sm">info</span>
          <p className="text-xs font-medium tracking-tight">
            MediCare AI is an educational tool and does not provide medical diagnoses. In case of emergency, contact your local medical services immediately.
          </p>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <section className="relative flex flex-1 flex-col bg-surface-bright">
            <header className="glass-panel sticky top-0 z-10 flex h-20 items-center justify-between border-b border-outline-variant/5 px-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container text-white shadow-lg">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: '"FILL" 1' }}>
                      smart_toy
                    </span>
                  </div>
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-secondary"></div>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-primary">MediCare Personal Assistant</h2>
                  <p className="text-xs font-medium text-secondary">Ready to assist you</p>
                </div>
              </div>
              <div className="flex gap-2">
              </div>
            </header>

            <div className="flex-1 space-y-8 overflow-y-auto p-8">
              <div className="flex max-w-3xl items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container">
                  <span className="material-symbols-outlined text-sm text-white">smart_toy</span>
                </div>
                <div className="rounded-2xl rounded-tl-none border border-outline-variant/10 bg-surface-container-lowest p-4 shadow-sm">
                  <p className="text-sm leading-relaxed text-on-surface">
                    Hello! I&apos;m your MediCare Personal Assistant. I&apos;m here to help you manage your medications, track your health metrics, and provide personalized health insights. How can I assist you today?
                  </p>
                </div>
              </div>

              {messages.map((message) => (
                message.type === 'ai' ? (
                  <div key={message.id} className="flex max-w-3xl items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container">
                      <span className="material-symbols-outlined text-sm text-white">smart_toy</span>
                    </div>
                    <div className="rounded-2xl rounded-tl-none border border-outline-variant/10 bg-surface-container-lowest p-4 shadow-sm">
                      <p className="text-sm leading-relaxed text-on-surface">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div key={message.id} className="flex items-start justify-end gap-4">
                    <div className="max-w-lg rounded-2xl rounded-tr-none bg-primary p-4 text-white shadow-xl shadow-primary/10">
                      <p className="text-sm leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-outline-variant/20 bg-primary text-white text-[11px] font-bold">
                      {initials}
                    </div>
                  </div>
                )
              ))}

              {isLoading && (
                <div className="flex max-w-3xl items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container">
                    <span className="material-symbols-outlined text-sm text-white">smart_toy</span>
                  </div>
                  <div className="rounded-2xl rounded-tl-none border border-outline-variant/10 bg-surface-container-lowest p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-on-surface-variant">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="glass-panel border-t border-outline-variant/5 p-6">
              <div className="mx-auto flex max-w-4xl gap-4">
                <div className="ring-primary flex flex-1 items-center gap-3 rounded-xl bg-surface-container-high px-4 focus-within:ring-2">
                  <input
                    className="flex-1 border-none bg-transparent py-4 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-0"
                    placeholder="Describe your symptoms or ask a health question..."
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
                <button
                  className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>
                    send
                  </span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* AI Assistant Consent Modal */}
      <AIAssistantConsentModal
        isOpen={showConsentModal}
        onOptIn={handleConsentOptIn}
        onOptOut={handleConsentOptOut}
        isLoading={consentLoading}
      />
    </div>
  )
}

export default AIAssistantPage
