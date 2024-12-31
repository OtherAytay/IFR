'use client'
import { useRef, useState } from 'react';
import { Stepper, Group, Container, Title, Text, Anchor, Card, Table, Badge, HoverCard, Center, Button, Divider, rem, ScrollArea, Grid, SimpleGrid, Image, Transition, Paper, SegmentedControl, Overlay } from '@mantine/core';
import { IFR, Stage, Event, Task, Outcome, Variable, IFRState, StageState, EventState, EventGroupState, EventGroup, Condition, TaskState, VariableState } from '../../IFR/ifr';
import { STL, Simple, SP } from '../../IFR/examples'
import { IconCarouselHorizontal, IconEdit, IconLayoutGrid, IconPhoto, IconSquareCheck, IconSquareX } from '@tabler/icons-react';
import { Carousel } from '@mantine/carousel'
import AutoHeight from 'embla-carousel-auto-height'
import './page.module.css'

export default function Home() {
  return (
    <InteractiveFR ifrState={Simple()} />
  );
}

export function InteractiveFR(props: { ifrState: IFRState }) {
  const ifrState = props.ifrState
  const ifr = ifrState.ifr
  const [showImage, setShowImage] = useState(false);
  const [depCheck, setDepCheck] = useState(0)
  const [active, setActive] = useState(0);
  const [view, setView] = useState("carousel")

  const changeStage = (nextStep) => {
    const isOutOfBounds = nextStep < 0 || ifr.stages.length < nextStep;
    if (isOutOfBounds) {
      return;
    }
    setActive(nextStep);
  };

  function progress() {
    ifrState.progress()
    setDepCheck(depCheck + 1);
  }

  if (ifr.fr_link) {
    if (ifr.fr_img) {
      var title = (
        <>
          <Anchor href={ifr.fr_link} target="_blank">
            <Title order={1} c="violet">{ifr.title}</Title>
          </Anchor>
          <Button ml="sm" variant={showImage ? "filled" : "outline"} color="violet" onClick={() => setShowImage(!showImage)}><IconPhoto /></Button>
        </>
      )

      var image = (
        <Image hidden={!showImage} src={ifr.fr_img} mb="sm" w="auto" radius="lg" mah="75vh" fit="contain" />
      )
    } else {
      var title = (
        <>
          <Anchor href={ifr.fr_link} target="_blank">
            <Title order={1} c="violet">{ifr.title}</Title>
          </Anchor>
        </>
      )
    }
  } else {
    var title = (
      <Title order={1} c="violet" mb="md">{ifr.title}</Title>
    )
  }

  return (
    <Container>
      <Center>
        <Paper w="100%" p="sm" mb="md" shadow="md" bg="dark.6" withBorder>
          <Group align="center">
            <Button variant="filled" color="blue" rightSection={<IconEdit />}>Edit</Button>
            <SegmentedControl size="sm" value={view} onChange={setView} color="violet"
              data={[
                { label: <Center><IconCarouselHorizontal /></Center>, value: "carousel" },
                { label: <Center><IconLayoutGrid /></Center>, value: "grid" }
              ]} />
          </Group>
        </Paper>
      </Center>
      <Center>
        <Transition mounted={showImage} transition="pop">
          {(styles) => <div style={styles}>{image}</div>}
        </Transition>
      </Center>
      <Center>
        {title}
      </Center>
      <Text>{ifr.description}</Text>
      <div>
        <Stepper active={active} onStepClick={setActive}>
          {[...ifrState.stageStates.values()].map((stageState, idx) => (
            <Stepper.Step key={idx} label={stageState.stage.title} description={stageState.stage.subtitle} allowStepSelect={false}>
              <StagePanel stageState={stageState} view={view} progressFn={progress} />
            </Stepper.Step>
          ))}
        </Stepper>
        <Center>
          <Button variant="filled" disabled={!ifrState.currentStage.isComplete()} onClick={() => changeStage([...ifrState.stageStates.values()].indexOf(ifrState.currentStage))}>Continue</Button>
        </Center>
        {ifrState.getVariableState(ifrState.ifr.variables[0]).value && <Overlay />}
      </div>

    </Container>
  )
}

