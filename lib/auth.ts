import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Auth: Missing credentials");
          return null;
        }

        const user1Email = process.env.AUTH_USER_1_EMAIL?.trim();
        const user1Hash = process.env.AUTH_USER_1_PASSWORD_HASH?.trim();
        const user2Email = process.env.AUTH_USER_2_EMAIL?.trim();
        const user2Hash = process.env.AUTH_USER_2_PASSWORD_HASH?.trim();

        if (!user1Email || !user1Hash) {
          console.warn("Auth: User 1 credentials not configured in environment");
        }

        const users = [
          { email: user1Email, passwordHash: user1Hash },
          { email: user2Email, passwordHash: user2Hash },
        ];

        const user = users.find((u) => u.email === credentials.email);

        if (!user) {
          console.log(`Auth: No user found for email: ${credentials.email}`);
          return null;
        }

        if (user.passwordHash) {
          if (!user.passwordHash.startsWith("$2")) {
            console.error(`Auth: Hash for ${credentials.email} does not look like a valid bcrypt hash. It should start with "$2". Current value starts with: ${user.passwordHash.substring(0, 3)}`);
            return null;
          }

          try {
            const isValid = await bcrypt.compare(
              credentials.password,
              user.passwordHash
            );

            if (isValid) {
              return {
                id: user.email!,
                email: user.email,
                name: user.email?.split("@")[0],
              };
            } else {
              console.log(`Auth: Invalid password for user: ${credentials.email}`);
            }
          } catch (error) {
            console.error("Auth: Error comparing passwords", error);
          }
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.name = token.name;
        session.user.email = token.email;
      }
      return session;
    },
  },
};
