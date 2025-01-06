'use client'
import '@/app/globals.css';
import { DEFAULT_THEME, MantineProvider, createTheme, mergeMantineTheme } from '@mantine/core';
import { IconPictureInPictureFilled } from '@tabler/icons-react';
import React from 'react';

const themeOverride = createTheme({
  primaryColor: "violet",
  defaultGradient: {
    from: 'blue',
    to: 'violet',
    deg: 45,
  },
  other: {
    gradients: {
      'club-bambi': { from: 'violet', to: 'grape', deg: 135 },
    },
    hexcodes: {
      
    }
  },
  defaultRadius: "md",
  autoContrast: true,
});

export const theme = mergeMantineTheme(DEFAULT_THEME, themeOverride)

export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="en">
      <head>
        {/* <ColorSchemeScript defaultColorScheme='auto' /> */}
      </head>
      <body>
        <MantineProvider theme={themeOverride} defaultColorScheme='dark'>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