export function StagePanel(props: { stageState: StageState, view: string, progressFn }) {
  const stageState = props.stageState
  const stage = stageState.stage
  const view = props.view


  var dependencyPassMap = new Map<EventState | EventGroupState, Array<boolean>>();
  const [depCheck, setDepCheck] = useState(1)

  function manageDependencies(init = false) {
    for (const es of stageState.eventSpaceStates) {
      var dependencyPassed = []
      for (const d of es.dependencyStates) {
        if (d instanceof EventState || d instanceof EventGroupState) {
          dependencyPassed.push(d.isComplete())
        } else {
          dependencyPassed.push(d.check())
        }
      }
      dependencyPassMap.set(es, dependencyPassed);
      if (!init) { setDepCheck(depCheck + 1) }
    }
  }

  manageDependencies(true)
  function colSpan(es: EventState | EventGroupState) {
    var groupSpan = es instanceof EventState ? 1 : es.eventGroup.events.length
    return { base: 12 * groupSpan, sm: 6 * groupSpan, lg: 4 * groupSpan, xl: 3 * groupSpan }
  }

  if (view == "carousel") {
    var essUnpacked = []
    for (const ess of stageState.eventSpaceStates) {
      if (ess instanceof EventGroupState) {
        for (const es of ess.eventStates) {
          essUnpacked.push(es)
        }
      } else {
        essUnpacked.push(ess)
      }
    }

    var autoHeight = AutoHeight()
  }

  return (
    <Center>
      {
        view == "carousel" ?
          <Carousel w="100%" align="center" slideGap="md" slideSize="auto" mb="xl" controlsOffset="md" dragFree>
            {stageState.eventSpaceStates.map((es, idx) => (
              <Carousel.Slide key={idx} maw="100%">
                <EventSpaceCard eventSpaceState={es} dependencyPassed={dependencyPassMap.get(es)} manageFn={manageDependencies} progressFn={props.progressFn} />
              </Carousel.Slide>
            ))}
          </Carousel>
          :
          <Grid w="100%" justify="center">
            {stageState.eventSpaceStates.map((es, idx) => (
              <Grid.Col key={idx} span={colSpan(es)}>
                <EventSpaceCard eventSpaceState={es} dependencyPassed={dependencyPassMap.get(es)} manageFn={manageDependencies} progressFn={props.progressFn} />
              </Grid.Col>
            ))}
          </Grid>
      }
    </Center>
  )
}

export function EventSpaceCard(props: { eventSpaceState: EventState | EventGroupState, dependencyPassed?: Array<boolean>, manageFn?, progressFn }) {
  if (props.eventSpaceState instanceof EventState) {
    return (
      <EventCard eventState={props.eventSpaceState} dependencyPassed={props.dependencyPassed} manageFn={props.manageFn} progressFn={props.progressFn} />
    )
  } else {
    return (
      <EventGroupCard eventGroupState={props.eventSpaceState} manageFn={props.manageFn} progressFn={props.progressFn} />
    )
  }
}

export function EventGroupCard(props: { eventGroupState: EventGroupState, dependencyPassed?: Array<boolean>, manageFn?, progressFn }) {
  const eventGroupState = props.eventGroupState;
  const eventGroup = eventGroupState.eventGroup;
  var dependencyPassMap = new Map<EventState, Array<boolean>>();
  const [depCheck, setDepCheck] = useState(1)

  const title = (
    <Card.Section>
      <Title order={4} mt="xs" mx="sm">{eventGroup.title}</Title>
    </Card.Section>
  )

  function manageDependencies(init = false) {
    for (const es of eventGroupState.eventStates) {
      var dependencyPassed = []
      for (const d of es.dependencyStates) {
        if (d instanceof EventState || d instanceof EventGroupState) {
          dependencyPassed.push(d.isComplete())
        } else {
          dependencyPassed.push(d.check())
        }
      }
      dependencyPassMap.set(es, dependencyPassed);
      if (!init) { setDepCheck(depCheck + 1) }
    }
  }

  manageDependencies(true)

  return (
    <Card>
      {eventGroup.title ? title : null}
      <SimpleGrid cols={{ base: 1, sm: Math.min(eventGroup.events.length, 2), md: Math.min(eventGroup.events.length, 3) }}>
        {eventGroupState.eventStates.map((es, idx) => (
          <EventCard key={idx} eventState={es} dependencyPassed={dependencyPassMap.get(es)} manageFn={manageDependencies} progressFn={props.progressFn} />
        ))}
      </SimpleGrid>
    </Card>
  )
}

