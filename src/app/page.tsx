'use client'
import { useState } from 'react';
import { Stepper, Group, Container, Title, Text, Anchor, Card, Table, Badge, HoverCard, Center, Button, Divider, rem, ScrollArea, Grid, SimpleGrid, Image, Transition } from '@mantine/core';
import { IFR, Stage, Event, Task, Outcome, Variable, IFRState, StageState, EventState, EventGroupState, EventGroup, Condition, TaskState } from '../IFR/ifr';
import { IconPhoto, IconSquareCheck, IconSquareX } from '@tabler/icons-react';

export default function Home() {
  return (
    <InteractiveFR ifrState={Simple()} />
  );
}

export function InteractiveFR(props: { ifrState: IFRState }) {
  const ifrState = props.ifrState
  const ifr = ifrState.ifr
  const [showImage, setShowImage] = useState(false);
  const [active, setActive] = useState(0);

  const handleStepChange = (nextStep) => {
    const isOutOfBounds = nextStep < 0 || ifr.stages.length < nextStep;
    if (isOutOfBounds) {
      return;
    }
    setActive(nextStep);
  };

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
    <Container fluid>
      <Center>
        <Transition mounted={showImage} transition="pop">
          {(styles) => <div style={styles}>{image}</div>}
        </Transition>
      </Center>
      <Center>
        {title}
      </Center>
      <Text>{ifr.description}</Text>
      <Stepper active={active} onStepClick={setActive} allowNextStepsSelect={false}>
        {ifrState.stageStates.map((stageState, idx) => (
          <Stepper.Step key={idx} label={stageState.stage.title} description={stageState.stage.subtitle}>
            <StagePanel stageState={stageState} />
          </Stepper.Step>
        ))}
      </Stepper>
    </Container>
  )
}

export function StagePanel(props: { stageState: StageState }) {
  const stageState = props.stageState
  const stage = stageState.stage

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
          console.log(d.variableState)
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

  return (
    <Center>
      <Grid w="100%" justify="center">
        {stageState.eventSpaceStates.map((es, idx) => (
          <Grid.Col key={idx} span={colSpan(es)}>
            <EventSpaceCard eventSpaceState={es} dependencyPassed={dependencyPassMap.get(es)} manageFn={manageDependencies} />
          </Grid.Col>
        ))}
      </Grid>
    </Center>
  )
}

export function EventSpaceCard(props: { eventSpaceState: EventState | EventGroupState, dependencyPassed?: Array<boolean>, manageFn?}) {
  if (props.eventSpaceState instanceof EventState) {
    return (
      <EventCard eventState={props.eventSpaceState} dependencyPassed={props.dependencyPassed} manageFn={props.manageFn} />
    )
  } else {
    return (
      <EventGroupCard eventGroupState={props.eventSpaceState} manageFn={props.manageFn} />
    )
  }
}

export function EventGroupCard(props: { eventGroupState: EventGroupState, dependencyPassed?: Array<boolean>, manageFn?}) {
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
          console.log(d.variableState)
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
      <SimpleGrid cols={eventGroupState.eventGroup.events.length}>
        {eventGroupState.eventStates.map((es, idx) => (
          <EventCard key={idx} eventState={es} dependencyPassed={dependencyPassMap.get(es)} manageFn={manageDependencies} />
        ))}
      </SimpleGrid>
    </Card>
  )
}

