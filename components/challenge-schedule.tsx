import {
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  differenceInDays,
  isFuture,
  addDays,
} from 'date-fns';
import { Link } from 'expo-router';
import { useContext } from 'react';
import { BsExclamationCircleFill } from 'react-icons/bs';
import { HiMiniPlusSmall } from 'react-icons/hi2';
import { Text, View, TouchableOpacity, Linking } from 'react-native';

import { CurrentUserContext, useCurrentUser } from '~/contexts/currentuser-context';
import { userLocale, pluralize } from '~/lib/helpers';
import { hasStarted } from '~/lib/helpers/challenge';
import type { Challenge, CurrentUser, MemberChallenge, Post } from '~/lib/types';
interface ChallengeScheduleProps {
  challenge: Challenge;
  posts: Post[];
  isSchedule?: boolean; // if true  , this is the scheduling page for the creator, and we should show all posts and empty days
  membership: MemberChallenge | null;
}

export default function ChallengeSchedule({
  challenge,
  posts,
  isSchedule = false,
  membership,
}: ChallengeScheduleProps): JSX.Element {
  // Need to capture any dangling posts that are unscheduled in the date range
  const unscheduled: Post[] = [];
  // create arrays of posts by day number and those that are unscheduled
  const { currentUser } = useContext(CurrentUserContext);
  const userIsCreator = currentUser?.id === challenge.userId;
  if (challenge.type === 'SELF_LED' && posts) {
    posts.forEach((post) => {
      if (!post.publishOnDayNumber) {
        unscheduled.push(post);
      }
    });
  }
  return (
    <View className="w-full">
      {(userIsCreator || currentUser?.role === 'ADMIN') && <UnscheduledPosts posts={unscheduled} />}
      {isSchedule && <ScheduleDateRange challenge={challenge} />}
      {challenge.type === 'SCHEDULED' && (
        <DateSchedule
          challenge={challenge}
          posts={posts}
          isSchedule={isSchedule}
          membership={membership}
        />
      )}
      {challenge.type === 'SELF_LED' && (
        <NumberSchedule
          challenge={challenge}
          posts={posts}
          isSchedule={isSchedule}
          membership={membership}
        />
      )}
    </View>
  );
}

