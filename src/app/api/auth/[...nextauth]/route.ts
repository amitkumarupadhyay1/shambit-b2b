import NextAuth, { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import axios from "axios"

const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const res = await axios.post(`${process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://web:8000/api'}/auth/login/`, {
            email: credentials.email,
            password: credentials.password,
            client_type: 'b2b'
          })

          const data = res.data

          // Adjust to how your backend returns the token (e.g. data.access, data.token)
          if (res.status === 200 && data && data.access) {
            return {
              id: data.user?.id || '1',
              email: credentials.email,
              accessToken: data.access,
            }
          } else if (res.status === 200 && data && data.token) {
            return {
              id: data.user?.id || '1',
              email: credentials.email,
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
        token.accessToken = user.accessToken
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
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
