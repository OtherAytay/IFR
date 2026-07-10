'use client'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { A2M, A2M_THROATING, ANAL_CUM, ANAL_MODIFIER, ANAL_NEXT, ANAL_POSITION, ANAL_TASK, Attribute, AttributeDetail, Attributes, BONDAGE, bpmToPercent, BREEDER, CLEANER, CLIENT, Client, Clients, CollapseContext, CUM_NEXT, Decision, DIFFICULTY, Effect, EffectDetail, effectDetails, EffectExpiration, eventDetails, events, findDecision, GameHistory, GameLogRecord, GameState, HUMILIATION, INDUCTION, INSATIABLE, LIMP, LOCKED, ORAL_CUM, ORAL_MODIFIER, ORAL_NEXT, ORAL_POSITION, ORAL_TASK, OUTFIT, PAYMENT, PenetrationTask, PERMALOCKED, PUNISHMENT, randRange, slugify, Stage, Stages, STARTING_TASK, theme, UNIFORM, Uniform } from "@/IFR/club-bambi"
import { Accordion, ActionIcon, AppShell, AspectRatio, BackgroundImage, Badge, Box, Button, Card, Center, Collapse, Container, Divider, getGradient, Group, HoverCard, Image, Indicator, Modal, Paper, Popover, Progress, ScrollArea, SegmentedControl, SimpleGrid, Space, Stack, Switch, Table, Tabs, Text, Timeline, Title, Tooltip, Transition, useMantineTheme } from "@mantine/core"
import { useCounter, useDisclosure, useElementSize, useHover, useLocalStorage, useScrollIntoView, useViewportSize } from "@mantine/hooks"
import { IconBug, IconDice, IconLayoutSidebarRightCollapse, IconLayoutSidebarRightExpandFilled, IconLock, IconRefresh, IconRestore, IconSettings, IconTemperature } from "@tabler/icons-react"
import React, { useContext, useEffect, useMemo, useRef, useState } from "react"
import { PageContext } from '@/IFR/club-bambi'

dayjs.extend(duration)

const clubBambiGradient = theme.other.gradients['club-bambi']
const clubBambiTextColor = 'grape.4'

const defaultGameState: GameState = {
  debtPaid: 0,
  taskLeniency: 'client',
  stage: 1,
  currentEvent: DIFFICULTY,
  satisfaction: 0,
  bondage: 1,
  outfit: 1,
  previewUniformIncrease: 0,
  effects: new Set(),
  strokeSpeedUnit: 'bpm',
  taskTimeModifier: '1',
  debugMode: false,
  clientsServed: 0
}

const initializeClient: Partial<GameState> = {
  client: null,
  satisfaction: 0,
  bondage: 1,
  outfit: 1,
}

const tooltipEvents = { hover: true, focus: true, touch: true }

export default function Home() {
  const collapseContext: CollapseContext | null = useContext(PageContext)

  const [gameState, setGameState] = useLocalStorage<GameState>({
    key: 'club-bambi-save',
    defaultValue: defaultGameState,
    getInitialValueInEffect: true,
    serialize: (value) => {
      const { effects, ...rest } = value
      return JSON.stringify({ effects: [...effects], ...rest })
    },
    deserialize: (value) => {
      const { effects, ...rest } = JSON.parse(value)
      return { effects: new Set(effects as Effect[]), ...rest }
    }
  })

  const [gameHistory, setGameHistory] = useLocalStorage<GameLogRecord[]>({
    key: 'club-bambi-history',
    defaultValue: [],
  })

  useEffect(() => {
    if (gameState.stage == 2) {
      collapseContext.openStatePanel()
    }
  }, [])

  let event = null
  switch (gameState.currentEvent) {
    case DIFFICULTY:
      event = (<DifficultyEvent gameState={gameState} setGameState={setGameState} gameHistory={gameHistory} setGameHistory={setGameHistory} />)
      break;
    case UNIFORM:
      event = (<UniformEvent gameState={gameState} setGameState={setGameState} gameHistory={gameHistory} setGameHistory={setGameHistory} />)
      break;
    case CLIENT:
      event = (<ClientEvent gameState={gameState} setGameState={setGameState} gameHistory={gameHistory} setGameHistory={setGameHistory} />)
      break;
    case INDUCTION:
      event = (<InductionEvent gameState={gameState} setGameState={setGameState} gameHistory={gameHistory} setGameHistory={setGameHistory} />)
      break;
    case BONDAGE:
      event = (<BondageEvent gameState={gameState} setGameState={setGameState} gameHistory={gameHistory} setGameHistory={setGameHistory} />)
      break;
    case OUTFIT:
      event = (<OutfitEvent gameState={gameState} setGameState={setGameState} gameHistory={gameHistory} setGameHistory={setGameHistory} />)
      break;
    case STARTING_TASK:
      event = (<StartingTaskEvent gameState={gameState} setGameState={setGameState} gameHistory={gameHistory} setGameHistory={setGameHistory} />)
      break;
    case ORAL_POSITION:
    case ORAL_MODIFIER:
      event = (<OralEvent gameState={gameState} setGameState={setGameState} gameHistory={gameHistory} setGameHistory={setGameHistory} />)
      break;
    case ORAL_TASK:
      event = (<OralTaskEvent gameState={gameState} setGameState={setGameState} gameHistory={gameHistory} setGameHistory={setGameHistory} />)
      break;
    case ORAL_NEXT:
      event = (<OralNextEvent gameState={gameState} setGameState={setGameState} gameHistory={gameHistory} setGameHistory={setGameHistory} />)
      break;
    case ORAL_CUM:
      event = (<OralCumEvent gameState={gameState} setGameState={setGameState} gameHistory={gameHistory} setGameHistory={setGameHistory} />)
      break;
    case ANAL_POSITION:
    case ANAL_MODIFIER:
      event = (<AnalEvent gameState={gameState} setGameState={setGameState} gameHistory={gameHistory} setGameHistory={setGameHistory} />)
      break;
    case ANAL_TASK:
      event = (<AnalTaskEvent gameState={gameState} setGameState={setGameState} gameHistory={gameHistory} setGameHistory={setGameHistory} />)
      break;
    case ANAL_NEXT:
      event = (<AnalNextEvent gameState={gameState} setGameState={setGameState} gameHistory={gameHistory} setGameHistory={setGameHistory} />)
      break;
    case ANAL_CUM:
      event = (<AnalCumEvent gameState={gameState} setGameState={setGameState} gameHistory={gameHistory} setGameHistory={setGameHistory} />)
      break;
    case HUMILIATION:
      event = (<HumiliationEvent gameState={gameState} setGameState={setGameState} gameHistory={gameHistory} setGameHistory={setGameHistory} />)
      break;
    case PUNISHMENT:
      event = (<PunishmentEvent gameState={gameState} setGameState={setGameState} gameHistory={gameHistory} setGameHistory={setGameHistory} />)
      break;
    case CUM_NEXT:
      event = (<CumNextEvent gameState={gameState} setGameState={setGameState} gameHistory={gameHistory} setGameHistory={setGameHistory} />)
      break;
    case PAYMENT:
      event = (<PaymentEvent gameState={gameState} setGameState={setGameState} gameHistory={gameHistory} setGameHistory={setGameHistory} />)
      break;
  }

  return (
    <>
      <SidePanel gameState={gameState} setGameState={setGameState} gameHistory={gameHistory} setGameHistory={setGameHistory} />
      <StatusBar gameState={gameState} setGameState={setGameState} gameHistory={gameHistory} setGameHistory={setGameHistory} />
      <Box pt="5.5rem" pb="5rem" pl="md" pr="md">
        <Container fluid>
          <Group gap={0} grow preventGrowOverflow={false} wrap='nowrap'>
            <Container size="xl">
              {event}
            </Container>
            <ActionIcon variant='subtle' flex={0} onClick={collapseContext?.toggleStatePanel} color='violet'>
              {collapseContext?.statePanelOpened ? <IconLayoutSidebarRightCollapse /> : <IconLayoutSidebarRightExpandFilled />}
            </ActionIcon>
          </Group>
        </Container>
      </Box>
    </>
  )
}

