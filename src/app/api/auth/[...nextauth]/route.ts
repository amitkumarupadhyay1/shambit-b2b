import NextAuth, { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import axios from "axios"

const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        turnstile_token: { label: "Turnstile token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const res = await axios.post(`${process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://web:8000/api'}/auth/login/`, {
            email: credentials.email,
            password: credentials.password,
            turnstile_token: credentials.turnstile_token,
            client_type: 'b2b'
          })

          const data = res.data

          // Adjust to how your backend returns the token (e.g. data.access, data.token)
          if (res.status === 200 && data && data.access) {
            return {
              id: data.user?.id || '1',
              email: credentials.email,
              name: data.user?.name || (data.user?.first_name ? `${data.user.first_name} ${data.user.last_name || ''}`.trim() : ''),
              phone: data.user?.phone || data.user?.mobile || data.user?.phone_number || '',
              accessToken: data.access,
            }
          } else if (res.status === 200 && data && data.token) {
            return {
              id: data.user?.id || '1',
              email: credentials.email,
              name: data.user?.name || (data.user?.first_name ? `${data.user.first_name} ${data.user.last_name || ''}`.trim() : ''),
              phone: data.user?.phone || data.user?.mobile || data.user?.phone_number || '',
              accessToken: data.token,
            }
          }

          return null
        } catch (e) {
          console.error("Login failed", e)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as { accessToken?: string }).accessToken
        token.name = user.name
        token.phone = (user as { phone?: string }).phone
      }
      return token
    },
    async session({ session, token }) {
      (session as { accessToken?: string }).accessToken = token.accessToken as string
      if (session.user) {
        session.user.name = token.name as string | null | undefined
        ;(session.user as { phone?: string }).phone = token.phone as string | undefined
      }
      return session
    }
  },
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: '/login',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
