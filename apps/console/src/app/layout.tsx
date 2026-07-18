import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppShell } from "@/components/app-shell.tsx";
import { GatewayClientProvider } from "@/lib/gateway-client.tsx";

export const metadata: Metadata = {
  title: "Operator Console",
  description: "Operator Console — Control UI",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=window.localStorage;var k=null;for(var i=0;i<s.length;i++){var key=s.key(i);if(key&&key.indexOf("openclaw.control.settings.v1")===0){k=s.getItem(key);break;}}var raw=k?JSON.parse(k):null;var t=raw&&typeof raw.theme==="string"?raw.theme:"";var m=raw&&typeof raw.themeMode==="string"?raw.themeMode:"";var LEG={"dark":"claw:dark","light":"claw:light","openknot":"knot:dark","fieldmanual":"dash:dark","clawdash":"dash:light","system":"claw:system"};var name=(t in LEG)?LEG[t].split(":")[0]:"claw";var mode=(m in LEG)?LEG[m].split(":")[1]:"system";var pref=window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches;var resolved=(mode==="system")?(pref?"light":"dark"):mode;var dataTheme=(name==="knot")?(resolved==="light"?"openknot-light":"openknot"):(name==="dash")?(resolved==="light"?"dash-light":"dash"):(resolved==="light"?"light":"dark");var el=document.documentElement;el.setAttribute("data-theme",dataTheme);el.setAttribute("data-theme-mode",resolved);}catch(e){document.documentElement.setAttribute("data-theme","dark");document.documentElement.setAttribute("data-theme-mode","dark");}})();`,
          }}
        />
      </head>
      <body>
        <GatewayClientProvider>
          <AppShell>{children}</AppShell>
        </GatewayClientProvider>
      </body>
    </html>
  );
}