export function EventCard(props: { eventState: EventState, dependencyPassed?: Array<boolean>, manageFn?, progressFn }) {
  const eventState = props.eventState;
  const event = eventState.event;

  const [roll, setRoll] = useState(null)

  function rollEvent() {
    eventState.roll()
    setRoll(eventState.currentRoll)
    props.manageFn()
  }

  function completeTask() {
    eventState.complete()
    if (eventState.activeTaskState.reroll) {
      setRoll(eventState.currentRoll)
    }
    props.manageFn()
    props.progressFn()
  }

  var depsUnpacked = []
  for (const dep of eventState.dependencyStates) {
    if (dep instanceof EventGroupState) {
      for (const es of dep.eventStates) {
        depsUnpacked.push(es)
      }
    } else {
      depsUnpacked.push(dep)
    }
  }

  var depExplains = []
  var depsReadyNew = []
  for (const dep of depsUnpacked) {
    if (dep instanceof EventState) {
      depsReadyNew.push(dep.isComplete())
      depExplains.push(
        <ConditionRow dependencyState={dep} key={depExplains.length} />
      )
    } else {
      depsReadyNew.push(dep.check())
      depExplains.push(
        <ConditionRow dependencyState={dep} key={depExplains.length} />
      )
    }
  }

  function ConditionRow(props: { dependencyState }, key) {
    const dep = props.dependencyState;

    if (dep instanceof EventState) {
      return (
        <Table.Tr key={key}>
          <Table.Td><Center>{dep.isComplete() ? <IconSquareCheck color="green" /> : <IconSquareX color="red" />}</Center></Table.Td>
          <Table.Td>
            <Center><Text >Completed <Text span fw={600}>{dep.event.title}</Text></Text></Center>
          </Table.Td>
        </Table.Tr>
      )
    } else {
      return (
        <Table.Tr key={key}>
          <Table.Td><Center>{dep.check() ? <IconSquareCheck color="green" /> : <IconSquareX color="red" />}</Center></Table.Td>
          <Table.Td>
            <Center>{dep.condition.readCondition()}</Center>
          </Table.Td>
        </Table.Tr>
      )
    }
  }

  if (roll) {
    var rollAction = (
      <Text my="sm" fw={600}>Active Roll: {roll}</Text>
    )
  } else {
    if (eventState.isAvailable()) {
      var rollAction = (
        <Button my="xs" onClick={rollEvent} >Roll</Button>
      )
    } else {
      var rollAction = (
        <HoverCard shadow="md">
          <HoverCard.Target>
            <Button my="xs" onClick={(event) => event.preventDefault()} data-disabled>Roll</Button>
          </HoverCard.Target>
          <HoverCard.Dropdown p={0}>
            <Center>
              <Title order={5}>Conditions</Title>
            </Center>
            <Divider />
            <Table>
              <Table.Tbody>
                {depExplains}
              </Table.Tbody>
            </Table>
          </HoverCard.Dropdown>
        </HoverCard>
      )
    }
  }

  if (roll == null) {
    var tasks = (
      <Table highlightOnHover>
        <Table.Tbody>
          {event.tasks.map((task, idx) => (
            <HoverCard key={idx} position="right" width="target" shadow="md">
              <HoverCard.Target>
                <Table.Tr>
                  <Table.Td>
                    <Badge variant={roll && roll >= task.min && roll <= task.max ? "filled" : "outline"} color="violet">{task.min == task.max ? task.min : task.min + "-" + task.max}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={roll && roll >= task.min && roll <= task.max ? 700 : 500} c={roll && roll >= task.min && roll <= task.max ? "violet" : ""} >{task.task.title}</Text>
                  </Table.Td>
                </Table.Tr>
              </HoverCard.Target>
              <HoverCard.Dropdown p={0}>
                <TaskCard taskState={eventState.taskStates.get(task.task)} />
              </HoverCard.Dropdown>
            </HoverCard>
          ))}
        </Table.Tbody>
      </Table>
    )
  } else {
    var tasks = (
      <TaskCard taskState={eventState.activeTaskState} completeFn={completeTask} />
    )
  }

  return (
    <Card withBorder h="100%" mih={rem(250)} miw={rem(250)}>
      <Card.Section style={{ flexGrow: "0" }} withBorder>
        <Title order={4} mt="xs" mx="sm">{event.title}</Title>
        <Title order={5} mb="xs" mx="sm" fw={300}>{event.subtitle}</Title>
      </Card.Section>
      <Card.Section style={{ flexGrow: "1" }} withBorder>
        <ScrollArea scrollbars="y">
          {tasks}
        </ScrollArea>
      </Card.Section>
      <Card.Section style={{ flexGrow: "0" }} withBorder>
        <Center>
          {rollAction}
        </Center>
      </Card.Section>
    </Card>
  )
}

