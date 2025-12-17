import { differenceInDays, format } from 'date-fns';

import CircularProgress from '~/components/CircularProgress';
import 'react-circular-progressbar/dist/styles.css';
import type { Challenge, CheckIn } from '~/lib/types';

export function ProgressChart({
  challenge,
  checkIns,
}: {
  challenge: Challenge;
  checkIns: CheckIn[];
}): JSX.Element {
  const numDays =
    challenge.type === 'SELF_LED'
      ? challenge.numDays
      : challenge?.endAt && challenge.startAt
        ? differenceInDays(challenge.endAt, challenge.startAt)
        : 0;
  const typedCheckIns = checkIns as { createdAt: string }[];
  // const uniqueDays = new Set(
  //   typedCheckIns.map((checkIn) => format(new Date(checkIn.createdAt), 'yyyy-MM-dd'))
  // ).size;
  const uniqueDays = 58;
  const progress = numDays ? (uniqueDays / numDays) * 100 : 0;
  return <CircularProgress value={40} />;
}
