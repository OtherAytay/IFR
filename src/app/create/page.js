'use client'
import { useState } from 'react';
import { Stepper, Button, Group, Container } from '@mantine/core';

export default function Home() {
  const [active, setActive] = useState(1);
  const [highestStepVisited, setHighestStepVisited] = useState(active);
  const handleStepChange = (nextStep) => {
    const isOutOfBounds = nextStep > 3 || nextStep < 0;
    if (isOutOfBounds) {
      return;
    }
    setActive(nextStep);
    setHighestStepVisited((hSC) => Math.max(hSC, nextStep));
  };
  // Allow the user to freely go back and forth between visited steps.
  const shouldAllowSelectStep = (step) => highestStepVisited >= step && active !== step;

  return (<></>)
}