function SidePanel({ gameState, setGameState, gameHistory, setGameHistory }: EventInput) {
  const [activeTab, setActiveTab] = useState<string>('Effects')
  const collapseContext: CollapseContext | null = useContext(PageContext)

  function filterExpiration(expiration: EffectExpiration) {
    return function (effect: Effect) {
      return effectDetails[effect].expiration == expiration
    }
  }

  const activeEffects = [...gameState.effects]
  const currentTaskEffects: Effect[] = useMemo(() => activeEffects.filter(filterExpiration('task')), [activeEffects])
  const currentClientEffects: Effect[] = useMemo(() => activeEffects.filter(filterExpiration('client')), [activeEffects])
  const currentGameEffects: Effect[] = useMemo(() => activeEffects.filter(filterExpiration('game')), [activeEffects])

  const { ref: asideRef, height: asideHeight } = useElementSize()
  const { ref: tabListRef, height: tabListHeight } = useElementSize()


  return (
    <AppShell.Aside
      p="0.75rem 0.75rem 0.75rem 0"
      style={{
        zIndex: 200,
        pointerEvents: collapseContext?.statePanelOpened ? 'auto' : 'none',
        flexDirection: 'column',
        border: 'none',
        backgroundColor: 'transparent',
      }}
    >
      <Paper 
        ref={asideRef} 
        style={{ 
          flex: 1, 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column',
          boxShadow: 'var(--mantine-shadow-md)',
          border: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
        }}
        radius="md" 
        bg="var(--mantine-color-body)"
      >
        <SegmentedControl
          value={activeTab}
          onChange={(val) => setActiveTab(val)}
          bg='none'
          color='violet'
          p='sm'
          pb={0}
          size='md'
          data={['Effects', 'History']}
          ref={tabListRef}
        />
        <Tabs value={activeTab} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Effects Panel */}
          <Tabs.Panel value='Effects' p='xs' style={{ flex: 1 }}>
            <ScrollArea.Autosize mah={asideHeight - tabListHeight - 33} offsetScrollbars='y' type='hover'>
              <Stack gap={0}>
                {/* Outfit & Bondage */}
                <Accordion variant='contained' mb='sm'>
                  <Accordion.Item value='bondage'>
                    <Accordion.Control>Bondage</Accordion.Control>
                    <Accordion.Panel>
                      <DecisionTable activeRoll={gameState.bondage} cumulative={true} decisionSet={eventDetails[BONDAGE]} />
                    </Accordion.Panel>
                  </Accordion.Item>
                  <Accordion.Item value='outfit'>
                    <Accordion.Control>Outfit</Accordion.Control>
                    <Accordion.Panel>
                      <DecisionTable activeRoll={gameState.outfit} cumulative={true} decisionSet={eventDetails[OUTFIT]} />
                    </Accordion.Panel>
                  </Accordion.Item>
                </Accordion>

                {/* Task Effects */}
                <Text fw='bold'>Task Effects</Text>
                <Text fz='sm' c='gray' mb='sm'>Effects that expire at the end of the current task</Text>
                {currentTaskEffects.length > 0
                  ? <EffectDisplayGroup effects={currentTaskEffects} />
                  : <Text ta='center' fw='lighter'> No active task effects!</Text>}
                <Divider my='sm' />

                {/* Client Effects */}
                <Text fw='bold'>Client Effects</Text>
                <Text fz='sm' c='gray' mb='sm'>Effects that expire at the end of the current client</Text>
                {currentClientEffects.length > 0
                  ? <EffectDisplayGroup effects={currentClientEffects} />
                  : <Text ta='center' fw='lighter'> No active client effects!</Text>}
                <Divider my='sm' />

                {/* Game Effects */}
                <Text fw='bold'>Game Effects</Text>
                <Text fz='sm' c='gray' mb='sm'>Effects that expire at the end of the current game</Text>
                {currentGameEffects.length > 0
                  ? <EffectDisplayGroup effects={currentGameEffects} />
                  : <Text ta='center' fw='lighter'> No active game effects!</Text>}
              </Stack>
            </ScrollArea.Autosize>
          </Tabs.Panel>

          {/* History Panel */}
          <Tabs.Panel value='History' p='xs' style={{ flex: 1 }}>
            <ScrollArea.Autosize mah={asideHeight - tabListHeight - 33} offsetScrollbars='y' type='hover'>
              <EventHistory gameState={gameState} gameHistory={gameHistory} />
            </ScrollArea.Autosize>
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </AppShell.Aside>
  )
}

function EventHistory({ gameState, gameHistory }: { gameState: GameState, gameHistory: GameHistory }) {

  return (
    <Accordion variant='filled'>
      {gameHistory.map((recordGroup, idx) => {
        if (Array.isArray(recordGroup)) {
          const [clientTitle, _] = LogItemProps(recordGroup[0])
          return (
            <Accordion.Item key={idx} value={idx.toString()}>
              <Accordion.Control>{clientTitle}</Accordion.Control>
              <Accordion.Panel>
                <Accordion variant='contained'>
                  {recordGroup.slice(1).map((record, idx2) => (
                    <EventHistoryItem key={`${idx}.${idx2}`} log={record} value={`${idx}.${idx2}`} />
                  ))}
                </Accordion>
              </Accordion.Panel>
            </Accordion.Item>

          )
        } else {
          return <EventHistoryItem key={idx} log={recordGroup} value={idx.toString()} />
        }
      })}

    </Accordion>
  )
}

function EventHistoryItem({ log, value }: { log: GameLogRecord, value: string }) {
  const [title, task] = LogItemProps(log)

  return (
    <Accordion.Item value={value}>
      <Accordion.Control style={!task && {'pointerEvents': 'none'}} chevron={!task && <></>}>{title}</Accordion.Control>
      {task ? <Accordion.Panel>{task}</Accordion.Panel> : null}
    </Accordion.Item>
  )
}

function LogItemProps(log: GameLogRecord): [React.ReactNode, string] {
  let task = null
  if (log.roll) {
    if (log.event == 'Client') {
      task = Clients[log.roll - 1].name
    } else if (log.event == 'Bondage' || log.event == 'Outfit') {
      task = 'See Effects Panel'
    } else if (eventDetails[log.event].length) {
      let decision: Decision = findDecision(log.roll, eventDetails[log.event])
      task = decision.name ?? decision.task ?? ''
    } else {

    }
  }

  let rollBadge = null
  if (log.roll) {
    rollBadge = (
      <Group justify='flex-end'>
        <Tooltip label='Roll' events={tooltipEvents}>
          <Badge radius='sm' color={clubBambiTextColor}>
            <Text fz='sm' fw='bold'>{log.roll}</Text>
          </Badge>
        </Tooltip>
      </Group>

    )
  }

  let title = (
    <Group grow preventGrowOverflow={false} mr='xs'>
      <Text c={clubBambiTextColor}>{log.event}{log.event == 'Client' && `: ${task}`} </Text>
      {rollBadge}
    </Group>
  )

  return [title, task]
}

function StatusBar({ gameState, setGameState, gameHistory, setGameHistory }: EventInput) {
  const theme = useMantineTheme()
  const { hovered: uniformHovered, ref: uniformRef } = useHover()
  const { hovered: clientHovered, ref: clientRef } = useHover()
  const { hovered: satisfactionHovered, ref: satisfactionRef } = useHover()

  const [resetModalOpened, resetModalHandlers] = useDisclosure(false)

  const clientDetail: Client = Clients[gameState.client - 1]
  const stageDetail: Stage = Stages[gameState.stage - 1]

  const uniformValue = gameState.uniform + (gameState.previewUniformIncrease ?? 0)
  let uniformBonus = 0
  if (gameState.client) {
    if (gameState.outfit >= 3) {
      uniformBonus += 1
    }
    if (gameState.outfit >= 8) {
      uniformBonus += 1
    }
  }

  function resetGame() {
    setGameState(defaultGameState)
    setGameHistory([])
    resetModalHandlers.close()
  }

  function adjustOption(option: string, value: any) {
    modifyState({ [option]: value }, gameState, setGameState)
  }

  const UniformTable = []
  for (let i = 0; i < Uniform.length / 2; i++) {
    UniformTable.push((
      <Table.Tr key={i}>
        <Table.Th c={uniformValue + uniformBonus >= i + 1 ? 'grape.4' : undefined}>{i + 1}</Table.Th>
        <Table.Td c={uniformValue + uniformBonus >= i + 1 ? 'grape.4' : undefined}>{Uniform[i]}</Table.Td>
        <Table.Th c={uniformValue + uniformBonus >= i + 7 ? 'grape.4' : undefined}>{i + 7}</Table.Th>
        <Table.Td c={uniformValue + uniformBonus >= i + 7 ? 'grape.4' : undefined}>{Uniform[i + 6]}</Table.Td>
      </Table.Tr>
    ))
  }

  let clientStatus = null
  let sizeStatus = null
  let satisfactionStatus = null
  if (clientDetail) {
    clientStatus = (
      <HoverCard offset={20} transitionProps={{ transition: 'pop' }}>
        <HoverCard.Target>
          <Card ref={clientRef} display={gameState.client ? undefined : 'none'} withBorder py="0.25rem" bg={clientHovered ? getGradient(theme.other.gradients['club-bambi'], theme) : undefined} style={{ borderColor: 'violet' }}>
            <Group>
              <Text>Client</Text>
              <Divider orientation="vertical" />
              <Text>{clientDetail.name}</Text>
            </Group>
          </Card>
        </HoverCard.Target>
        <HoverCard.Dropdown p={0} style={{ borderColor: 'violet', borderRadius: '2rem' }}>
          <ClientCard client={gameState.client} />
        </HoverCard.Dropdown>
      </HoverCard>
    )
    sizeStatus = (<StatusGroup display={gameState.client ? undefined : 'none'} leftChildren='Size' rightChildren={clientDetail.size} />)
    satisfactionStatus = (
      <HoverCard offset={20} transitionProps={{ transition: 'pop' }}>
        <HoverCard.Target>
          <Card ref={satisfactionRef} display={gameState.client ? undefined : 'none'} withBorder py="0.25rem" bg={satisfactionHovered ? getGradient(theme.other.gradients['club-bambi'], theme) : undefined} style={{ borderColor: 'violet' }}>
            <Group>
              <Text>Satisfaction</Text>
              <Divider orientation="vertical" />
              <Text>{gameState.satisfaction}</Text>
            </Group>
          </Card>
        </HoverCard.Target>
        <HoverCard.Dropdown p='md' w={300} style={{ borderColor: 'violet', borderRadius: '2rem' }}>
          <Stack gap={0}>
            <Text>
              As you perform sexual tasks for your client, their sexual satisfaction increases.
            </Text>
            <Progress.Root radius='sm' my='sm' size="xl">
              <Progress.Section value={Math.min(gameState.satisfaction * 10, 30)} color="red" animated />
              <Progress.Section value={Math.min(gameState.satisfaction * 10 - 30, 60)} color="green" animated />
              <Progress.Section value={Math.min(gameState.satisfaction * 10 - 90, 10)} color="blue" animated />
            </Progress.Root>
            <Text><Text span c='green'>Can Finish:</Text> 4</Text>
            <Text><Text span c='blue'>Guaranteed to Finish:</Text> 10</Text>
          </Stack>
        </HoverCard.Dropdown>
      </HoverCard>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 200,
      padding: '0 0.75rem 0.75rem 0.75rem',
    }}>
    <Paper
      p="sm"
      radius="md"
      bg="var(--mantine-color-body)"
      style={{
        border: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
        boxShadow: 'var(--mantine-shadow-md)',
      }}
    >
      <Group h="100%" justify="center" gap="lg">
        {/* Debt Paid Progress */}
        <StatusGroup display={gameState.debt ? undefined : 'none'} leftChildren='Debt Paid' rightChildren={`$${gameState.debtPaid} / $${gameState.debt}`} />

        {/* Uniform */}
        <HoverCard offset={20} transitionProps={{ transition: 'pop' }}>
          <HoverCard.Target>
            <Indicator ref={uniformRef} label={`+${uniformBonus}`} disabled={!uniformBonus || !gameState.uniform} color='grape' size={14}>
              <Card display={gameState.uniform ? undefined : 'none'} withBorder py="0.25rem" bg={uniformHovered ? getGradient(theme.other.gradients['club-bambi'], theme) : undefined} style={{ borderColor: 'violet' }}>
                <Group>
                  <Text>Uniform</Text>
                  <Divider orientation="vertical" />
                  <Text>{uniformValue.toString()}</Text>
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

        {/* Stage */}
        <StatusGroup leftChildren='Stage' rightChildren={stageDetail.name} />

        {/* Client */}
        {clientStatus}

        {/* Size */}
        {sizeStatus}

        {/* Sexual Satisfaction */}
        {satisfactionStatus}

        <Tooltip label='Reset Game' events={tooltipEvents}>
          <ActionIcon variant='subtle' size='lg' color='red' onClick={resetModalHandlers.open}><IconRestore /></ActionIcon>
        </Tooltip>
        <Modal title='Reset Game' opened={resetModalOpened} onClose={resetModalHandlers.close}>
          <Text>Are you sure you want to reset your game state, progress, and options? This <strong>cannot</strong> be undone.</Text>
          <Group justify='flex-end' mt='sm' gap='xs'>
            <Button variant='default' onClick={resetModalHandlers.close}>Cancel</Button>
            <Button color='red' onClick={resetGame}>Confirm Reset</Button>
          </Group>
        </Modal>

        {/* Options Popover */}
        <Popover offset={20}>
          <Popover.Target>
            <Tooltip label='Options' events={tooltipEvents}>
              <ActionIcon size='lg' variant='gradient'><IconSettings /></ActionIcon>
            </Tooltip>
          </Popover.Target>
          <Popover.Dropdown>
            <Title mb='sm'>
              <Text fz='h3' ta='center' fw='bold' c='violet'>Options</Text>
            </Title>

            <SimpleGrid cols={2} ta='center'>
              {/* Stroke Speed Unit */}
              <Center><Text>Stroke Speed Unit</Text></Center>
              <SegmentedControl
                color='violet'
                value={gameState.strokeSpeedUnit}
                onChange={(value) => adjustOption('strokeSpeedUnit', value)}
                data={[
                  { label: <Text span>BPM</Text>, value: 'bpm' },
                  { label: <Tooltip label="Stroke Speed % of a Hismith machine" events={tooltipEvents}><Text span>%</Text></Tooltip>, value: 'percent' }]}
              />

              {/* Task Time Modifier */}
              <Center><Text>Task Time Modifier</Text></Center>
              <SegmentedControl
                color='violet'
                value={gameState.taskTimeModifier}
                onChange={(value) => adjustOption('taskTimeModifier', value)}
                data={['0.5', '1', '1.5']}
              />

              {/* Debug */}
              <Center><Text>Debug Mode</Text></Center>
              <Center>
                <Switch
                  radius='md'
                  size='lg'
                  checked={gameState.debugMode}
                  onChange={(event) => adjustOption('debugMode', event.currentTarget.checked)}
                />
              </Center>

            </SimpleGrid>
          </Popover.Dropdown>
        </Popover>
      </Group>

    </Paper>
    </div>
  )
}

