'use client'
import '@mantine/core/styles.css';
import { useState } from 'react';
import { ColorSchemeScript, MantineProvider, createTheme, Container, Group, Burger, mergeMantineTheme, DEFAULT_THEME, Badge, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './HeaderSimple.module.css';
import { usePathname } from 'next/navigation';

const themeOverride = createTheme({
  primaryColor: "violet",
  defaultGradient: {
    from: 'blue',
    to: 'violet',
    deg: 45,
  },
});

export const theme = mergeMantineTheme(DEFAULT_THEME, themeOverride)

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript defaultColorScheme='auto' />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme='auto'>
          {Navbar()}
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}

export function Navbar() {
  const links = [
    { link: '/', label: 'Home' },
    { link: '/create', label: 'New' },
    // { link: '/learn', label: 'Learn' },
    // { link: '/community', label: 'Community' },
  ];

  const [opened, { toggle }] = useDisclosure(false);
  const [active, setActive] = useState(usePathname());

  const items = links.map((link) => (
    <a
      key={link.label}
      href={link.link}
      className={classes.link}
      data-active={active === link.link || undefined}
      onClick={(event) => {
        setActive(link.link);
      }}
    >
      {link.label}
    </a>
  ));

  return (
    <header className={classes.header}>
      <Container size="md" className={classes.inner}>
        <Text variant="gradient" size="xl" fw="bold">Interactive FR</Text>
        <Group gap={5} visibleFrom="xs" mx="auto">
          {items}
        </Group>
        <Burger opened={opened} onClick={toggle} hiddenFrom="xs" size="sm" />
      </Container>
    </header>
  );
}