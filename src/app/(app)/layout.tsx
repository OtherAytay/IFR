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

  return (
    <AppShell
      h="100%"
      header={{ height: "3.5rem", collapsed: false, offset: true }}
      navbar={{ width: "20rem", breakpoint: 'sm', collapsed: { mobile: !opened, desktop: true } }}
      aside={{ width: "20rem", breakpoint: 'sm', collapsed: {mobile: !statePanelOpened, desktop: !statePanelOpened}}}
      footer={{height: "3.5rem", collapsed: false, offset: true}}>
      <Nav opened={opened} toggle={toggle} />
      <PageContext.Provider value={{
        statePanelOpened: statePanelOpened, toggleStatePanel: statePanelHandlers.toggle,
        openStatePanel: statePanelHandlers.open, closeStatePanel: statePanelHandlers.close
      }}>
        {children}
      </PageContext.Provider>
    </AppShell>
  );
}

function Nav({ opened, toggle }: { opened: boolean, toggle: () => void }) {
  const colorScheme = useComputedColorScheme();

  const links = [
    { link: '/', label: 'Home' },
    { link: '/club-bambi', label: 'Club Bambi' },
  ];

  const path = usePathname()
  const [active, setActive] = useState<string>();

  useEffect(() => {
    setActive(path)
  })

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
      <AppShell.Header>
        <Container hiddenFrom='xs' size="md" className={classes.inner}>
          <Group w="100%">
            <Group justify='flex-start'>
              <Burger opened={opened} onClick={toggle} size="sm" />
            </Group>
            <Anchor flex={1} href="/" td="none" c={colorScheme == 'dark' ? 'white' : 'black'}>
              <Text variant='gradient' size="xl" fw="bold">Interactive FR</Text>
            </Anchor>
          </Group>
        </Container>
        <Container visibleFrom="xs" size="md" className={classes.inner}>
          <Anchor href="/" td="none" c={colorScheme == 'dark' ? 'white' : 'black'}>
            <Text variant='gradient' size="xl" fw="bold">Interactive FR</Text>
          </Anchor>
          <Group gap={5} mx="auto">
            {items}
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Navbar>
        <Stack p="md" gap={5}>
          {items}
        </Stack>
      </AppShell.Navbar>
    </>
  );
}