function StatusGroup({ leftChildren, rightChildren, ...props }) {
  return (
    <Card withBorder py="0.25rem" {...props}>
      <Group>
        <Text>{leftChildren}</Text>
        <Divider orientation="vertical" />
        <Text>{rightChildren}</Text>
      </Group>
    </Card>
  )
}

function ClientCard({ client }: { client: number }) {
  const clientDetail = Clients[client - 1]

  return (
    <Group h={250} wrap='nowrap'>
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
    <Tooltip label={attributeDetail.description} bg={attributeDetail.color} w={200} events={tooltipEvents} multiline>
      <Badge radius="md" bg={attributeDetail.color} c='black'>{attribute}</Badge>
    </Tooltip>
  )
}

function BasicEvent({ children, name, canContinue, nextEvent, image, ratio }: { children: React.ReactNode, name: string, canContinue: boolean, nextEvent: () => void, image: string, ratio: number }) {

  const { width: vw, height: vh } = useViewportSize()
  const { ref, width, height } = useElementSize()

  return (
    <Group grow h='82vh'>
      <AspectRatio flex={1} ref={ref} ratio={ratio}>
        <Image maw={Math.min(width, 82 / 100 * vh * ratio)} mah='82vh' radius='md' src={image} style={{ float: 'right' }} />
      </AspectRatio>
      <Stack h='100%'>
        <Card withBorder h='100%'>
          <Card.Section withBorder p='xs'>
            <Title ta='center'>{name}</Title>
          </Card.Section>
          <Card.Section h='100%' component={ScrollArea} type='hover' scrollbars='y' offsetScrollbars='y'>
            <div style={{ padding: '1rem' }}>
              {children}
            </div>
          </Card.Section>
        </Card>
        <Button variant='gradient' gradient={clubBambiGradient} disabled={!canContinue} onClick={nextEvent}><Text fz='h4'>Continue</Text></Button>
      </Stack>
    </Group>
  )
}
type EventInput = {
  gameState: GameState,
  setGameState: (gameState: GameState) => void
  gameHistory: GameLogRecord[],
  setGameHistory: (gameHistory: GameLogRecord[]) => void
}

function DifficultyEvent({ gameState, setGameState }: EventInput) {
  const [difficultyChoice, setDifficultyChoice] = useState<'750' | '1500' | '2500'>('750')
  const [leniencyChoice, setLeniencyChoice] = useState<'task' | 'client' | 'none'>(defaultGameState['taskLeniency'])

  function nextEvent() {
    modifyState({
      'debt': parseInt(difficultyChoice),
      'taskLeniency': leniencyChoice,
      'currentEvent': UNIFORM
    }, gameState, setGameState)
  }

  const difficultyOptions = [
    { label: '$750', value: '750' },
    { label: '$1500', value: '1500' },
    { label: '$2500', value: '2500' }
  ]

  const leniencyOptions = [
    { label: <Tooltip label='Allowed 1 reroll per task'><Text>Per Task</Text></Tooltip>, value: 'task' },
    { label: <Tooltip label='Allowed 3 rerolls per client'><Text>Per Client</Text></Tooltip>, value: 'client' },
    { label: <Tooltip label='No rerolls allowed'><Text>None</Text></Tooltip>, value: 'none' },
  ]

  return (
    <BasicEvent name='Difficulty' canContinue={true} nextEvent={nextEvent} image='club-bambi/mistress-stella.png' ratio={2 / 3}>
      <Card.Section p='xs'>
        <SimpleGrid cols={2}>
          {/* Debt */}
          <Center><Text fz='h3'>Debt Owed</Text></Center>
          <SegmentedControl color='violet' data={difficultyOptions} value={difficultyChoice} onChange={setDifficultyChoice as () => void} />

          {/* Task Leniency */}
          <Center><Text fz='h3'>Task Leniency</Text></Center>
          <SegmentedControl color='violet' data={leniencyOptions} value={leniencyChoice} onChange={setLeniencyChoice as () => void} />
        </SimpleGrid>
        <Center>
        </Center>
      </Card.Section>
    </BasicEvent>
  )
}

function UniformEvent({ gameState, setGameState, gameHistory, setGameHistory }: EventInput) {
  const [uniformRoll, setUniformRoll] = useState<number | null>(null) //eslint-disable-line react-hooks/rules-of-hooks

  const initialRerolls = gameState.taskLeniency == 'task' || gameState.taskLeniency == 'client' ? 1 : 0
  const [rerolls, { decrement: reroll }] = useCounter(initialRerolls, { min: 0, max: initialRerolls }) //eslint-disable-line react-hooks/rules-of-hooks

  function setUniform(roll: number) {
    setUniformRoll(roll)
    modifyState({ 'uniform': roll }, gameState, setGameState)
  }

  function nextEvent() {
    generateLogRecord({ event: gameState.currentEvent, roll: uniformRoll }, gameHistory, setGameHistory)
    modifyState({ 'currentEvent': CLIENT }, gameState, setGameState)
  }

  const UniformTable = []
  for (let i = 0; i < Uniform.length / 2; i++) {
    UniformTable.push((
      <Table.Tr key={i}>
        <Table.Th c={uniformRoll >= i + 1 ? 'grape.4' : undefined}>{i + 1}</Table.Th>
        <Table.Td c={uniformRoll >= i + 1 ? 'grape.4' : undefined}>{Uniform[i]}</Table.Td>
        <Table.Th c={uniformRoll >= i + 7 ? 'grape.4' : undefined}>{i + 7}</Table.Th>
        <Table.Td c={uniformRoll >= i + 7 ? 'grape.4' : undefined}>{Uniform[i + 6]}</Table.Td>
      </Table.Tr>
    ))
  }

  return (
    <BasicEvent name='Uniform' canContinue={!!uniformRoll} nextEvent={nextEvent} image='club-bambi/uniform.png' ratio={1 / 1}>
      <Card.Section px='md'>
        <Table withColumnBorders={false} withRowBorders={false} verticalSpacing="sm" fw="bold" c="white" fz="md">
          <Table.Tbody>
            {UniformTable}
          </Table.Tbody>
        </Table>
      </Card.Section>
      <Card.Section p='xs'>
        <Center>
          <Roller roll={uniformRoll} setRoll={setUniform} rollFn={() => randRange(1, 6)} rerolls={rerolls} reroll={reroll} />
        </Center>
      </Card.Section>
    </BasicEvent>
  )
}

