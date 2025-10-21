import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"
// import { ThemeProvider } from "@lib/context/theme-context"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        {/* <ThemeProvider> */}
          <main className="relative">{props.children}</main>
        {/* </ThemeProvider> */}
      </body>
    </html>
  )
}
