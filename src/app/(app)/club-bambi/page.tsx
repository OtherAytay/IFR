'use client'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { Attribute, AttributeDetail, Attributes, BONDAGE, CLIENT, Client, Clients, Decision, DIFFICULTY, eventDetails, events, findDecision, GameState, ORAL_MODIFIER, ORAL_NEXT, ORAL_POSITION, ORAL_TASK, OUTFIT, PenetrationTask, randRange, slugify, Stage, Stages, STARTING_TASK, UNIFORM, Uniform } from "@/IFR/club-bambi"
import { theme } from "@/app/layout"
import { ActionIcon, AppShell, AspectRatio, BackgroundImage, Badge, Button, Card, Center, Container, Divider, getGradient, Group, HoverCard, Image, Indicator, Progress, ScrollArea, SegmentedControl, SimpleGrid, Space, Stack, Table, Text, Timeline, Title, Tooltip, Transition, useMantineTheme } from "@mantine/core"
import { useDisclosure, useElementSize, useHover, useLocalStorage, useViewportSize } from "@mantine/hooks"
import { IconDice, IconLayoutSidebarRightCollapse, IconLayoutSidebarRightExpandFilled, IconLock, IconRefresh } from "@tabler/icons-react"
import React, { useContext, useEffect, useState } from "react"
import { CollapseContext, PageContext } from "../layout"

dayjs.extend(duration)

const clubBambiGradient = theme.other.gradients['club-bambi']
const clubBambiTextColor = 'grape.4'

const defaultGameState: GameState = {
  debtPaid: 0,
  debt: null,
  uniform: null,
  stage: 1,
  client: null,
  currentEvent: DIFFICULTY,
  cumCount: 0,
  bondage: 1,
  outfit: 1,
  effects: []
}

