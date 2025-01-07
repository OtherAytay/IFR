'use client'
import '@/app/globals.css';
import { theme } from '@/IFR/club-bambi';
import { MantineProvider } from '@mantine/core';
import React from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* <ColorSchemeScript defaultColorScheme='auto' /> */}
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme='dark'>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