function ClientEvent({ gameState, setGameState, gameHistory, setGameHistory }: EventInput) {
  const [clientRoll, setClientRoll] = useState<number | null>(null)

  function rollClient() {
    if (gameState.clientsServed == 0) {
      return randRange(1, 6) // Include only clients with small or medium size
    } else if (gameState.clientsServed == 1) {
      return randRange(1, Clients.length - 1) // exclude clients with huge size
    } else {
      return randRange(1, Clients.length)
    }
  }

  function setClient(roll: number) {
    setClientRoll(roll)
    const rerollsRemaining = gameState.taskLeniency == 'client' ? { rerollsRemaining: 3 } : {}
    modifyState({ 'client': roll, ...rerollsRemaining }, gameState, setGameState)
  }

  function induction() {
    modifyState({ 'currentEvent': INDUCTION }, gameState, setGameState)
  }

  function nextEvent() {
    generateLogRecord({ event: gameState.currentEvent, roll: clientRoll }, gameHistory, setGameHistory)
    modifyState({ 'currentEvent': BONDAGE }, gameState, setGameState)
  }

  return (
    <Stack>
      <SimpleGrid cols={5}>
        {Clients.map((client, idx) => (
          <Card withBorder key={idx} p={0} radius='xl' style={clientRoll == idx + 1 ? { borderColor: 'violet' } : undefined}>
            <AspectRatio ratio={2 / 3}>
              <BackgroundImage src={`club-bambi/${slugify(client.name)}.png`}>
                <Stack justify='end' h='100%' w='100%'>
                  <Card py={0} radius={0}>
                    <Text variant={clientRoll == idx + 1 ? 'gradient' : undefined} gradient={clubBambiGradient} ta='center' fw='bold' fz='h5'>{client.name}</Text>
                  </Card>
                </Stack>
              </BackgroundImage>
            </AspectRatio>
          </Card>
        ))}
      </SimpleGrid>
      <Center mb='sm'>
        <Roller roll={clientRoll} setRoll={setClient} rollFn={rollClient} />
        <Button display={!clientRoll ? 'none' : undefined} ml='sm' variant='gradient' gradient={clubBambiGradient} onClick={nextEvent}>Continue</Button>
        <Button display={clientRoll ? 'none' : undefined} ml='sm' variant='gradient' gradient={clubBambiGradient} onClick={induction}>Request Induction</Button>
      </Center>
    </Stack>

  )
}

function InductionEvent({ gameState, setGameState, gameHistory, setGameHistory }: EventInput) {
  const [timerFinished, { open: finishTimer }] = useDisclosure(false)

  function nextEvent() {
    if (timerFinished) {
      generateLogRecord({ event: gameState.currentEvent }, gameHistory, setGameHistory)
    }
    modifyState({ 'currentEvent': CLIENT }, gameState, setGameState)
  }

  return (
    <BasicEvent name='Induction' canContinue={true} nextEvent={nextEvent} image='club-bambi/induction.png' ratio={33 / 50}>
      <Stack>
        <Text>
          The bambi state of mind converts pain and humiliation into pleasure. 
          Bambis may request an induction session to induce or reinforce this state of mind to physically and mentally prepare for their next client.
        </Text>
        <Divider />
        <Text>
          Insert a medium buttplug and listen to <a href="https://bambicloud.com/playlist/5c030156-6009-4262-8e2e-80481ee203b9" target='_blank' rel='noreferrer noopener'>Bambi File</a> titled &quot;Fake Plastic Fuckpuppet&quot;
        </Text>
        <Divider />
        <TaskTimer duration={916 / 60} finishCallback={finishTimer} debug={gameState.debugMode} />
      </Stack>
    </BasicEvent>
  )
}

function reroll(consumeReroll: () => void, gameState: GameState, setGameState: (gameState: GameState) => void) {
  consumeReroll()
  if (gameState.taskLeniency == 'client') {
    modifyState({ 'rerollsRemaining': gameState.rerollsRemaining - 1 }, gameState, setGameState)
  }
}

function BondageEvent({ gameState, setGameState, gameHistory, setGameHistory }: EventInput) {
  const [bondageRoll, setBondageRoll] = useState<number | null>(null)
  const attributeDetail: AttributeDetail = Attributes['Kinky']

  const initialRerolls = gameState.taskLeniency == 'client' ? gameState.rerollsRemaining : gameState.taskLeniency == 'task' ? 1 : 0
  const [rerolls, { decrement: useReroll }] = useCounter(initialRerolls, { min: 0 })

  let bondageBonus = 0
  if (Clients[gameState.client - 1].attributes.includes('Kinky')) {
    bondageBonus = 3
  }

  function setBondage(roll: number) {
    setBondageRoll(roll)
    modifyState({ 'bondage': roll + bondageBonus }, gameState, setGameState)
  }

  function nextEvent() {
    generateLogRecord({ event: gameState.currentEvent, roll: bondageRoll }, gameHistory, setGameHistory)
    modifyState({ 'currentEvent': OUTFIT }, gameState, setGameState)
  }

  return (
    <BasicEvent name='Bondage' canContinue={!!bondageRoll} nextEvent={nextEvent} image='club-bambi/bondage.png' ratio={3 / 5}>
      <Card.Section>
        <DecisionTable activeRoll={bondageRoll ? bondageRoll + bondageBonus : null} cumulative={true} decisionSet={eventDetails[BONDAGE]} />
        <Center mt='sm'>
          <Indicator label={`+${bondageBonus}`} disabled={!bondageBonus} color={attributeDetail.color} size={14}>
            <Roller roll={bondageRoll} setRoll={setBondage} rollFn={r10} rerolls={rerolls} reroll={() => reroll(useReroll, gameState, setGameState)} />
          </Indicator>
        </Center>
      </Card.Section>
    </BasicEvent>
  )
}

function OutfitEvent({ gameState, setGameState, gameHistory, setGameHistory }: EventInput) {
  const [outfitRoll, setOutfitRoll] = useState<number | null>(null)
  const attributeDetail: AttributeDetail = Attributes['Cosplay']

  const initialRerolls = gameState.taskLeniency == 'client' ? gameState.rerollsRemaining : gameState.taskLeniency == 'task' ? 1 : 0
  const [rerolls, { decrement: useReroll }] = useCounter(initialRerolls, { min: 0 })

  let outfitBonus = 0
  if (Clients[gameState.client - 1].attributes.includes('Cosplay')) {
    outfitBonus = 2
  }

  function setOutfit(roll: number) {
    setOutfitRoll(roll)

    const finalRoll = roll + outfitBonus

    let uniformIncrease = 0
    if (finalRoll >= 9) {
      uniformIncrease++
    }
    if (finalRoll >= 10) {
      uniformIncrease++
    }

    return modifyState({
      'outfit': finalRoll,
      'previewUniformIncrease': uniformIncrease
    }, gameState, setGameState)
  }

  function nextEvent() {
    generateLogRecord({ event: gameState.currentEvent, roll: outfitRoll }, gameHistory, setGameHistory)

    const finalRoll = outfitRoll + outfitBonus

    let uniformIncrease = 0
    if (finalRoll >= 9) {
      uniformIncrease++
    }
    if (finalRoll >= 10) {
      uniformIncrease++
    }

    modifyState({ 
      'uniform': gameState.uniform + uniformIncrease,
      'previewUniformIncrease': 0,
      'currentEvent': STARTING_TASK,
    }, gameState, setGameState)
  }

  return (
    <BasicEvent name='Outfit' canContinue={!!outfitRoll} nextEvent={nextEvent} image='club-bambi/outfit.png' ratio={3 / 5}>
      <Card.Section>
        <DecisionTable activeRoll={outfitRoll ? outfitRoll + outfitBonus : null} cumulative={true} decisionSet={eventDetails[OUTFIT]} />
        <Center mt='sm'>
          <Indicator label={`+${outfitBonus}`} disabled={!outfitBonus} color={attributeDetail.color} size={14}>
            <Roller roll={outfitRoll} setRoll={setOutfit} rollFn={r10} rerolls={rerolls} reroll={(newGameState) => reroll(useReroll, newGameState, setGameState)} />
          </Indicator>
        </Center>
      </Card.Section>
    </BasicEvent>
  )
}

function StartingTaskEvent({ gameState, setGameState, gameHistory, setGameHistory }: EventInput) {
  const [taskRoll, setTaskRoll] = useState<number | null>(null)
  const decisionSet = eventDetails[STARTING_TASK]

  const initialRerolls = gameState.taskLeniency == 'client' ? gameState.rerollsRemaining : gameState.taskLeniency == 'task' ? 1 : 0
  const [rerolls, { decrement: useReroll }] = useCounter(initialRerolls, { min: 0 })

  function nextEvent() {
    const decision = findDecision(taskRoll, decisionSet)
    generateLogRecord({ event: gameState.currentEvent, roll: taskRoll }, gameHistory, setGameHistory)
    modifyState({ 'currentEvent': decision.task }, gameState, setGameState)
  }

  return (
    <BasicEvent name='Starting Task' canContinue={!!taskRoll} nextEvent={nextEvent} image='club-bambi/starting-task.png' ratio={1 / 1}>
      <Card.Section>
        <DecisionTable activeRoll={taskRoll} decisionSet={decisionSet} />
        <Center mt='sm'>
          <Roller roll={taskRoll} setRoll={setTaskRoll} rollFn={r10} rerolls={rerolls} reroll={() => reroll(useReroll, gameState, setGameState)} />
        </Center>
      </Card.Section>
    </BasicEvent>
  )
}

