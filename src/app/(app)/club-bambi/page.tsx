'use client'

import { ActionIcon, AppShell, Container, Group, Title, Text, Card, Divider, HoverCard, BackgroundImage, Table, Overlay, AspectRatio, Stack, Space, getGradient, useMantineTheme, MantineColor, Image, Badge, Tooltip, FloatingIndicator, Indicator } from "@mantine/core"
import { useContext } from "react"
import { CollapseContext, PageContext } from "../layout"
import { IconLayoutSidebarRightCollapse, IconLayoutSidebarRightExpandFilled } from "@tabler/icons-react"
import { useHover } from "@mantine/hooks"
import { Attribute, AttributeDetail, Attributes, Client, Clients, slugify, Stage, Stages, Uniform } from "@/IFR/club-bambi"

export default function Home() {
  const collapseContext: CollapseContext | null = useContext(PageContext)

  const debtPaid = 750
  const debt = 1500
  const uniformLevel = 7
  const uniformBonus = 3
  const stage = 2
  const client = 4

  return (
    <>
      <AppShell.Aside>
        {/*  */}
        <AppShell.Section mt="sm">
          <Title ta='center' fz='h3'>Client </Title>
        </AppShell.Section>
      </AppShell.Aside>
      <StatusBar debtPaid={debtPaid} debt={debt} uniformLevel={uniformLevel} uniformBonus={uniformBonus} stage={stage} client={client}/>
      <AppShell.Main mt="md">
        <Container fluid>
          <Group grow preventGrowOverflow={false}>
            <Container size="lg">

            </Container>
            <ActionIcon variant='subtle' flex={0} onClick={collapseContext.toggleStatePanel}>
              {collapseContext.statePanelOpened ? <IconLayoutSidebarRightCollapse /> : <IconLayoutSidebarRightExpandFilled />}
            </ActionIcon>
          </Group>

        </Container>

      </AppShell.Main>
    </>

  )
}

function StatusBar({ debtPaid, debt, uniformLevel, uniformBonus, stage, client }: { debtPaid: number, debt: number, uniformLevel: number, uniformBonus: number, stage: number, client: number }) {
  const theme = useMantineTheme()
  const { hovered: uniformHovered, ref: uniformRef } = useHover()
  const { hovered: clientHovered, ref: clientRef } = useHover()

  const clientDetail: Client = Clients[client - 1]
  const stageDetail: Stage = Stages[stage - 1]

  const UniformTable = []
  for (let i = 0; i < Uniform.length / 2; i++) {
    UniformTable.push((
      <Table.Tr key={i}>
        <Table.Th c={uniformLevel + uniformBonus >= i + 1 ? 'grape.4' : undefined}>{i + 1}</Table.Th>
        <Table.Td c={uniformLevel + uniformBonus >= i + 1 ? 'grape.4' : undefined}>{Uniform[i]}</Table.Td>
        <Table.Th c={uniformLevel + uniformBonus >= i + 7 ? 'grape.4' : undefined}>{i + 7}</Table.Th>
        <Table.Td c={uniformLevel + uniformBonus >= i + 7 ? 'grape.4' : undefined}>{Uniform[i + 6]}</Table.Td>
      </Table.Tr>
    ))
  }

  return (
    <AppShell.Footer p="sm">
      <Group h="100%" justify="center" gap="lg">
        {/* Debt Paid Progress */}
        <Card withBorder py="0.25rem">
          <Group>
            <Text>Debt Paid</Text>
            <Divider orientation="vertical" />
            <Text>${debtPaid} / ${debt}</Text>
          </Group>
        </Card>

        {/* Uniform */}
        <HoverCard offset={12}>
          <HoverCard.Target ref={uniformRef}>
            <Indicator label={`+${uniformBonus}`} disabled={!uniformBonus} color='grape' size={14}>
              <Card withBorder py="0.25rem" bg={uniformHovered ? getGradient(theme.other.gradients['club-bambi'], theme) : undefined} style={{ borderColor: 'violet' }}>
                <Group>
                  <Text>Uniform</Text>
                  <Divider orientation="vertical" />
                  <Text>{uniformLevel}</Text>
                </Group>
              </Card>
            </Indicator>

          </HoverCard.Target>
          <HoverCard.Dropdown p={0} style={{ borderColor: 'violet', borderRadius: '2rem' }}>
            <AspectRatio ratio={1 / 1}>
              <BackgroundImage radius="xl" p="sm" src='club-bambi/uniform.png' style={{ backgroundColor: "rgba(0, 0, 0, 0.2)", backgroundBlendMode: "darken" }}>
                <Stack h="100%">
                  <Space flex={1} />
                  <Card flex={3} radius="xl" style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", backgroundBlendMode: "darken", }}>
                    <Table withColumnBorders={false} withRowBorders={false} verticalSpacing="sm" fw="bold" c="white" fz="md">
                      <Table.Tbody>
                        {UniformTable}
                      </Table.Tbody>
                    </Table>
                  </Card>
                </Stack>
              </BackgroundImage>
            </AspectRatio>
          </HoverCard.Dropdown>
        </HoverCard>
        <Divider orientation="vertical" />

        {/* Stage */}
        <Card withBorder py="0.25rem">
          <Group>
            <Text>Stage</Text>
            <Divider orientation="vertical" />
            <Text>{stageDetail.name}</Text>
          </Group>
        </Card>

        {/* Client */}
        <HoverCard offset={12}>
          <HoverCard.Target ref={clientRef}>
            <Card withBorder py="0.25rem" bg={clientHovered ? getGradient(theme.other.gradients['club-bambi'], theme) : undefined} style={{ borderColor: 'violet' }}>
              <Group>
                <Text>Client</Text>
                <Divider orientation="vertical" />
                <Text>{clientDetail.name}</Text>
              </Group>
            </Card>
          </HoverCard.Target>
          <HoverCard.Dropdown p={0} style={{ borderColor: 'violet', borderRadius: '2rem' }}>
            <ClientCard client={client} />
          </HoverCard.Dropdown>
        </HoverCard>

      </Group>
    </AppShell.Footer>
  )
}

function ClientCard({ client }: { client: number }) {
  const clientDetail = Clients[client - 1]

  return (
    <Group h={250}>
      <AspectRatio ratio={2 / 3}>
        <Image radius="xl" h={250} src={`club-bambi/${slugify(clientDetail.name)}.png`} alt={`Client Image: ${clientDetail.name}`} />
      </AspectRatio>
      <Stack gap='xs' pe='xs' w={400}>
        <Title fz="h3" ta='center'>{clientDetail.name}</Title>
        <Text >
          {clientDetail.description}
        </Text>
        <Divider />
        <Group gap="xs" wrap="wrap">
          {clientDetail.attributes.map((attribute, idx) => (
            <AttributeChip attribute={attribute} key={idx} />
          ))}
        </Group>
      </Stack>
    </Group>)
}

function AttributeChip({ attribute }: { attribute: Attribute }) {
  const attributeDetail: AttributeDetail = Attributes[attribute]

  return (
    <Tooltip label={attributeDetail.description} bg={attributeDetail.color} w={200} multiline>
      <Badge radius="md" bg={attributeDetail.color} c='black'>{attribute}</Badge>
    </Tooltip>
  )
}