export default function Home() {
  const collapseContext: CollapseContext | null = useContext(PageContext)

  const [gameState, setGameState] = useLocalStorage<GameState>({
    key: 'club-bambi-save',
    defaultValue: defaultGameState,
    getInitialValueInEffect: true,
  })

  useEffect(() => {
    if (gameState.stage == 2) {
      collapseContext.openStatePanel()
    }
  }, [gameState.stage])

  let uniformBonus = 0
  if (gameState.client) {
    if (gameState.outfit >= 3) {
      uniformBonus += 1
    }
    if (gameState.outfit >= 7) {
      uniformBonus += 1
    }
  }


  let event = null
  switch (gameState.currentEvent) {
    case DIFFICULTY:
      event = (<DifficultyEvent gameState={gameState} setGameState={setGameState} />)
      break;
    case UNIFORM:
      event = (<UniformEvent gameState={gameState} setGameState={setGameState} />)
      break;
    case CLIENT:
      event = (<ClientEvent gameState={gameState} setGameState={setGameState} />)
      break;
    case BONDAGE:
      event = (<BondageEvent gameState={gameState} setGameState={setGameState} />)
      break;
    case OUTFIT:
      event = (<OutfitEvent gameState={gameState} setGameState={setGameState} />)
      break;
    case STARTING_TASK:
      event = (<StartingTaskEvent gameState={gameState} setGameState={setGameState} />)
      break;
    case ORAL_POSITION:
    case ORAL_MODIFIER:
      event = (<OralEvent gameState={gameState} setGameState={setGameState} />)
      break;
    case ORAL_TASK:
      event = (<OralTaskEvent gameState={gameState} setGameState={setGameState} />)
      break;
  }

  return (
    <>
      <TaskPanel />
      <StatusBar debtPaid={gameState.debtPaid} debt={gameState.debt} uniform={gameState.uniform} uniformBonus={uniformBonus} stage={gameState.stage} client={gameState.client} setGameState={setGameState} />
      <AppShell.Main mt="md">
        <Container fluid>
          <Group grow preventGrowOverflow={false}>
            <Container size="lg">
              {event}
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

function TaskPanel({ }) {
  const [bondageRoll, setBondageRoll] = useState(2)

  return (
    <AppShell.Aside >
      <AppShell.Section p='xs'>
        <Title ta='center' fz='h3'>Tasks</Title>
      </AppShell.Section>
      <Divider />
      <AppShell.Section component={ScrollArea}>
        {/* {Object.entries(eventCategories).map(([category, eventsInCategory], idx) => (
          <AppShell.Section py='xs' px='md' key={idx}>
            <Title ta='center' fz='h4'>{category}</Title>
            <Timeline mt='xs' radius='sm' active={0} bulletSize={28}>
              {eventsInCategory.map((event, idx) => (
                <EventItem key={idx} category={category} event={event} subevent={event == CUM ? 'Oral' : undefined} />
              ))}
            </Timeline>
          </AppShell.Section>
        ))} */}
      </AppShell.Section>
    </AppShell.Aside>
  )
}

function EventItem({ category, event, subevent }) {
  let decision = null
  if (subevent) {
    decision = findDecision(events.indexOf(event) + 1, eventDetails[category][event][subevent]).task
  } else {
    decision = findDecision(events.indexOf(event) + 1, eventDetails[category][event]).task
  }

  return (
    <Timeline.Item title={<Text>{event}</Text>} bullet={Bullet(events.indexOf(event) + 1)}>
      <Text c='dimmed'>{decision}</Text>
    </Timeline.Item>
  )
}

function Bullet(text) {
  return (
    <Text style={{ cursor: "pointer" }}>{text}</Text>
  )
}

function StatusBar({ debtPaid, debt, uniform, uniformBonus, stage, client, setGameState }: { debtPaid: number, debt: number, uniform: number, uniformBonus: number, stage: number, client: number, setGameState: (gameState: GameState) => void }) {
  const theme = useMantineTheme()
  const { hovered: uniformHovered, ref: uniformRef } = useHover()
  const { hovered: clientHovered, ref: clientRef } = useHover()

  const clientDetail: Client = Clients[client - 1]
  const stageDetail: Stage = Stages[stage - 1]

  const UniformTable = []
  for (let i = 0; i < Uniform.length / 2; i++) {
    UniformTable.push((
      <Table.Tr key={i}>
        <Table.Th c={uniform + uniformBonus >= i + 1 ? 'grape.4' : undefined}>{i + 1}</Table.Th>
        <Table.Td c={uniform + uniformBonus >= i + 1 ? 'grape.4' : undefined}>{Uniform[i]}</Table.Td>
        <Table.Th c={uniform + uniformBonus >= i + 7 ? 'grape.4' : undefined}>{i + 7}</Table.Th>
        <Table.Td c={uniform + uniformBonus >= i + 7 ? 'grape.4' : undefined}>{Uniform[i + 6]}</Table.Td>
      </Table.Tr>
    ))
  }

  let clientStatus = null
  let sizeStatus = null
  if (clientDetail) {
    clientStatus = (
      <HoverCard offset={12} transitionProps={{ transition: 'pop' }}>
        <HoverCard.Target ref={clientRef}>
          <Card display={client ? undefined : 'none'} withBorder py="0.25rem" bg={clientHovered ? getGradient(theme.other.gradients['club-bambi'], theme) : undefined} style={{ borderColor: 'violet' }}>
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
    )

    sizeStatus = (<StatusGroup display={stage != 2 ? 'none' : undefined} leftChildren='Size' rightChildren={clientDetail.size} />)
  }

  return (
    <AppShell.Footer p="sm">
      <Group h="100%" justify="center" gap="lg">
        {/* Debt Paid Progress */}
        <StatusGroup display={debt ? undefined : 'none'} leftChildren='Debt Paid' rightChildren={`$${debtPaid} / $${debt}`} />

        {/* Uniform */}
        <HoverCard offset={12} transitionProps={{ transition: 'pop' }}>
          <HoverCard.Target ref={uniformRef}>
            <Indicator label={`+${uniformBonus}`} disabled={!uniformBonus || !uniform} color='grape' size={14}>
              <Card display={uniform ? undefined : 'none'} withBorder py="0.25rem" bg={uniformHovered ? getGradient(theme.other.gradients['club-bambi'], theme) : undefined} style={{ borderColor: 'violet' }}>
                <Group>
                  <Text>Uniform</Text>
                  <Divider orientation="vertical" />
                  <Text>{uniform}</Text>
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
        <Divider display={stage != 2 ? 'none' : undefined} orientation="vertical" />

        {/* Stage */}
        <StatusGroup leftChildren='Stage' rightChildren={stageDetail.name} />

        {/* Client */}
        {clientStatus}

        {/* Size */}
        {sizeStatus}

        <ActionIcon size='lg' color='red' onClick={() => setGameState(null)}><IconRefresh /></ActionIcon>
      </Group>

    </AppShell.Footer>
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
    <Tooltip label={attributeDetail.description} bg={attributeDetail.color} w={200} multiline>
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
type EventInput = { gameState: GameState, setGameState: (gameState: GameState) => void }

function DifficultyEvent({ gameState, setGameState }: EventInput) {
  const [difficultyChoice, setDifficultyChoice] = useState<'750' | '1500' | '2500'>('750')

  function setDifficulty(difficulty: '750' | '1500' | '2500') {
    setDifficultyChoice(difficulty)
  }

  function nextEvent() {
    modifyState({
      'debt': parseInt(difficultyChoice),
      'currentEvent': UNIFORM
    }, gameState, setGameState)
  }

  const data = [
    { label: '$750', value: '750' },
    { label: '$1500', value: '1500' },
    { label: '$2500', value: '2500' }
  ]

  return (
    <BasicEvent name='Difficulty' canContinue={true} nextEvent={nextEvent} image='club-bambi/mistress-stella.png' ratio={2 / 3}>
      <Card.Section p='xs'>
        <Center>
          <SegmentedControl size='lg' data={data} value={difficultyChoice} onChange={setDifficulty} />
        </Center>
      </Card.Section>
    </BasicEvent>
  )
}

function UniformEvent({ gameState, setGameState }: EventInput) {
  const [uniformRoll, setUniformRoll] = useState<number | null>(null)

  function setUniform(roll: number) {
    setUniformRoll(roll)
    modifyState({ 'uniform': roll }, gameState, setGameState)
  }

  function nextEvent() {
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
          <Roller roll={uniformRoll} setRoll={setUniform} rollFn={r10} />
        </Center>
      </Card.Section>
    </BasicEvent>
  )
}

function ClientEvent({ gameState, setGameState }: EventInput) {
  const [clientRoll, setClientRoll] = useState<number | null>(null)

  function setClient(roll: number) {
    setClientRoll(roll)
    modifyState({ 'client': roll }, gameState, setGameState)
  }

  function nextEvent() {
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
      <Center>
        <Roller roll={clientRoll} setRoll={setClient} rollFn={r10} />
        <Button display={!clientRoll ? 'none' : undefined} ml='sm' variant='gradient' gradient={clubBambiGradient} onClick={nextEvent}>Continue</Button>
      </Center>
    </Stack>

  )
}

function BondageEvent({ gameState, setGameState }: EventInput) {
  const [bondageRoll, setBondageRoll] = useState<number | null>(null)
  const attributeDetail: AttributeDetail = Attributes['Kinky']

  let bondageBonus = 0
  if (Clients[gameState.client - 1].attributes.includes('Kinky')) {
    bondageBonus = 3
  }

  function setBondage(roll: number) {
    setBondageRoll(roll)
    modifyState({ 'bondage': roll + bondageBonus }, gameState, setGameState)
  }

  function nextEvent() {
    modifyState({ 'currentEvent': OUTFIT }, gameState, setGameState)
  }

  return (
    <BasicEvent name='Bondage' canContinue={!!bondageRoll} nextEvent={nextEvent} image='club-bambi/bondage.png' ratio={3 / 5}>
      <Card.Section>
        <DecisionTable activeRoll={bondageRoll ? bondageRoll + bondageBonus : null} cumulative={true} decisionSet={eventDetails[BONDAGE]} />
        <Center mt='sm'>
          <Indicator label={`+${bondageBonus}`} disabled={!bondageBonus} color={attributeDetail.color} size={14}>
            <Roller roll={bondageRoll} setRoll={setBondage} rollFn={r10} />
          </Indicator>
        </Center>
      </Card.Section>
    </BasicEvent>
  )
}

function OutfitEvent({ gameState, setGameState }: EventInput) {
  const [outfitRoll, setOutfitRoll] = useState<number | null>(null)
  const attributeDetail: AttributeDetail = Attributes['Cosplay']

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

    modifyState({
      'uniform': gameState.uniform + uniformIncrease,
      'outfit': finalRoll
    }, gameState, setGameState)
  }

  function nextEvent() {
    modifyState({ 'currentEvent': STARTING_TASK }, gameState, setGameState)
  }

  return (
    <BasicEvent name='Outfit' canContinue={!!outfitRoll} nextEvent={nextEvent} image='club-bambi/outfit.png' ratio={3 / 5}>
      <Card.Section>
        <DecisionTable activeRoll={outfitRoll ? outfitRoll + outfitBonus : null} cumulative={true} decisionSet={eventDetails[OUTFIT]} />
        <Center mt='sm'>
          <Indicator label={`+${outfitBonus}`} disabled={!outfitBonus} color={attributeDetail.color} size={14}>
            <Roller roll={outfitRoll} setRoll={setOutfit} rollFn={r10} />
          </Indicator>
        </Center>
      </Card.Section>
    </BasicEvent>
  )
}

function StartingTaskEvent({ gameState, setGameState }: EventInput) {
  const [taskRoll, setTaskRoll] = useState<number | null>(null)
  const decisionSet = eventDetails[STARTING_TASK]

  function nextEvent() {
    const decision = findDecision(taskRoll, decisionSet)

    modifyState({ 'currentEvent': decision.task }, gameState, setGameState)
  }

  return (
    <BasicEvent name='Starting Task' canContinue={!!taskRoll} nextEvent={nextEvent} image='club-bambi/starting-task.png' ratio={1 / 1}>
      <Card.Section>
        <DecisionTable activeRoll={taskRoll} decisionSet={decisionSet} />
        <Center mt='sm'>
          <Roller roll={taskRoll} setRoll={setTaskRoll} rollFn={r10} />
        </Center>
      </Card.Section>
    </BasicEvent>
  )
}

function OralEvent({ gameState, setGameState }: EventInput) {
  const [positionRoll, setPositionRoll] = useState<number | null>(null)
  const [modifierRoll, setModifierRoll] = useState<number | null>(null)


  function nextEvent() {
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
          <Roller roll={positionRoll} setRoll={setPositionRoll} rollFn={r10} />
        </Center>
        <Divider my='sm' />
        <Text fz='h3' fw='bold' ta='center'>Modifier</Text>
        <DecisionTable activeRoll={modifierRoll} decisionSet={eventDetails[ORAL_MODIFIER]} />
        <Center>
          <Roller roll={modifierRoll} setRoll={setModifierRoll} rollFn={r10} />
        </Center>
      </Stack>
    </BasicEvent>
  )
}

function OralTaskEvent({ gameState, setGameState }: EventInput) {
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
          <Text c={attributeDetail.color}>{task}</Text>
        ))
      }
    }
  }

  function nextEvent() {

  }

  return (
    <BasicEvent name='Oral Task' canContinue={false} nextEvent={nextEvent} image={`club-bambi/${slugify(position.name)}.png`} ratio={7 / 10}>
      <Stack>
        <Title ta='center' fz='h3'>{position.name}</Title>
        <Text>{position.description}</Text>
        <Divider />
        <Text>{position.task}</Text>
        {attributeTasks}
        <Group justify='center'>
          <StatusGroup leftChildren='Duration' rightChildren={`${position.duration} min`} />
          {position.speed ?
            <StatusGroup
              leftChildren='Speed'
              rightChildren={<Text c={speedBonus ? Attributes['Insatiable'].color : undefined}>{`${position.speed + speedBonus} BPM`}</Text>} />
            : null}
        </Group>
        <Divider />
        <Text>{modifier.task}</Text>
        <Divider />
        <TaskTimer duration={position.duration} />
      </Stack>
    </BasicEvent>
  )
}