function OralEvent({ gameState, setGameState, gameHistory, setGameHistory }: EventInput) {
  const throating = gameState.effects.has(A2M_THROATING)
  const [positionRoll, setPositionRoll] = useState<number | null>(throating ? 10 : null)
  const [modifierRoll, setModifierRoll] = useState<number | null>(throating ? 10 : null)

  const initialRerolls = gameState.taskLeniency == 'client' ? gameState.rerollsRemaining : gameState.taskLeniency == 'task' ? 1 : 0
  const [rerolls, { decrement: useReroll }] = useCounter(initialRerolls, { min: 0 })

  function nextEvent() {
    generateLogRecord({ event: ORAL_POSITION, roll: positionRoll }, gameHistory, setGameHistory)
    generateLogRecord({ event: ORAL_MODIFIER, roll: modifierRoll }, gameHistory, setGameHistory)
    modifyState({
      'currentEvent': ORAL_TASK,
      'currentTask': {
        'task': ORAL_TASK,
        'position': positionRoll,
        'modifier': modifierRoll,
      }
    }, gameState, setGameState)
  }

  return (
    <BasicEvent name='Oral' canContinue={!!positionRoll && !!modifierRoll} nextEvent={nextEvent} image='club-bambi/oral.png' ratio={3 / 5}>
      <Stack gap={0} mb='xs'>
        <Text px='sm'>Roll your oral position and modifier. You will begin your task on the next screen.</Text>
        <Divider />
        <Text fz='h3' fw='bold' ta='center'>Position</Text>
        <DecisionTable activeRoll={positionRoll} decisionSet={eventDetails[ORAL_POSITION]} />
        <Center>
          <Roller roll={positionRoll} setRoll={setPositionRoll} rollFn={r10} readOnly={throating} rerolls={rerolls} reroll={() => reroll(useReroll, gameState, setGameState)} />
        </Center>
        <Divider my='sm' />
        <Text fz='h3' fw='bold' ta='center'>Modifier</Text>
        <DecisionTable activeRoll={modifierRoll} decisionSet={eventDetails[ORAL_MODIFIER]} />
        <Center>
          <Roller roll={modifierRoll} setRoll={setModifierRoll} rollFn={r10} readOnly={throating} rerolls={rerolls} reroll={() => reroll(useReroll, gameState, setGameState)} />
        </Center>
      </Stack>
    </BasicEvent>
  )
}

function AnalEvent({ gameState, setGameState, gameHistory, setGameHistory }: EventInput) {
  const [positionRoll, setPositionRoll] = useState<number | null>(null)
  const [modifierRoll, setModifierRoll] = useState<number | null>(null)

  const initialRerolls = gameState.taskLeniency == 'client' ? gameState.rerollsRemaining : gameState.taskLeniency == 'task' ? 1 : 0
  const [rerolls, { decrement: useReroll }] = useCounter(initialRerolls, { min: 0 })

  function nextEvent() {
    generateLogRecord({ event: ANAL_POSITION, roll: positionRoll }, gameHistory, setGameHistory)
    generateLogRecord({ event: ANAL_MODIFIER, roll: modifierRoll }, gameHistory, setGameHistory)
    modifyState({
      'currentEvent': ANAL_TASK,
      'currentTask': {
        'task': ANAL_TASK,
        'position': positionRoll,
        'modifier': modifierRoll,
      }
    }, gameState, setGameState)
  }

  return (
    <BasicEvent name='Anal' canContinue={!!positionRoll && !!modifierRoll} nextEvent={nextEvent} image='club-bambi/anal.png' ratio={5 / 3}>
      <Stack gap={0} mb='xs'>
        <Text px='sm'>Roll your anal position and modifier. You will begin your task on the next screen.</Text>
        <Divider />
        <Text fz='h3' fw='bold' ta='center'>Position</Text>
        <DecisionTable activeRoll={positionRoll} decisionSet={eventDetails[ANAL_POSITION]} />
        <Center>
          <Roller roll={positionRoll} setRoll={setPositionRoll} rollFn={r10} rerolls={rerolls} reroll={() => reroll(useReroll, gameState, setGameState)} />
        </Center>
        <Divider my='sm' />
        <Text fz='h3' fw='bold' ta='center'>Modifier</Text>
        <DecisionTable activeRoll={modifierRoll} decisionSet={eventDetails[ANAL_MODIFIER]} />
        <Center>
          <Roller roll={modifierRoll} setRoll={setModifierRoll} rollFn={r10} rerolls={rerolls} reroll={() => reroll(useReroll, gameState, setGameState)} />
        </Center>
      </Stack>
    </BasicEvent>
  )
}

function OralTaskEvent({ gameState, setGameState, gameHistory, setGameHistory }: EventInput) {
  const [timerFinished, { open: finishTimer }] = useDisclosure(false)

  const currentTask = gameState.currentTask

  const attributes = Clients[gameState.client - 1].attributes
  const position = findDecision(currentTask.position, eventDetails[ORAL_POSITION]) as PenetrationTask
  const modifier = findDecision(currentTask.modifier, eventDetails[ORAL_MODIFIER])

  let speedBonus = 0;
  if (attributes.includes('Insatiable')) {
    speedBonus = 30
  }

  let attributeTasks = []
  if (position.attributeTasks) {
    for (const [attribute, task] of Object.entries(position.attributeTasks)) {
      if (attributes.includes(attribute as Attribute)) {
        const attributeDetail = Attributes[attribute]
        attributeTasks.push((
          <Text key={attribute} c={attributeDetail.color}>{task}</Text>
        ))
      }
    }
  }

  function nextEvent() {
    modifyState({
      'currentEvent': ORAL_NEXT,
      'satisfaction': gameState.satisfaction + 1 + attributeTasks.length,
      'effects': expireEffects(gameState.effects, 'task')
    }, gameState, setGameState)
  }

  let speed = null
  if (gameState.strokeSpeedUnit == 'bpm') {
    speed = `${position.speed + speedBonus} BPM`
  } else {
    speed = `${bpmToPercent(position.speed + speedBonus)} %`
  }

  let taskTimeModifier = parseFloat(gameState.debugMode ? '0.01' : gameState.taskTimeModifier ?? '1')
  let duration = position.duration * taskTimeModifier
  let durationDisplay = `${duration} min`

  return (
    <BasicEvent name='Oral Task' canContinue={timerFinished} nextEvent={nextEvent} image={`club-bambi/${slugify(position.name)}.png`} ratio={7 / 10}>
      <Stack>
        <Title ta='center' fz='h3'>{position.name}</Title>
        <Text>{position.description}</Text>
        <Divider />
        <Text>{position.task}</Text>
        {attributeTasks}
        <Group justify='center'>
          <StatusGroup leftChildren='Duration' rightChildren={durationDisplay} />
          {position.speed ?
            <StatusGroup
              leftChildren='Speed'
              rightChildren={<Text span c={speedBonus ? Attributes[INSATIABLE].color : undefined}>{speed}</Text>} />
            : null}
          {position.depth ? <StatusGroup leftChildren='Depth' rightChildren={position.depth} /> : null}
        </Group>
        <Divider />
        <Text>{modifier.task}</Text>
        <Divider />
        <TaskTimer duration={duration} finishCallback={finishTimer} debug={gameState.debugMode} />
      </Stack>
    </BasicEvent>
  )
}

function AnalTaskEvent({ gameState, setGameState, gameHistory, setGameHistory }: EventInput) {
  const [timerFinished, { open: finishTimer }] = useDisclosure(false)

  const currentTask = gameState.currentTask

  const attributes = Clients[gameState.client - 1].attributes
  const position = findDecision(currentTask.position, eventDetails[ANAL_POSITION]) as PenetrationTask
  const modifier = findDecision(currentTask.modifier, eventDetails[ANAL_MODIFIER]) as PenetrationTask

  let speedBonus = 0;
  if (attributes.includes('Insatiable')) {
    speedBonus = 30
  }

  let positionAttributeTasks = []
  if (position.attributeTasks) {
    for (const [attribute, task] of Object.entries(position.attributeTasks)) {
      if (attributes.includes(attribute as Attribute)) {
        const attributeDetail = Attributes[attribute]
        positionAttributeTasks.push((
          <Text key={attribute} c={attributeDetail.color}>{task}</Text>
        ))
      }
    }
  }

  let modifierAttributeTasks = []
  if (modifier.attributeTasks) {
    for (const [attribute, task] of Object.entries(modifier.attributeTasks)) {
      if (attributes.includes(attribute as Attribute)) {
        const attributeDetail = Attributes[attribute]
        modifierAttributeTasks.push((
          <Text key={attribute} c={attributeDetail.color}>{task}</Text>
        ))
      }
    }
  }

  function nextEvent() {
    let nextEvent = ANAL_NEXT
    if (gameState.effects.has(A2M)) {
      nextEvent = ORAL_POSITION
    }

    modifyState({
      'currentEvent': nextEvent,
      'satisfaction': gameState.satisfaction + 1 + positionAttributeTasks.length + modifierAttributeTasks.length,
      'effects': expireEffects(gameState.effects, 'task')
    }, gameState, setGameState)
  }

  let speed = null
  if (gameState.strokeSpeedUnit == 'bpm') {
    speed = `${position.speed + speedBonus} BPM`
  } else {
    speed = `${bpmToPercent(position.speed + speedBonus)} %`
  }

  let taskTimeModifier = parseFloat(gameState.debugMode ? '0.01' : gameState.taskTimeModifier ?? '1')
  let duration = position.duration * taskTimeModifier
  let durationDisplay = `${duration} min`

  return (
    <BasicEvent name='Anal Task' canContinue={timerFinished} nextEvent={nextEvent} image={`club-bambi/${slugify(position.name)}.png`} ratio={7 / 10}>
      <Stack>
        <Title ta='center' fz='h3'>{position.name}</Title>
        <Text>{position.description}</Text>
        <Divider />
        <Text>{position.task}</Text>
        {positionAttributeTasks}
        <Group justify='center'>
          <StatusGroup leftChildren='Duration' rightChildren={durationDisplay} />
          {position.speed ?
            <StatusGroup
              leftChildren='Speed'
              rightChildren={<Text span c={speedBonus ? Attributes[INSATIABLE].color : undefined}>{speed}</Text>} />
            : null}
          {position.depth ? <StatusGroup leftChildren='Depth' rightChildren={position.depth} /> : null}
        </Group>
        <Divider />
        <Text>{modifier.task}</Text>
        {modifierAttributeTasks}
        <Divider />
        <TaskTimer duration={duration} finishCallback={finishTimer} debug={gameState.debugMode} />
      </Stack>
    </BasicEvent>
  )
}

