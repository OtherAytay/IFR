'use client'
import { useState } from 'react';
import { Stepper, Button, Group, Container } from '@mantine/core';

export default function Home() {
  const [active, setActive] = useState(1);
  const [highestStepVisited, setHighestStepVisited] = useState(active);
  const handleStepChange = (nextStep) => {
    const isOutOfBounds = nextStep > 5 || nextStep < 0;
    if (isOutOfBounds) {
      return;
    }
    setActive(nextStep);
    setHighestStepVisited((hSC) => Math.max(hSC, nextStep));
  };
  // Allow the user to freely go back and forth between visited steps.
  const shouldAllowSelectStep = (step) => highestStepVisited >= step && active !== step;

  return (
  <Container>
    <Stepper active={active} onStepClick={setActive}>
      <Stepper.Step label="First step" description="Create an account" allowStepSelect={shouldAllowSelectStep(0)}>
        Step 1 content: Create an account
      </Stepper.Step>
      <Stepper.Step label="Second step" description="Verify email" allowStepSelect={shouldAllowSelectStep(1)}>
        Step 2 content: Verify email
      </Stepper.Step>
      <Stepper.Step label="Final step" description="Get full access" allowStepSelect={shouldAllowSelectStep(2)}>
        Step 3 content: Get full access
      </Stepper.Step>
            <Stepper.Step label="Final step" description="Get full access" allowStepSelect={shouldAllowSelectStep(3)}>
        Step 3 content: Get full access
      </Stepper.Step>
            <Stepper.Step label="Final step" description="Get full access" allowStepSelect={shouldAllowSelectStep(4)}>
        Step 3 content: Get full access
      </Stepper.Step>
            <Stepper.Step label="Final step" description="Get full access" allowStepSelect={shouldAllowSelectStep(5)}>
        Step 3 content: Get full access
      </Stepper.Step>

      <Stepper.Completed>
        Completed, click back button to get to previous step
      </Stepper.Completed>
    </Stepper>

    <Group justify="center" mt="xl">
      <Button variant="default" onClick={() => handleStepChange(active - 1)}>
        Back
      </Button>
      <Button onClick={() => handleStepChange(active + 1)}>Next step</Button>
    </Group>
  </Container>);
}
