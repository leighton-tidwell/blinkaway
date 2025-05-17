module.exports = {
  packagerConfig: {
    icon: "./assets/icon",
    name: "BlinkAway",
    appBundleId: "com.leightontidwell.blinkaway",
    appCategoryType: "public.app-category.productivity",
    osxSign: {},
  },
  makers: [
    {
      name: "@electron-forge/maker-dmg",
      config: {
        format: "ULFO",
      },
    },
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "BlinkAway",
      },
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-webpack",
      config: {
        mainConfig: "./webpack.main.config.js",
        renderer: {
          config: "./webpack.renderer.config.js",
          entryPoints: [
            {
              html: "./public/index.html",
              js: "./src/renderer/index.tsx",
              name: "main_window",
              preload: {
                js: "./src/main/preload.ts",
              },
            },
            {
              html: "./public/notification.html",
              js: "./src/renderer/notification.tsx",
              name: "notification_window",
              preload: {
                js: "./src/main/notificationPreload.ts",
              },
            },
            {
              html: "./public/twenty-twenty.html",
              js: "./src/renderer/twentyTwenty.tsx",
              name: "twenty_twenty_window",
              preload: {
                js: "./src/main/twentyTwentyPreload.ts",
              },
            },
            {
              html: "./public/reminder.html",
              js: "./src/renderer/reminder.tsx",
              name: "reminder_window",
              preload: {
                js: "./src/main/reminderPreload.ts",
              },
            },
          ],
        },
      },
    },
  ],
};