export function EventCard(props: { eventState: EventState, dependencyPassed?: Array<boolean>, manageFn?}) {
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
            <HoverCard key={idx} position="right" width="auto" shadow="md">
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


function STL() {
  const ifr = new IFR("Sissy Transformation Lab")

  // Stages
  var body = new Stage("Body", "", "", 1, 2);
  var mind = new Stage("Mind", "", "", 1, 1);
  var training = new Stage("Training", "", "", 1, 1);
  var quality = new Stage("Quality Check", "", "", 1, 1);
  var ending = new Stage("Ending", "", "", 1, 1)

  // Events
  var eventGroup = new EventGroup("", 1, 2);
  var event1 = new Event("Body Transformation", "yeet treat", 10, true)
  var event2 = new Event("Pussy Table", "Roll a pussy", 8, true)

  // Variables
  var variable1 = new Variable("Breasts", Variable.STRING, "")
  var variable2 = new Variable("Genitals", Variable.STRING, "")
  variable1.addBounds(["", "Small", "Medium", "Large"])
  variable2.addBounds(["", "Oversized Clitoris", "Vagina", "Full Female"])
  ifr.addVariable(variable1)
  ifr.addVariable(variable2)

  // Tasks
  var outcome1 = new Outcome(variable1, Outcome.SET, "Small")
  var outcome2 = new Outcome(variable2, Outcome.SET, "Vagina")
  var outcome3 = new Outcome(variable2, Outcome.SET, "Oversized Clitoris")
  var task1 = new Task("Breasts", "", "Immobilize your body on a chair. Use nipple suckers to pump them for 5 minutes. Put on warm lube and repeat 1 more minute.", outcome1)
  var task2 = new Task("Reproductive System Transformation", "", "Wear a chastity cage and put on abundant numbing cream on your clitty", outcome2)
  var task3 = new Task("Irritable Pussy", "", "Permanent: You must always use a drop of hot sauce during penetration.", outcome3)


  event1.addTask({ min: 1, max: 5, task: task1 })
  event1.addTask({ min: 6, max: 10, task: task2 })
  event2.addTask({ min: 1, max: 1, task: task3 })

  // Dependencies
  event2.addDependency(event1)
  var condition1 = new Condition(variable2, Condition.ANY, ["Vagina", "Full Female"])
  event2.addDependency(condition1)


  eventGroup.addEvent(event1)
  eventGroup.addEvent(event2)
  body.addEventSpace(eventGroup)

  ifr.addStage(body)
  ifr.addStage(mind)
  ifr.addStage(training)
  ifr.addStage(quality)
  ifr.addStage(ending)

  const ifrState = new IFRState(ifr)
  return ifrState
}

function Simple() {
  const ifr = new IFR("Messy Facial", "https://www.faproulette.co/44693/messy-facial-roulette/", "https://files.faproulette.co/images/fap/44693.png?1672076552")
  var facial = new Stage("Facial", "Legs above head!", "", 6, 6)
  var test = new Variable("X", Variable.NUM, 4)
  ifr.addVariable(test)

  var prep = new Event("Preparation", "", 10);
  var edge = new Task("Edge", "", "Edge {{ _roll * 2 }} times before cumming");
  prep.addTask({ min: 1, max: 10, task: edge });
  facial.addEventSpace(prep);

  var orgasm = new Event("Orgasm", "", 2);
  var normal = new Task("Normal", "", "Cum normally");
  var ruined = new Task("Ruined", "", "Ruined orgasm");
  orgasm.addTask({ min: 1, max: 1, task: normal });
  orgasm.addTask({ min: 2, max: 2, task: ruined });
  orgasm.addDependency(prep);
  facial.addEventSpace(orgasm)

  var mouth = new Event("Mouth", "", 2);
  var opened = new Task("Opened", "", "Mouth wide open");
  var closed = new Task("Closed", "", "Mouth closed");
  mouth.addTask({ min: 1, max: 1, task: opened });
  mouth.addTask({ min: 2, max: 2, task: closed });
  mouth.addDependency(orgasm)
  facial.addEventSpace(mouth)

  var aim = new Event("Where to Aim", "", 10);
  var chin = new Task("Chin and Neck", "", "Aim for Chin and Neck");
  var forehead = new Task("Forehead and Nose", "", "Aim for Forehead and Nose");
  var cheeks = new Task("Mouth and Cheeks", "", "Aim for Mouth and Cheeks");
  var mouth_only = new Task("Mouth Only", "", "Aim directly in your Mouth");
  aim.addTask({ min: 1, max: 3, task: chin });
  aim.addTask({ min: 4, max: 6, task: forehead });
  aim.addTask({ min: 7, max: 9, task: cheeks });
  aim.addTask({ min: 10, max: 10, task: mouth_only });
  aim.addDependency(mouth)
  facial.addEventSpace(aim)

  var gather = new Event("Gathering Cum", "", 10);
  var scrape = new Task("Scrape into Mouth", "", "Scrape all cum into your mouth");
  var rub = new Task("Rub on Face", "", "Rub cum all over face, lick fingers cleans");
  var lick = new Task("Lick lips", "", "Lick up any cum your tongue can reach, leave the rest as is");
  gather.addTask({ min: 1, max: 8, task: scrape });
  gather.addTask({ min: 9, max: 9, task: rub });
  gather.addTask({ min: 10, max: 10, task: lick });
  gather.addDependency(aim)
  facial.addEventSpace(gather);

  var play = new Event("Cumplay", "", 10);
  var snowball = new Task("Snowball", "", "Snowball X times");
  var swirl = new Task("Swirl", "", "Swirl cum around in mouth for X * 10 seconds");
  var gargle = new Task("Gargle", "", "Gargle cum for X * 10 seconds");
  var smear = new Task("Smear", "", "Smear around face, then collect with fingers. Repeat X  times.");
  var drool = new Task("Drool", "", "Drool onto body, scoop with hands and lick them clean.");
  var hold = new Task("Hold", "", "Hold cum in mouth for {{ X }} minutes then reroll.", "REROLL");
  play.addTask({ min: 1, max: 2, task: snowball })
  play.addTask({ min: 3, max: 4, task: swirl })
  play.addTask({ min: 5, max: 6, task: gargle })
  play.addTask({ min: 7, max: 7, task: smear })
  play.addTask({ min: 8, max: 8, task: drool })
  play.addTask({ min: 9, max: 10, task: hold });
  play.addDependency(gather)
  facial.addEventSpace(play)

  ifr.addStage(facial);

  return new IFRState(ifr);
}

function SP() {
  const ifr = new IFR("Sissy Prostitute")
  var please = new Stage("Work", "Please the Customer", "", 1, 5);

  please.addEventSpace

  ifr.addStage(please)

  return new IFRState(ifr)
}
