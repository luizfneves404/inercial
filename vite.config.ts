import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/inercial/",

  plugins: [
    VitePWA({
      // Automatically update the service worker without prompting the user.
      registerType: "autoUpdate",

      // Configuration for the web app manifest file.
      manifest: {
        name: "Inercial",
        short_name: "Inercial",
        description: "A fun musical physics sandbox",
        theme_color: "#242424", // A color for the browser UI
        background_color: "#242424", // A color for the splash screen
        display: "standalone", // Makes the app feel like a native app
        scope: "/inercial/", // <-- Must match the 'base' option
        start_url: "/inercial/", // <-- Must match the 'base' option
      },
    }),
  ],
});
