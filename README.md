This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Markdown Support

The **Directions** and **Notes** fields in recipes support standard Markdown syntax for better formatting in the detail view. While you edit them as plain text, they will be rendered with the following styles:

- **Bold**: Use `**text**` or `__text__`.
- *Italics*: Use `*text*` or `_text_`.
- [Links](https://google.com): Use `[Link Text](https://url.com)`.
- **Images**: Use `![Alt text](https://image-url.com)`.
- **Lists**:
  - Unordered: Use `*` or `-` at the start of a line.
  - Ordered: Use `1.` at the start of a line.
- `Inline Code`: Use backticks `` `code` ``.

Markdown is rendered using `react-markdown` with custom styles defined in `app/globals.css`.