function TaskTimer({ duration }: { duration: number }) {
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

  setInterval(() => {
    if (dayjs(now) > dayjs(startTime).add(duration, 'minutes')) {
      stopTimer()
    } else {
      setNow(new Date())
    }
  }, 1000)

  let progressElement = (
    <Center>
      <Button variant='gradient' gradient={clubBambiGradient} size='md' onClick={start}>Start Task</Button>
    </Center>
  )
  if (timerRunning) {
    const elapsedTime = dayjs.duration(dayjs(now).diff(dayjs(startTime))).format('m:ss')
    const remainingTime = dayjs.duration(dayjs(dayjs(startTime).add(duration, 'minutes')).diff(now)).format('m:ss')
    const endTime = dayjs(startTime).add(duration, 'minutes').toDate()
    const progress = ((now.getTime() - startTime.getTime()) / (endTime.getTime() - startTime.getTime())) * 100

    progressElement = (
      <Group>
        <Text flex={0}>{elapsedTime}</Text>
        <Progress flex={1} radius='sm' color='grape' size='xl' value={progress} animated={timerRunning} />
        <Text flex={0}>{remainingTime}</Text>
      </Group>
    )
  }

  return (
    <Card withBorder style={{ borderColor: 'violet' }}>
      <Card.Section p='sm' withBorder>
        <Title fz='h4' ta='center'>Task Timer</Title>
      </Card.Section>
      <Card.Section p='sm' withBorder>
        {progressElement}
      </Card.Section>
    </Card>
  )
}

