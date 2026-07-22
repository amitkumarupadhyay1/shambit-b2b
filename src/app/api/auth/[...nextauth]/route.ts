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
      async authorize(credentials: Record<string, string | undefined> | undefined) {
        if (!credentials) return null

        try {
          if (credentials.type === 'tokens') {
            // The frontend already verified the credentials and got tokens
            return {
              id: credentials.id,
              email: credentials.email,
              name: credentials.name,
              phone: credentials.phone,
              accessToken: credentials.access,
              refreshToken: credentials.refresh,
            }
          }

          if (credentials.type === 'totp') {
            const res = await axios.post(`${process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://web:8000/api'}/users/totp/login/`, {
              temp_token: credentials.temp_token,
              code: credentials.totp_code
            })
            
            const data = res.data
            if (res.status === 200 && data && (data.access || data.token)) {
              return {
                id: data.user?.id || '1',
                email: data.user?.email,
                name: data.user?.name || (data.user?.first_name ? `${data.user.first_name} ${data.user.last_name || ''}`.trim() : ''),
                phone: data.user?.phone || data.user?.mobile || data.user?.phone_number || '',
                accessToken: data.access || data.token,
                refreshToken: data.refresh,
              }
            }
            return null
          }

          if (!credentials.email || !credentials.password) return null

          const res = await axios.post(`${process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://web:8000/api'}/auth/login/`, {
            email: credentials.email,
            password: credentials.password,
            turnstile_token: credentials.turnstile_token,
            client_type: 'b2b'
          })

          const data = res.data

          if (res.status === 200 && data && data.totp_required) {
             throw new Error("TOTP_REQUIRED")
          }

          // Adjust to how your backend returns the token (e.g. data.access, data.token)
          if (res.status === 200 && data && (data.access || data.token)) {
            return {
              id: data.user?.id || '1',
              email: credentials.email,
              name: data.user?.name || (data.user?.first_name ? `${data.user.first_name} ${data.user.last_name || ''}`.trim() : ''),
              phone: data.user?.phone || data.user?.mobile || data.user?.phone_number || '',
              accessToken: data.access || data.token,
              refreshToken: data.refresh,
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
        token.id = user.id;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.name = user.name;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session) {
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
        if (session.user) {
          session.user.id = token.id as string;
          session.user.name = token.name === null ? undefined : token.name;
          session.user.phone = token.phone as string | undefined;
        }
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: '/login',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
