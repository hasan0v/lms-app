'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { uploadProfileImage, deleteFile } from '@/lib/storage'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface ExtendedProfile {
  id: string
  full_name: string
  email?: string
  phone_number?: string
  profile_image_url?: string
  bio?: string
  role: 'student' | 'admin'
  created_at: string
}

interface FormData {
  full_name: string
  email: string
  phone_number: string
  bio: string
}

interface ValidationErrors {
  full_name?: string
  email?: string
  phone_number?: string
  bio?: string
}

interface Notification {
  type: 'success' | 'error'
  message: string
}

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState<Notification | null>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    phone_number: '',
    bio: ''
  })

  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

  const [extendedProfile, setExtendedProfile] = useState<ExtendedProfile | null>(null)

  useEffect(() => {
    const fetchExtendedProfile = async () => {
      if (!user) return
      
      setLoading(true)
      try {
        // First, try to get all columns including bio and phone_number
        let { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        // If bio/phone_number columns don't exist yet, fallback to basic columns
        if (error && error.message.includes('column')) {
          console.log('Bio/phone columns not found, using basic profile data')
          const { data: basicData, error: basicError } = await supabase
            .from('user_profiles')
            .select('id, full_name, profile_image_url, role, created_at')
            .eq('id', user.id)
            .single()

          if (basicError) throw basicError
          
          data = {
            ...basicData,
            phone_number: null,
            bio: null,
            email: user.email || ''
          }
        }

        if (error && !error.message.includes('column')) throw error
        
        setExtendedProfile({
          ...data,
          email: user.email || '',
          phone_number: data?.phone_number || '',
          bio: data?.bio || ''
        })
        
        setFormData({
          full_name: data?.full_name || '',
          email: user.email || '',
          phone_number: data?.phone_number || '',
          bio: data?.bio || ''
        })
        
        setProfileImage(data?.profile_image_url || null)
      } catch (error) {
        console.error('Error fetching extended profile:', error)
        // Fallback to basic profile data from context
        if (profile) {
          setFormData({
            full_name: profile.full_name || '',
            email: user.email || '',
            phone_number: '',
            bio: ''
          })
          setProfileImage(profile.profile_image_url || null)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchExtendedProfile()
  }, [user, profile])

  useEffect(() => {
    if (profile && user && !extendedProfile) {
      setFormData({
        full_name: profile.full_name || '',
        email: user.email || '',
        phone_number: profile.phone_number || '',
        bio: profile.bio || ''
      })
      setProfileImage(profile.profile_image_url || null)
    }
  }, [profile, user, extendedProfile])

  // Validation rules
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'full_name':
        if (!value.trim()) return 'Full name is required'
        if (value.trim().length < 2) return 'Name must be at least 2 characters'
        return undefined
      case 'email':
        if (!value.trim()) return 'Email is required'
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) return 'Please enter a valid email address'
        return undefined
      case 'phone_number':
        if (value && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
          return 'Please enter a valid phone number'
        }
        return undefined
      case 'bio':
        if (value.length > 500) return 'Bio must be less than 500 characters'
        return undefined
      default:
        return undefined
    }
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}
    let isValid = true

    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value)
      if (error) {
        newErrors[key as keyof ValidationErrors] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Add to touched fields
    setTouchedFields(prev => new Set([...prev, name]))
    
    // Real-time validation for touched fields
    if (touchedFields.has(name) || value !== '') {
      const error = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showNotification('error', 'Image size must be less than 5MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        showNotification('error', 'Please select a valid image file')
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Upload image to Supabase Storage
  const uploadImageToCloud = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated')
    
    const result = await uploadProfileImage(file, user.id)
    
    if (result.error) {
      console.error('Profile image upload failed:', result.error)
      throw new Error(result.error)
    }
    
    if (!result.url) {
      throw new Error('Upload failed: No URL returned')
    }
    
    return result.url
  }

  const handleRemoveImage = async () => {
    if (profileImage && user) {
      try {
        // Extract file path from URL if it's a Supabase storage URL
        if (profileImage.includes('supabase')) {
          const urlParts = profileImage.split('/storage/v1/object/public/profile-images/')
          if (urlParts.length > 1) {
            await deleteFile('profile-images', urlParts[1])
          }
        }
      } catch (error) {
        console.error('Error deleting image from storage:', error)
      }
    }
    
    setProfileImage(null)
    setImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const handleSave = async () => {
    if (!validateForm()) {
      showNotification('error', 'Please fix the errors before saving')
      return
    }

    setSaving(true)
    try {
      let imageUrl = profileImage

      // Upload image if a new file was selected
      if (imageFile) {
        try {
          imageUrl = await uploadImageToCloud(imageFile)
          showNotification('success', 'Profile image uploaded successfully!')
        } catch (error) {
          console.error('Image upload error:', error)
          showNotification('error', 'Failed to upload image. Profile will be updated without new image.')
          imageUrl = extendedProfile?.profile_image_url || null
        }
      }

      // Update user profile - try with new columns first, fallback if they don't exist
      let profileUpdateData: any = {
        full_name: formData.full_name,
        profile_image_url: imageUrl
      }

      // Only include bio and phone_number if the columns exist
      try {
        profileUpdateData.phone_number = formData.phone_number || null
        profileUpdateData.bio = formData.bio || null

        const { error: profileError } = await supabase
          .from('user_profiles')
          .update(profileUpdateData)
          .eq('id', user?.id)

        if (profileError && profileError.message.includes('column')) {
          // Fallback: update only basic fields
          console.log('Bio/phone columns not found, updating basic fields only')
          const { error: basicError } = await supabase
            .from('user_profiles')
            .update({
              full_name: formData.full_name,
              profile_image_url: imageUrl
            })
            .eq('id', user?.id)
          
          if (basicError) throw basicError
          showNotification('success', 'Profile updated (bio and phone number will be available after database migration)')
        } else if (profileError) {
          throw profileError
        }
      } catch (error: any) {
        if (error.message.includes('column')) {
          // Fallback: update only basic fields
          const { error: basicError } = await supabase
            .from('user_profiles')
            .update({
              full_name: formData.full_name,
              profile_image_url: imageUrl
            })
            .eq('id', user?.id)
          
          if (basicError) throw basicError
          showNotification('success', 'Profile updated (bio and phone number will be available after database migration)')
        } else {
          throw error
        }
      }

      // Update email if changed
      if (formData.email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        })
        if (emailError) throw emailError
        showNotification('success', 'Email update initiated. Please check your inbox to confirm the change.')
      }

      await refreshProfile()
      
      // Refresh extended profile data
      if (user) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!error) {
          setExtendedProfile({
            ...data,
            email: formData.email
          })
        }
      }

      setIsEditing(false)
      setImageFile(null)
      showNotification('success', 'Profile updated successfully!')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      showNotification('error', error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    const profileData = extendedProfile || profile
    if (profileData && user) {
      setFormData({
        full_name: profileData.full_name || '',
        email: user.email || '',
        phone_number: profileData.phone_number || '', 
        bio: profileData.bio || ''
      })
      setProfileImage(profileData.profile_image_url || null)
      setImageFile(null)
      setErrors({})
      setTouchedFields(new Set())
    }
    setIsEditing(false)
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
      <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        {/* Header with Theme Toggle */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Manage your personal information and preferences
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full transition-colors ${
                isDarkMode 
                  ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              } shadow-md`}
              title="Toggle theme"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button> */}
            {!isEditing && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <span className="mr-2">✏️</span>
                Edit Profile
              </motion.button>
            )}
          </div>
        </div>

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className={`mb-6 p-4 rounded-md ${
                notification.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <div className="flex">
                <span className="mr-2">
                  {notification.type === 'success' ? '✅' : '❌'}
                </span>
                {notification.message}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-xl rounded-2xl overflow-hidden transition-colors duration-300`}
        >
          {/* Profile Header */}
          <div className={`${
            isDarkMode ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
          } px-6 py-8`}>
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Profile Picture */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-white shadow-lg">
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl">
                      👤
                    </div>
                  )}
                </div>
                {isEditing && (
                  <div className="absolute -bottom-2 -right-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-indigo-600 hover:bg-gray-50 transition-colors"
                      title="Change photo"
                    >
                      📷
                    </button>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold text-white">
                  {extendedProfile?.full_name || profile?.full_name || 'User'}
                </h2>
                <p className="text-indigo-100 capitalize">
                  {extendedProfile?.role || profile?.role} • Member since {new Date(extendedProfile?.created_at || profile?.created_at || '').toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Full Name *
                </label>
                {isEditing ? (
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="text"
                    value={formData.full_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('full_name', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                      errors.full_name
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white focus:border-indigo-500 focus:ring-indigo-200'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
                    } focus:ring-4 focus:ring-opacity-20`}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className={`px-4 py-3 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-900'
                  }`}>
                    {formData.full_name || 'Not provided'}
                  </p>
                )}
                {errors.full_name && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm flex items-center"
                  >
                    ⚠️ {errors.full_name}
                  </motion.p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email Address *
                </label>
                {isEditing ? (
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="email"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                      errors.email
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white focus:border-indigo-500 focus:ring-indigo-200'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
                    } focus:ring-4 focus:ring-opacity-20`}
                    placeholder="Enter your email address"
                  />
                ) : (
                  <p className={`px-4 py-3 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-900'
                  }`}>
                    {formData.email || 'Not provided'}
                  </p>
                )}
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm flex items-center"
                  >
                    ⚠️ {errors.email}
                  </motion.p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Phone Number
                </label>
                {isEditing ? (
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('phone_number', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                      errors.phone_number
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-white focus:border-indigo-500 focus:ring-indigo-200'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
                    } focus:ring-4 focus:ring-opacity-20`}
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p className={`px-4 py-3 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-900'
                  }`}>
                    {formData.phone_number || 'Not provided'}
                  </p>
                )}
                {errors.phone_number && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm flex items-center"
                  >
                    ⚠️ {errors.phone_number}
                  </motion.p>
                )}
              </div>

              {/* Role (Read-only) */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Role
                </label>
                <p className={`px-4 py-3 capitalize ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-900'
                }`}>
                  {extendedProfile?.role || profile?.role || 'Student'} 
                  <span className="ml-2 text-xs text-gray-500">
                    {(extendedProfile?.role || profile?.role) === 'admin' ? '👑' : '🎓'}
                  </span>
                </p>
              </div>
            </div>

            {/* Bio */}
            <div className="mt-6 space-y-2">
              <label className={`block text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Bio
              </label>
              {isEditing ? (
                <motion.textarea
                  whileFocus={{ scale: 1.02 }}
                  value={formData.bio}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('bio', e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 resize-none ${
                    errors.bio
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : isDarkMode
                      ? 'border-gray-600 bg-gray-700 text-white focus:border-indigo-500 focus:ring-indigo-200'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
                  } focus:ring-4 focus:ring-opacity-20`}
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className={`px-4 py-3 min-h-[100px] ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-900'
                }`}>
                  {formData.bio || 'No bio provided'}
                </p>
              )}
              <div className="flex justify-between items-center">
                {errors.bio && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm flex items-center"
                  >
                    ⚠️ {errors.bio}
                  </motion.p>
                )}
                <p className={`text-xs ${
                  formData.bio.length > 450 ? 'text-red-500' : 'text-gray-500'
                } ml-auto`}>
                  {formData.bio.length}/500 characters
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">💾</span>
                      Save Changes
                    </>
                  )}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCancel}
                  disabled={saving}
                  className={`flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 border-2 shadow-sm text-base font-medium rounded-lg transition-colors ${
                    isDarkMode
                      ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="mr-2">❌</span>
                  Cancel
                </motion.button>

                {profileImage && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRemoveImage}
                    disabled={saving}
                    className="inline-flex items-center justify-center px-4 py-3 border-2 border-red-300 shadow-sm text-base font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="mr-2">🗑️</span>
                    Remove Photo
                  </motion.button>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
    </DashboardLayout>
  )
}
