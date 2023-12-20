'use client'
import { useState } from 'react';
import { Stepper, Group, Container, Title, Text, Anchor, Card, Table, Badge, HoverCard, Center, Flex, Button, Tooltip, Divider, rem } from '@mantine/core';
import { IFR, Stage, Event, Task, Outcome, Variable, IFRState, StageState, EventState, EventGroupState, EventGroup, Condition, ConditionGroup, ConditionState } from '../IFR/ifr'
import { IconDice } from '@tabler/icons-react'

export default function Home() {
  return (
    <InteractiveFR ifrState={testIFR()} />
  );
}

export function InteractiveFR(props: { ifrState: IFRState }) {
  const ifrState = props.ifrState
  const ifr = ifrState.ifr
  const [active, setActive] = useState(0);

  const handleStepChange = (nextStep) => {
    const isOutOfBounds = nextStep < 0 || ifr.stages.length < nextStep;
    if (isOutOfBounds) {
      return;
    }
    setActive(nextStep);
  };

  return (
    <Container>
      <Anchor href={ifr.fr_link} target="_blank">
        <Title order={1} c="violet" mb="md">{ifr.title}</Title>
      </Anchor>
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

  return (
    <Group>
      {stageState.eventSpaceStates.map((es, idx) => (
        <EventSpaceCard eventSpaceState={es} key={idx} />
      ))}
    </Group>
  )
}

export function EventSpaceCard(props: { eventSpaceState: EventState | EventGroupState }, key: number) {
  if (props.eventSpaceState instanceof EventState) {
    return (
      <div key={key}>
        <EventCard eventState={props.eventSpaceState} />
      </div>
    )
  } else {
    return (
      <div key={key}>
        <EventGroupCard eventGroupState={props.eventSpaceState} />
      </div>
    )
  }
}

export function EventGroupCard(props: { eventGroupState: EventGroupState }) {
  const eventGroupState = props.eventGroupState;
  const eventGroup = eventGroupState.eventGroup;

  const title = (
    <Card.Section>
      <Title order={4} mt="xs" mx="sm">{eventGroup.title}</Title>
    </Card.Section>
  )

  return (
    <Card>
      {eventGroup.title ? title : null}
      <Group align="start">
        {eventGroupState.eventStates.map((es, idx) => (
          <EventCard key={idx} eventState={es} />
        ))}
      </Group>
    </Card>
  )
}

export function EventCard(props: { eventState: EventState }) {
  const eventState = props.eventState;
  const event = eventState.event;

  const [roll, setRoll] = useState(null)
  const [activeTask, setActiveTask] = useState();

  function rollEvent() {
    eventState.roll()
    setRoll(eventState.currentRoll)
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
  for (const dep of depsUnpacked) {
    if (dep instanceof EventState) {
      depExplains.push(
        <Table.Tr key={depExplains.length}>
          <Table.Td>
            <span>
              Rolled <Text span fw={600}>{dep.event.title}</Text>
            </span>
          </Table.Td>
        </Table.Tr>
      )
    } else {
      depExplains.push(
        <Table.Tr key={depExplains.length}>
          <Table.Td>
            {dep.condition.readCondition()}
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
            <Divider/>
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

  return (
    <Card withBorder style={{ height: "100%" }}>
      <Card.Section withBorder>
        <Title order={4} mt="xs" mx="sm">{event.title}</Title>
        <Title order={5} mb="xs" mx="sm" fw={300}>{event.subtitle}</Title>
      </Card.Section>
      <Card.Section withBorder>
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
                  <TaskCard task={task.task} />
                </HoverCard.Dropdown>
              </HoverCard>
            ))}
          </Table.Tbody>
        </Table>
      </Card.Section>
      <Card.Section withBorder>
        <Center>
          {rollAction}
        </Center>
      </Card.Section>
    </Card>
  )
}

export function TaskCard(props: { task: Task }) {
  const task = props.task

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
          <Text>{task.passOutcome.readOutcome()}</Text>
        </Center>
      </Card.Section>
    )
  }

  if (task.failOutcome) {
    var fail = (
      <Card.Section>
        <Center>
          <Badge color="red" mr="sm" radius="sm">Fail</Badge>
          <Text>{task.failOutcome.readOutcome()}</Text>
        </Center>
      </Card.Section>
    )
  }

  return (
    <Card p="md" pb="lg">
      <Card.Section withBorder p="xs">
        <Center><Title order={4}>{task.title}</Title></Center>
      </Card.Section>
      {flavor}
      <Card.Section withBorder p="xs">
        <Text>{task.description}</Text>
      </Card.Section>
      {outcomes}
      {pass}
      {fail}
    </Card>
  )
}


function testIFR() {
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
  var event2 = new Event("Pussy Table", "Roll a pussy", 8, false)

  // Variables
  var variable1 = new Variable("Breasts", Variable.STRING, "")
  var variable2 = new Variable("Genitals", Variable.STRING, "")
  variable1.addBounds(["", "Small", "Medium", "Large"])
  variable2.addBounds(["", "Oversized Clitoris", "Vagina", "Full Female"])
  ifr.addVariable(variable1)
  ifr.addVariable(variable2)

  // Tasks
  var outcome1 = new Outcome(variable1, Outcome.SET, "Small")
  var outcome2 = new Outcome(variable2, Outcome.SET, "Oversized Clitoris")
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
