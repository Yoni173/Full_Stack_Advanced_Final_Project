import { useEffect, useRef, memo } from 'react'
import { User as UserIcon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchUserProfile, uploadAvatar } from '../store/userSlice'
import { API_BASE_URL } from '../config/api'

// תמונת פרופיל של המשתמש בהדר - לחיצה פותחת בחירת קובץ ומעלה אותו דרך Multer בשרת
function ProfileAvatar() {
  const { isDarkMode } = useTheme()
  const dispatch = useAppDispatch()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { avatarUrl, profileStatus, avatarUploading, username } = useAppSelector((state) => state.user)

  useEffect(() => {
    if (profileStatus === 'idle') {
      dispatch(fetchUserProfile())
    }
  }, [profileStatus, dispatch])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      dispatch(uploadAvatar(file))
    }
    event.target.value = ''
  }

  const fullAvatarUrl = avatarUrl ? `${API_BASE_URL}${avatarUrl}` : null

  return (
    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      title={username ? `${username} - click to change photo` : 'Upload profile photo'}
      style={{
        width: '34px',
        height: '34px',
        borderRadius: '50%',
        border: isDarkMode ? '1px solid #1f2937' : '1px solid #e2e8f0',
        background: isDarkMode ? '#111827' : '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: 'pointer',
        padding: 0,
        opacity: avatarUploading ? 0.5 : 1,
        flexShrink: 0
      }}
    >
      {fullAvatarUrl ? (
        <img src={fullAvatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <UserIcon size={16} color={isDarkMode ? '#94a3b8' : '#64748b'} />
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </button>
  )
}

export default memo(ProfileAvatar)
