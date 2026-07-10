import { useState, useEffect } from 'react';
import { Button, Text, Transition } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconDice, IconLock, IconRefresh } from '@tabler/icons-react';

function ChangingNumber({ maxRoll }: { maxRoll: number }) {
  const [number, setNumber] = useState(1);
  useEffect(() => {
    const interval = setInterval(() => {
      setNumber(Math.floor(Math.random() * maxRoll) + 1);
    }, 150);
    return () => clearInterval(interval);
  }, [maxRoll]);
  return <>{number}</>;
}

export function Roller({ 
  roll, 
  setRoll, 
  rollFn, 
  rerolls, 
  reroll, 
  readOnly = false,
  maxRoll = 10,
  buttonLabel = 'Roll'
}: { 
  roll: number | null, 
  setRoll: (val: number) => void, 
  rollFn: () => number, 
  rerolls?: number, 
  reroll?: () => void, 
  readOnly?: boolean,
  maxRoll?: number,
  buttonLabel?: React.ReactNode
}) {
  const [rollStarted, { open: startRoll }] = useDisclosure(readOnly);
  const [rollFinished, { open: finishRoll, close: restartRoll }] = useDisclosure(readOnly);
  const [rolled, { open: flagRoll }] = useDisclosure(readOnly);

  const rollsLeft = (rerolls ?? 0) + (rolled ? 0 : 1);
  const buttonStyle = rollStarted && rollsLeft ? undefined : { borderTopRightRadius: '0.5rem', borderBottomRightRadius: '0.5rem' };

  function handleRoll() {
    if (!rollFinished || rollsLeft) {
      startRoll();

      if (rollsLeft) {
        restartRoll();
      }

      setTimeout(() => {
        const val = rollFn();
        setRoll(val);
        finishRoll();
        flagRoll();

        if (rolled && rollsLeft && reroll) {
          reroll();
        }
      }, 1500);
    }
  }

  let buttonText = <><Text mr='xs'>{buttonLabel}</Text><IconDice size={18} /></>;
  if (rollFinished) {
    if (rollsLeft) {
      buttonText = <><Text mr='xs'>Reroll</Text><IconDice size={18} /></>;
    } else {
      buttonText = <><Text mr='xs'>Rolled</Text><IconLock size={18} /></>;
    }
  }

  return (
    <Button.Group w='15rem'>
      <Button
        fullWidth style={{ 
          ...(rollsLeft <= 1 && !rollStarted && buttonStyle),
          ...(rollFinished && !rollsLeft ? { border: '1px solid var(--mantine-color-default-border)' } : {})
        }}
        variant={(rollFinished && !rollsLeft) ? 'default' : 'filled'}
        disabled={rollFinished && !rollsLeft}
        loading={rollStarted && !rollFinished} loaderProps={{ type: 'dots' }}
        onClick={handleRoll}>
        {buttonText}
      </Button>
      <Button.GroupSection display={rollsLeft > 1 ? undefined : 'none'} variant='default' style={{ ...(rollsLeft && buttonStyle) }}>
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
          <Button.GroupSection variant='default' style={{ ...transitionStyle }}>
            <Text fw='bold' ta='center' w={40}>
              {rollStarted ? rollFinished ? roll : <ChangingNumber maxRoll={maxRoll} /> : null}
            </Text>
          </Button.GroupSection>
        )}
      </Transition>
    </Button.Group>
  );
}