function OralNextEvent({ gameState, setGameState, gameHistory, setGameHistory }: EventInput) {
  const [taskRoll, setTaskRoll] = useState<number | null>(null)
  const decisionSet = eventDetails[ORAL_NEXT]

  const initialRerolls = gameState.taskLeniency == 'client' ? gameState.rerollsRemaining : gameState.taskLeniency == 'task' ? 1 : 0
  const [rerolls, { decrement: useReroll }] = useCounter(initialRerolls, { min: 0 })

  function nextEvent() {
    const decision = findDecision(taskRoll, decisionSet)
    generateLogRecord({ event: gameState.currentEvent, roll: taskRoll }, gameHistory, setGameHistory)
    modifyState({ 'currentEvent': decision.task }, gameState, setGameState)
  }


  return (
    <BasicEvent name='Oral Next Task' canContinue={!!taskRoll} nextEvent={nextEvent} image='club-bambi/oral-next.png' ratio={1 / 1}>
      <Card.Section>
        <DecisionTable activeRoll={taskRoll} decisionSet={decisionSet} />
        <Center mt='sm'>
          <Roller roll={taskRoll} setRoll={setTaskRoll} rollFn={r10} rerolls={rerolls} reroll={() => reroll(useReroll, gameState, setGameState)} />
        </Center>
      </Card.Section>
    </BasicEvent>
  )
}

function AnalNextEvent({ gameState, setGameState, gameHistory, setGameHistory }: EventInput) {
  const [taskRoll, setTaskRoll] = useState<number | null>(null)
  const decisionSet = eventDetails[ANAL_NEXT]

  const initialRerolls = gameState.taskLeniency == 'client' ? gameState.rerollsRemaining : gameState.taskLeniency == 'task' ? 1 : 0
  const [rerolls, { decrement: useReroll }] = useCounter(initialRerolls, { min: 0 })

  function nextEvent() {
    const decision = findDecision(taskRoll, decisionSet)
    generateLogRecord({ event: gameState.currentEvent, roll: taskRoll }, gameHistory, setGameHistory)
    modifyState({ 'currentEvent': decision.task }, gameState, setGameState)
  }

  return (
    <BasicEvent name='Anal Next Task' canContinue={!!taskRoll} nextEvent={nextEvent} image='club-bambi/anal-next.png' ratio={1 / 1}>
      <Card.Section>
        <DecisionTable activeRoll={taskRoll} decisionSet={decisionSet} />
        <Center mt='sm'>
          <Roller roll={taskRoll} setRoll={setTaskRoll} rollFn={r10} rerolls={rerolls} reroll={() => reroll(useReroll, gameState, setGameState)} />
        </Center>
      </Card.Section>
    </BasicEvent>
  )
}

function OralCumEvent({ gameState, setGameState, gameHistory, setGameHistory }: EventInput) {
  const [cumRoll, setCumRoll] = useState<number | null>(null)

  const initialRerolls = gameState.taskLeniency == 'client' ? gameState.rerollsRemaining : gameState.taskLeniency == 'task' ? 1 : 0
  const [rerolls, { decrement: useReroll }] = useCounter(initialRerolls, { min: 0 })

  let cumMultiplier = 1
  let satisfactionBonus = 0
  if (Clients[gameState.client - 1].attributes.includes(BREEDER)) {
    cumMultiplier = 2
    satisfactionBonus = 1
  }

  function nextEvent() {
    generateLogRecord({ event: gameState.currentEvent, roll: cumRoll }, gameHistory, setGameHistory)
    modifyState({
      'currentEvent': CUM_NEXT,
      'satisfaction': gameState.satisfaction + 1 + satisfactionBonus
    }, gameState, setGameState)
  }

  const decisionSet = eventDetails[ORAL_CUM]
  const cum = cumRoll ? findDecision(cumRoll, decisionSet) : null

  return (
    <BasicEvent name='Cum from Oral' canContinue={!!cumRoll} nextEvent={nextEvent} image='club-bambi/oral-cum.png' ratio={1 / 1}>
      <Card.Section p='sm' withBorder>
        <Text>
          Your cannot clean off any cum until you finish with this client, except for any in/on your eyes.
        </Text>
      </Card.Section>
      <Card.Section withBorder={!!cumRoll}>
        <DecisionTable activeRoll={cumRoll} decisionSet={decisionSet} />
        <Center my='sm'>
          <Roller roll={cumRoll} setRoll={setCumRoll} rollFn={r10} rerolls={rerolls} reroll={() => reroll(useReroll, gameState, setGameState)} />
        </Center>
      </Card.Section>
      {cumRoll ?
        <Card.Section p='sm'>
          <Group justify='center'>
            <StatusGroup leftChildren='Cum Amount'
              rightChildren={<Text span c={cumMultiplier > 1 ? Attributes[BREEDER].color : undefined}>{`${cum.cum * cumMultiplier} ml`}</Text>} />
          </Group>
        </Card.Section>
        : null}
    </BasicEvent>
  )
}

function AnalCumEvent({ gameState, setGameState, gameHistory, setGameHistory }: EventInput) {
  const [cumRoll, setCumRoll] = useState<number | null>(null)

  const initialRerolls = gameState.taskLeniency == 'client' ? gameState.rerollsRemaining : gameState.taskLeniency == 'task' ? 1 : 0
  const [rerolls, { decrement: useReroll }] = useCounter(initialRerolls, { min: 0 })

  let cumMultiplier = 1
  let satisfactionBonus = 0
  if (Clients[gameState.client - 1].attributes.includes(BREEDER)) {
    cumMultiplier = 2
    satisfactionBonus = 1
  }

  function nextEvent() {
    generateLogRecord({ event: gameState.currentEvent, roll: cumRoll }, gameHistory, setGameHistory)
    modifyState({
      'currentEvent': CUM_NEXT,
      'satisfaction': gameState.satisfaction + 1 + satisfactionBonus
    }, gameState, setGameState)
  }

  const decisionSet = eventDetails[ANAL_CUM]
  const cum = cumRoll ? findDecision(cumRoll, decisionSet) : null

  return (
    <BasicEvent name='Cum from Anal' canContinue={!!cumRoll} nextEvent={nextEvent} image='club-bambi/anal-cum.png' ratio={1 / 1}>
      <Card.Section p='sm' withBorder>
        <Text>
          Your cannot clean off any cum until you finish with this client.
        </Text>
      </Card.Section>
      <Card.Section withBorder={!!cumRoll}>
        <DecisionTable activeRoll={cumRoll} decisionSet={decisionSet} />
        <Center my='sm'>
          <Roller roll={cumRoll} setRoll={setCumRoll} rollFn={r10} rerolls={rerolls} reroll={() => reroll(useReroll, gameState, setGameState)} />
        </Center>
      </Card.Section>
      {cumRoll ?
        <Card.Section p='sm'>
          <Group justify='center'>
            <StatusGroup leftChildren='Cum Amount'
              rightChildren={<Text span c={cumMultiplier > 1 ? Attributes[BREEDER].color : undefined}>{`${cum.cum * cumMultiplier} ml`}</Text>} />
          </Group>
        </Card.Section>
        : null}
    </BasicEvent>
  )
}

