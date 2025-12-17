import axios from 'axios';
import { isPast, isFuture } from 'date-fns';
import { type DateTimeFormatOptions } from 'intl';
import { useState, useEffect, useContext } from 'react';
import { HiOutlineClipboardCopy } from 'react-icons/hi';
import { LiaUserFriendsSolid } from 'react-icons/lia';
import { ActivityIndicator } from 'react-native';
import DatePicker from 'react-native-date-picker';
import toast from 'react-native-toast-message';

import LinkRenderer from '~/components/LinkRenderer';
import { CurrentUserContext } from '~/contexts/currentuser-context';
import { useMemberContext } from '~/contexts/member-context';
import { userLocale, pluralize, textToJSX } from '~/lib/helpers';
import { hasStarted, getShortUrl } from '~/lib/helpers/challenge';
import { type ChallengeSummary, type MemberChallenge, type CheckIn } from '~/lib/types';
interface ChallengeOverviewProps {
  challenge: ChallengeSummary;
}
export default function ChallengeOverview(props: ChallengeOverviewProps): JSX.Element {
  const { challenge } = props;
  const { membership, setMembership } = useMemberContext();
  const cohortId = membership?.cohortId;
  const expired = challenge?.endAt ? isPast(new Date(challenge.endAt)) : false;
  const [started, setStarted] = useState(hasStarted(challenge, membership));
  const { currentUser } = useContext(CurrentUserContext);
  const locale = currentUser ? userLocale(currentUser) : 'en-US';
  const dateOptions: DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };
  const formatTime = (hour: number, minute: number): string => {
    // Create a Date object with the given hour and minute in GMT
    const date = new Date(Date.UTC(1970, 0, 1, hour, minute));
    // Convert to local time and format based on locale
    return date.toLocaleTimeString(locale, { hour: 'numeric', minute: 'numeric', hour12: true });
  };
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toLocaleDateString(locale, dateOptions);
    }
    return '';
  };
  const [editingNotificationTime, setEditingNotificationTime] = useState(false);
  const [editingStartAt, setEditingStartAt] = useState(false);

  useEffect(() => {
    setMembership(membership);
    setStarted(hasStarted(challenge, membership));
  }, [membership, challenge]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const fetchCheckIns = async (): Promise<void> => {
    try {
      const response = await axios.get(`/api/checkins/${challenge.id}/${currentUser?.id}`);
      setCheckIns(response.data.checkIns as CheckIn[]);
    } catch (error) {
      console.error('Error fetching check-ins:', error);
    }
  };
  const copyLink = async (): Promise<void> => {
    await navigator.clipboard.writeText(getShortUrl(challenge, membership));
    toast.show({
      type: 'success',
      text1: '🎉 Link copied to clipboard!',
    });
  };
  const parsedDescription = textToJSX(challenge.description ?? '');
  useEffect(() => {
    void fetchCheckIns();
  }, [challenge.id, currentUser?.id]);
  return (
    <div className="relative max-w-lg px-2">
      <div className="relative mb-4">
        {parsedDescription}
        <LinkRenderer text={challenge.description ?? ''} />
      </div>

      {challenge.type === 'SELF_LED' && (
        <>
          <div className="flex">
            <div className="w-1/3">
              <div className="font-bold">Frequency</div>
              <div className="capitalize">{challenge?.frequency?.toLowerCase()}</div>
            </div>
            <div className="w-1/3">
              <div className="font-bold">Duration</div>
              {challenge.numDays} days
            </div>
          </div>

          {membership?.startAt && (
            <div className="mt-4 flex">
              <div className="w-1/3">
                <div className="font-bold">
                  {isFuture(membership.startAt) ? 'Starts' : 'Started'}
                </div>
                {editingStartAt ? (
                  <EditMembership
                    which="startAt"
                    membership={membership}
                    onCancel={() => {
                      setEditingStartAt(false);
                    }}
                    afterSave={() => {
                      setEditingStartAt(false);
                    }}
                  />
                ) : (
                  <>
                    {formatDate(String(membership.startAt))}
                    {!editingNotificationTime && (
                      <button
                        onClick={() => {
                          setEditingStartAt(true);
                        }}
                        className="ml-2 text-xs text-red underline">
                        edit
                      </button>
                    )}
                  </>
                )}
              </div>
              <div className="w-1/3">
                <div className="font-bold">Reminder Time</div>
                {editingNotificationTime ? (
                  <div>
                    <EditMembership
                      which="notificationTime"
                      membership={membership}
                      onCancel={() => {
                        setEditingNotificationTime(false);
                      }}
                      afterSave={() => {
                        setEditingNotificationTime(false);
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <div className="inline capitalize">{challenge?.frequency.toLowerCase()}</div> at{' '}
                    {formatTime(
                      membership?.notificationHour ?? 0,
                      membership?.notificationMinute ?? 0
                    )}
                    {!editingStartAt && (
                      <button
                        onClick={() => {
                          setEditingNotificationTime(true);
                        }}
                        className="ml-2 text-xs text-red underline">
                        edit
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
      {challenge.type === 'SCHEDULED' && (
        <>
          {expired && <div className="text-center text-red">This challenge has ended</div>}
          <div className="flex-cols mb-2 flex">
            <div className="w-1/3">
              <div className="font-bold">{expired || started ? 'Started' : 'Starts'}</div>
              {challenge.startAt
                ? new Date(challenge.startAt).toLocaleDateString(locale, dateOptions)
                : ''}
            </div>
            <div className="w-1/3">
              <div className="font-bold">{expired ? 'Ended' : 'Ends'}</div>
              {challenge.endAt
                ? new Date(challenge.endAt).toLocaleDateString(locale, dateOptions)
                : ''}
            </div>
            <div className="w-1/3">
              <div className="font-bold">Frequency</div>
              <div className="capitalize">{challenge?.frequency?.toLowerCase()}</div>
            </div>
          </div>
          {challenge?._count?.members > 0 && (
            <div className="w-full">
              <LiaUserFriendsSolid className="mr-1 inline h-5 w-5 text-grey" />
              {challenge?._count.members} {pluralize(challenge?._count.members, 'member')}
            </div>
          )}
        </>
      )}
      {membership && (
        <div className="mt-4 flex w-full items-center justify-center">
          <div className="text-xs">Copy link to invite friends</div>
          <div className="md:text-md ml-1 max-w-[250px] rounded-md  border p-2 text-left text-sm text-lessblack">
            {getShortUrl(challenge, membership, cohortId)}
          </div>
          <HiOutlineClipboardCopy onClick={copyLink} className="ml-1 h-6 w-6 cursor-pointer" />
          <div
            onClick={copyLink}
            className="ml-1 cursor-pointer text-xs text-blue underline md:text-sm">
            copy
          </div>
        </div>
      )}
    </div>
  );
}

interface EditMembershipProps {
  membership: MemberChallenge | null;
  onCancel: () => void;
  afterSave: (membership: MemberChallenge) => void;
  which: 'notificationTime' | 'startAt';
}

export function EditMembership(props: EditMembershipProps): JSX.Element {
  const { onCancel, afterSave, which } = props;
  const { membership, setMembership } = useMemberContext();
  if (!membership) {
    return <></>;
  }
  let initialNotificationTime: Date | null = null;
  if (which === 'notificationTime') {
    initialNotificationTime = new Date();
    initialNotificationTime.setUTCHours(membership.notificationHour ?? 0);
    initialNotificationTime.setUTCMinutes(membership.notificationMinute ?? 0);
  } else {
    initialNotificationTime = null;
  }
  const [formData, setFormData] = useState({
    notificationTime: which === 'notificationTime' ? initialNotificationTime : null,
    startAt:
      which === 'startAt' ? (membership.startAt ? new Date(membership.startAt) : null) : null,
  });
  const selectDate = (date: Date): void => {
    setFormData({ ...formData, startAt: date });
  };
  const selectNotificationTime = (time: Date | null): void => {
    setFormData({ ...formData, notificationTime: time });
  };
  const [loading, setLoading] = useState(false);
  const validate = (): boolean => {
    if (which === 'notificationTime' && !formData.notificationTime) {
      return false;
    }
    if (which === 'startAt' && !formData.startAt) {
      return false;
    }
    return true;
  };
  const save = async (): Promise<void> => {
    if (!membership?.id) {
      throw new Error('cannot save notification time without an id');
    }
    if (!validate()) {
      return;
    }
    const data = new FormData();
    setLoading(true);
    let notificationDate: Date | null = null;
    let notificationHour: number | null = null;
    let notificationMinute: number | null = null;
    if (formData.notificationTime) {
      notificationDate = new Date(formData.notificationTime);
      notificationHour = notificationDate.getUTCHours();
      notificationMinute = notificationDate.getUTCMinutes();
      data.append('notificationHour', notificationHour.toString());
      data.append('notificationMinute', notificationMinute.toString());
    }
    if (formData.startAt) {
      const startAt = new Date(formData.startAt);
      data.append('startAt', startAt.toISOString());
    }
    const url = `/api/memberchallenges/${membership.id}`;
    const response = await axios.post(url, data);
    setLoading(false);
    setMembership(response.data.result as MemberChallenge);
    afterSave(response.data.result as MemberChallenge);
  };

  return (
    <div>
      {which === 'notificationTime' && (
        <DatePicker
          modal
          open
          date={formData.notificationTime || new Date()}
          mode="time"
          onConfirm={(date) => {
            selectNotificationTime(date);
          }}
          onCancel={onCancel}
        />
      )}
      {which === 'startAt' && (
        <DatePicker
          modal
          open
          date={formData.startAt || new Date()}
          mode="date"
          minimumDate={new Date()}
          onConfirm={(date: Date) => {
            selectDate(date);
          }}
          onCancel={onCancel}
        />
      )}
      <div className="inline">
        <span onClick={save} className="mx-2 cursor-pointer text-xs  text-red underline">
          Save
        </span>
        <span onClick={onCancel} className="cursor-pointer text-xs">
          Cancel
        </span>
        {loading && <ActivityIndicator size="small" className="mt-10" />}
      </div>
    </div>
  );
}
