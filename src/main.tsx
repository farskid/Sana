import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { ChakraProvider } from "@chakra-ui/react";
import { Global } from "@emotion/react";

createRoot(document.getElementById("root")!).render(
  <ChakraProvider>
    <Global
      styles={`
      @font-face {
        font-family: 'SanaSans';
        src: url('./fonts/SabaSans-Regular.woff2') format('woff2');
        font-weight: 400;
        font-style: normal;
      }
      @font-face {
        font-family: 'SanaSans';
        src: url('./fonts/SabaSans-Medium.woff2') format('woff2');
        font-weight: 500;
        font-style: normal;
      }
      @font-face {
        font-family: 'SanaSans';
        src: url('./fonts/SabaSans-Bold.woff2') format('woff2');
        font-weight: 900;
        font-style: normal;
      },
      html, body: {
        color: var(--chakra-colors-black);
        font-family: SanaSans, monospace
      }
    `}
    />
    <App />
  </ChakraProvider>
);