function CumNextEvent({ gameState, setGameState, gameHistory, setGameHistory }: EventInput) {
  const [taskRoll, setTaskRoll] = useState<number | null>(null)
  const decisionSet = eventDetails[CUM_NEXT]

  function rollSatisfied() {
    return Math.max(1, Math.min(randRange(1, 6) + Math.max(0, gameState.satisfaction - 3), 10))
  }

  function nextEvent() {
    const decision = findDecision(taskRoll, decisionSet)
    generateLogRecord({ event: gameState.currentEvent, roll: taskRoll }, gameHistory, setGameHistory)
    modifyState({ 'currentEvent': decision.task }, gameState, setGameState)
  }

  return (
    <BasicEvent name='Are They Satisfied?' canContinue={!!taskRoll} nextEvent={nextEvent} image='club-bambi/cum-next.png' ratio={7 / 10}>
      <Card.Section withBorder p='sm'>
        <Stack gap='xs'>
          <Title ta='center' fz='h4'>Client&apos;s Satisfaction Level: {gameState.satisfaction}</Title>
          <Progress.Root radius='sm' size="xl">
            <Progress.Section value={Math.min(gameState.satisfaction * 10, 30)} color="red" animated />
            <Progress.Section value={Math.min(gameState.satisfaction * 10 - 30, 60)} color="green" animated />
            <Progress.Section value={Math.min(gameState.satisfaction * 10 - 90, 10)} color="blue" animated />
          </Progress.Root>
          <Text ta='center'>Roll Range: {1 + Math.max(0, gameState.satisfaction - 3)} - {6 + Math.max(0, gameState.satisfaction - 3)}</Text>
        </Stack>
      </Card.Section>
      <Card.Section>
        <DecisionTable activeRoll={taskRoll} decisionSet={decisionSet} showDescription />
        <Center mt='sm'>
          <Roller roll={taskRoll} setRoll={setTaskRoll} rollFn={rollSatisfied} />
        </Center>
      </Card.Section>
    </BasicEvent>
  )
}

function HumiliationEvent({ gameState, setGameState, gameHistory, setGameHistory }: EventInput) {
  const [taskRoll, setTaskRoll] = useState<number | null>(null)
  const decisionSet = eventDetails[HUMILIATION]

  const initialRerolls = gameState.taskLeniency == 'client' ? gameState.rerollsRemaining : gameState.taskLeniency == 'task' ? 1 : 0
  const [rerolls, { decrement: useReroll }] = useCounter(initialRerolls, { min: 0 })

  function nextEvent() {
    const decision = findDecision(taskRoll, decisionSet)
    const mainEffect = decision.effect ?? undefined
    const attributeEffects = Object.entries(decision.attributeEffects ?? {}).map(([attribute, effect]: [Attribute, Effect]) => {
      if (Clients[gameState.client - 1].attributes.includes(attribute)) {
        return effect
      }
    })
    const effects = [mainEffect, ...attributeEffects].filter((e) => e)

    generateLogRecord({ event: gameState.currentEvent, roll: taskRoll }, gameHistory, setGameHistory)
    modifyState({
      'currentEvent': decision.next,
      'effects': new Set([...effects, ...gameState.effects])
    }, gameState, setGameState)
    if (gameState.currentEvent == HUMILIATION) {
      setTaskRoll(null)

    }
  }

  let humiliation = null
  if (taskRoll) {
    const decision = findDecision(taskRoll, decisionSet)
    const attributes = Clients[gameState.client - 1].attributes

    humiliation = (
      <Stack gap='xs'>
        <Text>{decision.description}</Text>
        <Divider />
        <TaskDisplayGroup tasks={[decision.task]} attributes={attributes} attributeTasks={decision.attributeTasks} />
        <Divider />
        {decision.effect || Object.keys(decision.attributeEffects ?? {}).length ?
          <>
            <Text ta='center' fz='h4' fw='bold'>Effects</Text>
            <EffectDisplayGroup effects={[decision.effect]} attributes={attributes} attributeEffects={decision.attributeEffects} />
            <Divider />
          </>
          : null}

        <Text ta='center'>Next Task: {decision.next}</Text>
      </Stack>
    )
  }

  let image = 'club-bambi/humiliation.png'
  if (taskRoll) {
    image = `club-bambi/humiliation-${taskRoll}.png`
  }


  return (
    <BasicEvent name='Humiliation' canContinue={!!taskRoll} nextEvent={nextEvent} image={image} ratio={2 / 3}>
      <Collapse expanded={!taskRoll}>
        <Card.Section>
          <DecisionTable activeRoll={taskRoll} decisionSet={decisionSet} />
        </Card.Section>
      </Collapse>
      <Center mt={!taskRoll ? 'md' : 0} mb='md'>
        <Roller roll={taskRoll} setRoll={setTaskRoll} rollFn={() => randRange(1, 7)} rerolls={rerolls} reroll={() => reroll(useReroll, gameState, setGameState)} />
      </Center>
      <Collapse expanded={!!taskRoll}>
        {humiliation}
      </Collapse>
    </BasicEvent>
  )
}

function PunishmentEvent({ gameState, setGameState, gameHistory, setGameHistory }: EventInput) {
  const [taskRoll, setTaskRoll] = useState<number | null>(null)
  const decisionSet = eventDetails[PUNISHMENT]

  const initialRerolls = gameState.taskLeniency == 'client' ? gameState.rerollsRemaining : gameState.taskLeniency == 'task' ? 1 : 0
  const [rerolls, { decrement: useReroll }] = useCounter(initialRerolls, { min: 0 })

  function nextEvent() {
    const decision = findDecision(taskRoll, decisionSet)
    const mainEffect = decision.effect ?? undefined
    const attributeEffects = Object.entries(decision.attributeEffects ?? {}).map(([attribute, effect]: [Attribute, Effect]) => {
      if (Clients[gameState.client - 1].attributes.includes(attribute)) {
        return effect
      }
    })
    const effects = [mainEffect, ...attributeEffects].filter((e) => e)

    generateLogRecord({ event: gameState.currentEvent, roll: taskRoll }, gameHistory, setGameHistory)
    modifyState({
      'currentEvent': decision.next,
      'effects': new Set([...effects, ...gameState.effects])
    }, gameState, setGameState)
    if (gameState.currentEvent == PUNISHMENT) {
      setTaskRoll(null)
    }
  }

  function rollPunishment() {
    let valid = false
    let roll = 0
    while (!valid) {
      roll = randRange(1, 10)

      const effects = gameState.effects
      if (roll == 8) {
        let uniformBonus = 0
        if (gameState.client) {
          if (gameState.outfit >= 3) {
            uniformBonus += 1
          }
          if (gameState.outfit >= 7) {
            uniformBonus += 1
          }
        }
        valid = (gameState.uniform + uniformBonus >= 9)
      } else if (roll == 9) {
        valid = !(effects.has(CLEANER))
      } else if (roll == 10) {
        valid = !(effects.has(LOCKED) || effects.has(PERMALOCKED) || effects.has(LIMP))
      } else {
        valid = true
      }
    }
    return roll
  }

  let punishment = null
  if (taskRoll) {
    const decision = findDecision(taskRoll, decisionSet)
    const attributes = Clients[gameState.client - 1].attributes

    punishment = (
      <Stack gap='xs'>
        <Text>{decision.description}</Text>
        <Divider />
        <TaskDisplayGroup tasks={[decision.task]} attributes={attributes} attributeTasks={decision.attributeTasks} />
        <Divider />
        {decision.effect || Object.keys(decision.attributeEffects ?? {}).length ?
          <>
            <Text ta='center' fz='h4' fw='bold'>Effects</Text>
            <EffectDisplayGroup effects={[decision.effect]} attributes={attributes} attributeEffects={decision.attributeEffects} />
            <Divider />
          </>
          : null}
        <Text ta='center'>Next Task: {decision.next}</Text>
      </Stack>
    )
  }

  let image = 'club-bambi/punishment.png'
  if (taskRoll) {
    image = `club-bambi/punishment-${taskRoll}.png`
  }

  return (
    <BasicEvent name='Punishment' canContinue={!!taskRoll} nextEvent={nextEvent} image={image} ratio={2 / 3}>
      <Collapse expanded={!taskRoll}>
        <Card.Section>
          <DecisionTable activeRoll={taskRoll} decisionSet={decisionSet} />
        </Card.Section>
      </Collapse>
      <Center mt={!taskRoll ? 'md' : 0} mb='md'>
        <Roller roll={taskRoll} setRoll={setTaskRoll} rollFn={rollPunishment} rerolls={rerolls} reroll={() => reroll(useReroll, gameState, setGameState)} />
      </Center>
      <Collapse expanded={!!taskRoll}>
        {punishment}
      </Collapse>
    </BasicEvent>
  )
}

function PaymentEvent({ gameState, setGameState, gameHistory, setGameHistory }: EventInput) {
  const [paymentRoll, setPaymentRoll] = useState<number | null>(null)
  const [canContinue, { open: allowContinue }] = useDisclosure(!!paymentRoll)
  const decisionSet = eventDetails[PAYMENT]

  function setPayment(roll: number) {
    setPaymentRoll(roll)
    if (roll != 10) {
      allowContinue()
    }
  }

  function nextEvent() {
    const decision = findDecision(paymentRoll, decisionSet)

    generateLogRecord({ event: gameState.currentEvent, roll: paymentRoll }, gameHistory, setGameHistory)
    modifyState({
      'currentEvent': CLIENT,
      'debtPaid': gameState.debtPaid + decision.amount,
      'effects': expireEffects(gameState.effects, 'client'),
      'clientsServed': gameState.clientsServed + 1,
      ...initializeClient
    }, gameState, setGameState)
  }

  let drugged = null
  if (paymentRoll == 10) {
    drugged = (
      <>
        <Divider mt='sm' />
        <Text>Put on a mouth gag, chastity, and buttplug. Put yourself in a hogtie for 10 minutes.</Text>
        <Card.Section p='sm'>
          <TaskTimer duration={10} finishCallback={allowContinue} debug={gameState.debugMode} />
        </Card.Section>
      </>
    )
  }

  return (
    <BasicEvent name='Payment' canContinue={canContinue} nextEvent={nextEvent} image='club-bambi/oral-next.png' ratio={1 / 1}>
      <Card.Section>
        <DecisionTable activeRoll={paymentRoll} decisionSet={decisionSet} showDescription />
        <Center mt='sm'>
          <Roller roll={paymentRoll} setRoll={setPayment} rollFn={r10} />
        </Center>
      </Card.Section>
      {drugged}
    </BasicEvent>
  )
}