const DateSchedule = ({
  challenge,
  posts,
  isSchedule,
  membership,
}: {
  challenge: Challenge;
  posts: Post[];
  isSchedule: boolean;
  membership: MemberChallenge | null;
}): JSX.Element => {
  // Need to capture any dangling posts that are unscheduled in the date range
  const unscheduled: Post[] = [];
  // create arrays of posts by day number and those that are unscheduled
  const postsByDayNum = posts.reduce<Record<number, Post[]>>((acc, post) => {
    const date = post.publishAt ? new Date(post.publishAt) : new Date(post.createdAt);
    const day = differenceInDays(date, new Date(challenge.startAt as unknown as Date)) + 1; // Calculate days since challenge.startAt
    if (day <= 0) {
      unscheduled.push(post);
    } else {
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(post);
    }
    return acc;
  }, {});
  const { currentUser } = useContext(CurrentUserContext);
  const locale = userLocale(currentUser as CurrentUser);
  const startDate = new Date(challenge?.startAt as unknown as Date);
  startDate.setHours(0, 0, 0, 0); // set it to midnight
  const endDate = new Date(challenge?.endAt as unknown as Date);
  const days = eachDayOfInterval({ start: startOfWeek(startDate), end: endOfWeek(endDate) });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const userIsCreator = currentUser?.id === challenge.userId;
  return (
    <Text
      className={`w-full max-w-lg px-2  ${isSchedule ? 'md:max-w-xl lg:max-w-2xl' : 'md:max-w-md lg:max-w-lg'}`}>
      <Text className={`${isSchedule ? 'md:grid' : ''}  mt-4 w-full grid-cols-7 gap-0 `}>
        {/* only show the days if we're on the schedule page */}
        {weekDays.map((day) => (
          <Text key={day} className={`hidden ${isSchedule ? 'md:block' : ''} font-bol text-center`}>
            {day}
          </Text>
        ))}

        {days.map((day) => {
          const isInRange = day >= startDate && day <= endDate;
          const dayNum = differenceInDays(day, startDate) + 1;
          return (
            <Text key={day.toISOString()}>
              {(postsByDayNum[dayNum] || isSchedule) && (
                <Text
                  key={day.toISOString()}
                  className={`relative h-24  p-2   ${isInRange ? ' border border-[#CECECE] bg-lightgrey' : 'hidden bg-white md:block'}`}>
                  <Text className="absolute left-0 top-0 m-1 text-xs">
                    <Text className={`${isSchedule ? 'md:hidden' : ''}`}>
                      {day.toLocaleDateString(locale, {
                        weekday: 'short',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                    <Text className={`hidden ${isSchedule ? 'md:block' : ''}`}>
                      {day.getDate()}
                    </Text>
                  </Text>
                  <Text className="mb-2 mt-4 flex h-full flex-col items-start justify-start overflow-hidden pb-2">
                    {postsByDayNum[dayNum]?.map((post) => (
                      <PostsBlock
                        post={post}
                        key={post.id}
                        isSchedule={isSchedule}
                        challenge={challenge}
                        membership={membership}
                      />
                    ))}
                    {isSchedule && isInRange && !postsByDayNum[dayNum] && userIsCreator && (
                      <NewPostLink day={dayNum} challenge={challenge} />
                    )}
                  </Text>
                </Text>
              )}
            </Text>
          );
        })}
      </Text>
    </Text>
  );
};

const NumberSchedule = ({
  challenge,
  posts,
  isSchedule,
  membership,
}: {
  challenge: Challenge;
  posts: Post[];
  isSchedule: boolean;
  membership: MemberChallenge | null;
}): JSX.Element => {
  if (!posts) {
    return <></>;
  }
  const postsByDayNum = posts.reduce<Record<number, Post[]>>((acc, post) => {
    const publishOnDayNumber = post.publishOnDayNumber; // Assuming this property exists
    if (Number(publishOnDayNumber) > 0) {
      if (!acc[Number(publishOnDayNumber)]) {
        acc[Number(publishOnDayNumber)] = [];
      }
      acc[Number(publishOnDayNumber)].push(post);
    }
    return acc;
  }, {});
  const { currentUser } = useCurrentUser();
  const userIsCreator = currentUser?.id === challenge.userId;
  const numDays = challenge.numDays ?? 0; // Default to 0 if numDays is null or undefined
  return (
    <View className="w-full px-4 md:px-0">
      <View className={`${isSchedule ? 'md:grid' : ''}  mt-4 w-full grid-cols-7 gap-2`}>
        {Array.from({ length: numDays }, (_, index) => (
          <Text
            key={index}
            className="border-[#CECECE]' relative flex h-24 flex-col items-center justify-center border  border-gray-300  bg-lightgrey p-2  text-center">
            {!postsByDayNum[index + 1] && <>Day {index + 1}</>}
            {postsByDayNum[index + 1]?.map((post) => (
              <Text
                className="flex h-full items-center justify-center"
                key={`${challenge.id} - ${post.id}`}>
                <PostsBlock
                  post={post}
                  isSchedule={isSchedule}
                  challenge={challenge}
                  key={post.id}
                  membership={membership}
                />
              </Text>
            ))}
            {isSchedule && !postsByDayNum[index + 1] && userIsCreator && (
              <NewPostLink day={index + 1} challenge={challenge} />
            )}
          </Text>
        ))}
      </View>
      <Text>{JSON.stringify(postsByDayNum)}</Text>
    </View>
  );
};

const PostsBlock = ({
  post,
  challenge,
  isSchedule,
  membership,
}: {
  post: Post;
  challenge: Challenge;
  isSchedule: boolean;
  membership: MemberChallenge | null;
}): JSX.Element => {
  const { currentUser } = useContext(CurrentUserContext);
  // if post is in the future, don't link to the full post UNLESS it's the user's post
  let linkable = false;
  const started = hasStarted(challenge, membership);
  if (challenge.type === 'SCHEDULED') {
    linkable = Boolean(post.publishAt && !isFuture(post.publishAt));
  }
  if (challenge.type === 'SELF_LED') {
    if (
      started &&
      post.publishOnDayNumber &&
      membership &&
      post.publishOnDayNumber <= membership.dayNumber
    ) {
      linkable = true;
    }
  }
  linkable = true;
  if (currentUser?.id === post.userId || currentUser?.role === 'ADMIN') {
    linkable = true;
  }

  const isPublished = (): boolean => {
    if (challenge.type === 'SELF_LED') {
      if (post.publishOnDayNumber) {
        return true;
      }
      return false;
    }
    return Boolean(post.published || post.publishAt);
  };
  return (
    <>
      {(isPublished() || currentUser?.id === challenge.userId) && (
        <>
          <Link href={`/posts/${post.id}`} key={post.id} style={{ marginBottom: 10 }}>
            <Text
              key={post.id}
              className={`${isSchedule ? 'text-xs' : 'block text-xl'} mb-1 w-full overflow-hidden text-ellipsis text-black ${linkable ? 'cursor-pointer underline' : ''}`}>
              {post.title}
            </Text>
          </Link>
          <DraftBadge published={isPublished()} />
        </>
      )}
    </>
  );
};
function DraftBadge({ published }: { published: boolean }): JSX.Element {
  if (!published) {
    return <Text className="ml-2 text-sm text-yellow">Draft</Text>;
  }
  return <></>;
}

const NewPostLink = ({ day, challenge }: { day: number; challenge: Challenge }): JSX.Element => {
  const navigate = useNavigate();
  const newPost = (): void => {
    const startDate =
      challenge.type === 'SCHEDULED' ? new Date(challenge.startAt as unknown as Date) : null;
    const state = {
      title: `Day ${day}`,
      publishAt: startDate ? format(addDays(startDate, day - 1), 'yyyy-MM-dd 08:00:00') : null,
      dayNumber: day,
      notifyMembers: true,
    };
    navigate(`/posts/new/challenge/${challenge?.id}`, { state });
  };

  return (
    <Text className="-mt-3 flex h-full w-full cursor-pointer items-start justify-center pt-6">
      <HiMiniPlusSmall
        className="h-8 w-8  rounded-full bg-white text-red hover:bg-red hover:text-white"
        onClick={newPost}
      />
    </Text>
  );
};

const UnscheduledPosts = ({ posts }: { posts: Post[] }): JSX.Element => {
  if (posts.length === 0) {
    return <></>;
  }
  return (
    <Text className="my-2 rounded-md p-2">
      <BsExclamationCircleFill className="-mt-1 mr-2  inline-block h-4 w-4 text-red" />
      There {pluralize(posts.length, 'is', 'are')} {posts.length} unscheduled{' '}
      {pluralize(posts.length, 'post', 'posts')}.
      {posts.map((post) => {
        return (
          <View>
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/challenges/${post.challengeId}/posts/${post.id}`}
                style={{ marginBottom: 10 }}>
                <Text>{post.title}</Text>
              </Link>
            ))}
          </View>
        );
      })}
    </Text>
  );
};

const ScheduleDateRange = ({ challenge }: { challenge: Challenge }): JSX.Element => {
  const { currentUser } = useCurrentUser();
  const locale = userLocale(currentUser);
  // function to format the date for the challenge start and end dates
  const formattedDate = (date: Date): string => {
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  const startDate = new Date(challenge?.startAt as unknown as Date);
  const endDate = new Date(challenge?.endAt as unknown as Date);
  if (challenge.type === 'SELF_LED') {
    return <></>;
  }

  return (
    <Text className="mt-4 w-full">
      {formattedDate(startDate)} to {formattedDate(endDate)}
    </Text>
  );
};
