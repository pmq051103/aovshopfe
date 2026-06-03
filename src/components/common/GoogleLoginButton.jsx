// GoogleLoginButton.jsx
// Component nút đăng nhập Google dùng chung cho cả Login và Register
import { useGoogleLogin } from '@react-oauth/google'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { googleLogin } from '../../store/slices/authSlice'
import { Spinner } from './UIComponents'
import toast from 'react-hot-toast'
import axios from 'axios'

export default function GoogleLoginButton({ label = 'Tiếp tục với Google' }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector(s => s.auth)

  // Dùng Authorization Code Flow (implicit) để lấy access_token rồi exchange lấy id_token
  // Hoặc dùng useGoogleLogin với flow='auth-code' tuỳ BE setup
  // Ở đây dùng credential (One Tap / standard button) thông qua GoogleOAuthProvider
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Lấy thông tin user từ Google userinfo endpoint
        const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        })

        // Gửi access_token lên BE để verify và lấy JWT
        // BE sẽ dùng google-auth-library để verify
        const result = await dispatch(googleLogin(tokenResponse.access_token))

        if (googleLogin.fulfilled.match(result)) {
          toast.success('Đăng nhập Google thành công! 🎉')
          navigate('/')
        }
      } catch (err) {
        toast.error('Đăng nhập Google thất bại')
      }
    },
    onError: () => {
      toast.error('Đăng nhập Google bị huỷ hoặc thất bại')
    },
  })

  return (
    <button
      type="button"
      onClick={() => handleGoogleLogin()}
      disabled={loading}
      className="
        w-full flex items-center justify-center gap-3
        py-3 px-4 rounded-xl
        bg-white/5 hover:bg-white/10
        border border-white/10 hover:border-white/20
        text-white/80 hover:text-white
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        group
      "
    >
      {loading ? (
        <Spinner size="sm" color="white" />
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" className="flex-shrink-0">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}