function EffectBadge({ effect, attribute }: { effect: Effect, attribute?: Attribute }) {
  const effectDetail: EffectDetail = effectDetails[effect]
  const color = attribute ? Attributes[attribute].color : clubBambiTextColor

  return (
    <Tooltip label={effectDetail.description} events={tooltipEvents}>
      <Badge color={color} radius='md'>{effect}</Badge>
    </Tooltip>
  )
}

function EffectDisplayGroup({ effects, attributes, attributeEffects }: { effects?: Effect[], attributes?: Attribute[], attributeEffects?: { [key in Attribute]?: Effect } }) {
  let effectDisplay = []
  if (effects) {
    effectDisplay = effects.map((effect, idx) => (
      <EffectBadge key={idx} effect={effect} />
    ))
  }

  let attributeEffectDisplay = []
  if (attributes && attributeEffects) {
    for (const attribute of attributes) {
      if (attribute in attributeEffects) {
        attributeEffectDisplay.push(
          <EffectBadge key={attribute} effect={attributeEffects[attribute]} attribute={attribute} />
        )
      }
    }
  }

  return (
    <Group justify='center'>
      {effectDisplay}
      {attributeEffectDisplay}
    </Group>
  )
}

function TaskDisplayGroup({ tasks, attributes, attributeTasks }: { tasks?: string[], attributes?: Attribute[], attributeTasks?: { [key in Attribute]?: string } }) {

  let tasksDisplay = []
  if (tasks) {
    for (const task of tasks) {
      tasksDisplay.push(<Text fw='bold'>{task}</Text>)
    }
  }

  let attributeTasksDisplay = []
  if (attributes && attributeTasks) {
    for (const attribute of attributes) {
      if (attribute in attributeTasks) {
        const attributeDetail = Attributes[attribute]
        attributeTasksDisplay.push((
          <Text key={attribute} c={attributeDetail.color}>{attributeTasks[attribute]}</Text>
        ))
      }
    }
  }

  return (
    <Stack gap='xs'>
      {tasks}
      {attributeTasksDisplay}
    </Stack>
  )
}

function TaskTimer({ duration, finishCallback, debug }: { duration: number, finishCallback?: () => void, debug?: boolean }) {
  const [timerStarted, { open: startTimer }] = useDisclosure(false)
  const [timerRunning, { open: runTimer, close: stopTimer }] = useDisclosure(false)

  const [startTime, setStartTime] = useState<Date>()
  const [now, setNow] = useState<Date>()

  function start() {
    setStartTime(new Date())
    setNow(new Date())
    startTimer()
    runTimer()
  }

  useEffect(() => {
    if (timerRunning) {
      const interval = setInterval(() => {
        if (dayjs(new Date()) > dayjs(startTime).add(duration, 'minutes')) {
          stopTimer()
          if (finishCallback) { finishCallback() }
        } else {
          setNow(new Date())
        }
      }, 1000)

      return () => {
        clearInterval(interval)
      }
    }
  }, [timerRunning])


  let progressElement = (
    <Center>
      <Button variant='gradient' gradient={clubBambiGradient} size='md' onClick={start}>Start Task</Button>
    </Center>
  )
  if (timerStarted) {
    const elapsedTime = dayjs.duration(dayjs(now).diff(dayjs(startTime))).format('m:ss')
    const remainingTime = dayjs.duration(dayjs(dayjs(startTime).add(duration, 'minutes')).diff(now)).format('m:ss')
    const endTime = dayjs(startTime).add(duration, 'minutes').toDate()
    const progress = ((now.getTime() - startTime.getTime()) / (endTime.getTime() - startTime.getTime())) * 100

    progressElement = (
      <Group>
        <Text flex={0}>{elapsedTime}</Text>
        <Progress flex={1} radius='sm' color='grape' size='xl' value={timerRunning ? progress : 100} animated={timerRunning} />
        <Text flex={0}>{remainingTime}</Text>
      </Group>
    )
  }

  const debugButton = <ActionIcon flex={0} onClick={() => { stopTimer(); finishCallback() }}><IconBug /></ActionIcon>

  return (
    <Card withBorder style={{ borderColor: 'violet' }}>
      <Card.Section p='sm' withBorder>
        <Group grow preventGrowOverflow={false} justify='center'>
          <Title fz='h4' ta='center'>Task Timer</Title>
          {debug && debugButton}
        </Group>
      </Card.Section>
      <Card.Section p='sm' withBorder>
        {progressElement}
      </Card.Section>
    </Card>
  )
}

function DecisionTable({ activeRoll, decisionSet, showDescription = false, cumulative = false }: { activeRoll: number, decisionSet: Decision[], showDescription?: boolean, cumulative?: boolean }) {
  return (
    <Table>
      <Table.Tbody>
        {decisionSet.map((decision, idx) => {
          let color = undefined
          if (activeRoll) {
            if (cumulative) {
              if (decision.min <= activeRoll) {
                color = clubBambiTextColor
              }
            } else {
              if (decision.min <= activeRoll && activeRoll <= decision.max) {
                color = clubBambiTextColor
              }
            }
          }

          return (
            <Table.Tr key={idx}>
              <Table.Th w='5rem' ta='center' c={color}>{decision.min == decision.max ? decision.min : `${decision.min} - ${decision.max}`}</Table.Th>
              <Table.Td c={color}>
                <Stack gap={0}>
                  <Text>{decision.task}</Text>
                  <Text c='dimmed'>{showDescription && decision.description ? decision.description : null}</Text>
                </Stack>
              </Table.Td>
            </Table.Tr>
          )
        })}
      </Table.Tbody>
    </Table>
  )
}

function Roller({ roll, setRoll, rollFn, rerolls, reroll, readOnly = false }: { roll: number, setRoll: any, rollFn: () => number, rerolls?: number, reroll?: (newGameState?: GameState) => void, readOnly?: boolean }) {
  const [rollStarted, { open: startRoll }] = useDisclosure(readOnly)
  const [rollFinished, { open: finishRoll, close: restartRoll }] = useDisclosure(readOnly)
  const [rolled, { open: flagRoll }] = useDisclosure(readOnly)

  const rollsLeft = (rerolls ?? 0) + (rolled ? 0 : 1)
  const buttonStyle = rollStarted && rollsLeft ? undefined : { borderTopRightRadius: '0.5rem', borderBottomRightRadius: '0.5rem' }

  function handleRoll() {
    if (!rollFinished || rollsLeft) {
      startRoll()

      if (rollsLeft) {
        restartRoll()
      }

      setTimeout(() => {
        let newGameState = setRoll(rollFn())
        finishRoll()
        flagRoll()

        if (rolled && rollsLeft) {
          reroll(newGameState)
        }
      }, 1500)
    }
  }

  let buttonText = <><Text mr='xs'>Roll</Text><IconDice /></>
  if (rollFinished) {
    if (rollsLeft) {
      buttonText = <><Text mr='xs'>Reroll</Text><IconDice /></>
    } else {
      buttonText = <><Text mr='xs'>Rolled</Text><IconLock /></>
    }
  }

  return (
    <Button.Group w='15rem'>
      <Button
        fullWidth style={{ borderColor: 'violet', ...(rollsLeft <= 1 && !rollStarted && buttonStyle) }}
        variant='gradient' gradient={clubBambiGradient}
        disabled={rollFinished && !rollsLeft}
        loading={rollStarted && !rollFinished} loaderProps={{ type: 'dots' }}
        onClick={handleRoll}>
        {buttonText}
      </Button>
      <Button.GroupSection display={rollsLeft > 1 ? undefined : 'none'} variant='default' style={{ borderColor: 'violet', ...(rollsLeft && buttonStyle) }}>
        <Text mr='0.125rem'>{rerolls}</Text><IconRefresh size={18} />
      </Button.GroupSection>
      <Transition
        mounted={rollStarted}
        transition={{
          in: { opacity: 1, transform: 'scaleX(1)' },
          out: { opacity: 0, transform: 'scaleX(0)' },
          common: { transformOrigin: 'left' },
          transitionProperty: 'transform, opacity',
        }}
        duration={200}
        timingFunction="ease"
        keepMounted
      >
        {(transitionStyle) => (
          <Button.GroupSection variant='default' style={{ borderColor: 'violet', ...transitionStyle }}>
            <Text fw='bold' ta='center' w={15}>
              {rollStarted ? rollFinished ? roll : <ChangingNumber /> : null}
            </Text>
          </Button.GroupSection>
        )}
      </Transition>
    </Button.Group>
  )
}

function ChangingNumber() {
  const [number, setNumber] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setNumber(randRange(1, 10))
    }, 150)

    return () => clearInterval(interval)
  }, [])


  return number
}

function r10() {
  return randRange(1, 10)
}

function modifyState(changes: { [attribute: string]: any }, gameState: GameState, setGameState: (gameState: GameState) => void) {
  let newGameState = structuredClone(gameState)
  for (const [attribute, value] of Object.entries(changes)) {
    newGameState[attribute] = value
  }

  setGameState(newGameState)
  return newGameState
}

function generateLogRecord(record: GameLogRecord, gameHistory: GameHistory, setGameHistory: (gameHistory: GameHistory) => void) {
  if (record.event == CLIENT) {
    gameHistory.push([record])
  } else if ([UNIFORM, INDUCTION].indexOf(record.event) != -1) {
    gameHistory.push(record)
  } else {
    let currentClient = gameHistory[gameHistory.length - 1];
    (currentClient as GameLogRecord[]).push(record)
  }
  // gameHistory.push(record)
  setGameHistory(gameHistory)
}

function expireEffects(effects: Set<Effect>, expiration: 'task' | 'client' | 'game') {
  return new Set([...effects].filter((effect) => effectDetails[effect].expiration != expiration))
}