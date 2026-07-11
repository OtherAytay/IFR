'use client'
import '@mantine/core/styles.css';
import '@mantine/carousel/styles.css';
import { useEffect, useState } from 'react';
import { Container, Group, Burger, Text, AppShell, Anchor, Stack, useComputedColorScheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './HeaderSimple.module.css';
import { usePathname } from 'next/navigation';
import { PageContext } from '@/IFR/club-bambi';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure(false)
  const [statePanelOpened, statePanelHandlers] = useDisclosure(false)
  const path = usePathname()

  return (
    <AppShell
      h="100%"
      padding={0}
      header={{ height: "4.5rem", collapsed: false, offset: path?.startsWith('/create') ? false : true }}
      navbar={{ width: "20rem", breakpoint: 'sm', collapsed: { mobile: !opened, desktop: true } }}
      aside={{ width: "20rem", breakpoint: 'sm', collapsed: { desktop: !statePanelOpened, mobile: !statePanelOpened } }}
    >
      <Nav opened={opened} toggle={toggle} />
      <PageContext.Provider value={{
        statePanelOpened: statePanelOpened, toggleStatePanel: statePanelHandlers.toggle,
        openStatePanel: statePanelHandlers.open, closeStatePanel: statePanelHandlers.close
      }}>
        <AppShell.Main style={{ height: '100dvh' }}>
          {children}
        </AppShell.Main>
      </PageContext.Provider>
    </AppShell>
  );
}

function Nav({ opened, toggle }: { opened: boolean, toggle: () => void }) {
  const colorScheme = useComputedColorScheme();

  const links = [
    { link: '/', label: 'Library' },
    { link: '/create', label: 'Create' },
  ];

  const path = usePathname()
  const [active, setActive] = useState<string>();

  useEffect(() => {
    setActive(path)
  }, [path])

  const items = links.map((link) => (
    <a
      key={link.label}
      href={link.link}
      className={classes.link}
      data-active={active === link.link || undefined}
      onClick={() => {
        setActive(link.link);
      }}
    >
      {link.label}
    </a>
  ));

  return (
    <>
      <AppShell.Header withBorder={false} bg="transparent" style={{ pointerEvents: 'none' }}>
        <Group justify="center" h="100%" px="md">
          <Group 
            bg="var(--mantine-color-body)" 
            px="md" 
            py="xs" 
            style={{ 
              pointerEvents: 'auto',
              borderRadius: 'var(--mantine-radius-md)', 
              border: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
              boxShadow: 'var(--mantine-shadow-md)'
            }}
          >
            <Group gap="sm" mr="md">
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
              <Anchor href="/" td="none" c={colorScheme == 'dark' ? 'white' : 'black'}>
                <Text variant='gradient' size="xl" fw="bold">Interactive FR</Text>
              </Anchor>
            </Group>
            <Group gap={5} visibleFrom="xs">
              {items}
            </Group>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar>
        <Stack p="md" gap={5}>
          {items}
        </Stack>
      </AppShell.Navbar>
    </>
  );
}