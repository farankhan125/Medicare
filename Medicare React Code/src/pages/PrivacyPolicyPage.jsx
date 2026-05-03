import { useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

function PrivacyPolicyPage() {
  const [expandedSections, setExpandedSections] = useState({})

  const toggleSection = (index) => {
    setExpandedSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const sections = [
    {
      id: 1,
      title: 'Information We Collect',
      icon: 'info',
      content: [
        {
          subtitle: 'Personal Information',
          items: ['Full name', 'Email address', 'Date of birth', 'Gender'],
        },
        {
          subtitle: 'Medical Information',
          items: [
            'Known medical conditions',
            'Allergies',
            'Blood type',
            'Organ donor status',
            'Weight and height',
          ],
        },
        {
          subtitle: 'Medication Information',
          items: [
            'Medication names, forms, and dosages',
            'Medication schedules and frequency',
            'Stock levels',
            'Prescribed by information',
            'Notes',
          ],
        },
        {
          subtitle: 'Emergency Contact Information',
          items: [
            'Emergency contact name',
            'Emergency contact phone number',
            'Emergency contact relation',
          ],
        },
        {
          subtitle: 'Usage Data',
          items: [
            'Dose logs and medication history',
            'Adherence records',
            'AI assistant chat history',
          ],
        },
      ],
    },
    {
      id: 2,
      title: 'How We Use Your Information',
      icon: 'privacy_tip',
      content: [
        {
          subtitle: 'Primary Purposes',
          items: [
            'To manage your medication schedules and send automated dose reminders',
            'To track your dose history and calculate your adherence rate',
            'To display your health information on your personal dashboard',
            'To provide emergency medical information through the Emergency SOS feature',
            'To power the AI assistant with your health profile for personalised guidance',
            'To send email alerts and smart follow-up reminders when doses are missed',
          ],
        },
      ],
    },
    {
      id: 3,
      title: 'Data Sharing',
      icon: 'share',
      content: [
        {
          subtitle: 'Google Gemini AI Model',
          items: [
            'Your health data including medications, name, date of birth, gender, weight, height, allergies, blood type, and organ donor status is transmitted to Google\'s Gemini model only if you explicitly opt in to the AI assistant feature',
            'You will be clearly informed of this before any data is transmitted and your consent will be recorded',
          ],
        },
        {
          subtitle: 'No Other Third Party Sharing',
          items: [
            'Medicare does not sell, rent, or share your personal data with any other third parties for marketing or commercial purposes',
          ],
        },
      ],
    },
    {
      id: 4,
      title: 'Data Security',
      icon: 'security',
      content: [
        {
          subtitle: 'Security Measures',
          items: [
            'Row Level Security (RLS) — All database tables have Row Level Security enabled, ensuring each user can only access their own data',
            'Supabase Authentication — All user authentication is handled through Supabase Auth, which manages passwords securely and never stores them in plaintext',
            'HTTPS — All data transmitted between your browser and our servers is encrypted using HTTPS',
            'Email Verification — All new accounts require email verification through a six-digit one-time password before access is granted',
            'Session Management — User sessions are verified on every protected page load to prevent unauthorised access',
          ],
        },
      ],
    },
    {
      id: 5,
      title: 'Your Rights',
      icon: 'verified_user',
      content: [
        {
          subtitle: 'Data Rights',
          items: [
            'Access — You can view all your personal and medical information through the Settings page',
            'Update — You can update your profile information, medical details, and emergency contact at any time through the Settings page',
            'Delete — You can permanently delete your account and all associated data through the Danger Zone section in Settings. This action is irreversible and removes all your medical history, dose logs, and AI chat history',
            'Consent Withdrawal — You can disable the AI assistant at any time through the Settings page, which will prevent any further data transmission to the Gemini model',
            'Email Alerts — You can enable or disable email reminders at any time through the Settings page',
          ],
        },
      ],
    },
    {
      id: 6,
      title: 'Data Retention',
      icon: 'history',
      content: [
        {
          subtitle: 'Retention Policy',
          items: [
            'Your data is retained for as long as your account remains active',
            'If you delete your account, all associated data including your profile, medications, dose history, and AI chat history is permanently and irreversibly deleted from our database through cascading deletion',
          ],
        },
      ],
    },
    {
      id: 7,
      title: 'AI Assistant',
      icon: 'smart_toy',
      content: [
        {
          subtitle: 'AI Assistant Details',
          items: [
            'The AI assistant feature is entirely optional and requires your explicit informed consent before activation',
            'Your health data is only transmitted to Google\'s Gemini model after you have opted in',
            'The AI assistant is an informational tool only and does not provide clinical diagnoses or medical prescriptions',
            'You should always consult a qualified doctor or healthcare professional before making any medical decisions',
            'AI responses should never be relied upon as a substitute for professional medical advice',
            'You can withdraw your consent and disable the AI assistant at any time through Settings',
          ],
        },
      ],
    },
    {
      id: 8,
      title: 'Cookies and Local Storage',
      icon: 'storage',
      content: [
        {
          subtitle: 'Storage Practices',
          items: [
            'Medicare uses browser session management provided by Supabase Authentication to maintain your login state',
            'No advertising cookies or third party tracking technologies are used',
          ],
        },
      ],
    },
    {
      id: 9,
      title: "Children's Privacy",
      icon: 'child_care',
      content: [
        {
          subtitle: 'Age Requirement',
          items: [
            'Medicare is not intended for use by individuals under the age of 18',
            'We do not knowingly collect personal data from minors',
          ],
        },
      ],
    },
    {
      id: 10,
      title: 'Changes to This Policy',
      icon: 'update',
      content: [
        {
          subtitle: 'Policy Updates',
          items: [
            'We may update this privacy policy from time to time',
            'Any changes will be reflected on this page with an updated date',
            'Continued use of the application following any changes constitutes acceptance of the updated policy',
          ],
        },
      ],
    },
  ]

  return (
    <div className="bg-surface font-body text-on-surface antialiased">
      <Navbar ctaLabel="Login" ctaTo="/login" showCta={true} />

      <main className="pt-32 md:pt-40 pb-20">
        <div className="container mx-auto px-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-16 text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-container/30 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase">
                <span className="material-symbols-outlined text-sm">shield</span>
                Your Privacy Matters
              </div>

              <h1 className="text-5xl md:text-6xl font-headline font-extrabold text-primary leading-tight">
                Privacy Policy
              </h1>

              <p className="text-lg text-on-surface-variant leading-relaxed max-w-2xl mx-auto">
                Medicare is committed to protecting your personal and medical information. This privacy policy explains
                what data we collect, how we use it, and how we protect it.
              </p>

              <p className="text-sm text-outline font-medium">Last Updated: May 2026</p>
            </div>

            <div className="space-y-3 mb-12">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className="group rounded-2xl border border-outline-variant/20 bg-surface-container-lowest overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <button
                    onClick={() => toggleSection(index)}
                    className="w-full px-6 md:px-8 py-6 flex items-start md:items-center justify-between gap-4 hover:bg-surface-container-low/50 transition-colors"
                  >
                    <div className="flex items-start md:items-center gap-4 flex-1 text-left">
                      <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary mt-1 md:mt-0">
                        <span className="material-symbols-outlined text-xl md:text-2xl">{section.icon}</span>
                      </div>

                      <div>
                        <h2 className="font-headline font-bold text-lg md:text-xl text-on-surface">
                          {section.id}. {section.title}
                        </h2>
                        <p className="text-xs md:text-sm text-on-surface-variant mt-1">
                          {section.content[0]?.subtitle || 'Click to expand'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`flex-shrink-0 text-primary transition-transform duration-300 ${
                        expandedSections[index] ? 'rotate-180' : ''
                      }`}
                    >
                      <span className="material-symbols-outlined">expand_more</span>
                    </span>
                  </button>

                  {expandedSections[index] && (
                    <div className="px-6 md:px-8 py-6 border-t border-outline-variant/10 space-y-6 bg-surface-container-low/30">
                      {section.content.map((block, blockIndex) => (
                        <div key={blockIndex} className="space-y-3">
                          <h3 className="font-headline font-semibold text-base text-primary">
                            {block.subtitle}
                          </h3>

                          <ul className="space-y-2 ml-2">
                            {block.items.map((item, itemIndex) => (
                              <li key={itemIndex} className="flex gap-3 text-on-surface-variant leading-relaxed">
                                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary/70 mt-2"></span>
                                <span className="text-sm">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-16 p-8 rounded-2xl border border-error-container/50 bg-error-container/10">
              <div className="flex gap-4 mb-4">
                <span className="material-symbols-outlined text-2xl text-error flex-shrink-0">info</span>
                <div>
                  <h3 className="font-headline font-bold text-lg text-on-error-container mb-2">Important Notice</h3>
                  <p className="text-on-surface-variant leading-relaxed">
                    Your trust is our priority. If you have any questions about this privacy policy or how we handle your
                    data, please contact us through the Support section in the app. We are committed to transparency and
                    will respond to any inquiries promptly.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 p-8 rounded-2xl bg-primary-container/10 border border-primary/20">
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-2xl text-primary flex-shrink-0">check_circle</span>
                <div>
                  <h3 className="font-headline font-bold text-lg text-primary mb-2">Your Control</h3>
                  <p className="text-on-surface-variant leading-relaxed">
                    You maintain complete control over your data. Access the Settings page at any time to review, update,
                    or delete your information. We believe that privacy should be straightforward and user-friendly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default PrivacyPolicyPage