function DecisionTable({ activeRoll, decisionSet, cumulative = false }: { activeRoll: number, decisionSet: Decision[], cumulative?: boolean }) {
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
                {decision.task}

              </Table.Td>
            </Table.Tr>
          )
        })}
      </Table.Tbody>
    </Table>
  )
}

function Roller({ roll, setRoll, rollFn, rerolls, useReroll }: { roll: number, setRoll: any, rollFn: () => number, rerolls?: number, useReroll?: () => void }) {
  const [rollStarted, { open: startRoll }] = useDisclosure(false)
  const [rollFinished, { open: finishRoll, close: restartRoll }] = useDisclosure(false)

  const buttonStyle = rollStarted && rerolls ? undefined : { borderTopRightRadius: '0.5rem', borderBottomRightRadius: '0.5rem' }

  function handleRoll() {
    if (!rollFinished || rerolls) {
      startRoll()

      if (rerolls) {
        restartRoll()
      }

      setTimeout(() => {
        setRoll(rollFn())
        finishRoll()

        if (rerolls) {
          useReroll()
        }
      }, 1500)
    }
  }

  let buttonText = <><Text mr='xs'>Roll</Text><IconDice /></>
  if (rollFinished) {
    if (rerolls) {
      buttonText = <><Text mr='xs'>Reroll</Text><IconDice /></>
    } else {
      buttonText = <><Text mr='xs'>Rolled</Text><IconLock /></>
    }
  }

  return (
    <Button.Group w='15rem'>
      <Button
        fullWidth style={{ borderColor: 'violet', ...(!rerolls && !rollStarted && buttonStyle) }}
        variant='gradient' gradient={clubBambiGradient}
        disabled={rollFinished && !rerolls}
        loading={rollStarted && !rollFinished} loaderProps={{ type: 'dots' }}
        onClick={handleRoll}>
        {buttonText}
      </Button>
      <Button.GroupSection display={rerolls ? undefined : 'none'} variant='default' style={{ borderColor: 'violet', ...(rerolls && buttonStyle) }}>
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

function r10() {
  return randRange(1, 10)
}

function ChangingNumber() {
  const [number, setNumber] = useState(1);

  setInterval(() => {
    setNumber(randRange(1, 10))
  }, 150)

  return number
}

function modifyState(changes: { [attribute: string]: any }, gameState: GameState, setGameState: (gameState: GameState) => void) {
  let newGameState = structuredClone(gameState)
  for (const [attribute, value] of Object.entries(changes)) {
    newGameState[attribute] = value
  }

  setGameState(newGameState)
}