export function TaskCard(props: { taskState: TaskState, completeFn?}) {
  const taskState = props.taskState
  const task = taskState.task

  const [complete, setComplete] = useState(false)

  function completeTask(pass: boolean) {
    props.completeFn(pass)
    setComplete(true)
  }

  if (task.flavor) {
    var flavor = (
      <Card.Section withBorder>
        <Text>{task.flavor}</Text>
      </Card.Section>
    )
  }

  if (task.passOutcome) {
    var outcomes = (
      <Card.Section>
        <Center>
          <Title order={5}>Outcomes</Title>
        </Center>
      </Card.Section>
    )
    var pass = (
      <Card.Section>
        <Center>
          <Badge color="green" mr="sm" radius="sm">Pass</Badge>
          <Text>{task.passOutcome instanceof Outcome ? task.passOutcome.readOutcome() : "Reroll"}</Text>
        </Center>
      </Card.Section>
    )
  }

  if (task.failOutcome) {
    var fail = (
      <Card.Section>
        <Center>
          <Badge color="red" mr="sm" radius="sm">Fail</Badge>
          <Text>{task.passOutcome instanceof Outcome ? task.passOutcome.readOutcome() : "Reroll"}</Text>
        </Center>
      </Card.Section>
    )
  }

  if (props.completeFn != null) {
    var embedStyles = { m: "md", withBorder: true }

    if (complete) {
      var passButton = (
        <Button variant="outlined" disabled color="green" onClick={() => completeTask(true)}>Completed</Button>
      )
    } else {
      var passButton = (
        <Button variant="filled" color="green" onClick={() => completeTask(true)}>Complete</Button>
      )
    }


    if (task.failOutcome) {
      if (complete) {
        var failButton = (
          <Button variant="outline" disabled color="red" onClick={() => completeTask(false)}>Fail</Button>
        )
      } else {
        var failButton = (
          <Button variant="outline" color="red" onClick={() => completeTask(false)}>Fail</Button>
        )
      }

    }

    var actions = (
      <Card.Section>
        <Center>
          <Group py="xs">
            {passButton}
            {failButton}
          </Group>
        </Center>
      </Card.Section>

    )
  }

  return (
    <Card p="md" {...embedStyles}>
      <Card.Section withBorder p="xs">
        <Center><Title order={4}>{task.title}</Title></Center>
      </Card.Section>
      {flavor}
      <Card.Section withBorder p="xs">
        <Text>{taskState.getDescription()}</Text>
      </Card.Section>
      {outcomes}
      {pass}
      {fail}
      {actions}
    </Card>
  )
}
